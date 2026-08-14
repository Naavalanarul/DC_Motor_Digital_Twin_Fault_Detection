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
    peak_dBc,
    upper_sideband_amp,
    lower_sideband_amp
  } = analysisResults;

  // Determine color based on peak dBc
  let peakColor = 'var(--accent-green)';
  if (peak_dBc >= -25) peakColor = 'var(--accent-red)';
  else if (peak_dBc >= -40) peakColor = 'var(--accent-orange)';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <AnalysisCard 
        title="Fundamental" 
        value={formatNumber(fundamental_freq)} 
        unit="Hz" 
        colorClass="var(--accent-cyan)" 
      />
      <AnalysisCard 
        title="Peak dBc" 
        value={formatNumber(peak_dBc)} 
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
  );
};

export default AnalysisPanel;
