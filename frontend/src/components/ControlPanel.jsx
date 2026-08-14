import React from 'react';

const ControlPanel = ({ params, setParams, onSimulate, loading, faultMode, setFaultMode }) => {
  const handleParamChange = (key, value) => {
    setParams(prev => ({ ...prev, [key]: Number(value) }));
  };

  const renderSlider = (label, key, min, max, step) => (
    <div className="form-group" key={key}>
      <label className="form-label">{label}</label>
      <div className="slider-container">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={params[key] !== undefined ? params[key] : min}
          onChange={(e) => handleParamChange(key, e.target.value)}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={params[key] !== undefined ? params[key] : min}
          onChange={(e) => handleParamChange(key, e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <div className="sidebar">
      <div className="title-bar">
        <h1 className="title-text">Sound Fault Detector</h1>
      </div>

      <div className="form-group">
        <label className="form-label">Fault Simulation Mode</label>
        <select
          className="form-control"
          value={faultMode}
          onChange={(e) => setFaultMode(e.target.value)}
        >
          <option value="Broken Rotor Bar">Broken Rotor Bar</option>
          <option value="Stator winding fault">Stator Winding Fault</option>
          <option value="Eccentricity (Asymmetry)">Eccentricity (Asymmetry)</option>
          <option value="External (Mechanical Unbalance / Alignment)">Mechanical Unbalance</option>
        </select>
      </div>

      <div className="section-header">Common Parameters</div>
      {renderSlider("Modulation Index (m)", "modulation_index", 0.0, 1.0, 0.005)}
      {renderSlider("Line Frequency (Hz)", "line_freq", 0, 100, 1)}
      {renderSlider("Fault Frequency (Hz)", "fault_freq", 0, 20, 1)}
      {renderSlider("Amplitude (A)", "amplitude", 0, 100, 1)}
      {renderSlider("Duration (s)", "duration", 0, 100, 1)}
      {renderSlider("Noise Floor", "noise_floor", 0.0, 1.0, 0.01)}

      <div className="section-header">Fault Parameters</div>

      {faultMode === 'Broken Rotor Bar' && (
        <>
          {renderSlider("Motor Slip (s)", "brb_slip", 0.0, 0.1, 0.001)}
          {renderSlider("Harmonic Index (k)", "brb_harmonic_index", 0, 10, 1)}
          {renderSlider("Fault Severity (m)", "brb_severity", 0.0, 0.05, 0.005)}
        </>
      )}

      {faultMode === 'Stator winding fault' && (
        <>
          {renderSlider("Fault Severity (m)", "stator_severity", 0.0, 0.5, 0.005)}
          {renderSlider("Number of Poles (p)", "stator_poles", 2, 12, 2)}
          {renderSlider("Rotor Slots (R)", "stator_slots", 15, 60, 1)}
          {renderSlider("Motor Slip (s)", "stator_slip", 0.0, 0.1, 0.001)}
          {renderSlider("Slot Harmonic (n)", "stator_slot_harmonic", 1, 5, 1)}
          {renderSlider("Network Harmonic (k)", "stator_network_harmonic", 1, 5, 1)}
        </>
      )}

      {faultMode === 'Eccentricity (Asymmetry)' && (
        <>
          {renderSlider("Rotor Speed (Hz)", "ecc_rotor_speed", 0.0, 60.0, 0.1)}
          {renderSlider("Static Severity (ms)", "ecc_static_severity", 0.0, 0.5, 0.005)}
          {renderSlider("Dynamic Severity (md)", "ecc_dynamic_severity", 0.0, 0.5, 0.005)}
        </>
      )}

      {faultMode === 'External (Mechanical Unbalance / Alignment)' && (
        <>
          {renderSlider("Fault Severity (m)", "mech_severity", 0.0, 0.5, 0.005)}
          {renderSlider("Rotor Speed (Hz)", "mech_rotor_speed", 0.0, 60.0, 0.1)}
        </>
      )}

      <button
        className="btn-primary"
        onClick={onSimulate}
        disabled={loading}
      >
        {loading ? 'SIMULATING...' : 'RUN SIMULATION'}
      </button>
    </div>
  );
};

export default ControlPanel;
