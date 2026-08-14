import React, { useMemo } from 'react';

const DigitalTwinMotor = ({ faultMode, severity }) => {

  const getWindingClass = (index) => {
    if (faultMode === 'Stator winding fault' && index % 3 === 0) {
      return 'animate-pulse-orange';
    }
    return '';
  };

  const getRotorBarFill = (index) => {
    if (faultMode === 'Broken Rotor Bar' && (index === 2 || index === 7 || index === 13)) {
      return '#ef4444';
    }
    return '#374151';
  };

  const getRotorBarClass = (index) => {
    if (faultMode === 'Broken Rotor Bar' && (index === 2 || index === 7 || index === 13)) {
      return 'animate-pulse-red';
    }
    return '';
  };

  // CSS transform for eccentricity — shift in px
  const rotorOffset = useMemo(() => {
    if (faultMode === 'Eccentricity (Asymmetry)') {
      const shift = severity * 15; // visual multiplier
      return { transform: `translate(${shift}px, ${shift * 0.5}px)`, transition: 'transform 0.5s ease-out' };
    }
    return { transform: 'translate(0, 0)', transition: 'transform 0.5s ease-out' };
  }, [faultMode, severity]);

  const shaftClass = faultMode === 'External (Mechanical Unbalance / Alignment)' ? 'animate-shake' : '';
  const isSpinning = faultMode !== 'Eccentricity (Asymmetry)';

  // Generate stator windings
  const renderWindings = () => {
    const windings = [];
    for (let i = 0; i < 24; i++) {
      const angle = (i * 360) / 24;
      const rad = (angle * Math.PI) / 180;
      const cx = 200 + 150 * Math.cos(rad);
      const cy = 200 + 150 * Math.sin(rad);
      windings.push(
        <g key={`winding-${i}`} className={getWindingClass(i)}>
          {/* Coil slot */}
          <rect
            x={cx - 12}
            y={cy - 10}
            width={24}
            height={20}
            rx={3}
            fill="#1a2332"
            stroke="rgba(0, 212, 255, 0.6)"
            strokeWidth="0.8"
            transform={`rotate(${angle} ${cx} ${cy})`}
          />
          {/* Coil wires */}
          {[0, 5, 10].map((offset) => (
            <line
              key={offset}
              x1={cx - 8}
              y1={cy - 7 + offset}
              x2={cx + 8}
              y2={cy - 7 + offset}
              stroke="rgba(0, 212, 255, 0.4)"
              strokeWidth="0.5"
              transform={`rotate(${angle} ${cx} ${cy})`}
            />
          ))}
        </g>
      );
    }
    return windings;
  };

  // Generate rotor bars
  const renderRotorBars = () => {
    const bars = [];
    for (let i = 0; i < 18; i++) {
      const angle = (i * 360) / 18;
      const rad = (angle * Math.PI) / 180;
      const cx = 200 + 80 * Math.cos(rad);
      const cy = 200 + 80 * Math.sin(rad);
      bars.push(
        <circle
          key={`bar-${i}`}
          cx={cx}
          cy={cy}
          r={6}
          fill={getRotorBarFill(i)}
          className={getRotorBarClass(i)}
          stroke="rgba(0, 212, 255, 0.4)"
          strokeWidth="0.5"
        />
      );
    }
    return bars;
  };

  return (
    <div className="glass-panel blueprint-bg" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, left: 20, zIndex: 10 }}>
        <h2 className="card-title" style={{ marginBottom: '4px' }}>MOTOR CROSS-SECTION</h2>
        <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
          MODE: {faultMode.toUpperCase()}
        </div>
        {severity > 0 && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 2 }}>
            SEVERITY: {(severity * 100).toFixed(0)}%
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', zIndex: 2, minHeight: 0, minWidth: 0 }}>
        <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" style={{ maxHeight: '400px' }}>
          <defs>
            <radialGradient id="statorGrad" cx="50%" cy="50%" r="50%" fx="45%" fy="45%">
              <stop offset="60%" stopColor="#222831" />
              <stop offset="100%" stopColor="#393E46" />
            </radialGradient>
            <radialGradient id="rotorGrad" cx="50%" cy="50%" r="50%" fx="35%" fy="35%">
              <stop offset="0%" stopColor="#393E46" />
              <stop offset="100%" stopColor="#222831" />
            </radialGradient>
            <radialGradient id="shaftGrad" cx="50%" cy="50%" r="50%" fx="40%" fy="40%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="cyanGlow">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00d4ff" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Center guidelines (blueprint style) */}
          <line x1="200" y1="10" x2="200" y2="390" stroke="rgba(0, 212, 255, 0.15)" strokeWidth="0.5" strokeDasharray="4,6" />
          <line x1="10" y1="200" x2="390" y2="200" stroke="rgba(0, 212, 255, 0.15)" strokeWidth="0.5" strokeDasharray="4,6" />

          {/* Dimension circle (outer reference) */}
          <circle cx="200" cy="200" r="190" fill="none" stroke="rgba(0, 212, 255, 0.12)" strokeWidth="0.5" strokeDasharray="2,4" />

          {/* === STATOR === */}
          {/* Outer housing */}
          <circle cx="200" cy="200" r="175" fill="url(#statorGrad)" stroke="rgba(0, 212, 255, 0.5)" strokeWidth="1.5" />
          {/* Inner stator bore */}
          <circle cx="200" cy="200" r="130" fill="none" stroke="rgba(0, 212, 255, 0.3)" strokeWidth="0.8" />

          {/* Stator windings */}
          {renderWindings()}

          {/* Air gap indicator (dashed ring) */}
          <circle cx="200" cy="200" r="105" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="6" strokeDasharray="3,5" />

          {/* === ROTOR (with eccentricity offset) === */}
          <g style={rotorOffset}>
            {/* Rotor core */}
            <circle
              cx="200"
              cy="200"
              r="95"
              fill="url(#rotorGrad)"
              stroke="rgba(0, 212, 255, 0.4)"
              strokeWidth="0.8"
              className={isSpinning ? 'animate-spin-slow' : ''}
              style={{ transformOrigin: '200px 200px' }}
            />

            {/* Rotor bars */}
            <g className={isSpinning ? 'animate-spin-slow' : ''} style={{ transformOrigin: '200px 200px' }}>
              {renderRotorBars()}
            </g>

            {/* === SHAFT === */}
            <circle cx="200" cy="200" r="28" fill="url(#shaftGrad)" stroke="#cbd5e1" strokeWidth="1.5" className={shaftClass} />
            <circle cx="200" cy="200" r="18" fill="#475569" stroke="rgba(0, 212, 255, 0.2)" strokeWidth="0.5" className={shaftClass} />
            <circle cx="200" cy="200" r="8" fill="#1a2332" stroke="rgba(0, 212, 255, 0.3)" strokeWidth="0.5" className={shaftClass} />
            {/* Keyway slot */}
            <rect x="196" y="174" width="8" height="12" rx="1" fill="#334155" className={shaftClass} />
          </g>

          {/* === LABELS === */}
          <g style={{ pointerEvents: 'none' }}>
            {/* Stator label */}
            <text x="30" y="38" fill="rgba(0, 212, 255, 0.7)" fontSize="10" fontFamily="monospace" fontWeight="600">STATOR</text>
            <line x1="70" y1="42" x2="95" y2="70" stroke="rgba(0, 212, 255, 0.3)" strokeWidth="0.8" />
            <circle cx="95" cy="70" r="2" fill="rgba(0, 212, 255, 0.5)" />

            {/* Rotor label */}
            <text x="320" y="370" fill="rgba(0, 212, 255, 0.7)" fontSize="10" fontFamily="monospace" fontWeight="600">ROTOR</text>
            <line x1="315" y1="365" x2="270" y2="280" stroke="rgba(0, 212, 255, 0.3)" strokeWidth="0.8" />
            <circle cx="270" cy="280" r="2" fill="rgba(0, 212, 255, 0.5)" />

            {/* Air gap label */}
            <text x="28" y="204" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace">AIR GAP</text>
            <line x1="74" y1="200" x2="95" y2="200" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />

            {/* Shaft label */}
            <text x="330" y="195" fill="rgba(0, 212, 255, 0.5)" fontSize="9" fontFamily="monospace">SHAFT</text>
            <line x1="325" y1="195" x2="230" y2="200" stroke="rgba(0, 212, 255, 0.15)" strokeWidth="0.5" />

            {/* Dimension annotation */}
            <text x="195" y="398" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace" textAnchor="middle">Ø 350mm</text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default DigitalTwinMotor;
