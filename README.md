# Sound Fault Detector (Motor Frequency Simulator)

A full-stack application designed to simulate and detect faults in industrial motors using current/sound frequency analysis. It models motor currents under various fault conditions and applies Fast Fourier Transform (FFT) to analyze the frequency spectrum, detecting anomalies such as sidebands and harmonics. 

The project utilizes data structures and algorithms (DSA), specifically a Max-Heap Priority Queue, to manage and rank motors based on their fault severity, ensuring that critical motors requiring immediate attention are prioritized.

## Reference paper

This project's physics is modeled after:

> S. Prainetr, S. Wangnippanto, S. Tunyasirut, "Detection Mechanical Fault of
> Induction Motor Using Harmonic Current and Sound Acoustic," 5th
> International Electrical Engineering Congress, Pattaya, Thailand, 8-10
> March 2017.

That paper is specifically about **eccentricity** faults in a 4-pole,
11 kW, 380 V, 1500 rpm induction motor, detected two ways: (1) current
harmonic/sideband analysis via FFT, and (2) sound acoustic spectral
analysis. Its own experimental test points come from a real alignment
standard (Table I) — normal alignment, then 0.05 mm, 0.10 mm and 0.20 mm
of parallel misalignment.

### What was inaccurate before this pass, and what changed

1. **Fault mode had no effect on the simulated signal.** `simulate()`
   always produced the same generic `A*(1 + m*sin(2π f_fault t))*sin(2π
   f_line t))` tremolo regardless of which fault mode, slip, poles, slots,
   severity, `fr`, or eccentricity parameters were set — those values were
   captured from the UI/API but silently discarded. Every fault mode was
   numerically identical. This is now fixed: each mode derives its sideband
   frequency and modulation depth from its *own* physical parameters
   (`_effective_fault_frequency` / `_effective_modulation_index` in
   `frequencySimulator.py`).
2. **Eccentricity didn't match the paper's own equations.** The paper's Eq.
   9/13 (`f_de = f_n ± f_r`, `f_ecc = f_s ± m·f_r`) and Fig. 6 show
   eccentricity sidebands spaced at ± the rotor mechanical frequency `f_r`
   around the **odd harmonics** of the supply frequency (1st, 3rd, 5th, 7th,
   9th), not a single sideband pair around the fundamental alone. The
   simulator and `FFTAlgorithm.harmonic_sideband_survey()` now reproduce
   that multi-harmonic pattern directly.
3. **No connection to the paper's own alignment standard (Table I).** Added
   `standards.py`, which maps a physical misalignment in mm to Table I's
   tolerance and to the simulator's severity index, and exposes the paper's
   test ladder (0 / 0.05 / 0.10 / 0.20 mm) via `/api/standards/alignment`.
4. **No acoustic detection at all**, despite the project's own name and the
   paper's title putting sound analysis on equal footing with current
   analysis. Added `soundAcoustic.py`, implementing the paper's Eq. 11
   (`Pc = Po + Po·cos(2πft+φ)`) and its Sec. IV.D reference values
   (healthy peak ≈ 157.2 Hz, fault criterion at 625 Hz), exposed via
   `/api/acoustic/simulate`.
5. **Naming mismatch.** The repo is named "DC Motor..." but every formula
   here — line frequency, slip, poles, rotor slots — is AC induction-motor
   physics, matching the paper exactly. Kept as-is since renaming the repo
   is a larger, separate decision, but flagged here so it isn't confused
   for a DC-motor model.
6. **Broken Rotor Bar and Stator Winding Fault are not in this paper at
   all** — the paper covers eccentricity only. Those two modes now use
   standard MCSA literature formulas (Thomson & Fenger relation for broken
   bars; rotor-slot-harmonic relation for stator faults) so they at least
   respond to their own parameters, but they should be understood as
   extensions beyond this specific paper's scope, not results reproduced
   from it.

### Known remaining gap

The React frontend (`frontend/src/components/*`) still only visualizes the
single fundamental sideband pair and doesn't yet render the new
multi-harmonic survey (`analysis.harmonic_sidebands`) or the acoustic
endpoints. The backend/simulation layer is now paper-accurate; wiring
those extra fields into the UI charts is the natural next step.

## Features

- **Signal Simulation**: Generates synthetic motor current signals for various fault modes (Broken Rotor Bar, Stator Winding Fault, Eccentricity, Mechanical Unbalance), factoring in parameters like line frequency, fault frequency, amplitude, slip, poles, slots, and noise floor.
- **FFT Analysis**: Processes time-domain signals using Fast Fourier Transform to extract fundamental frequencies and sidebands, and calculates dBc (decibels relative to carrier) values to measure fault severity.
- **Priority Queue Management (DSA)**: Implements a custom Max-Heap priority queue to efficiently rank and retrieve motors based on their peak dBc values.
- **Database Storage**: Uses SQLite to persist motor configurations, ongoing scan results, and historical fault data.
- **FastAPI Backend**: Provides robust REST API endpoints for simulation, analysis, motor management, and priority queue operations.
- **React Frontend**: A modern Vite + React frontend dashboard to manage motors, trigger scans, and visualize frequency spectrums and time-domain signals using Chart.js.
- **Standalone Streamlit Interface**: Includes a Streamlit UI (`frequencySimulator.py`) for interactive real-time simulation and visualization without the full web stack.

## Tech Stack

- **Backend**: Python, FastAPI, NumPy, SQLite
- **Frontend**: React, Vite, Chart.js
- **Algorithms & Data Structures**: Fast Fourier Transform (FFT), Max-Heap Priority Queue

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js & npm

### Running the Backend

1. Navigate to the backend directory (or root, depending on where requirements are):
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

### Running the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

### Running the Streamlit Simulator (Optional standalone UI)

You can run the standalone frequency simulator to interactively tweak parameters and see the resulting signal.

```bash
pip install streamlit matplotlib numpy
streamlit run frequencySimulator.py
```

## Fault Modes Supported

1. **Broken Rotor Bar**: Sidebands appear around the fundamental frequency based on motor slip and harmonic index.
2. **Stator Winding Fault**: Frequency shifts based on number of poles, rotor slots, and slip.
3. **Eccentricity (Asymmetry)**: Generates static and dynamic severity components based on rotor speed.
4. **Mechanical Unbalance / Alignment**: Modulates the signal based on rotor speed and fault severity.
