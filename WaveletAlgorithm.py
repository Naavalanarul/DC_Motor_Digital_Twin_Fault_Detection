import numpy as np
import pywt

"""
WaveletAlgorithm
================

Replaces the plain FFT fault-detection engine with a wavelet-based one,
following the multiresolution-analysis (MRA) framework popularised by:

    R. Polikar, "The Wavelet Tutorial", Rowan University
    (https://web.pdx.edu/~jduh/courses/Archive/wavelet%20tutorial.pdf)

and its standard application to motor current signature analysis (MCSA),
e.g. wavelet-decomposition-based broken-rotor-bar / bearing fault indices
that appear throughout the MCSA literature Polikar's tutorial underlies.

Two wavelet transforms are used, each for the job it is actually good at
(this division of labour -- time resolution vs. frequency resolution -- is
the whole point of the tutorial):

1. Continuous Wavelet Transform (CWT, complex Morlet 'cmor1.5-1.0')
   -----------------------------------------------------------------
   FFT gives one frequency spectrum averaged over the *entire* window, so a
   fault sideband that only appears intermittently (e.g. during a torque
   ripple) gets diluted by however much of the record is fault-free. CWT
   keeps time resolution, producing a magnitude value at every
   (time, frequency) point -- i.e. exactly the "frequency vs time vs
   amplitude" surface used for the 3D scalogram plot, and lets sideband
   detection run on the time-averaged magnitude at each frequency, which is
   still far less noise-sensitive than a single FFT bin because each
   wavelet coefficient already integrates energy over its own frequency
   band (Polikar tutorial, Ch. 3-4: constant relative bandwidth / "Q").

2. Discrete Wavelet Transform (DWT, Daubechies-4, Mallat's algorithm)
   -----------------------------------------------------------------
   Multiresolution decomposition of the signal into octave-spaced
   approximation/detail bands. The percentage of signal energy sitting in
   each band is a standard wavelet-domain fault fingerprint: a healthy
   motor's energy stays concentrated in the band containing the line
   frequency, while broken-bar / eccentricity / unbalance faults leak
   energy into neighbouring detail bands as sidebands grow. This is
   reported as `wavelet_energy_bands` and used as a second, independent
   corroborating severity signal alongside the CWT-derived dBc.
"""


class WaveletAlgorithm:

    def __init__(self, sampling_freq, sig, fault_freq, line_freq=None, harmonic_orders=None):
        self.sampling_frequency = sampling_freq
        self.signal = np.asarray(sig, dtype=float)
        self.f_fault = fault_freq
        self.line_freq_hint = line_freq
        self.harmonic_orders = harmonic_orders or [1]
        self.cwt_wavelet = "cmor1.5-1.0"   # complex Morlet: B=1.5 (bandwidth), C=1.0 (center freq)
        self.dwt_wavelet = "db4"           # Daubechies-4, standard MCSA/MRA choice
        self.freq_bins = 96
        self.time_bins = 64

    # ------------------------------------------------------------------
    # Frequency band to analyze: wide enough to see the requested
    # harmonic orders and their sidebands, narrow enough to keep the CWT
    # (which is O(freq_bins * N)) fast and the scalogram legible.
    # ------------------------------------------------------------------
    def _frequency_range(self):
        nyquist = self.sampling_frequency / 2.0
        anchor = self.line_freq_hint or max(self.f_fault * 4, 10.0)
        top_order = max(self.harmonic_orders) if self.harmonic_orders else 1
        f_max = min(nyquist * 0.95, anchor * (top_order + 1.5) + 4 * abs(self.f_fault))
        f_max = max(f_max, anchor + 4 * abs(self.f_fault), 10.0)
        f_min = max(0.5, min(anchor * 0.3, self.f_fault * 0.25))
        return f_min, f_max

    def _compute_cwt(self):
        """Returns (magnitude[freq_bins, N], freqs[freq_bins]) or None if the
        signal is too short to analyze."""
        N = len(self.signal)
        if N < 16 or self.sampling_frequency <= 0:
            return None
        f_min, f_max = self._frequency_range()
        freqs_target = np.linspace(f_min, f_max, self.freq_bins)
        fc = pywt.central_frequency(self.cwt_wavelet)
        scales = fc * self.sampling_frequency / freqs_target
        coeffs, freqs_out = pywt.cwt(
            self.signal, scales, self.cwt_wavelet,
            sampling_period=1.0 / self.sampling_frequency
        )
        magnitude = np.abs(coeffs)
        return magnitude, freqs_out

    @staticmethod
    def _nearest_index(freqs_out, target_freq):
        return int(np.argmin(np.abs(freqs_out - target_freq)))

    # ------------------------------------------------------------------
    # Public: full time x frequency x amplitude grid for the 3D plot.
    # ------------------------------------------------------------------
    def scalogram(self):
        result = self._compute_cwt()
        if result is None:
            return {"time": [], "frequency": [], "amplitude": []}
        magnitude, freqs_out = result
        N = magnitude.shape[1]
        t = np.arange(N) / self.sampling_frequency

        if N > self.time_bins:
            idx = np.linspace(0, N - 1, self.time_bins).astype(int)
        else:
            idx = np.arange(N)

        mag_ds = magnitude[:, idx]
        t_ds = t[idx]

        return {
            "time": t_ds.tolist(),
            "frequency": freqs_out.tolist(),
            # amplitude[i][j] = magnitude at frequency[i], time[j]
            "amplitude": mag_ds.tolist(),
        }

    # ------------------------------------------------------------------
    # DWT multiresolution energy fingerprint (Polikar-tutorial MRA).
    # ------------------------------------------------------------------
    def wavelet_energy_bands(self):
        N = len(self.signal)
        wl = pywt.Wavelet(self.dwt_wavelet)
        try:
            max_level = pywt.dwt_max_level(N, wl.dec_len)
        except Exception:
            return []
        if max_level < 1:
            return []
        levels = max(1, min(6, max_level))
        coeffs = pywt.wavedec(self.signal, self.dwt_wavelet, level=levels)
        fs = self.sampling_frequency

        energies = [float(np.sum(c ** 2)) for c in coeffs]
        total_energy = sum(energies) + 1e-12

        bands = [{
            "label": f"A{levels}",
            "freq_low": 0.0,
            "freq_high": fs / (2 ** (levels + 1)),
            "energy_pct": 100.0 * energies[0] / total_energy,
        }]
        for i, e in enumerate(energies[1:]):
            lvl = levels - i
            bands.append({
                "label": f"D{lvl}",
                "freq_low": fs / (2 ** (lvl + 1)),
                "freq_high": fs / (2 ** lvl),
                "energy_pct": 100.0 * e / total_energy,
            })
        return bands

    # ------------------------------------------------------------------
    # Harmonic sideband survey (CWT analogue of FFTAlgorithm's version),
    # used for multi-harmonic fault modes such as eccentricity.
    # ------------------------------------------------------------------
    def _harmonic_sideband_survey(self, freqs_out, time_avg, f1):
        results = []
        for n in self.harmonic_orders:
            harmonic_freq = n * f1
            idx_h = self._nearest_index(freqs_out, harmonic_freq)
            harmonic_amp = time_avg[idx_h]

            upper_freq = harmonic_freq + self.f_fault
            lower_freq = harmonic_freq - self.f_fault
            idx_upper = self._nearest_index(freqs_out, upper_freq)
            idx_lower = self._nearest_index(freqs_out, max(lower_freq, 0.0))

            upper_amp = time_avg[idx_upper]
            lower_amp = time_avg[idx_lower]

            ref = harmonic_amp if harmonic_amp > 1e-10 else 1e-10
            upper_dbc = 20 * np.log10((upper_amp + 1e-10) / ref)
            lower_dbc = 20 * np.log10((lower_amp + 1e-10) / ref)

            results.append({
                "order": n,
                "harmonic_freq": float(harmonic_freq),
                "harmonic_amp": float(harmonic_amp),
                "upper_freq": float(upper_freq),
                "lower_freq": float(lower_freq),
                "upper_amp": float(upper_amp),
                "lower_amp": float(lower_amp),
                "upper_dbc": float(upper_dbc),
                "lower_dbc": float(lower_dbc),
                "peak_dbc": float(max(upper_dbc, lower_dbc)),
            })
        return results

    # ------------------------------------------------------------------
    # Main entry point. Mirrors FFTAlgorithm.main_algorithm()'s return
    # shape so it's a drop-in for existing callers, plus wavelet-specific
    # fields (`wavelet_energy_bands`, `algorithm`).
    # ------------------------------------------------------------------
    def main_algorithm(self):
        result = self._compute_cwt()
        if result is None:
            return {
                "fundamental_freq": 0.0,
                "upper_sideband_freq": 0.0,
                "lower_sideband_freq": 0.0,
                "upper_sideband_amp": 0.0,
                "lower_sideband_amp": 0.0,
                "upper_dbc": -np.inf,
                "lower_dbc": -np.inf,
                "peak_dbc": -np.inf,
                "harmonic_sidebands": [],
                "wavelet_energy_bands": [],
                "algorithm": "CWT (Morlet) + DWT (db4) - Polikar wavelet MRA",
            }

        magnitude, freqs_out = result
        time_avg = magnitude.mean(axis=1)

        idx_fundamental = int(np.argmax(time_avg))
        fundamental_freq = float(freqs_out[idx_fundamental])
        base_amp = float(time_avg[idx_fundamental])

        if base_amp < 1e-10:
            return {
                "fundamental_freq": 0.0,
                "upper_sideband_freq": 0.0,
                "lower_sideband_freq": 0.0,
                "upper_sideband_amp": 0.0,
                "lower_sideband_amp": 0.0,
                "upper_dbc": -np.inf,
                "lower_dbc": -np.inf,
                "peak_dbc": -np.inf,
                "harmonic_sidebands": [],
                "wavelet_energy_bands": self.wavelet_energy_bands(),
                "algorithm": "CWT (Morlet) + DWT (db4) - Polikar wavelet MRA",
            }

        upper_sideband_freq = fundamental_freq + self.f_fault
        lower_sideband_freq = fundamental_freq - self.f_fault
        idx_upper = self._nearest_index(freqs_out, upper_sideband_freq)
        idx_lower = self._nearest_index(freqs_out, max(lower_sideband_freq, 0.0))

        upper_sideband_amp = float(time_avg[idx_upper])
        lower_sideband_amp = float(time_avg[idx_lower])

        upper_dbc = float(20 * np.log10((upper_sideband_amp + 1e-10) / (base_amp + 1e-10)))
        lower_dbc = float(20 * np.log10((lower_sideband_amp + 1e-10) / (base_amp + 1e-10)))
        peak_dbc = max(upper_dbc, lower_dbc)

        harmonics = self._harmonic_sideband_survey(freqs_out, time_avg, fundamental_freq)
        if len(self.harmonic_orders) > 1 and harmonics:
            peak_dbc = max(peak_dbc, max(h["peak_dbc"] for h in harmonics))

        return {
            "fundamental_freq": fundamental_freq,
            "upper_sideband_freq": float(upper_sideband_freq),
            "lower_sideband_freq": float(lower_sideband_freq),
            "upper_sideband_amp": upper_sideband_amp,
            "lower_sideband_amp": lower_sideband_amp,
            "upper_dbc": upper_dbc,
            "lower_dbc": lower_dbc,
            "peak_dbc": peak_dbc,
            "harmonic_sidebands": harmonics,
            "wavelet_energy_bands": self.wavelet_energy_bands(),
            "algorithm": "CWT (Morlet) + DWT (db4) - Polikar wavelet MRA",
        }