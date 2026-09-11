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
7. **Frontend Gap Closed:** The React frontend now accurately visualizes the
    multi-harmonic survey (`analysis.harmonic_sidebands`) and includes a dedicated
    `AcousticChart` to visualize acoustic pressure waveforms and peak frequencies.
    It also features an overhauled OLED Dark Theme UI designed using the `ui-ux-pro-max` skill.
8. **Detection engine replaced: FFT → wavelet transform (Polikar MRA).**
   `WaveletAlgorithm.py` is now the primary fault-detection engine used by
   every backend endpoint (`/api/motors/{id}/scan`, `/api/analyze`), following
   R. Polikar's "The Wavelet Tutorial" multiresolution-analysis framework:
   a continuous wavelet transform (complex Morlet) gives a magnitude value at
   every (time, frequency) point instead of one spectrum averaged over the
   whole window, so intermittent/time-varying sidebands are no longer diluted
   away; a discrete wavelet transform (Daubechies-4, Mallat's algorithm) adds
   an independent multiresolution energy fingerprint (`wavelet_energy_bands`)
   as a second, corroborating severity signal. FFT is kept only as a
   secondary reference spectrum (`fft_reference` / the 2D spectrum chart), not
   the detector.
9. **3D time/frequency/amplitude scalogram.** The CWT's full (time,
   frequency) magnitude grid is exposed via `scalogram()` and rendered as a
   Plotly 3D surface (`Scalogram3D.jsx`) so a fault's evolution over time is
   visible directly, not just its time-averaged FFT peak.
10. **Minimalist black & white theme.** The UI was rebuilt to a strict
    grayscale palette (no hue anywhere) -- fault severity is now communicated
    through brightness/weight alone (fault = brightest white, healthy = a
    muted recessive gray), rather than the previous red/orange/green/cyan
    color-coded OLED theme.

## Features

- **Signal Simulation**: Generates synthetic motor current signals for various fault modes (Broken Rotor Bar, Stator Winding Fault, Eccentricity, Mechanical Unbalance), factoring in parameters like line frequency, fault frequency, amplitude, slip, poles, slots, and noise floor.
- **Wavelet Analysis (primary detector)**: Applies a continuous wavelet transform (complex Morlet CWT) and discrete wavelet transform (Daubechies-4 DWT) to the time-domain signal, following R. Polikar's wavelet-tutorial MRA framework, extracting fundamental/sideband frequencies, dBc severity, and per-band energy fingerprints while preserving time resolution.
- **FFT (reference only)**: Still computed as a secondary spectrum for comparison against the wavelet result, and to drive the 2D spectrum chart.
- **3D Scalogram**: Full time × frequency × amplitude surface from the CWT, visualized as an interactive 3D Plotly surface.
- **Acoustic Modeling**: Simulates acoustic pressure waveforms and evaluates spectral peaks against defined mechanical fault thresholds.
- **Priority Queue Management (DSA)**: Implements a custom Max-Heap priority queue to efficiently rank and retrieve motors based on their peak dBc values.
- **Database Storage**: Uses SQLite to persist motor configurations, ongoing scan results, and historical fault data.
- **FastAPI Backend**: Provides robust REST API endpoints for simulation, analysis, motor management, and priority queue operations.
- **React Frontend**: A modern Vite + React frontend dashboard to manage motors, trigger scans, and visualize frequency spectrums and time-domain signals using Chart.js.
- **Standalone Streamlit Interface**: Includes a Streamlit UI (`frequencySimulator.py`) for interactive real-time simulation and visualization without the full web stack.

## Tech Stack

- **Backend**: Python, FastAPI, NumPy, SQLite
- **Frontend**: React, Vite, Chart.js
- **Algorithms & Data Structures**: Wavelet Transform (CWT + DWT, Polikar MRA) as primary detector, Fast Fourier Transform (FFT) as reference, Max-Heap Priority Queue
- **Deployment**: Vercel (Serverless Python Functions & Vite Static Build)

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js & npm

### Running Locally (Backend + Frontend)

1. Start the FastAPI server:
   ```bash
   pip install -r requirements.txt
   cd backend
   uvicorn main:app --reload
   ```

2. Start the React development server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Deployment to Vercel`

This repository is pre-configured for full-stack deployment on Vercel:
- `vercel.json` and `api/index.py` handle serverless routing for the FastAPI backend.
- `package.json` at the root orchestrates the frontend Vite build.
- `database.py` maps the SQLite database to `/tmp/motors.db` automatically in the Vercel environment to respect the read-only file system.

To deploy:
1. Push your repository to GitHub/GitLab/Bitbucket.
2. Import the project in your Vercel Dashboard.
3. Leave all settings at their defaults (Root Directory: `/`, Framework Preset: `Other`).
4. Click **Deploy**. Vercel will build both the frontend and the Python backend seamlessly.

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
