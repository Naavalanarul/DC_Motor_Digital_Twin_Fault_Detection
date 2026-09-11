import React from 'react';

const AnalysisCard = ({ title, value, unit, color, subtitle }) => (
  <div className="panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', backgroundColor: color || '#525252' }}></div>
    <div style={{ marginBottom: '8px' }}>
      <span style={{ fontSize: '0.65rem', color: '#737373', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'JetBrains Mono' }}>{title}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
      <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffffff', fontFamily: 'JetBrains Mono' }}>{value !== undefined ? value : '--'}</span>
      <span style={{ fontSize: '0.75rem', color: '#737373', fontFamily: 'JetBrains Mono' }}>{unit}</span>
    </div>
    {subtitle && (
      <div style={{ fontSize: '0.7rem', color: '#737373', marginTop: '4px', fontFamily: 'JetBrains Mono' }}>
        {subtitle}
      </div>
    )}
  </div>
);

const AnalysisPanel = ({ analysisResults }) => {
  if (!analysisResults) {
    return (
      <div className="panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#737373' }}>
        RUN SIMULATION TO VIEW ANALYSIS
      </div>
    );
  }

  const formatNumber = (num, decimals = 2) => {
    return num !== undefined && num !== null ? Number(num).toFixed(decimals) : '--';
  };

  const {
    fundamental_freq,
    upper_sideband_freq,
    lower_sideband_freq,
    peak_dbc,
    upper_sideband_amp,
    lower_sideband_amp,
    harmonic_sidebands
  } = analysisResults;

  // Determine color based on peak dBc - grayscale only
  let peakColor = '#404040'; // healthy
  if (peak_dbc >= -25) peakColor = '#ffffff'; // fault
  else if (peak_dbc >= -40) peakColor = '#8a8a8a'; // warning

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <AnalysisCard 
          title="FUNDAMENTAL" 
          value={formatNumber(fundamental_freq)} 
          unit="Hz" 
          color="#525252"
        />
        <AnalysisCard 
          title="PEAK dBc" 
          value={formatNumber(peak_dbc)} 
          unit="dBc" 
          color={peakColor}
        />
        <AnalysisCard 
          title="UPPER SIDEBAND" 
          value={formatNumber(upper_sideband_freq)} 
          unit="Hz" 
          color="#8a8a8a"
          subtitle={`AMP: ${formatNumber(upper_sideband_amp, 4)}`}
        />
        <AnalysisCard 
          title="LOWER SIDEBAND" 
          value={formatNumber(lower_sideband_freq)} 
          unit="Hz" 
          color="#8a8a8a"
          subtitle={`AMP: ${formatNumber(lower_sideband_amp, 4)}`}
        />
      </div>

      {harmonic_sidebands && harmonic_sidebands.length > 1 && (
        <div className="panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.65rem', color: '#737373', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'JetBrains Mono', marginBottom: '12px' }}>
            MULTI-HARMONIC SURVEY
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'right', fontFamily: 'JetBrains Mono' }}>
            <thead>
              <tr style={{ color: '#737373', borderBottom: '1px solid #2a2a2a' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>ORDER</th>
                <th style={{ padding: '6px 8px' }}>FREQ (Hz)</th>
                <th style={{ padding: '6px 8px' }}>L-SB (dBc)</th>
                <th style={{ padding: '6px 8px' }}>U-SB (dBc)</th>
                <th style={{ padding: '6px 8px' }}>PEAK (dBc)</th>
              </tr>
            </thead>
            <tbody>
              {harmonic_sidebands.map((h, i) => {
                let hColor = '#a3a3a3';
                if (h.peak_dbc >= -25) hColor = '#ffffff';
                else if (h.peak_dbc >= -40) hColor = '#8a8a8a';
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #1f1f1f' }}>
                    <td style={{ padding: '6px 8px', textAlign: 'left' }}>{h.order}x</td>
                    <td style={{ padding: '6px 8px' }}>{formatNumber(h.harmonic_freq, 1)}</td>
                    <td style={{ padding: '6px 8px' }}>{formatNumber(h.lower_dbc, 1)}</td>
                    <td style={{ padding: '6px 8px' }}>{formatNumber(h.upper_dbc, 1)}</td>
                    <td style={{ padding: '6px 8px', color: hColor, fontWeight: '700' }}>{formatNumber(h.peak_dbc, 1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;