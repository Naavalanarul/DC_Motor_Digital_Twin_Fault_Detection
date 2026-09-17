"""Numerical regression checks only; not physical-motor calibration.

Run from the repository root: .venv/bin/python -B -m unittest -v test_signal_regression
"""
import unittest

import numpy as np

from backend.main import analyze_current, dbc_to_status
from frequencySimulator import FrequencySimulator


class SignalRegressionTests(unittest.TestCase):
    @staticmethod
    def simulator(slip, severity):
        sim = FrequencySimulator()
        sim.fault_mode = 'Broken Rotor Bar'
        sim.line_frequency = 50.13
        sim.sampling_frequency = 1000
        sim.duration = 5
        sim.amplitude = 10
        sim.noise_floor = 0
        sim.slip = slip
        sim.harmonic_index = 1
        sim.severity = severity
        sim.fault_frequency = 2  # Must not survive a derived zero-slip offset.
        return sim

    def test_zero_slip_waveform_is_healthy_at_resolvable_diagnostic_spacing(self):
        sim = self.simulator(slip=0, severity=0.2)
        time, signal = sim.simulate()
        expected = 10 * np.sin(2 * np.pi * 50.13 * time)
        self.assertEqual(sim.fault_frequency, 0,
                         f'Zero-slip effective offset: {sim.fault_frequency!r}')
        np.testing.assert_allclose(signal, expected, atol=1e-12, rtol=0)
        # Check for spurious sidebands 2 Hz from the carrier, not at zero offset.
        result, _, _ = analyze_current(1000, signal, 2)
        self.assertEqual(dbc_to_status(result['peak_dbc']), 'healthy', repr(result))

    def test_known_faults_remain_faults(self):
        for carrier in (50.0, 50.13):
            for severity in (0.2, 0.5):
                with self.subTest(carrier=carrier, severity=severity):
                    sim = self.simulator(slip=0.02, severity=severity)
                    sim.line_frequency = carrier
                    _, signal = sim.simulate()
                    result, _, _ = analyze_current(1000, signal, sim.fault_frequency)
                    self.assertEqual(dbc_to_status(result['peak_dbc']), 'fault', repr(result))

    def test_zero_spacing_is_unknown_not_false_fault_or_healthy(self):
        sim = self.simulator(slip=0, severity=0.2)
        _, signal = sim.simulate()
        result, _, _ = analyze_current(1000, signal, sim.fault_frequency)
        self.assertEqual(dbc_to_status(result['peak_dbc']), 'unknown', repr(result))
        self.assertFalse(result['measurement_valid'], repr(result))

    def test_fractional_duration_preserves_sample_clock(self):
        sim = self.simulator(slip=0, severity=0)
        sim.duration = 1.0005
        time, _ = sim.simulate()
        np.testing.assert_allclose(np.diff(time), 1 / sim.sampling_frequency,
                                   atol=1e-15, rtol=0)


if __name__ == '__main__':
    unittest.main(verbosity=2)
