import numpy as np

class FFTAlgorithm:
    def __init__(self, sampling_freq, sig, fault_freq, harmonic_orders=None):

        """
        CONSTANTS
        :param sampling_freq:
        :param harmonic_orders: which harmonics of the fundamental to inspect
            for sidebands (default: just the fundamental, order 1). Pass
            [1, 3, 5, 7, 9] to reproduce the odd-harmonic sideband survey
            used in the paper's Fig. 6 (eccentricity fault indicators
            clearly shown at the 1st, 3rd, 5th and 7th harmonic orders).
        """

        self.sampling_frequency = sampling_freq
        self.signal = sig
        self.f_fault = fault_freq
        self.harmonic_orders = harmonic_orders or [1]

    def harmonic_sideband_survey(self):
        """
        Reproduces the paper's Fig. 6 style analysis: for each odd harmonic
        order n of the fundamental (n*f1), measure the sideband amplitude
        at n*f1 +/- f_fault, expressed in dBc relative to that harmonic's
        own amplitude. This is what actually distinguishes an eccentricity
        fault from a healthy motor in the paper -- a single fundamental
        sideband pair is not enough, the fault shows up as elevated
        sidebands across the 1st/3rd/5th/7th/9th harmonics simultaneously.
        """
        N = len(self.signal)
        if N == 0:
            return []
        bin_width = self.sampling_frequency / N
        fft_amp = np.abs(np.fft.fft(self.signal)) * (2.0 / N)
        fft_freq = np.fft.fftfreq(N, 1.0 / self.sampling_frequency)
        half_N = N // 2
        fft_amp_pos = fft_amp[0:half_N]
        fft_freq_pos = fft_freq[0:half_N]

        if len(fft_amp_pos) == 0:
            return []

        # Fundamental is the tallest spike among the low-order harmonics
        index_fundamental = np.argmax(fft_amp_pos)
        f1 = fft_freq_pos[index_fundamental]

        results = []
        for n in self.harmonic_orders:
            harmonic_freq = n * f1
            idx_h = int(round(harmonic_freq / bin_width)) if bin_width > 0 else 0
            idx_h = max(0, min(idx_h, len(fft_amp_pos) - 1))
            harmonic_amp = fft_amp_pos[idx_h]

            upper_freq = harmonic_freq + self.f_fault
            lower_freq = harmonic_freq - self.f_fault
            idx_upper = int(round(upper_freq / bin_width)) if bin_width > 0 else 0
            idx_lower = int(round(lower_freq / bin_width)) if bin_width > 0 else 0
            idx_upper = max(0, min(idx_upper, len(fft_amp_pos) - 1))
            idx_lower = max(0, min(idx_lower, len(fft_amp_pos) - 1))

            upper_amp = fft_amp_pos[idx_upper]
            lower_amp = fft_amp_pos[idx_lower]

            ref = harmonic_amp if harmonic_amp > 1e-10 else 1e-10
            upper_dbc = 20 * np.log10((upper_amp + 1e-10) / ref)
            lower_dbc = 20 * np.log10((lower_amp + 1e-10) / ref)

            results.append({
                "order": n,
                "harmonic_freq": harmonic_freq,
                "harmonic_amp": harmonic_amp,
                "upper_freq": upper_freq,
                "lower_freq": lower_freq,
                "upper_amp": upper_amp,
                "lower_amp": lower_amp,
                "upper_dbc": upper_dbc,
                "lower_dbc": lower_dbc,
                "peak_dbc": max(upper_dbc, lower_dbc),
            })
        return results

    def main_algorithm(self):

        """
        Performing fast fourier transform operation using fft function of numpy module
        :return: dict with fundamental, sideband (both), and dBc results
        """

        # Step 1 - Storing array length and Bin width for indexing later
        N = len(self.signal)
        bin_width = self.sampling_frequency / N

        # Step 2 - Performing fast fourier transforms and Normalising it
        fft_amp = np.abs(np.fft.fft(self.signal)) * (2.0 / N)
        fft_freq = np.fft.fftfreq(N, 1.0 / self.sampling_frequency)

        # Step 3 - Slice the Mirror (Nyquist Effect)
        half_N = N // 2
        fft_amp_pos = fft_amp[0:half_N]
        fft_freq_pos = fft_freq[0:half_N]

        # 4. Find the Fundamental Frequency (The tallest spike)
        # np.argmax finds the *index* of the highest value in the amplitude array
        index_fundamental = np.argmax(fft_amp_pos)
        fundamental_freq = fft_freq_pos[index_fundamental]
        base_amp = fft_amp_pos[index_fundamental]

        # Guard against zero-amplitude fundamental (no signal case)
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
            }

        # 5. Find Sidebands using the O(1) Math Hack
        # For broken rotor bar faults, sidebands appear on BOTH sides of fundamental
        upper_sideband_freq = fundamental_freq + self.f_fault
        lower_sideband_freq = fundamental_freq - self.f_fault

        # Calculate the exact array indices without looping/searching
        index_upper = int(round(upper_sideband_freq / bin_width))
        index_lower = int(round(lower_sideband_freq / bin_width))

        # Clamp indices to valid range to avoid IndexError
        index_upper = max(0, min(index_upper, len(fft_amp_pos) - 1))
        index_lower = max(0, min(index_lower, len(fft_amp_pos) - 1))

        upper_sideband_amp = fft_amp_pos[index_upper]
        lower_sideband_amp = fft_amp_pos[index_lower]

        # 6. Calculate dBc (Logarithmic scale) — relative to the carrier
        # Add 1e-10 to prevent "divide by zero" if amplitude is exactly 0
        upper_dbc = 20 * np.log10((upper_sideband_amp + 1e-10) / (base_amp + 1e-10))
        lower_dbc = 20 * np.log10((lower_sideband_amp + 1e-10) / (base_amp + 1e-10))

        peak_dbc = max(upper_dbc, lower_dbc)

        # Multi-harmonic survey (paper Fig. 6): if the caller asked for
        # more than just the fundamental, the overall peak_dbc should
        # reflect the worst sideband across ALL surveyed harmonics, not
        # just the fundamental -- this is what the paper actually uses to
        # flag a fault (odd harmonic 3rd/5th/7th sidebands, not just 1st).
        harmonics = self.harmonic_sideband_survey()
        if len(self.harmonic_orders) > 1 and harmonics:
            peak_dbc = max(peak_dbc, max(h["peak_dbc"] for h in harmonics))

        return {
            "fundamental_freq": fundamental_freq,
            "upper_sideband_freq": upper_sideband_freq,
            "lower_sideband_freq": lower_sideband_freq,
            "upper_sideband_amp": upper_sideband_amp,
            "lower_sideband_amp": lower_sideband_amp,
            "upper_dbc": upper_dbc,
            "lower_dbc": lower_dbc,
            "peak_dbc": peak_dbc,
            "harmonic_sidebands": harmonics,
        }
