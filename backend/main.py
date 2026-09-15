import sys
import os
import json
from pathlib import Path

# Add the parent directory to sys.path so we can import the existing modules
parent_dir = str(Path(__file__).resolve().parent.parent)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from frequencySimulator import FrequencySimulator
from FFTAlgorithm import FFTAlgorithm
from WaveletAlgorithm import WaveletAlgorithm
from soundAcoustic import SoundAcousticSimulator
import standards

from database import init_db, create_motor, get_motor, list_motors, update_motor, delete_motor, add_fault_history, get_fault_history, save_scan_results, get_scan_results
from priority_queue import MotorPriorityQueue

app = FastAPI(title="Sound Fault Detector API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

motor_queue = MotorPriorityQueue()

@app.on_event("startup")
def startup():
    init_db()
    rebuild_priority_queue()

def rebuild_priority_queue():
    """Rebuild the priority queue from DB state."""
    global motor_queue
    motor_queue = MotorPriorityQueue()
    for motor in list_motors():
        peak_dbc = motor.get("peak_dbc", -999)
        if peak_dbc is None or peak_dbc == float('-inf'):
            peak_dbc = -999
        motor_queue.insert(motor["id"], peak_dbc, {
            "name": motor["name"],
            "fault_mode": motor["fault_mode"],
            "peak_dbc": peak_dbc,
            "status": motor.get("status", "unknown"),
            "location": motor.get("location", "")
        })

def dbc_to_status(peak_dbc):
    if peak_dbc is None or peak_dbc <= -999:
        return "unknown"
    if peak_dbc < -40:
        return "healthy"
    if peak_dbc <= -25:
        return "warning"
    return "fault"

def downsample(data: list, target_size: int = 2000) -> list:
    """Downsample an array to a target size evenly."""
    if len(data) <= target_size:
        return data
    indices = np.linspace(0, len(data) - 1, target_size, dtype=int)
    return [data[i] for i in indices]

def run_motor_scan(config: dict):
    """Run simulation + wavelet (CWT/DWT) analysis for a motor config dict,
    returning all results including the 3D time-frequency-amplitude scalogram."""
    sim = FrequencySimulator()
    if "fault_mode" in config:
        sim.fault_mode = config["fault_mode"]
    sim.line_frequency = config.get("line_frequency", 50)
    sim.sampling_frequency = 20 * sim.line_frequency
    sim.fault_frequency = config.get("fault_frequency", 2)
    sim.amplitude = config.get("amplitude", 10)
    sim.modulation_index = config.get("modulation_index", 0.04)
    sim.duration = config.get("duration", 5)
    sim.noise_floor = config.get("noise_floor", 0.05)
    
    for key in ["slip", "harmonic_index", "severity", "poles", "slots", "slot_harmonic", "network_harmonic", "fr", "static_severity", "dynamic_severity"]:
        if key in config:
            setattr(sim, key, config[key])
    
    t, current = sim.simulate()
    signal_list = downsample(current.tolist())
    time_list = downsample(t.tolist())

    # Eccentricity faults, per the paper's Fig. 6, show up as sidebands
    # across the 1st/3rd/5th/7th/9th ODD harmonics of the fundamental, not
    # just around the fundamental alone -- so survey all of them for that
    # mode. Other modes keep the original fundamental-only check.
    harmonic_orders = [1, 3, 5, 7, 9] if sim.fault_mode == "Eccentricity (Asymmetry)" else [1]

    # Primary fault-detection engine: wavelet transform (CWT + DWT), per
    # R. Polikar's wavelet tutorial / MRA framework -- see WaveletAlgorithm.py.
    wavelet_algo = WaveletAlgorithm(
        sim.sampling_frequency, current, sim.fault_frequency,
        line_freq=sim.line_frequency, harmonic_orders=harmonic_orders,
    )
    analysis = wavelet_algo.main_algorithm()
    scalogram = wavelet_algo.scalogram()

    # FFT is kept only as a secondary, reference spectrum (still shown on the
    # 2D spectrum chart) so the wavelet result can be sanity-checked against
    # the classical method it replaces as the primary detector.
    fft_algo = FFTAlgorithm(sim.sampling_frequency, current, sim.fault_frequency, harmonic_orders)
    fft_reference = fft_algo.main_algorithm()

    N = len(current)
    fft_amp = np.abs(np.fft.fft(current)) * (2.0 / N)
    fft_freqs = np.fft.fftfreq(N, 1.0 / sim.sampling_frequency)
    half = N // 2
    pos_freqs = downsample(fft_freqs[:half].tolist())
    pos_amps = downsample(fft_amp[:half].tolist())

    return {
        "signal": {"time": time_list, "motor_current": signal_list},
        "analysis": analysis,
        "fft_reference": fft_reference,
        "spectrum": {"fft_freqs": pos_freqs, "fft_amplitudes": pos_amps},
        "scalogram": scalogram,
    }


class SimulationRequest(BaseModel):
    fault_mode: str
    modulation_index: float
    line_frequency: float
    fault_frequency: float
    amplitude: float
    duration: float
    noise_floor: float
    # Optional parameters depending on fault mode
    slip: Optional[float] = None
    harmonic_index: Optional[int] = None
    severity: Optional[float] = None
    poles: Optional[int] = None
    slots: Optional[int] = None
    slot_harmonic: Optional[int] = None
    network_harmonic: Optional[int] = None
    fr: Optional[float] = None
    static_severity: Optional[float] = None
    dynamic_severity: Optional[float] = None

class SimulationResponse(BaseModel):
    time: List[float]
    motor_current: List[float]
    
class AnalyzeRequest(BaseModel):
    sampling_freq: float
    fault_freq: float
    signal: List[float]

class CreateMotorRequest(BaseModel):
    name: str
    location: str = ""
    fault_mode: str
    config: dict

class UpdateMotorRequest(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    fault_mode: Optional[str] = None
    config: Optional[dict] = None


@app.post("/api/simulate", response_model=SimulationResponse)
def simulate_signal(req: SimulationRequest):
    sim = FrequencySimulator()
    sim.fault_mode = req.fault_mode
    sim.line_frequency = req.line_frequency
    sim.sampling_frequency = 20 * req.line_frequency
    sim.fault_frequency = req.fault_frequency
    sim.amplitude = req.amplitude
    sim.modulation_index = req.modulation_index
    sim.duration = req.duration
    sim.noise_floor = req.noise_floor
    
    # Optional params
    if req.slip is not None: sim.slip = req.slip
    if req.harmonic_index is not None: sim.harmonic_index = req.harmonic_index
    if req.severity is not None: sim.severity = req.severity
    if req.poles is not None: sim.poles = req.poles
    if req.slots is not None: sim.slots = req.slots
    if req.slot_harmonic is not None: sim.slot_harmonic = req.slot_harmonic
    if req.network_harmonic is not None: sim.network_harmonic = req.network_harmonic
    if req.fr is not None: sim.fr = req.fr
    if req.static_severity is not None: sim.static_severity = req.static_severity
    if req.dynamic_severity is not None: sim.dynamic_severity = req.dynamic_severity
    
    time, motor_current = sim.simulate()
    
    downsampled_time = downsample(time.tolist())
    downsampled_current = downsample(motor_current.tolist())
    
    return SimulationResponse(time=downsampled_time, motor_current=downsampled_current)

@app.post("/api/analyze")
def analyze_signal(req: AnalyzeRequest):
    signal_arr = np.array(req.signal)

    # Primary detector: wavelet transform (CWT + DWT), per Polikar's MRA
    # framework. See WaveletAlgorithm.py for the full explanation.
    wavelet_algo = WaveletAlgorithm(req.sampling_freq, signal_arr, req.fault_freq)
    results = wavelet_algo.main_algorithm()
    results["scalogram"] = wavelet_algo.scalogram()

    # FFT kept as a secondary reference spectrum only.
    fft_algo = FFTAlgorithm(req.sampling_freq, signal_arr, req.fault_freq)
    results["fft_reference"] = fft_algo.main_algorithm()

    # Compute full FFT spectrum
    N = len(signal_arr)
    T = 1.0 / req.sampling_freq
    fft_vals = np.fft.fft(signal_arr)
    fft_amp = np.abs(fft_vals) * (2.0 / N)
    fft_freqs = np.fft.fftfreq(N, T)
    
    # Take positive half
    positive_mask = fft_freqs >= 0
    pos_freqs = fft_freqs[positive_mask]
    pos_amps = fft_amp[positive_mask]
    
    # Downsample
    ds_freqs = downsample(pos_freqs.tolist())
    ds_amps = downsample(pos_amps.tolist())
    
    results["fft_freqs"] = ds_freqs
    results["fft_amplitudes"] = ds_amps
    
    return results

class AcousticRequest(BaseModel):
    fault_present: bool = False
    base_frequency: float = standards.ACOUSTIC_HEALTHY_PEAK_HZ
    fault_frequency: float = standards.ACOUSTIC_FAULT_LIMIT_HZ
    amplitude: float = 1.0
    # > amplitude so that, when fault_present=True, the 625Hz fault
    # component actually dominates the spectrum (matching the paper's
    # Fig. 7b, where the fault peak overtakes the healthy 157.2Hz peak)
    fault_amplitude: float = 1.5
    duration: float = 5.0
    sampling_frequency: float = 2000.0
    noise_floor: float = 0.05


@app.post("/api/acoustic/simulate")
def api_acoustic_simulate(req: AcousticRequest):
    """
    Sound-acoustic detection path from the paper (Sec. II.D Eq. 11,
    Sec. IV.D Fig. 7) -- previously entirely absent from this codebase
    even though the project is named 'Sound Fault Detector'.
    """
    sim = SoundAcousticSimulator(sampling_frequency=req.sampling_frequency, duration=req.duration)
    t, pc = sim.simulate(
        base_frequency=req.base_frequency,
        amplitude=req.amplitude,
        fault_present=req.fault_present,
        fault_frequency=req.fault_frequency,
        fault_amplitude=req.fault_amplitude,
        noise_floor=req.noise_floor,
    )
    peak = sim.spectral_peak(pc)
    status = sim.classify(peak)
    return {
        "time": downsample(t.tolist()),
        "acoustic_pressure": downsample(pc.tolist()),
        "spectral_peak_hz": peak,
        "status": status,
        "healthy_reference_hz": standards.ACOUSTIC_HEALTHY_PEAK_HZ,
        "fault_limit_hz": standards.ACOUSTIC_FAULT_LIMIT_HZ,
    }


@app.get("/api/standards/alignment")
def api_alignment_standard(speed_rpm: float = 1500):
    """Table I (paper Sec. III.B): standard alignment setup of induction
    motor, giving the allowed parallel offset / angularity for a given
    rotor speed."""
    return {
        "speed_rpm": speed_rpm,
        **standards.allowed_offset_mm(speed_rpm),
        "classification_at_tested_offsets": {
            f"{mm}mm": standards.classify_offset(speed_rpm, mm)
            for mm in standards.TESTED_OFFSETS_MM
        },
    }


@app.get("/api/fault-modes")
def get_fault_modes():
    return [
        {
            "mode": "Broken Rotor Bar",
            "label": "Broken Rotor Bar",
            "params": ["slip", "harmonic_index", "severity"]
        },
        {
            "mode": "Stator winding fault",
            "label": "Stator Winding Fault",
            "params": ["severity", "poles", "slots", "slip", "slot_harmonic", "network_harmonic"]
        },
        {
            "mode": "Eccentricity (Asymmetry)",
            "label": "Eccentricity (Asymmetry)",
            "params": ["fr", "static_severity", "dynamic_severity"]
        },
        {
            "mode": "External (Mechanical Unbalance / Alignment)",
            "label": "Mechanical Unbalance",
            "params": ["severity", "fr"]
        }
    ]

@app.get("/api/motors")
def api_list_motors():
    return list_motors()

@app.get("/api/motors/{motor_id}")
def api_get_motor(motor_id: int):
    motor = get_motor(motor_id)
    if not motor:
        raise HTTPException(status_code=404, detail="Motor not found")
    scan = get_scan_results(motor_id)
    return {**motor, "scan": scan}

@app.post("/api/motors")
def api_create_motor(req: CreateMotorRequest):
    motor_id = create_motor(req.name, req.location, req.fault_mode, req.config)
    motor_queue.insert(motor_id, -999, {"name": req.name, "fault_mode": req.fault_mode, "peak_dbc": -999, "status": "unknown", "location": req.location})
    return {"id": motor_id, "message": "Motor created"}

@app.put("/api/motors/{motor_id}")
def api_update_motor(motor_id: int, req: UpdateMotorRequest):
    motor = get_motor(motor_id)
    if not motor:
        raise HTTPException(status_code=404, detail="Motor not found")
    updates = {}
    if req.name is not None: updates["name"] = req.name
    if req.location is not None: updates["location"] = req.location
    if req.fault_mode is not None: updates["fault_mode"] = req.fault_mode
    if req.config is not None: updates["config"] = req.config
    update_motor(motor_id, **updates)
    return {"message": "Motor updated"}

@app.delete("/api/motors/{motor_id}")
def api_delete_motor(motor_id: int):
    motor = get_motor(motor_id)
    if not motor:
        raise HTTPException(status_code=404, detail="Motor not found")
    delete_motor(motor_id)
    motor_queue.remove(motor_id)
    return {"message": "Motor deleted"}

@app.post("/api/motors/scan-all")
def api_scan_all():
    results = []
    for motor in list_motors():
        try:
            result = api_scan_motor(motor["id"])
            results.append(result)
        except Exception as e:
            results.append({"motor_id": motor["id"], "error": str(e)})
    return results

@app.post("/api/motors/{motor_id}/scan")
def api_scan_motor(motor_id: int):
    motor = get_motor(motor_id)
    if not motor:
        raise HTTPException(status_code=404, detail="Motor not found")
    config = json.loads(motor["config_json"]) if isinstance(motor["config_json"], str) else motor.get("config", {})
    config["fault_mode"] = motor["fault_mode"]
    results = run_motor_scan(config)
    
    peak_dbc = results["analysis"]["peak_dbc"]
    if peak_dbc == float('-inf'):
        peak_dbc = -999
    status = dbc_to_status(peak_dbc)
    
    update_motor(motor_id, peak_dbc=peak_dbc, status=status)
    save_scan_results(motor_id, results["signal"], results["spectrum"], results["analysis"], results["scalogram"])
    
    add_fault_history(
        motor_id,
        motor["fault_mode"],
        peak_dbc,
        results["analysis"]["fundamental_freq"],
        results["analysis"]["upper_sideband_freq"],
        results["analysis"]["lower_sideband_freq"],
        status
    )
    
    motor_queue.insert(motor_id, peak_dbc, {
        "name": motor["name"],
        "fault_mode": motor["fault_mode"],
        "peak_dbc": peak_dbc,
        "status": status,
        "location": motor.get("location", "")
    })
    
    return {
        "motor_id": motor_id,
        "status": status,
        "peak_dbc": peak_dbc,
        "analysis": results["analysis"],
        "fft_reference": results["fft_reference"],
        "signal": results["signal"],
        "spectrum": results["spectrum"],
        "scalogram": results["scalogram"],
    }

@app.get("/api/motors/{motor_id}/history")
def api_get_history(motor_id: int):
    return get_fault_history(motor_id)

@app.get("/api/priority-queue")
def api_get_priority_queue():
    queue = motor_queue.get_sorted_list()
    return [{"priority": item[0], "motor_id": item[1], "motor_data": item[2]} for item in queue]

@app.get("/api/priority-queue/critical")
def api_get_critical():
    if motor_queue.is_empty():
        return None
    item = motor_queue.peek()
    return {"priority": item[0], "motor_id": item[1], "motor_data": item[2]}
