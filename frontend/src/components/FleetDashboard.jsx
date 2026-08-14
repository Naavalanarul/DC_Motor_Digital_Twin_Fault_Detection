import React, { useState, useEffect } from 'react';
import MotorCard from './MotorCard';
import AddMotorModal from './AddMotorModal';
import { fetchPriorityQueue, fetchMotors, scanAllMotors, scanMotor } from '../api';

const FleetDashboard = ({ onSelectMotor }) => {
  const [motors, setMotors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanningAll, setScanningAll] = useState(false);
  const [scanningMotorId, setScanningMotorId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const loadMotors = async () => {
    setLoading(true);
    try {
      const queue = await fetchPriorityQueue();
      setMotors(queue);
    } catch (err) {
      console.error('Failed to load priority queue', err);
      // Fallback
      try {
        const rawMotors = await fetchMotors();
        setMotors(rawMotors.map(m => ({ motor_id: m.id, motor_data: m })));
      } catch (err2) {
        console.error('Fallback fetchMotors failed', err2);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMotors();
  }, []);
  
  const handleScanAll = async () => { 
    setScanningAll(true);
    try {
      await scanAllMotors();
      await loadMotors();
    } catch (err) {
      console.error(err);
    }
    setScanningAll(false);
  };
  
  const handleScanOne = async (id) => {
    setScanningMotorId(id);
    try {
      await scanMotor(id);
      await loadMotors();
    } catch (err) {
      console.error(err);
    }
    setScanningMotorId(null);
  };
  
  const handleMotorAdded = () => { 
    setShowAddModal(false); 
    loadMotors(); 
  };
  
  const healthyCt = motors.filter(m => m.motor_data?.status === 'healthy').length;
  const warningCt = motors.filter(m => m.motor_data?.status === 'warning').length;
  const faultCt = motors.filter(m => m.motor_data?.status === 'fault').length;
  
  return (
    <div className="fleet-dashboard">
      <div className="fleet-header">
        <div>
          <h1 className="app-title">Motor Fleet — <span className="accent-text">Priority Monitor</span></h1>
          <p className="app-subtitle">Real-time Motor Health Monitoring powered by Max-Heap Priority Queue</p>
        </div>
        <div className="fleet-actions">
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add Motor</button>
          <button className="btn-primary" onClick={handleScanAll} disabled={scanningAll}>
            {scanningAll ? 'Scanning...' : 'Scan All'}
          </button>
        </div>
      </div>
      
      <div className="priority-summary">
        <div className="priority-stat priority-fault">Fault: {faultCt}</div>
        <div className="priority-stat priority-warning">Warning: {warningCt}</div>
        <div className="priority-stat priority-healthy">Healthy: {healthyCt}</div>
        <div className="priority-stat priority-total">Total: {motors.length}</div>
      </div>
      
      {loading ? (
        <div className="loading-state">Loading motors...</div>
      ) : (
        <div className="motor-grid">
          {motors.map((item, index) => (
            <MotorCard
              key={item.motor_id}
              motor={{ id: item.motor_id, ...item.motor_data }}
              rank={index + 1}
              onSelect={onSelectMotor}
              onScan={handleScanOne}
              scanning={scanningMotorId === item.motor_id}
            />
          ))}
        </div>
      )}
      
      {showAddModal && <AddMotorModal onClose={() => setShowAddModal(false)} onAdded={handleMotorAdded} />}
    </div>
  );
};

export default FleetDashboard;
