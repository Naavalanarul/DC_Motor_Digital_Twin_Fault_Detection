import React from 'react';

const MotorCard = ({ motor, rank, onSelect, onScan, scanning }) => {
  // Status color mapping
  const statusColorMap = {
    healthy: '#22c55e',
    warning: '#f97316',
    fault: '#ef4444',
    unknown: '#6b7280'
  };
  const statusColor = statusColorMap[motor.status] || statusColorMap.unknown;
  
  const peakDbc = typeof motor.peak_dbc === 'number' ? motor.peak_dbc.toFixed(2) : '--';
  
  return (
    <div className="motor-card glass-panel" onClick={() => onSelect(motor.id)} 
         style={{ borderLeft: `3px solid ${statusColor}` }}>
      <div className="motor-card-rank">#{rank}</div>
      <div className="motor-card-header">
        <span className={`status-dot status-${motor.status || 'unknown'}`}></span>
        <h3 className="motor-card-name">{motor.name}</h3>
      </div>
      <div className="motor-card-location">{motor.location || 'Unknown Location'}</div>
      <div className="motor-card-fault-badge">{motor.fault_mode || 'Unknown Mode'}</div>
      <div className="motor-card-dbc">
        <span className="dbc-value">{peakDbc}</span>
        <span className="dbc-unit">dBc</span>
      </div>
      <div className="motor-card-footer">
        <button className="btn-scan" onClick={e => { e.stopPropagation(); onScan(motor.id); }} disabled={scanning}>
          {scanning ? 'Scanning' : 'Scan'}
        </button>
      </div>
    </div>
  );
};

export default MotorCard;
