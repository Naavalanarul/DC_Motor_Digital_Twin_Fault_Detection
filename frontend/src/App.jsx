import React, { useState, useCallback } from 'react';
import ControlPanel from './components/ControlPanel';
import DigitalTwinMotor from './components/DigitalTwinMotor';
import StatusIndicator from './components/StatusIndicator';
import AnalysisPanel from './components/AnalysisPanel';
import WaveformChart from './components/WaveformChart';
import SpectrumChart from './components/SpectrumChart';
import AcousticChart from './components/AcousticChart';
import Scalogram3D from './components/Scalogram3D';
import FleetDashboard from './components/FleetDashboard';
import FaultHistoryTimeline from './components/FaultHistoryTimeline';
import { fetchMotor, updateMotor, scanMotor, simulateAcoustic } from './api';

const defaultParams = {
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
};

function App() {
  const [currentView, setCurrentView] = useState('fleet');
  const [selectedMotorId, setSelectedMotorId] = useState(null);
  const [motorName, setMotorName] = useState('');
  
  const [params, setParams] = useState(defaultParams);
  const [faultMode, setFaultMode] = useState('Broken Rotor Bar');

  const [simulationData, setSimulationData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [spectrumData, setSpectrumData] = useState(null);
  const [scalogramData, setScalogramData] = useState(null);
  const [acousticData, setAcousticData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mapConfigToParams = (config) => {
    return {
      ...defaultParams,
      modulation_index: config.modulation_index || 0.04,
      line_freq: config.line_frequency || 50,
      fault_freq: config.fault_frequency || 2,
      amplitude: config.amplitude || 10,
      duration: config.duration || 10,
      noise_floor: config.noise_floor || 0.05,
      
      brb_slip: config.slip || 0.02,
      brb_harmonic_index: config.harmonic_index || 1,
      brb_severity: config.severity || 0.05,
      
      stator_severity: config.severity || 0.05,
      stator_poles: config.poles || 4,
      stator_slots: config.slots || 28,
      stator_slip: config.slip || 0.03,
      stator_slot_harmonic: config.slot_harmonic || 1,
      stator_network_harmonic: config.network_harmonic || 1,
      
      ecc_rotor_speed: config.fr || 24.5,
      ecc_static_severity: config.static_severity || 0.05,
      ecc_dynamic_severity: config.dynamic_severity || 0.05,
      
      mech_severity: config.severity || 0.05,
      mech_rotor_speed: config.fr || 24.5
    };
  };

  const buildConfigFromParams = () => {
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
    return config;
  };

  const populateScanResults = (scanData) => {
    if (!scanData) {
      setSimulationData(null);
      setAnalysisResults(null);
      setSpectrumData(null);
      setScalogramData(null);
      setAcousticData(null);
      return;
    }
    
    if (scanData.signal) {
      setSimulationData({
        t: scanData.signal.time,
        motor_current: scanData.signal.motor_current
      });
    }
    
    if (scanData.analysis) {
      setAnalysisResults(scanData.analysis);
    }
    
    if (scanData.spectrum) {
      setSpectrumData({
        freqs: scanData.spectrum.fft_freqs,
        amps: scanData.spectrum.fft_amplitudes
      });
    }

    if (scanData.scalogram) {
      setScalogramData(scanData.scalogram);
    }
  };

  const currentSeverity = (() => {
    switch (faultMode) {
      case 'Broken Rotor Bar': return params.brb_severity;
      case 'Stator winding fault': return params.stator_severity;
      case 'Eccentricity (Asymmetry)': return Math.max(params.ecc_static_severity, params.ecc_dynamic_severity);
      case 'External (Mechanical Unbalance / Alignment)': return params.mech_severity;
      default: return 0;
    }
  })();

  const handleSelectMotor = async (motorId) => {
    setLoading(true);
    try {
      const motor = await fetchMotor(motorId);
      setSelectedMotorId(motor.id);
      setMotorName(motor.name);
      setFaultMode(motor.fault_mode);
      
      const config = motor.config_json ? (typeof motor.config_json === 'string' ? JSON.parse(motor.config_json) : motor.config_json) : {};
      setParams(mapConfigToParams(config));
      
      if (motor.scan) {
        populateScanResults({
          signal: motor.scan.signal_json ? (typeof motor.scan.signal_json === 'string' ? JSON.parse(motor.scan.signal_json) : motor.scan.signal_json) : null,
          analysis: motor.scan.analysis_json ? (typeof motor.scan.analysis_json === 'string' ? JSON.parse(motor.scan.analysis_json) : motor.scan.analysis_json) : null,
          spectrum: motor.scan.spectrum_json ? (typeof motor.scan.spectrum_json === 'string' ? JSON.parse(motor.scan.spectrum_json) : motor.scan.spectrum_json) : null,
          scalogram: motor.scan.scalogram_json ? (typeof motor.scan.scalogram_json === 'string' ? JSON.parse(motor.scan.scalogram_json) : motor.scan.scalogram_json) : null,
        });
        
        setAcousticData(null);
      } else {
        setSimulationData(null);
        setAnalysisResults(null);
        setSpectrumData(null);
        setScalogramData(null);
        setAcousticData(null);
      }
      
      setCurrentView('detail');
    } catch (err) {
      console.error(err);
      alert('Failed to fetch motor details');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToFleet = () => {
    setCurrentView('fleet');
    setSelectedMotorId(null);
  };

  const handleSimulate = useCallback(async () => {
    if (!selectedMotorId) return;
    
    setLoading(true);
    setError(null);
    try {
      const config = buildConfigFromParams();
      await updateMotor(selectedMotorId, {
        fault_mode: faultMode,
        config: config
      });
      
      const scanResult = await scanMotor(selectedMotorId);
      populateScanResults(scanResult);

      const acousticRes = await simulateAcoustic({
        fault_present: currentSeverity > 0 && faultMode === 'Eccentricity (Asymmetry)',
        duration: params.duration || 10
      });
      setAcousticData(acousticRes);
    } catch (err) {
      setError(err.message || 'Simulation failed. Is the backend running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [faultMode, params, selectedMotorId, currentSeverity]);

  if (currentView === 'fleet') {
    return <FleetDashboard onSelectMotor={handleSelectMotor} />;
  }

  return (
    <div className="app-container">
      <ControlPanel
        params={params}
        setParams={setParams}
        faultMode={faultMode}
        setFaultMode={setFaultMode}
        onSimulate={handleSimulate}
        loading={loading}
      />

      <div className="main-content">
        <div className="detail-header">
          <button className="btn btn-back" onClick={handleBackToFleet}>← BACK TO FLEET</button>
          <div style={{ marginBottom: 0 }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.01em' }}>
              {motorName} — <span style={{ color: '#a3a3a3', fontWeight: '400' }}>DIGITAL TWIN</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#737373', marginTop: '2px', fontWeight: '400' }}>
              REAL-TIME MOTOR CURRENT SIGNATURE ANALYSIS (MCSA)
            </p>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            {error}
          </div>
        )}

        <div className="top-row">
          <DigitalTwinMotor
            faultMode={faultMode}
            severity={currentSeverity}
          />
          <div className="right-column">
            <StatusIndicator peakDbc={analysisResults?.peak_dbc} />
            <AnalysisPanel analysisResults={analysisResults} />
            <FaultHistoryTimeline motorId={selectedMotorId} />
          </div>
        </div>

        <div className="bottom-row">
          <WaveformChart
            timeData={simulationData?.t}
            currentData={simulationData?.motor_current}
          />
          <SpectrumChart
            freqData={spectrumData?.freqs}
            ampData={spectrumData?.amps}
            analysisResults={analysisResults}
          />
          <AcousticChart acousticData={acousticData} />
          <Scalogram3D scalogram={scalogramData} />
        </div>
      </div>
    </div>
  );
}

export default App;