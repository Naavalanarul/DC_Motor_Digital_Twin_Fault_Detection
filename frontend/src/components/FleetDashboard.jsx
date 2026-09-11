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
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.01em' }}>
            MOTOR FLEET — <span style={{ color: '#a3a3a3', fontWeight: '400' }}>PRIORITY MONITOR</span>
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#737373', marginTop: '2px', fontWeight: '400' }}>
            REAL-TIME MOTOR HEALTH MONITORING — MAX-HEAP PRIORITY QUEUE
          </p>
        </div>
        <div className="fleet-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ ADD MOTOR</button>
          <button className="btn btn-primary" onClick={handleScanAll} disabled={scanningAll}>
            {scanningAll ? 'SCANNING...' : 'SCAN ALL'}
          </button>
        </div>
      </div>
      
      <div className="priority-summary">
        <div className="priority-stat fault">
          <div className="priority-label">FAULT</div>
          <div className="priority-value">{faultCt}</div>
        </div>
        <div className="priority-stat warning">
          <div className="priority-label">WARNING</div>
          <div className="priority-value">{warningCt}</div>
        </div>
        <div className="priority-stat healthy">
          <div className="priority-label">HEALTHY</div>
          <div className="priority-value">{healthyCt}</div>
        </div>
        <div className="priority-stat total">
          <div className="priority-label">TOTAL</div>
          <div className="priority-value">{motors.length}</div>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-state">LOADING MOTORS...</div>
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