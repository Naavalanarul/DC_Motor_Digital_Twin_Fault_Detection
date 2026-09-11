import React from 'react';

const StatusIndicator = ({ peakDbc }) => {
  let statusText = 'READY';
  let statusColor = '#404040';
  let borderColor = '#2a2a2a';
  
  if (peakDbc === undefined || peakDbc === null) {
    statusText = 'READY';
    statusColor = '#404040';
    borderColor = '#2a2a2a';
  } else if (peakDbc < -40) {
    statusText = 'HEALTHY';
    statusColor = '#404040';
    borderColor = '#404040';
  } else if (peakDbc >= -40 && peakDbc <= -25) {
    statusText = 'WARNING';
    statusColor = '#8a8a8a';
    borderColor = '#8a8a8a';
  } else {
    statusText = 'FAULT DETECTED';
    statusColor = '#ffffff';
    borderColor = '#ffffff';
  }

  return (
    <div className="panel" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '24px',
      borderColor: borderColor,
      minHeight: '160px',
      transition: 'border-color 0.15s ease'
    }}>
      <div style={{ fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'JetBrains Mono', color: '#737373', marginBottom: '12px' }}>
        MOTOR STATUS
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: '700', letterSpacing: '0.02em', textAlign: 'center', color: statusColor, fontFamily: 'JetBrains Mono' }}>
        {statusText}
      </div>
      {peakDbc !== undefined && (
        <div style={{ marginTop: '16px', fontSize: '0.75rem', color: '#737373', fontFamily: 'JetBrains Mono' }}>
          PEAK SIDEBAND: <span style={{ color: '#ffffff', fontWeight: '600' }}>{peakDbc.toFixed(2)} DBc</span>
        </div>
      )}
      {/* Mechanical indicator bar */}
      <div style={{ 
        marginTop: '16px', 
        width: '100%', 
        maxWidth: '200px', 
        height: '6px', 
        background: '#1a1a1a', 
        border: '1px solid #2a2a2a',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: '100%', 
          height: '100%', 
          background: statusColor,
          transformOrigin: 'left center',
          transition: 'width 0.2s ease'
        }} />
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          background: 'repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          pointerEvents: 'none'
        }} />
      </div>
    </div>
  );
};

export default StatusIndicator;