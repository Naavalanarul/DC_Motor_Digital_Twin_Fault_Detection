import numpy as np
import streamlit as st
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib import cm
from typing import Dict, List, Tuple, Optional
from WaveletAlgorithm import WaveletAlgorithm
from soundAcoustic import SoundAcousticSimulator
from standards import classify_offset, offset_mm_to_severity_index, allowed_offset_mm

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
        """
        self.modulation_index = 0
        self.line_frequency = 0
        self.fault_frequency = 0
        self.amplitude = 0
        self.sampling_frequency = 0
        self.duration = 0
        self.noise_floor = 0

        """
        DYNAMICALLY DEFINED CONSTANTS
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
        Physical motor parameters for digital twin
        """
        self.rated_power = 11.0  # kW
        self.rated_voltage = 380.0  # V
        self.rated_speed = 1500.0  # rpm
        self.rated_current = 22.0  # A
        self.power_factor = 0.85
        self.efficiency = 0.89
        self.moment_of_inertia = 0.05  # kg*m^2
        self.stator_resistance = 0.45  # ohm
        self.rotor_resistance = 0.38  # ohm
        self.stator_inductance = 0.012  # H
        self.rotor_inductance = 0.012  # H
        self.mutual_inductance = 0.011  # H

        """
        Measured misalignment for standards compliance
        """
        self.measured_offset_mm = 0.0
        self.angularity_mm = 0.0

        """
        Store the arrays as class attributes
        """
        self.t = np.array([])
        self.motor_current = np.array([])
        self.wavelet_result = None
        self.acoustic_simulator = SoundAcousticSimulator()

    def _setup_minimal_theme(self):
        """Apply minimalistic black/white theme to Streamlit."""
        st.markdown("""
        <style>
        /* Minimal Black/White Theme */
        :root {
            --primary: #000000;
            --background: #ffffff;
            --surface: #fafafa;
            --text: #000000;
            --text-muted: #666666;
            --border: #e0e0e0;
            --divider: #d0d0d0;
        }
        
        @media (prefers-color-scheme: dark) {
            :root {
                --primary: #ffffff;
                --background: #000000;
                --surface: #111111;
                --text: #ffffff;
                --text-muted: #aaaaaa;
                --border: #333333;
                --divider: #444444;
            }
        }
        
        .stApp {
            background-color: var(--background);
            color: var(--text);
        }
        
        .main .block-container {
            padding-top: 1rem;
            padding-bottom: 1rem;
            max-width: 1200px;
        }
        
        /* Typography */
        h1, h2, h3, h4, h5, h6 {
            color: var(--text);
            font-weight: 400;
            letter-spacing: -0.02em;
        }
        
        h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
        h2 { font-size: 1.25rem; margin-top: 2rem; margin-bottom: 0.75rem; }
        h3 { font-size: 1rem; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        
        /* Sidebar */
        .css-1d391kg, .css-1lcbmhc, .css-1outpf7 {
            background-color: var(--surface);
            border-right: 1px solid var(--border);
        }
        
        /* Widgets */
        .stSlider > div > div > div > div {
            background-color: var(--primary);
        }
        
        .stNumberInput input {
            background-color: var(--surface);
            border: 1px solid var(--border);
            color: var(--text);
        }
        
        .stSelectbox > div > div {
            background-color: var(--surface);
            border: 1px solid var(--border);
            color: var(--text);
        }
        
        .stSelectbox label, .stSlider label, .stNumberInput label {
            color: var(--text) !important;
            font-weight: 400;
            font-size: 0.875rem;
        }
        
        /* Buttons */
        .stButton > button {
            background-color: var(--primary);
            color: var(--background);
            border: none;
            padding: 0.5rem 1rem;
            font-weight: 400;
            border-radius: 2px;
            transition: opacity 0.15s;
        }
        
        .stButton > button:hover {
            opacity: 0.8;
        }
        
        .stButton > button[kind="secondary"] {
            background-color: var(--surface);
            color: var(--text);
            border: 1px solid var(--border);
        }
        
        /* Containers */
        .stContainer, .stExpander {
            border: 1px solid var(--border);
            border-radius: 2px;
            background-color: var(--surface);
        }
        
        /* Tabs */
        .stTabs [data-baseweb="tab-list"] {
            gap: 0;
            border-bottom: 1px solid var(--border);
        }
        
        .stTabs [data-baseweb="tab"] {
            background-color: transparent;
            color: var(--text-muted);
            border: none;
            padding: 0.75rem 1.5rem;
            font-weight: 400;
        }
        
        .stTabs [aria-selected="true"] {
            color: var(--primary);
            border-bottom: 2px solid var(--primary);
        }
        
        /* Metrics */
        .stMetric {
            background-color: var(--surface);
            border: 1px solid var(--border);
            border-radius: 2px;
            padding: 1rem;
        }
        
        .stMetric label {
            color: var(--text-muted) !important;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .stMetric [data-testid="stMetricValue"] {
            color: var(--text) !important;
            font-size: 1.5rem;
            font-weight: 400;
        }
        
        /* Dataframes */
        .stDataFrame {
            border: 1px solid var(--border);
        }
        
        /* Divider */
        hr {
            border-color: var(--divider);
            margin: 1.5rem 0;
        }
        
        /* Code */
        code {
            background-color: var(--surface);
            border: 1px solid var(--border);
            padding: 0.125rem 0.375rem;
            border-radius: 2px;
            font-size: 0.875em;
        }
        
        /* Remove default Streamlit styling */
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}
        </style>
        """, unsafe_allow_html=True)

    def _slider_input(self, label, min_val, max_val, initial, key, step, help_text=None):
        """Minimal slider + number input pair."""
        col1, col2 = st.columns([4, 1])
        with col1:
            val = st.slider(label, min_val, max_val, initial, step=step, key=key, help=help_text)
        with col2:
            val = st.number_input(label, min_val, max_val, val, step=step, 
                                  key=f"{key}_num", label_visibility="collapsed")
        return val

    def _section_header(self, text):
        """Minimal section header."""
        st.markdown(f"<h3 style='margin-top:1.5rem;margin-bottom:0.75rem;color:var(--text);'>{text}</h3>", 
                    unsafe_allow_html=True)

    def interface(self):
        """Build minimalistic Streamlit UI."""
        self._setup_minimal_theme()
        
        # Header
        st.markdown("<h1>Motor Fault Detector</h1>", unsafe_allow_html=True)
        st.markdown("<p style='color:var(--text-muted);margin-bottom:2rem;'>Wavelet-based analysis · Digital Twin · IEC Standards</p>", unsafe_allow_html=True)
        
        # Sidebar - Fault Selection
        with st.sidebar:
            st.markdown("<h2 style='font-size:1rem;margin-bottom:1rem;'>Configuration</h2>", unsafe_allow_html=True)
            
            options = [
                "Broken Rotor Bar",
                "Stator Winding Fault",
                "Eccentricity (Asymmetry)",
                "External (Unbalance/Alignment)"
            ]
            self.fault_mode = st.selectbox("Fault Mode", options, key="fault_mode_select")
            
            st.markdown("<hr>", unsafe_allow_html=True)
            
            # Motor nameplate (digital twin params)
            st.markdown("<h3 style='font-size:0.875rem;margin-bottom:0.5rem;'>Motor Nameplate</h3>", unsafe_allow_html=True)
            self.rated_power = self._slider_input("Rated Power (kW)", 0.5, 500.0, self.rated_power, "rated_power", 0.5)
            self.rated_voltage = self._slider_input("Rated Voltage (V)", 100.0, 690.0, self.rated_voltage, "rated_voltage", 1.0)
            self.rated_speed = self._slider_input("Rated Speed (rpm)", 500.0, 3600.0, self.rated_speed, "rated_speed", 1.0)
            self.rated_current = self._slider_input("Rated Current (A)", 0.5, 500.0, self.rated_current, "rated_current", 0.1)
            self.power_factor = self._slider_input("Power Factor", 0.5, 1.0, self.power_factor, "pf", 0.01)
            self.efficiency = self._slider_input("Efficiency", 0.5, 1.0, self.efficiency, "eff", 0.01)
            
            st.markdown("<hr>", unsafe_allow_html=True)
            
            # Alignment standards (IEC)
            st.markdown("<h3 style='font-size:0.875rem;margin-bottom:0.5rem;'>Alignment (IEC)</h3>", unsafe_allow_html=True)
            self.measured_offset_mm = self._slider_input("Parallel Offset (mm)", 0.0, 1.0, self.measured_offset_mm, "offset_mm", 0.01)
            self.angularity_mm = self._slider_input("Angularity (mm)", 0.0, 1.0, self.angularity_mm, "angularity_mm", 0.01)
            
            # Classify against standards
            offset_class = classify_offset(self.rated_speed, self.measured_offset_mm)
            st.caption(f"Offset Classification: **{offset_class.replace('_', ' ').title()}**")
            
            # Map to severity
            limits = allowed_offset_mm(self.rated_speed)
            tol = limits["parallel_offset_mm"]
            mapped_severity = offset_mm_to_severity_index(self.measured_offset_mm, tol)
            st.caption(f"Mapped Severity Index: **{mapped_severity:.3f}**")
        
        # Main area - Tabs
        tab1, tab2, tab3, tab4 = st.tabs(["Signal", "Wavelet (3D)", "Diagnosis", "Digital Twin"])
        
        with tab1:
            self._signal_tab()
        
        with tab2:
            self._wavelet_3d_tab()
        
        with tab3:
            self._diagnosis_tab()
        
        with tab4:
            self._digital_twin_tab()
        
        return self.t, self.motor_current

    def _signal_tab(self):
        """Signal generation and time-domain plot."""
        self._section_header("Simulation Parameters")
        
        col1, col2, col3 = st.columns(3)
        with col1:
            self.modulation_index = self._slider_input("Modulation Index", 0.0, 1.0, 0.04, "mod_idx", 0.005)
            self.line_frequency = self._slider_input("Line Frequency (Hz)", 10, 100, 50, "line_freq", 1)
            self.amplitude = self._slider_input("Amplitude (A)", 0.1, 200.0, self.rated_current, "amp", 0.5)
        with col2:
            self.duration = self._slider_input("Duration (s)", 0.1, 30.0, 2.0, "dur", 0.1)
            self.noise_floor = self._slider_input("Noise Floor", 0.0, 0.5, 0.02, "noise", 0.005)
            self.sampling_frequency = 20 * self.line_frequency
            st.caption(f"Sampling: {self.sampling_frequency:.0f} Hz")
        with col3:
            # Fault-specific parameters
            if self.fault_mode == "Broken Rotor Bar":
                self.slip = self._slider_input("Slip (s)", 0.001, 0.1, 0.02, "slip", 0.001)
                self.harmonic_index = self._slider_input("Harmonic Index (k)", 1, 10, 1, "k_idx", 1)
                self.severity = self._slider_input("Severity", 0.0, 0.1, mapped_severity, "brb_sev", 0.005)
            elif self.fault_mode == "Stator Winding Fault":
                self.poles = self._slider_input("Poles", 2, 12, 4, "poles", 2)
                self.slots = self._slider_input("Rotor Slots", 10, 80, 28, "slots", 1)
                self.slip = self._slider_input("Slip (s)", 0.001, 0.1, 0.03, "slip_stator", 0.001)
                self.slot_harmonic = self._slider_input("Slot Harmonic (n)", 1, 5, 1, "slot_h", 1)
                self.network_harmonic = self._slider_input("Network Harmonic (k)", 1, 5, 1, "net_h", 1)
                self.severity = self._slider_input("Severity", 0.0, 0.5, mapped_severity, "stator_sev", 0.005)
            elif self.fault_mode == "Eccentricity (Asymmetry)":
                self.fr = self._slider_input("Rotor Speed (Hz)", 0.0, 100.0, self.rated_speed/60, "fr", 0.1)
                self.static_severity = self._slider_input("Static Severity", 0.0, 0.5, mapped_severity*0.5, "ecc_static", 0.005)
                self.dynamic_severity = self._slider_input("Dynamic Severity", 0.0, 0.5, mapped_severity*0.5, "ecc_dynamic", 0.005)
            elif self.fault_mode == "External (Unbalance/Alignment)":
                self.fr = self._slider_input("Rotor Speed (Hz)", 0.0, 100.0, self.rated_speed/60, "fr_unb", 0.1)
                self.severity = self._slider_input("Severity", 0.0, 0.5, mapped_severity, "unb_sev", 0.005)
        
        st.markdown("<hr>", unsafe_allow_html=True)
        
        # Generate signal
        self.simulate()
        
        # Time domain plot
        self._plot_time_domain()
        
        # Signal statistics
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("RMS Current", f"{np.sqrt(np.mean(self.motor_current**2)):.2f} A")
        with col2:
            st.metric("Peak Current", f"{np.max(np.abs(self.motor_current)):.2f} A")
        with col3:
            st.metric("THD Est.", f"{self._estimate_thd():.1f}%")
        with col4:
            st.metric("Samples", f"{len(self.motor_current)}")

    def _wavelet_3d_tab(self):
        """3D Wavelet scalogram visualization."""
        self._section_header("Wavelet Time-Frequency Analysis (CWT)")
        
        if len(self.motor_current) == 0:
            st.warning("Generate signal first in Signal tab")
            return
        
        # Run wavelet analysis
        with st.spinner("Computing CWT..."):
            analyzer = WaveletAlgorithm(
                sampling_freq=self.sampling_frequency,
                signal=self.motor_current,
                fault_freq=self._effective_fault_frequency(),
                line_frequency=self.line_frequency
            )
            self.wavelet_result = analyzer.main_algorithm()
        
        # 3D Scalogram
        magnitude = self.wavelet_result['scalogram_magnitude']
        frequencies = self.wavelet_result['scalogram_frequencies']
        time = self.wavelet_result['scalogram_time']
        
        # Downsample for 3D rendering performance
        skip_t = max(1, len(time) // 200)
        skip_f = max(1, len(frequencies) // 100)
        
        T, F = np.meshgrid(time[::skip_t], frequencies[::skip_f])
        Z = magnitude[::skip_f, ::skip_t]
        
        # Limit frequency range for visibility
        f_mask = F <= 500
        T, F, Z = T[f_mask], F[f_mask], Z[f_mask]
        
        fig = plt.figure(figsize=(10, 6), facecolor='white')
        ax = fig.add_subplot(111, projection='3d')
        
        # Plot surface
        surf = ax.plot_surface(T, F, Z, cmap='gray', 
                                linewidth=0, antialiased=True,
                                alpha=0.9, rstride=1, cstride=1)
        
        ax.set_xlabel('Time (s)', labelpad=8)
        ax.set_ylabel('Frequency (Hz)', labelpad=8)
        ax.set_zlabel('Magnitude', labelpad=8)
        ax.set_title('CWT Scalogram — Time / Frequency / Amplitude', pad=10)
        
        # Black/white styling
        ax.xaxis.pane.fill = False
        ax.yaxis.pane.fill = False
        ax.zaxis.pane.fill = False
        ax.xaxis.pane.set_edgecolor('black')
        ax.yaxis.pane.set_edgecolor('black')
        ax.zaxis.pane.set_edgecolor('black')
        ax.grid(True, color='gray', alpha=0.3, linewidth=0.5)
        
        # Mark fault frequencies
        f_line = self.line_frequency
        f_fault = self._effective_fault_frequency()
        for freq, label in [(f_line, 'f_line'), (f_line+f_fault, 'f+f_fault'), (f_line-f_fault, 'f-f_fault')]:
            if freq <= 500:
                ax.plot([time[0], time[-1]], [freq, freq], [0, 0], 
                       'k--', linewidth=0.8, alpha=0.5)
                ax.text(time[-1]*0.95, freq, np.max(Z)*0.1, label, 
                       fontsize=8, color='black')
        
        plt.tight_layout()
        st.pyplot(fig)
        plt.close()
        
        # 2D Scalogram (alternative view)
        self._section_header("Scalogram (2D View)")
        fig2, ax2 = plt.subplots(figsize=(10, 4), facecolor='white')
        im = ax2.imshow(magnitude, aspect='auto', origin='lower',
                       extent=[time[0], time[-1], frequencies[0], frequencies[-1]],
                       cmap='gray', vmax=np.percentile(magnitude, 99))
        ax2.set_xlabel('Time (s)')
        ax2.set_ylabel('Frequency (Hz)')
        ax2.set_ylim(0, min(500, frequencies[-1]))
        ax2.axhline(f_line, color='black', linestyle='--', linewidth=0.8, alpha=0.7)
        ax2.axhline(f_line+f_fault, color='black', linestyle=':', linewidth=0.8, alpha=0.7)
        ax2.axhline(f_line-f_fault, color='black', linestyle=':', linewidth=0.8, alpha=0.7)
        plt.colorbar(im, ax=ax2, label='Magnitude')
        plt.tight_layout()
        st.pyplot(fig2)
        plt.close()

    def _diagnosis_tab(self):
        """Fault diagnosis results."""
        self._section_header("Fault Diagnosis")
        
        if self.wavelet_result is None:
            st.info("Run analysis in Wavelet (3D) tab first")
            return
        
        wr = self.wavelet_result
        
        # Diagnosis summary
        col1, col2, col3 = st.columns(3)
        with col1:
            status = "FAULT" if wr['fault_detected'] else "HEALTHY"
            color = "🔴" if wr['fault_detected'] else "🟢"
            st.metric("Status", f"{color} {status}")
        with col2:
            st.metric("Fault Type", wr['fault_type'])
        with col3:
            st.metric("Confidence", f"{wr['confidence']:.0f}%")
        
        st.markdown("<hr>", unsafe_allow_html=True)
        
        # Sideband analysis
        self._section_header("Sideband Analysis")
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Fundamental", f"{wr['fundamental_freq']:.1f} Hz")
            st.metric("Upper Sideband", f"{wr['upper_sideband_freq']:.1f} Hz")
            st.metric("Lower Sideband", f"{wr['lower_sideband_freq']:.1f} Hz")
        with col2:
            st.metric("Upper dBc", f"{wr['upper_dbc']:.1f} dBc")
            st.metric("Lower dBc", f"{wr['lower_dbc']:.1f} dBc")
            st.metric("Peak dBc", f"{wr['peak_dbc']:.1f} dBc")
        
        # Multi-harmonic table
        self._section_header("Multi-Harmonic Survey (Eccentricity Check)")
        if wr['harmonic_sidebands']:
            import pandas as pd
            df = pd.DataFrame(wr['harmonic_sidebands'])
            df = df[['order', 'harmonic_freq', 'upper_freq', 'lower_freq', 'upper_dbc', 'lower_dbc', 'peak_dbc']]
            df.columns = ['Order', 'Harmonic (Hz)', 'Upper SB (Hz)', 'Lower SB (Hz)', 'Upper (dBc)', 'Lower (dBc)', 'Peak (dBc)']
            st.dataframe(df, use_container_width=True, hide_index=True)
        
        # DWT Features
        self._section_header("DWT Energy Distribution")
        ed = wr['dwt_energy_distribution']
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Approx Energy %", f"{ed.get('approx_pct', 0):.1f}%")
        with col2:
            st.metric("Detail Energy Ratio", f"{wr['dwt_sideband_energy_ratio']:.4f}")
        with col3:
            st.metric("Ridge Count", f"{wr['ridge_count']}")

    def _digital_twin_tab(self):
        """Digital twin - physics-based motor model."""
        self._section_header("Digital Twin — Physics-Based Motor Model")
        
        st.markdown("""
        The digital twin replicates the electrical and mechanical dynamics of the 
        physical induction motor using first-principles equations (dq-model).
        """)
        
        # Motor parameters
        col1, col2 = st.columns(2)
        with col1:
            st.markdown("**Electrical Parameters**")
            self.stator_resistance = self._slider_input("Stator R (Ω)", 0.01, 5.0, self.stator_resistance, "rs", 0.01)
            self.rotor_resistance = self._slider_input("Rotor R (Ω)", 0.01, 5.0, self.rotor_resistance, "rr", 0.01)
            self.stator_inductance = self._slider_input("Stator L (H)", 0.001, 0.1, self.stator_inductance, "ls", 0.001)
            self.rotor_inductance = self._slider_input("Rotor L (H)", 0.001, 0.1, self.rotor_inductance, "lr", 0.001)
            self.mutual_inductance = self._slider_input("Mutual L (H)", 0.001, 0.1, self.mutual_inductance, "lm", 0.001)
        with col2:
            st.markdown("**Mechanical Parameters**")
            self.moment_of_inertia = self._slider_input("Inertia J (kg·m²)", 0.001, 1.0, self.moment_of_inertia, "J", 0.001)
            load_torque = self._slider_input("Load Torque (Nm)", 0.0, 200.0, 70.0, "Tload", 1.0)
            friction_coeff = self._slider_input("Friction Coeff", 0.0, 0.1, 0.01, "B", 0.001)
        
        if st.button("Run Digital Twin Simulation", type="primary"):
            with st.spinner("Simulating motor dynamics..."):
                twin_result = self._run_digital_twin(load_torque, friction_coeff)
            
            # Compare with measured/simulated
            self._plot_digital_twin_comparison(twin_result)

    def _run_digital_twin(self, load_torque: float, friction: float) -> Dict:
        """
        Run physics-based digital twin simulation (dq-model).
        
        Implements 5th order induction motor model:
        - Electrical: stator/rotor flux dynamics in dq frame
        - Mechanical: rotor speed dynamics
        - Fault injection: broken bar asymmetry, eccentricity air-gap modulation
        """
        dt = 1.0 / self.sampling_frequency
        n_steps = len(self.t)
        
        # Synchronous speed
        omega_sync = 2 * np.pi * self.line_frequency / (self.poles / 2 if self.poles > 0 else 2)
        
        # Initial conditions
        psi_sd = psi_sq = psi_rd = psi_rq = 0.0
        omega_r = omega_sync * (1 - self.slip) if self.slip > 0 else omega_sync * 0.98
        theta_e = 0.0
        
        # Storage
        i_sd_hist = np.zeros(n_steps)
        i_sq_hist = np.zeros(n_steps)
        omega_hist = np.zeros(n_steps)
        te_hist = np.zeros(n_steps)
        
        # Fault modulation
        f_fault = self._effective_fault_frequency()
        
        for i in range(n_steps):
            t = self.t[i]
            
            # Supply voltages (balanced 3-phase -> dq)
            vsd = np.sqrt(2/3) * self.rated_voltage / np.sqrt(3) * np.cos(2*np.pi*self.line_frequency*t)
            vsq = np.sqrt(2/3) * self.rated_voltage / np.sqrt(3) * np.sin(2*np.pi*self.line_frequency*t)
            
            # Fault modulation on rotor resistance (broken bar) or inductance (eccentricity)
            fault_mod = 1.0
            if self.fault_mode == "Broken Rotor Bar":
                fault_mod = 1 + self.severity * np.sin(2*np.pi*f_fault*t)
                rr_eff = self.rotor_resistance * fault_mod
                lr_eff = self.rotor_inductance
            elif self.fault_mode == "Eccentricity (Asymmetry)":
                fault_mod = 1 + (self.static_severity + self.dynamic_severity) * np.sin(2*np.pi*self.fr*t)
                rr_eff = self.rotor_resistance
                lr_eff = self.rotor_inductance * fault_mod
            else:
                rr_eff = self.rotor_resistance
                lr_eff = self.rotor_inductance
            
            # Inductance matrix
            Ls = self.stator_inductance
            Lr = lr_eff
            Lm = self.mutual_inductance
            det = Ls*Lr - Lm**2
            
            # Currents from fluxes
            isd = (Lr*psi_sd - Lm*psi_rd) / det
            isq = (Lr*psi_sq - Lm*psi_rq) / det
            ird = (Ls*psi_rd - Lm*psi_sd) / det
            irq = (Ls*psi_rq - Lm*psi_sq) / det
            
            # Flux derivatives (voltage equations)
            dpsi_sd = vsd - self.stator_resistance*isd + omega_sync*psi_sq
            dpsi_sq = vsq - self.stator_resistance*isq - omega_sync*psi_sd
            dpsi_rd = -rr_eff*ird + (omega_sync - omega_r)*psi_rq
            dpsi_rq = -rr_eff*irq - (omega_sync - omega_r)*psi_rd
            
            # Electromagnetic torque
            Te = 1.5 * (self.poles/2) * Lm * (isd*irq - isq*ird)
            
            # Mechanical equation
            domega_r = (Te - load_torque - friction*omega_r) / self.moment_of_inertia
            
            # Integrate (Euler)
            psi_sd += dpsi_sd * dt
            psi_sq += dpsi_sq * dt
            psi_rd += dpsi_rd * dt
            psi_rq += dpsi_rq * dt
            omega_r += domega_r * dt
            theta_e += omega_sync * dt
            
            # Store
            i_sd_hist[i] = isd
            i_sq_hist[i] = isq
            omega_hist[i] = omega_r
            te_hist[i] = Te
        
        # Convert to phase currents for comparison
        i_alpha = np.sqrt(2/3) * (i_sd_hist * np.cos(theta_e) - i_sq_hist * np.sin(theta_e))
        i_beta = np.sqrt(2/3) * (i_sd_hist * np.sin(theta_e) + i_sq_hist * np.cos(theta_e))
        i_a = i_alpha
        i_b = -0.5*i_alpha + np.sqrt(3)/2*i_beta
        i_c = -0.5*i_alpha - np.sqrt(3)/2*i_beta
        
        return {
            'time': self.t,
            'i_a': i_a, 'i_b': i_b, 'i_c': i_c,
            'i_sd': i_sd_hist, 'i_sq': i_sq_hist,
            'omega_r': omega_r * 60 / (2*np.pi),  # rpm
            'Te': te_hist,
            'slip': (omega_sync - omega_r) / omega_sync
        }

    def _plot_digital_twin_comparison(self, twin_result: Dict):
        """Compare digital twin with measured/simulated signal."""
        fig, axes = plt.subplots(3, 1, figsize=(10, 8), facecolor='white', sharex=True)
        
        # Phase current comparison
        ax = axes[0]
        ax.plot(self.t, self.motor_current, 'k-', linewidth=0.8, label='Simulated (AM model)', alpha=0.7)
        ax.plot(twin_result['time'], twin_result['i_a'], 'r-', linewidth=0.8, label='Digital Twin (dq-model)', alpha=0.7)
        ax.set_ylabel('Current (A)')
        ax.set_title('Phase A Current Comparison')
        ax.legend(frameon=False, fontsize=8)
        ax.grid(True, color='gray', alpha=0.3, linewidth=0.5)
        
        # Speed
        ax = axes[1]
        ax.plot(twin_result['time'], twin_result['omega_r'], 'k-', linewidth=0.8)
        ax.axhline(self.rated_speed, color='gray', linestyle='--', linewidth=0.8)
        ax.set_ylabel('Speed (rpm)')
        ax.set_title('Rotor Speed')
        ax.grid(True, color='gray', alpha=0.3, linewidth=0.5)
        
        # Torque
        ax = axes[2]
        ax.plot(twin_result['time'], twin_result['Te'], 'k-', linewidth=0.8)
        ax.set_ylabel('Torque (Nm)')
        ax.set_xlabel('Time (s)')
        ax.set_title('Electromagnetic Torque')
        ax.grid(True, color='gray', alpha=0.3, linewidth=0.5)
        
        plt.tight_layout()
        st.pyplot(fig)
        plt.close()
        
        # FFT comparison
        fig2, ax2 = plt.subplots(figsize=(10, 4), facecolor='white')
        
        # Original signal FFT
        N = len(self.motor_current)
        fft_orig = np.abs(np.fft.fft(self.motor_current)) * (2.0/N)
        freq = np.fft.fftfreq(N, 1.0/self.sampling_frequency)
        half = N//2
        
        # Twin signal FFT
        twin_sig = twin_result['i_a']
        fft_twin = np.abs(np.fft.fft(twin_sig)) * (2.0/N)
        
        ax2.semilogy(freq[:half], fft_orig[:half], 'k-', linewidth=0.7, label='Simulated', alpha=0.7)
        ax2.semilogy(freq[:half], fft_twin[:half], 'r-', linewidth=0.7, label='Digital Twin', alpha=0.7)
        ax2.set_xlabel('Frequency (Hz)')
        ax2.set_ylabel('Magnitude')
        ax2.set_title('Frequency Domain Comparison')
        ax2.set_xlim(0, 500)
        ax2.legend(frameon=False, fontsize=8)
        ax2.grid(True, color='gray', alpha=0.3, linewidth=0.5)
        
        # Mark fault frequencies
        f_fault = self._effective_fault_frequency()
        for f, lbl in [(self.line_frequency, 'f_line'), 
                       (self.line_frequency+f_fault, 'f+f_f'), 
                       (self.line_frequency-f_fault, 'f-f_f')]:
            ax2.axvline(f, color='gray', linestyle=':', linewidth=0.8)
            ax2.text(f, ax2.get_ylim()[1]*0.9, lbl, fontsize=7, rotation=90, va='top', ha='right')
        
        plt.tight_layout()
        st.pyplot(fig2)
        plt.close()
        
        # Metrics
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Avg Speed", f"{np.mean(twin_result['omega_r']):.1f} rpm")
        with col2:
            st.metric("Slip", f"{twin_result['slip']*100:.2f}%")
        with col3:
            st.metric("Avg Torque", f"{np.mean(twin_result['Te']):.1f} Nm")
        with col4:
            # RMS error
            rms_err = np.sqrt(np.mean((self.motor_current - twin_result['i_a'])**2))
            st.metric("RMS Diff", f"{rms_err:.2f} A")

    def _effective_fault_frequency(self):
        """Derive physically-correct fault frequency."""
        if self.fault_mode == "Broken Rotor Bar":
            k = max(self.harmonic_index, 1)
            return 2 * k * self.slip * self.line_frequency
        elif self.fault_mode == "Stator Winding Fault":
            p = max(self.poles, 2)
            return self.line_frequency * (self.slots * (1 - self.slip) / p) % self.line_frequency \
                   + self.slot_harmonic * self.network_harmonic
        elif self.fault_mode == "Eccentricity (Asymmetry)":
            return self.fr
        elif self.fault_mode == "External (Unbalance/Alignment)":
            return self.fr
        return self.fault_frequency

    def _effective_modulation_index(self):
        """Map fault severity to modulation depth."""
        if self.fault_mode == "Broken Rotor Bar":
            return self.severity
        elif self.fault_mode == "Stator Winding Fault":
            return self.severity
        elif self.fault_mode == "Eccentricity (Asymmetry)":
            return self.static_severity + self.dynamic_severity
        elif self.fault_mode == "External (Unbalance/Alignment)":
            return self.severity
        return self.modulation_index

    def simulate(self):
        """Generate motor current signal with fault signatures."""
        if self.sampling_frequency <= 0:
            self.t, self.motor_current = np.array([]), np.array([])
            return self.t, self.motor_current
        
        num_samples = int(self.duration * self.sampling_frequency)
        t = np.linspace(0, self.duration, num_samples, endpoint=False)
        self.t = t
        
        eff_fault_freq = self._effective_fault_frequency()
        eff_mod_index = self._effective_modulation_index()
        
        if eff_fault_freq and eff_fault_freq > 0:
            self.fault_frequency = eff_fault_freq
        
        if self.fault_mode == "Eccentricity (Asymmetry)":
            harmonic_orders = [1, 3, 5, 7, 9]
            carrier = np.zeros_like(t)
            for n in harmonic_orders:
                carrier += (self.amplitude / n) * np.sin(2 * np.pi * n * self.line_frequency * t)
            motor_current = carrier * (1 + eff_mod_index * np.sin(2 * np.pi * self.fr * t))
        else:
            motor_current = self.amplitude * (
                1 + eff_mod_index * np.sin(2 * np.pi * self.fault_frequency * t)
            ) * np.sin(2 * np.pi * self.line_frequency * t)
        
        if self.noise_floor > 0:
            motor_current += np.random.normal(0, self.noise_floor * self.amplitude, size=t.shape)
        
        self.motor_current = motor_current
        return self.t, self.motor_current

    def _plot_time_domain(self):
        """Minimal time domain plot."""
        fig, ax = plt.subplots(figsize=(10, 3), facecolor='white')
        ax.plot(self.t, self.motor_current, 'k-', linewidth=0.5)
        ax.set_xlabel('Time (s)')
        ax.set_ylabel('Current (A)')
        ax.set_title('Motor Current — Time Domain')
        ax.grid(True, color='gray', alpha=0.3, linewidth=0.5)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        plt.tight_layout()
        st.pyplot(fig)
        plt.close()

    def _estimate_thd(self):
        """Estimate THD from signal."""
        if len(self.motor_current) < 10:
            return 0.0
        N = len(self.motor_current)
        fft_amp = np.abs(np.fft.fft(self.motor_current)) * (2.0/N)
        fft_freq = np.fft.fftfreq(N, 1.0/self.sampling_frequency)
        half = N//2
        fft_amp_pos = fft_amp[1:half]
        fft_freq_pos = fft_freq[1:half]
        
        # Find fundamental
        idx_fund = np.argmax(fft_amp_pos)
        fund_amp = fft_amp_pos[idx_fund]
        
        # Harmonic energy
        harmonic_energy = np.sum(fft_amp_pos**2) - fund_amp**2
        if fund_amp > 0:
            return 100 * np.sqrt(harmonic_energy) / fund_amp
        return 0.0


def _is_streamlit_running():
    try:
        from streamlit.runtime.scriptrunner import get_script_run_ctx
        return get_script_run_ctx() is not None
    except Exception:
        return False


if __name__ == "__main__" or _is_streamlit_running():
    sim = FrequencySimulator()
    sim.interface()