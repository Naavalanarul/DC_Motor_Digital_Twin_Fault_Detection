# Sound Fault Detector (Motor Frequency Simulator)

A full-stack application designed to simulate and detect faults in industrial motors using current/sound frequency analysis. It models motor currents under various fault conditions and applies Fast Fourier Transform (FFT) to analyze the frequency spectrum, detecting anomalies such as sidebands and harmonics. 

The project utilizes data structures and algorithms (DSA), specifically a Max-Heap Priority Queue, to manage and rank motors based on their fault severity, ensuring that critical motors requiring immediate attention are prioritized.

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
