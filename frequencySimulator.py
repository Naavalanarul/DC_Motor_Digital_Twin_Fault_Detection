import numpy as np

"""
FAULTS
    1. Broken Rotor Bar Fault
    2. Stator windings Fault
    3. Eccentricity
    4. External (Mechanical Unbalance / Alignment)
"""


class FrequencySimulator:

    def __init__(self):
        """
        CONSTANTS DEFINED
        sampling_frequency is not necessarily defined using interface and be edited if wanted
        """
        self.modulation_index = 0
        self.line_frequency = 0
        self.fault_frequency = 0
        self.amplitude = 0
        self.sampling_frequency = 0  # As per Nyquist-Shannon theorem
        self.duration = 0
        self.noise_floor = 0

        """
        DYNAMICALLY DEFINED CONSTANTS (i.e. Used only if it is necessary)[Not necessarily dynamic but defined already]
        """
        self.slip = 0
        self.severity = 0
        self.harmonic_index = 0

        self.poles = 0
        self.slots = 0
        self.slot_harmonic = 0
        self.network_harmonic = 0

        self.fr = 0
        self.static_severity = 0
        self.dynamic_severity = 0

        """
        CONSTANT DEFINED FOR THE FAULT CHOICE
        """
        self.fault_mode = None

        """
        Store the arrays as class attributes so they can be easily accessed
        """
        self.t = np.array([])
        self.motor_current = np.array([])

    def _button_slider(self, placeholder_text, min_val, max_val, initial_value,
                       slider_name, number_input_name, step_value):
        """
        Synchronized slider + number input pair stored in session_state.
        Changes in either widget update the other in real-time.
        """
        import streamlit as st
        if slider_name not in st.session_state:
            st.session_state[slider_name] = initial_value
        if number_input_name not in st.session_state:
            st.session_state[number_input_name] = initial_value

        def sync_from_slider():
            st.session_state[number_input_name] = st.session_state[slider_name]

        def sync_from_number():
            st.session_state[slider_name] = st.session_state[number_input_name]

        col1, col2 = st.columns([3, 1])
        with col1:
            st.slider(
                placeholder_text,
                min_value=min_val,
                max_value=max_val,
                value=initial_value,
                key=slider_name,
                step=step_value,
                on_change=sync_from_slider
            )
        with col2:
            st.number_input(
                placeholder_text,
                min_value=min_val,
                max_value=max_val,
                value=initial_value,
                key=number_input_name,
                step=step_value,
                label_visibility="collapsed",
                on_change=sync_from_number
            )

    def interface(self):
        """
        Build the Streamlit UI: fault selector on sidebar, simulation params
        and plot in the main area. Returns time and current arrays for use
        by external callers (FFTAlgorithm, downstream analysis, etc.).
        """

        def simulation_parameters():
            self._button_slider("Modulation Index (m)", 0.0, 1.0, 0.04,
                                "modulationIndex_slider", "modulationIndex_numberInput", 0.005)
            self.modulation_index = st.session_state.modulationIndex_slider

            self._button_slider("Line Frequency (f_line)", 0, 100, 50,
                                "LineFreq_slider", "LineFreq_numberInput", 1)
            self.line_frequency = st.session_state.LineFreq_slider

            self._button_slider("Fault Frequency (f_frequency)", 0, 20, 2,
                                "FaultFreq_slider", "FaultFreq_numberInput", 1)
            self.fault_frequency = st.session_state.FaultFreq_slider

            self._button_slider("Amplitude (Amp)", 0, 100, 10,
                                "Amp_slider", "Amp_numberInput", 1)
            self.amplitude = st.session_state.Amp_slider

            self._button_slider("Time duration (t)", 0, 100, 10,
                                "dur_slider", "dur_numberInput", 1)
            self.duration = st.session_state.dur_slider

            self._button_slider("Noise Floor (N)", 0.0, 1.0, 0.05,
                                "noise_floor_slider", "noise_floor_numberInput", 0.01)
            self.noise_floor = st.session_state.noise_floor_slider

            # Compute derived value so it's always in sync
            self.sampling_frequency = 20 * self.line_frequency

        # --- Fault-specific parameter functions ---

        def broken_rotor_bar_simulation_parameters():
            self._button_slider("Motor Slip (s)", 0.0, 0.1, 0.02,
                                "slip_slider", "slip_numberInput", 0.001)
            self.slip = st.session_state.slip_slider

            self._button_slider("Harmonic Index (k)", 0, 10, 1,
                                "harmonic_slider", "harmonic_numberInput", 1)
            self.harmonic_index = st.session_state.harmonic_slider

            self._button_slider("Fault Severity (m)", 0.0, 0.05, 0.05,
                                "fault_severity_slider", "fault_severity_numberInput", 0.005)
            self.severity = st.session_state.fault_severity_slider

        def stator_fault_simulation_parameters():
            self._button_slider("Fault Severity (m)", 0.0, 0.5, 0.05,
                                "stator_sev_slider", "stator_sev_num", 0.005)
            self.severity = st.session_state.stator_sev_slider

            self._button_slider("Number of Poles (p)", 2.0, 12.0, 4.0,
                                "stator_p_slider", "stator_p_num", 2.0)
            self.poles = st.session_state.stator_p_slider

            self._button_slider("Number of Rotor Slots (R)", 15.0, 60.0, 28.0,
                                "stator_r_slider", "stator_r_num", 1.0)
            self.slots = st.session_state.stator_r_slider

            self._button_slider("Motor Slip (s)", 0.0, 0.1, 0.03,
                                "stator_slip_slider", "stator_slip_num", 0.001)
            self.slip = st.session_state.stator_slip_slider

            self._button_slider("Slot Harmonic (n)", 1.0, 5.0, 1.0,
                                "stator_n_slider", "stator_n_num", 1.0)
            self.slot_harmonic = st.session_state.stator_n_slider

            self._button_slider("Network Harmonic (k)", 1.0, 5.0, 1.0,
                                "stator_k_slider", "stator_k_num", 1.0)
            self.network_harmonic = st.session_state.stator_k_slider

        def eccentricity_simulation_parameters():
            self._button_slider("Rotor Speed (fr) Hz", 0.0, 60.0, 24.5,
                                "ecc_fr_slider", "ecc_fr_num", 0.1)
            self.fr = st.session_state.ecc_fr_slider

            self._button_slider("Static Severity (ms)", 0.0, 0.5, 0.05,
                                "ecc_ms_slider", "ecc_ms_num", 0.005)
            self.static_severity = st.session_state.ecc_ms_slider

            self._button_slider("Dynamic Severity (md)", 0.0, 0.5, 0.05,
                                "ecc_md_slider", "ecc_md_num", 0.005)
            self.dynamic_severity = st.session_state.ecc_md_slider

        def mechanical_unbalance_simulation_parameters():
            self._button_slider("Fault Severity (m)", 0.0, 0.5, 0.05,
                                "unb_sev_slider", "unb_sev_num", 0.005)
            self.severity = st.session_state.unb_sev_slider

            self._button_slider("Rotor Speed (fr) Hz", 0.0, 60.0, 24.5,
                                "unb_fr_slider", "unb_fr_num", 0.1)
            self.fr = st.session_state.unb_fr_slider

        # --- UI Layout ---

        import streamlit as st
        st.title("Motor Frequency Simulator")

        with st.sidebar:
            st.subheader("Simulation Parameters")
            options = [
                "Broken Rotor Bar",
                "Stator winding fault",
                "Eccentricity (Asymmetry)",
                "External (Mechanical Unbalance / Alignment)"
            ]
            self.fault_mode = st.selectbox("Select Fault Simulation mode", options)

            if self.fault_mode == "Broken Rotor Bar":
                broken_rotor_bar_simulation_parameters()
            elif self.fault_mode == "Stator winding fault":
                stator_fault_simulation_parameters()
            elif self.fault_mode == "Eccentricity (Asymmetry)":
                eccentricity_simulation_parameters()
            elif self.fault_mode == "External (Mechanical Unbalance / Alignment)":
                mechanical_unbalance_simulation_parameters()

        with st.container(border=True):
            simulation_parameters()
            self.plot()

        return self.t, self.motor_current

    def _effective_fault_frequency(self):
        """
        Derive the physically-correct sideband offset frequency from the
        fault-mode-specific parameters, instead of relying on a single
        generic 'Fault Frequency' slider for every fault type.

        Broken Rotor Bar (classical MCSA / Thomson & Fenger relation):
            f_brb_sideband = 2 * k * s * f_line      (k = harmonic_index, s = slip)

        Stator winding fault (rotor slot harmonic relation):
            f_stator_sideband = f_line * (R*(1-s)/p) +/- n   (approximate)

        Eccentricity (this paper, Sec. II.C/II.D, Eq. 9 & 13):
            f_de  = f_n +/- f_r
            f_ecc = f_s +/- m * f_r
            -> here we drive the sideband spacing directly from the rotor
               mechanical speed f_r (not an arbitrary slider value).

        Mechanical unbalance / misalignment (classical vibration literature):
            dominant sideband sits at 1x rotor mechanical speed f_r.
        """
        if self.fault_mode == "Broken Rotor Bar":
            k = max(self.harmonic_index, 1)
            return 2 * k * self.slip * self.line_frequency
        elif self.fault_mode == "Stator winding fault":
            p = max(self.poles, 1)
            return self.line_frequency * (self.slots * (1 - self.slip) / p) % self.line_frequency \
                   + self.slot_harmonic * self.network_harmonic
        elif self.fault_mode == "Eccentricity (Asymmetry)":
            return self.fr
        elif self.fault_mode == "External (Mechanical Unbalance / Alignment)":
            return self.fr
        else:
            # Fall back to the manually-set slider value when no mode selected
            return self.fault_frequency

    def _effective_modulation_index(self):
        """
        Map the fault-mode-specific severity parameter onto the AM
        modulation depth actually used to synthesize the tremolo, instead
        of a single generic slider for every mode.
        """
        if self.fault_mode == "Broken Rotor Bar":
            return self.severity
        elif self.fault_mode == "Stator winding fault":
            return self.severity
        elif self.fault_mode == "Eccentricity (Asymmetry)":
            # Combined static + dynamic eccentricity severity, per Fig. 1
            # (mix eccentricity = static + dynamic superimposed)
            return self.static_severity + self.dynamic_severity
        elif self.fault_mode == "External (Mechanical Unbalance / Alignment)":
            return self.severity
        else:
            return self.modulation_index

    def simulate(self):
        """
        Safety catch to prevent ZeroDivisionError
        """
        if self.sampling_frequency <= 0:
            self.t, self.motor_current = np.array([]), np.array([])
            return self.t, self.motor_current

        # Preserve the specified acquisition clock even for fractional durations.
        num_samples = int(self.duration * self.sampling_frequency)
        t = np.arange(num_samples) / self.sampling_frequency
        self.t = t  # Fix: save to instance attribute so plot() can use them

        # Resolve the physically-correct fault frequency/severity for the
        # selected fault mode instead of always using the raw slider values.
        # This keeps self.fault_frequency in sync for anything downstream
        # (e.g. FFTAlgorithm, which is told what offset to look for).
        eff_fault_freq = self._effective_fault_frequency()
        eff_mod_index = self._effective_modulation_index()
        self.fault_frequency = eff_fault_freq

        if self.fault_mode == "Eccentricity (Asymmetry)":
            # Paper Eq. 13: f_ecc = f_s +/- m*f_r, observed as sidebands
            # spaced at +/- f_r around the ODD harmonics of the supply
            # frequency (1st, 3rd, 5th, 7th, 9th) -- see paper Fig. 6b,
            # where sidebands appear at 1st(25,75), 3rd(125,175),
            # 5th(225,275), 7th(325,375) for f_line=50Hz, f_r~=25Hz.
            harmonic_orders = [1, 3, 5, 7, 9]
            carrier = np.zeros_like(t)
            for n in harmonic_orders:
                # Odd harmonics naturally decay in amplitude (~1/n),
                # matching the healthy spectral density shape in Fig. 6a.
                carrier += (self.amplitude / n) * np.sin(2 * np.pi * n * self.line_frequency * t)
            motor_current = carrier * (
                1 + eff_mod_index * np.sin(2 * np.pi * self.fr * t)
            )
        else:
            motor_current = self.amplitude * (
                1 + eff_mod_index * np.sin(2 * np.pi * self.fault_frequency * t)
            ) * np.sin(2 * np.pi * self.line_frequency * t)

        # Additive measurement/environmental noise floor, so 'healthy'
        # motors don't produce a perfectly clean, noiseless spectrum.
        if self.noise_floor and self.noise_floor > 0:
            motor_current = motor_current + np.random.normal(
                0, self.noise_floor * self.amplitude, size=t.shape
            )

        self.motor_current = motor_current  # Fix: save to instance attribute

        return self.t, self.motor_current

    def plot(self):
        """
        Current Equation  - I(t) = A * sin(2*pi*f*t)       where f = 50Hz (line frequency)
        Fault Equation    - I(t) = A * sin(2*pi*f*t)       where f = 2Hz  (fault frequency)
        Final Current Eqn - I(t) = A * (1 + m * sin(2*pi*f_fault*t)) * sin(2*pi*f_line*t)
                            where m = modulation index for the motor's fault detection (<= 1)
        This [1 + ...] bracket is tremolo
        """
        t, motor_current = self.simulate()
        import matplotlib.pyplot as plt
        import streamlit as st
        plt.figure(figsize=(12, 4))
        plt.plot(t, motor_current, color='#d62728')
        plt.title('Motor Sound Simulation')
        plt.xlabel('Time (seconds)')
        plt.ylabel('Current (Amps)')
        plt.grid(True)
        st.pyplot(plt.gcf())

    def return_sampling_frequency(self):
        return self.sampling_frequency

    def return_fault_frequency(self):
        return self.fault_frequency


# --- Streamlit entry point ---
# When run with `streamlit run frequencySimulator.py`, Streamlit
# executes all top-level code. This instantiates the simulator
# and builds the UI.
# The guard prevents this code from running when imported as a module
# (e.g., by the FastAPI backend).
def _is_streamlit_running():
    try:
        from streamlit.runtime.scriptrunner import get_script_run_ctx
        return get_script_run_ctx() is not None
    except Exception:
        return False

if __name__ == "__main__" or _is_streamlit_running():
    sim = FrequencySimulator()
    sim.interface()
