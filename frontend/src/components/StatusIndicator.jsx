import React from 'react';

const StatusIndicator = ({ peakDbc }) => {
  let statusText = 'UNKNOWN';
  let statusClass = '';
  let glowStyle = {};
  
  if (peakDbc === undefined || peakDbc === null) {
    statusText = 'READY';
    statusClass = 'text-secondary';
  } else if (peakDbc < -40) {
    statusText = 'HEALTHY';
    statusClass = 'status-healthy';
    glowStyle = { boxShadow: '0 0 12px rgba(255, 255, 255, 0.12)' };
  } else if (peakDbc >= -40 && peakDbc <= -25) {
    statusText = 'WARNING';
    statusClass = 'status-warning';
    glowStyle = { boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)' };
  } else {
    statusText = 'FAULT DETECTED';
    statusClass = 'status-fault';
    glowStyle = { boxShadow: '0 0 34px rgba(255, 255, 255, 0.65)' };
  }

  return (
    <div className="glass-panel" style={{ ...glowStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', transition: 'box-shadow 0.3s ease' }}>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '2px', marginBottom: '12px' }}>
        MOTOR STATUS
      </div>
      <div className={statusClass} style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '1px', textAlign: 'center' }}>
        {statusText}
      </div>
      {peakDbc !== undefined && (
        <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Peak Sideband: <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{peakDbc.toFixed(2)} dBc</span>
        </div>
      )}
    </div>
  );
};

export default StatusIndicator;