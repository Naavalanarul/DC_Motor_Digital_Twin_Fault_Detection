"""
Sound-acoustic fault detection, per Sec. II.D and IV.D of:

Prainetr, S., Wangnippanto, S., Tunyasirut, S. (2017). "Detection
Mechanical Fault of Induction Motor Using Harmonic Current and Sound
Acoustic." 5th International Electrical Engineering Congress, Pattaya,
Thailand, 8-10 March 2017.

The paper's title and its whole second detection channel (Sec. II.D,
Eq. 11; Sec. IV.D, Fig. 7) is acoustic analysis, done in parallel with the
current-harmonic analysis (Sec. IV.A-C). This repo's own README describes
itself as a "Sound Fault Detector" but the codebase never actually
generated or analyzed an acoustic signal -- only motor current. This
module fills that gap.

Paper Eq. (11):
    Pc = Po + Po * cos(2*pi*f*t + phi)
where Pc is acoustic pressure (Pa), Po is the sound pressure amplitude,
f is frequency (Hz), t is time (s), phi is phase shift.

Paper Sec. IV.D reports the experimentally measured spectral peaks:
    - healthy state:      157.2 Hz
    - eccentricity fault: an over-limit peak at 625 Hz

Those two reference values are used below purely as classification
thresholds (matching how the paper itself frames the result: "eccentricity
fault, it have over limit criterion is 625Hz"), not as universal constants
for any motor -- they are specific to the paper's 11 kW/380V/1500rpm test
motor and are exposed here as configurable defaults for that reason.
"""

import numpy as np

from standards import ACOUSTIC_HEALTHY_PEAK_HZ, ACOUSTIC_FAULT_LIMIT_HZ


class SoundAcousticSimulator:
    def __init__(self, sampling_frequency=2000, duration=5):
        self.sampling_frequency = sampling_frequency
        self.duration = duration

    def simulate(self, base_frequency=157.2, amplitude=1.0, phase=0.0,
                 fault_present=False, fault_frequency=625.0,
                 fault_amplitude=0.6, noise_floor=0.05):
        """
        Generate a synthetic acoustic pressure signal per Eq. (11), with an
        optional additional fault-band component superimposed when a
        mechanical fault (e.g. eccentricity-driven vibration) is present,
        matching the paper's observation that fault acoustic spectra show
        an additional peak well above the healthy baseline (157.2 Hz ->
        625 Hz, Sec. IV.D).
        """
        num_samples = max(int(self.duration * self.sampling_frequency), 1)
        t = np.linspace(0, self.duration, num_samples, endpoint=False)

        # Eq. (11): Pc = Po + Po*cos(2*pi*f*t + phi)
        pc = amplitude + amplitude * np.cos(2 * np.pi * base_frequency * t + phase)

        if fault_present:
            pc = pc + fault_amplitude * np.cos(2 * np.pi * fault_frequency * t)

        if noise_floor > 0:
            pc = pc + np.random.normal(0, noise_floor * amplitude, size=t.shape)

        return t, pc

    def spectral_peak(self, signal):
        """Return the dominant (non-DC) spectral peak frequency of an
        acoustic pressure signal, analogous to Fig. 7's spectral density
        plots."""
        N = len(signal)
        if N == 0:
            return 0.0
        fft_amp = np.abs(np.fft.fft(signal)) * (2.0 / N)
        fft_freq = np.fft.fftfreq(N, 1.0 / self.sampling_frequency)
        half = N // 2
        fft_amp_pos = fft_amp[1:half]  # skip DC bin
        fft_freq_pos = fft_freq[1:half]
        if len(fft_amp_pos) == 0:
            return 0.0
        return float(fft_freq_pos[np.argmax(fft_amp_pos)])

    def classify(self, peak_freq_hz,
                 healthy_ref_hz=ACOUSTIC_HEALTHY_PEAK_HZ,
                 fault_limit_hz=ACOUSTIC_FAULT_LIMIT_HZ):
        """
        Classify a measured spectral peak against the paper's Sec. IV.D
        reference values: healthy ~157.2 Hz, fault criterion exceeded at
        625 Hz. These thresholds are specific to the paper's test motor
        and should be re-calibrated per machine in a real deployment; they
        are kept here only to reproduce the paper's own worked example.
        """
        if peak_freq_hz >= fault_limit_hz:
            return "fault"
        elif peak_freq_hz > healthy_ref_hz * 1.5:
            return "warning"
        return "healthy"
