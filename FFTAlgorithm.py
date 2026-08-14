import numpy as np

class FFTAlgorithm:
    def __init__(self, sampling_freq, sig, fault_freq):

        """
        CONSTANTS
        :param sampling_freq:
        """

        self.sampling_frequency = sampling_freq
        self.signal = sig
        self.f_fault = fault_freq

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

        return {
            "fundamental_freq": fundamental_freq,
            "upper_sideband_freq": upper_sideband_freq,
            "lower_sideband_freq": lower_sideband_freq,
            "upper_sideband_amp": upper_sideband_amp,
            "lower_sideband_amp": lower_sideband_amp,
            "upper_dbc": upper_dbc,
            "lower_dbc": lower_dbc,
            "peak_dbc": peak_dbc,
        }
