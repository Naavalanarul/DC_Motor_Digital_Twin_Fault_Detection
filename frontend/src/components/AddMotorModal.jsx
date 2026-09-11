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
        <h2 className="modal-title">ADD NEW MOTOR</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">MOTOR NAME</label>
            <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">LOCATION</label>
            <input type="text" className="form-control" value={location} onChange={e => setLocation(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">FAULT MODE</label>
            <select className="form-control" value={faultMode} onChange={e => setFaultMode(e.target.value)}>
              <option value="Broken Rotor Bar">BROKEN ROTOR BAR</option>
              <option value="Stator winding fault">STATOR WINDING FAULT</option>
              <option value="Eccentricity (Asymmetry)">ECCENTRICITY (ASYMMETRY)</option>
              <option value="External (Mechanical Unbalance / Alignment)">MECHANICAL UNBALANCE</option>
            </select>
          </div>
          
          <div className="section-header">SIMULATION PARAMETERS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {renderNumberInput("MODULATION INDEX", "modulation_index")}
            {renderNumberInput("LINE FREQ (Hz)", "line_freq")}
            {renderNumberInput("FAULT FREQ (Hz)", "fault_freq")}
            {renderNumberInput("AMPLITUDE", "amplitude")}
            {renderNumberInput("DURATION", "duration")}
            {renderNumberInput("NOISE FLOOR", "noise_floor")}
          </div>

          <div className="section-header">FAULT-SPECIFIC PARAMETERS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {faultMode === 'Broken Rotor Bar' && (
              <>
                {renderNumberInput("MOTOR SLIP", "brb_slip")}
                {renderNumberInput("HARMONIC INDEX", "brb_harmonic_index")}
                {renderNumberInput("SEVERITY", "brb_severity")}
              </>
            )}
            {faultMode === 'Stator winding fault' && (
              <>
                {renderNumberInput("SEVERITY", "stator_severity")}
                {renderNumberInput("POLES", "stator_poles")}
                {renderNumberInput("ROTOR SLOTS", "stator_slots")}
                {renderNumberInput("MOTOR SLIP", "stator_slip")}
                {renderNumberInput("SLOT HARMONIC", "stator_slot_harmonic")}
                {renderNumberInput("NETWORK HARMONIC", "stator_network_harmonic")}
              </>
            )}
            {faultMode === 'Eccentricity (Asymmetry)' && (
              <>
                {renderNumberInput("ROTOR SPEED", "ecc_rotor_speed")}
                {renderNumberInput("STATIC SEVERITY", "ecc_static_severity")}
                {renderNumberInput("DYNAMIC SEVERITY", "ecc_dynamic_severity")}
              </>
            )}
            {faultMode === 'External (Mechanical Unbalance / Alignment)' && (
              <>
                {renderNumberInput("SEVERITY", "mech_severity")}
                {renderNumberInput("ROTOR SPEED", "mech_rotor_speed")}
              </>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>CANCEL</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'SAVING...' : 'ADD MOTOR'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMotorModal;