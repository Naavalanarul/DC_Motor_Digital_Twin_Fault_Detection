import React, { useMemo } from 'react';

const DigitalTwinMotor = ({ faultMode, severity }) => {

  const getWindingClass = (index) => {
    if (faultMode === 'Stator winding fault' && index % 3 === 0) {
      return 'pulse-hard';
    }
    return '';
  };

  const getRotorBarFill = (index) => {
    if (faultMode === 'Broken Rotor Bar' && (index === 2 || index === 7 || index === 13)) {
      return '#ffffff'; // broken bar: brightest
    }
    return '#404040';
  };

  const getRotorBarStroke = (index) => {
    if (faultMode === 'Broken Rotor Bar' && (index === 2 || index === 7 || index === 13)) {
      return '#ffffff';
    }
    return '#525252';
  };

  const rotorOffset = useMemo(() => {
    if (faultMode === 'Eccentricity (Asymmetry)') {
      const shift = severity * 15;
      return { transform: `translate(${shift}px, ${shift * 0.5}px)`, transition: 'transform 0.3s ease-out' };
    }
    return { transform: 'translate(0, 0)', transition: 'transform 0.3s ease-out' };
  }, [faultMode, severity]);

  const shaftClass = faultMode === 'External (Mechanical Unbalance / Alignment)' ? 'tick' : '';
  const isSpinning = faultMode !== 'Eccentricity (Asymmetry)';

  const renderWindings = () => {
    const windings = [];
    for (let i = 0; i < 24; i++) {
      const angle = (i * 360) / 24;
      const rad = (angle * Math.PI) / 180;
      const cx = 200 + 150 * Math.cos(rad);
      const cy = 200 + 150 * Math.sin(rad);
      windings.push(
        <g key={`winding-${i}`} className={getWindingClass(i)}>
          <rect
            x={cx - 12}
            y={cy - 10}
            width={24}
            height={20}
            rx={2}
            fill="#1a1a1a"
            stroke="#525252"
            strokeWidth="0.8"
            transform={`rotate(${angle} ${cx} ${cy})`}
          />
          {[0, 5, 10].map((offset) => (
            <line
              key={offset}
              x1={cx - 8}
              y1={cy - 7 + offset}
              x2={cx + 8}
              y2={cy - 7 + offset}
              stroke="#3a3a3a"
              strokeWidth="0.5"
              transform={`rotate(${angle} ${cx} ${cy})`}
            />
          ))}
        </g>
      );
    }
    return windings;
  };

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
          stroke={getRotorBarStroke(i)}
          strokeWidth="0.8"
          className={isSpinning ? 'spin-slow' : ''}
          style={{ transformOrigin: '200px 200px' }}
        />
      );
    }
    return bars;
  };

  return (
    <div className="panel blueprint" style={{ display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0, height: '100%', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono', color: '#737373', marginBottom: '4px' }}>
          MOTOR CROSS-SECTION
        </div>
        <div style={{ fontSize: '0.6rem', color: '#404040', fontFamily: 'JetBrains Mono', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          MODE: {faultMode.toUpperCase()}
        </div>
        {severity > 0 && (
          <div style={{ fontSize: '0.6rem', color: '#404040', marginTop: 2, fontFamily: 'JetBrains Mono' }}>
            SEVERITY: {(severity * 100).toFixed(0)}%
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', zIndex: 2, minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
        <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', maxWidth: '360px', maxHeight: '360px' }}>
          <defs>
            <radialGradient id="statorGrad" cx="50%" cy="50%" r="50%" fx="45%" fy="45%">
              <stop offset="60%" stopColor="#1a1a1a" />
              <stop offset="100%" stopColor="#2a2a2a" />
            </radialGradient>
            <radialGradient id="rotorGrad" cx="50%" cy="50%" r="50%" fx="35%" fy="35%">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </radialGradient>
            <radialGradient id="shaftGrad" cx="50%" cy="50%" r="50%" fx="40%" fy="40%">
              <stop offset="0%" stopColor="#8a8a8a" />
              <stop offset="100%" stopColor="#404040" />
            </radialGradient>
          </defs>

          {/* Center guidelines */}
          <line x1="200" y1="10" x2="200" y2="390" stroke="#1f1f1f" strokeWidth="0.5" strokeDasharray="4,6" />
          <line x1="10" y1="200" x2="390" y2="200" stroke="#1f1f1f" strokeWidth="0.5" strokeDasharray="4,6" />

          {/* Dimension circle */}
          <circle cx="200" cy="200" r="190" fill="none" stroke="#1f1f1f" strokeWidth="0.5" strokeDasharray="2,4" />

          {/* === STATOR === */}
          <circle cx="200" cy="200" r="175" fill="url(#statorGrad)" stroke="#525252" strokeWidth="1.2" />
          <circle cx="200" cy="200" r="130" fill="none" stroke="#3a3a3a" strokeWidth="0.6" />

          {/* Stator windings */}
          {renderWindings()}

          {/* Air gap indicator */}
          <circle cx="200" cy="200" r="105" fill="none" stroke="#2a2a2a" strokeWidth="4" strokeDasharray="3,5" />

          {/* === ROTOR (with eccentricity offset) === */}
          <g style={rotorOffset}>
            {/* Rotor core */}
            <circle
              cx="200"
              cy="200"
              r="95"
              fill="url(#rotorGrad)"
              stroke="#404040"
              strokeWidth="0.6"
              className={isSpinning ? 'spin-slow' : ''}
              style={{ transformOrigin: '200px 200px' }}
            />

            {/* Rotor bars */}
            <g className={isSpinning ? 'spin-slow' : ''} style={{ transformOrigin: '200px 200px' }}>
              {renderRotorBars()}
            </g>

            {/* === SHAFT === */}
            <circle cx="200" cy="200" r="28" fill="url(#shaftGrad)" stroke="#a3a3a3" strokeWidth="1.2" className={shaftClass} />
            <circle cx="200" cy="200" r="18" fill="#404040" stroke="#3a3a3a" strokeWidth="0.5" className={shaftClass} />
            <circle cx="200" cy="200" r="8" fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="0.5" className={shaftClass} />
            {/* Keyway slot */}
            <rect x="196" y="174" width="8" height="12" rx="1" fill="#2a2a2a" className={shaftClass} />
          </g>

          {/* === LABELS === */}
          <g style={{ pointerEvents: 'none' }}>
            {/* Stator label */}
            <text x="30" y="38" fill="#404040" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">STATOR</text>
            <line x1="70" y1="42" x2="95" y2="70" stroke="#2a2a2a" strokeWidth="0.6" />
            <circle cx="95" cy="70" r="2" fill="#404040" />

            {/* Rotor label */}
            <text x="320" y="370" fill="#404040" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">ROTOR</text>
            <line x1="315" y1="365" x2="270" y2="280" stroke="#2a2a2a" strokeWidth="0.6" />
            <circle cx="270" cy="280" r="2" fill="#404040" />

            {/* Air gap label */}
            <text x="28" y="204" fill="#404040" fontSize="8" fontFamily="JetBrains Mono">AIR GAP</text>
            <line x1="74" y1="200" x2="95" y2="200" stroke="#1f1f1f" strokeWidth="0.4" />

            {/* Shaft label */}
            <text x="330" y="195" fill="#404040" fontSize="8" fontFamily="JetBrains Mono">SHAFT</text>
            <line x1="325" y1="195" x2="230" y2="200" stroke="#1f1f1f" strokeWidth="0.4" />

            {/* Dimension annotation */}
            <text x="195" y="398" fill="#2a2a2a" fontSize="7" fontFamily="JetBrains Mono" textAnchor="middle">Ø 350mm</text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default DigitalTwinMotor;