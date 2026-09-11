import React from 'react';

const MotorCard = ({ motor, rank, onSelect, onScan, scanning }) => {
  // Brightness encodes severity (no hue): healthy recedes, fault is the
  // brightest, highest-contrast value on the page.
  const statusColorMap = {
    healthy: '#404040',
    warning: '#8a8a8a',
    fault: '#ffffff',
    unknown: '#2a2a2a'
  };
  const statusColor = statusColorMap[motor.status] || statusColorMap.unknown;
  
  const peakDbc = typeof motor.peak_dbc === 'number' ? motor.peak_dbc.toFixed(2) : '--';
  
  return (
    <div className="motor-card panel" onClick={() => onSelect(motor.id)} 
         style={{ borderLeft: `3px solid ${statusColor}` }}>
      <div className="motor-card-rank">#{rank}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span className={`status-dot status-${motor.status || 'unknown'} filled`}></span>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '600' }}>{motor.name}</h3>
      </div>
      <div style={{ fontSize: '0.75rem', color: '#737373', marginBottom: '8px' }}>
        {motor.location || 'UNKNOWN LOCATION'}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#737373', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #2a2a2a' }}>
        {motor.fault_mode || 'UNKNOWN MODE'}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '1.5rem', fontWeight: '700' }}>{peakDbc}</span>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#737373', textTransform: 'uppercase' }}>DBc</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #2a2a2a' }}>
        <button className="btn btn-scan" onClick={e => { e.stopPropagation(); onScan(motor.id); }} disabled={scanning}>
          {scanning ? 'SCANNING' : 'SCAN'}
        </button>
      </div>
    </div>
  );
};

export default MotorCard;