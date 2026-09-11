import React from 'react';

const ControlPanel = ({ params, setParams, onSimulate, loading, faultMode, setFaultMode }) => {
  const handleParamChange = (key, value) => {
    setParams(prev => ({ ...prev, [key]: Number(value) }));
  };

  const renderSlider = (label, key, min, max, step) => (
    <div className="form-group" key={key}>
      <label className="form-label">{label}</label>
      <div className="slider-row">
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
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #2a2a2a' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          SOUND FAULT DETECTOR
        </h1>
      </div>

      <div className="form-group">
        <label className="form-label">FAULT SIMULATION MODE</label>
        <select
          className="form-control"
          value={faultMode}
          onChange={(e) => setFaultMode(e.target.value)}
        >
          <option value="Broken Rotor Bar">BROKEN ROTOR BAR</option>
          <option value="Stator winding fault">STATOR WINDING FAULT</option>
          <option value="Eccentricity (Asymmetry)">ECCENTRICITY (ASYMMETRY)</option>
          <option value="External (Mechanical Unbalance / Alignment)">MECHANICAL UNBALANCE</option>
        </select>
      </div>

      <div className="section-header">COMMON PARAMETERS</div>
      {renderSlider("MODULATION INDEX (m)", "modulation_index", 0.0, 1.0, 0.005)}
      {renderSlider("LINE FREQUENCY (Hz)", "line_freq", 0, 100, 1)}
      {renderSlider("FAULT FREQUENCY (Hz)", "fault_freq", 0, 20, 1)}
      {renderSlider("AMPLITUDE (A)", "amplitude", 0, 100, 1)}
      {renderSlider("DURATION (s)", "duration", 0, 100, 1)}
      {renderSlider("NOISE FLOOR", "noise_floor", 0.0, 1.0, 0.01)}

      <div className="section-header">FAULT PARAMETERS</div>

      {faultMode === 'Broken Rotor Bar' && (
        <>
          {renderSlider("MOTOR SLIP (s)", "brb_slip", 0.0, 0.1, 0.001)}
          {renderSlider("HARMONIC INDEX (k)", "brb_harmonic_index", 0, 10, 1)}
          {renderSlider("FAULT SEVERITY (m)", "brb_severity", 0.0, 0.05, 0.005)}
        </>
      )}

      {faultMode === 'Stator winding fault' && (
        <>
          {renderSlider("FAULT SEVERITY (m)", "stator_severity", 0.0, 0.5, 0.005)}
          {renderSlider("NUMBER OF POLES (p)", "stator_poles", 2, 12, 2)}
          {renderSlider("ROTOR SLOTS (R)", "stator_slots", 15, 60, 1)}
          {renderSlider("MOTOR SLIP (s)", "stator_slip", 0.0, 0.1, 0.001)}
          {renderSlider("SLOT HARMONIC (n)", "stator_slot_harmonic", 1, 5, 1)}
          {renderSlider("NETWORK HARMONIC (k)", "stator_network_harmonic", 1, 5, 1)}
        </>
      )}

      {faultMode === 'Eccentricity (Asymmetry)' && (
        <>
          {renderSlider("ROTOR SPEED (Hz)", "ecc_rotor_speed", 0.0, 60.0, 0.1)}
          {renderSlider("STATIC SEVERITY (ms)", "ecc_static_severity", 0.0, 0.5, 0.005)}
          {renderSlider("DYNAMIC SEVERITY (md)", "ecc_dynamic_severity", 0.0, 0.5, 0.005)}
        </>
      )}

      {faultMode === 'External (Mechanical Unbalance / Alignment)' && (
        <>
          {renderSlider("FAULT SEVERITY (m)", "mech_severity", 0.0, 0.5, 0.005)}
          {renderSlider("ROTOR SPEED (Hz)", "mech_rotor_speed", 0.0, 60.0, 0.1)}
        </>
      )}

      <button
        className="btn btn-primary"
        onClick={onSimulate}
        disabled={loading}
        style={{ width: '100%', marginTop: 'auto' }}
      >
        {loading ? 'SIMULATING...' : 'RUN SIMULATION'}
      </button>
    </div>
  );
};

export default ControlPanel;