import React from 'react';

const MotorCard = ({ motor, rank, onSelect, onScan, scanning }) => {
  // Status color mapping
  // Brightness encodes severity (no hue): healthy recedes, fault is the
  // brightest, highest-contrast value on the page.
  const statusColorMap = {
    healthy: '#707070',
    warning: '#bdbdbd',
    fault: '#ffffff',
    unknown: '#4a4a4a'
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