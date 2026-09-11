import React from 'react';

const AnalysisCard = ({ title, value, unit, icon, colorClass, subtitle }) => (
  <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: colorClass || 'var(--accent-cyan)' }}></div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>{title}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
      <span style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>{value !== undefined ? value : '--'}</span>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{unit}</span>
    </div>
    {subtitle && (
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
        {subtitle}
      </div>
    )}
  </div>
);

const AnalysisPanel = ({ analysisResults }) => {
  if (!analysisResults) {
    return (
      <div className="glass-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Run simulation to view analysis results.
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

  // Determine color based on peak dBc
  let peakColor = 'var(--accent-green)';
  if (peak_dbc >= -25) peakColor = 'var(--accent-red)';
  else if (peak_dbc >= -40) peakColor = 'var(--accent-orange)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <AnalysisCard 
          title="Fundamental" 
          value={formatNumber(fundamental_freq)} 
          unit="Hz" 
          colorClass="var(--accent-cyan)" 
        />
        <AnalysisCard 
          title="Peak dBc" 
          value={formatNumber(peak_dbc)} 
          unit="dBc" 
          colorClass={peakColor} 
        />
        <AnalysisCard 
          title="Upper Sideband" 
          value={formatNumber(upper_sideband_freq)} 
          unit="Hz" 
          colorClass="var(--accent-orange)"
          subtitle={`Amp: ${formatNumber(upper_sideband_amp, 4)}`}
        />
        <AnalysisCard 
          title="Lower Sideband" 
          value={formatNumber(lower_sideband_freq)} 
          unit="Hz" 
          colorClass="var(--accent-yellow)"
          subtitle={`Amp: ${formatNumber(lower_sideband_amp, 4)}`}
        />
      </div>

      {harmonic_sidebands && harmonic_sidebands.length > 1 && (
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px' }}>
            Multi-Harmonic Survey (Paper Fig. 6)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'right' }}>
            <thead>
              <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ padding: '4px', textAlign: 'left' }}>Order</th>
                <th style={{ padding: '4px' }}>Freq (Hz)</th>
                <th style={{ padding: '4px' }}>L-SB (dBc)</th>
                <th style={{ padding: '4px' }}>U-SB (dBc)</th>
                <th style={{ padding: '4px' }}>Peak (dBc)</th>
              </tr>
            </thead>
            <tbody>
              {harmonic_sidebands.map((h, i) => {
                let hColor = 'var(--text-primary)';
                if (h.peak_dbc >= -25) hColor = 'var(--accent-red)';
                else if (h.peak_dbc >= -40) hColor = 'var(--accent-orange)';
                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '4px', textAlign: 'left' }}>{h.order}x</td>
                    <td style={{ padding: '4px' }}>{formatNumber(h.harmonic_freq, 1)}</td>
                    <td style={{ padding: '4px' }}>{formatNumber(h.lower_dbc, 1)}</td>
                    <td style={{ padding: '4px' }}>{formatNumber(h.upper_dbc, 1)}</td>
                    <td style={{ padding: '4px', color: hColor, fontWeight: 'bold' }}>{formatNumber(h.peak_dbc, 1)}</td>
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