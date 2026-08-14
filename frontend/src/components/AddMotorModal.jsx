import React, { useState } from 'react';
import { createMotor } from '../api';

const AddMotorModal = ({ onClose, onAdded }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [faultMode, setFaultMode] = useState('Broken Rotor Bar');
  const [loading, setLoading] = useState(false);

  const [params, setParams] = useState({
    modulation_index: 0.04,
    line_freq: 50,
    fault_freq: 2,
    amplitude: 10,
    duration: 10,
    noise_floor: 0.05,
    
    brb_slip: 0.02,
    brb_harmonic_index: 1,
    brb_severity: 0.05,
    
    stator_severity: 0.05,
    stator_poles: 4,
    stator_slots: 28,
    stator_slip: 0.03,
    stator_slot_harmonic: 1,
    stator_network_harmonic: 1,
    
    ecc_rotor_speed: 24.5,
    ecc_static_severity: 0.05,
    ecc_dynamic_severity: 0.05,
    
    mech_severity: 0.05,
    mech_rotor_speed: 24.5
  });

  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setParams(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const config = {
      modulation_index: params.modulation_index,
      line_frequency: params.line_freq,
      fault_frequency: params.fault_freq,
      amplitude: params.amplitude,
      duration: params.duration,
      noise_floor: params.noise_floor,
    };

    if (faultMode === 'Broken Rotor Bar') {
      config.slip = params.brb_slip;
      config.harmonic_index = params.brb_harmonic_index;
      config.severity = params.brb_severity;
    } else if (faultMode === 'Stator winding fault') {
      config.severity = params.stator_severity;
      config.poles = params.stator_poles;
      config.slots = params.stator_slots;
      config.slip = params.stator_slip;
      config.slot_harmonic = params.stator_slot_harmonic;
      config.network_harmonic = params.stator_network_harmonic;
    } else if (faultMode === 'Eccentricity (Asymmetry)') {
      config.fr = params.ecc_rotor_speed;
      config.static_severity = params.ecc_static_severity;
      config.dynamic_severity = params.ecc_dynamic_severity;
    } else if (faultMode === 'External (Mechanical Unbalance / Alignment)') {
      config.severity = params.mech_severity;
      config.fr = params.mech_rotor_speed;
    }

    try {
      await createMotor({
        name,
        location,
        fault_mode: faultMode,
        config
      });
      onAdded();
    } catch (err) {
      console.error(err);
      alert('Failed to add motor');
    } finally {
      setLoading(false);
    }
  };

  const renderNumberInput = (label, key) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input type="number" className="form-control" name={key} value={params[key]} onChange={handleParamChange} step="any" required />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Add New Motor</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Motor Name</label>
            <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input type="text" className="form-control" value={location} onChange={e => setLocation(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Fault Mode</label>
            <select className="form-control" value={faultMode} onChange={e => setFaultMode(e.target.value)}>
              <option value="Broken Rotor Bar">Broken Rotor Bar</option>
              <option value="Stator winding fault">Stator Winding Fault</option>
              <option value="Eccentricity (Asymmetry)">Eccentricity (Asymmetry)</option>
              <option value="External (Mechanical Unbalance / Alignment)">Mechanical Unbalance</option>
            </select>
          </div>
          
          <div style={{ marginTop: '16px', marginBottom: '8px', color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 'bold' }}>Simulation Params</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {renderNumberInput("Modulation Index", "modulation_index")}
            {renderNumberInput("Line Freq (Hz)", "line_freq")}
            {renderNumberInput("Fault Freq (Hz)", "fault_freq")}
            {renderNumberInput("Amplitude", "amplitude")}
            {renderNumberInput("Duration", "duration")}
            {renderNumberInput("Noise Floor", "noise_floor")}
          </div>

          <div style={{ marginTop: '16px', marginBottom: '8px', color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 'bold' }}>Fault Specific Params</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {faultMode === 'Broken Rotor Bar' && (
              <>
                {renderNumberInput("Motor Slip", "brb_slip")}
                {renderNumberInput("Harmonic Index", "brb_harmonic_index")}
                {renderNumberInput("Severity", "brb_severity")}
              </>
            )}
            {faultMode === 'Stator winding fault' && (
              <>
                {renderNumberInput("Severity", "stator_severity")}
                {renderNumberInput("Poles", "stator_poles")}
                {renderNumberInput("Rotor Slots", "stator_slots")}
                {renderNumberInput("Motor Slip", "stator_slip")}
                {renderNumberInput("Slot Harmonic", "stator_slot_harmonic")}
                {renderNumberInput("Network Harmonic", "stator_network_harmonic")}
              </>
            )}
            {faultMode === 'Eccentricity (Asymmetry)' && (
              <>
                {renderNumberInput("Rotor Speed", "ecc_rotor_speed")}
                {renderNumberInput("Static Severity", "ecc_static_severity")}
                {renderNumberInput("Dynamic Severity", "ecc_dynamic_severity")}
              </>
            )}
            {faultMode === 'External (Mechanical Unbalance / Alignment)' && (
              <>
                {renderNumberInput("Severity", "mech_severity")}
                {renderNumberInput("Rotor Speed", "mech_rotor_speed")}
              </>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Add Motor'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMotorModal;
