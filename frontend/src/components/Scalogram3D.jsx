import React, { useMemo } from 'react';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

/**
 * 3D time / frequency / amplitude surface, computed from the wavelet
 * (CWT, complex Morlet) transform in WaveletAlgorithm.py -- i.e. the
 * scalogram Polikar's tutorial builds toward: unlike a single FFT
 * spectrum (frequency vs amplitude, averaged over the whole window),
 * this keeps the time axis, so intermittent or time-varying sidebands
 * are visible instead of being averaged away.
 *
 * Rendered strictly in grayscale to match the rest of the UI -- height
 * (amplitude) is the only channel that needs color at all, so it uses a
 * black-to-white colorscale rather than a hue-based one.
 */
const Scalogram3D = ({ scalogram }) => {
  const hasData = scalogram && scalogram.time?.length > 0 && scalogram.frequency?.length > 0;

  const data = useMemo(() => {
    if (!hasData) return [];
    return [
      {
        type: 'surface',
        x: scalogram.time,
        y: scalogram.frequency,
        z: scalogram.amplitude,
        colorscale: [
          [0, '#000000'],
          [0.5, '#737373'],
          [1, '#ffffff'],
        ],
        showscale: true,
        colorbar: {
          title: { text: 'AMPLITUDE', font: { color: '#737373', size: 10, family: 'JetBrains Mono' } },
          tickfont: { color: '#737373', size: 9, family: 'JetBrains Mono' },
          outlinewidth: 0,
          len: 0.7,
          borderwidth: 1,
          bordercolor: '#2a2a2a',
        },
        contours: {
          z: {
            show: true,
            usecolormap: true,
            highlightcolor: '#ffffff',
            project: { z: true },
          },
        },
        lighting: { ambient: 0.75, diffuse: 0.6, specular: 0.15, roughness: 0.9 },
      },
    ];
  }, [hasData, scalogram]);

  const layout = useMemo(
    () => ({
      autosize: true,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { l: 0, r: 0, t: 0, b: 0 },
      font: { family: 'JetBrains Mono, monospace', color: '#737373' },
      scene: {
        xaxis: {
          title: { text: 'TIME (s)', font: { color: '#737373', size: 10, family: 'JetBrains Mono' } },
          gridcolor: '#1f1f1f',
          zerolinecolor: '#2a2a2a',
          color: '#737373',
          backgroundcolor: '#0a0a0a',
          tickfont: { family: 'JetBrains Mono', size: 9, color: '#737373' },
          showspikes: false,
        },
        yaxis: {
          title: { text: 'FREQUENCY (Hz)', font: { color: '#737373', size: 10, family: 'JetBrains Mono' } },
          gridcolor: '#1f1f1f',
          zerolinecolor: '#2a2a2a',
          color: '#737373',
          backgroundcolor: '#0a0a0a',
          tickfont: { family: 'JetBrains Mono', size: 9, color: '#737373' },
          showspikes: false,
        },
        zaxis: {
          title: { text: 'AMPLITUDE', font: { color: '#737373', size: 10, family: 'JetBrains Mono' } },
          gridcolor: '#1f1f1f',
          zerolinecolor: '#2a2a2a',
          color: '#737373',
          backgroundcolor: '#0a0a0a',
          tickfont: { family: 'JetBrains Mono', size: 9, color: '#737373' },
          showspikes: false,
        },
        camera: { eye: { x: 1.6, y: -1.6, z: 0.9 } },
      },
    }),
    []
  );

  return (
    <div className="panel chart-wrap" style={{ height: '100%', padding: '16px', position: 'relative' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono', color: '#737373', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #2a2a2a' }}>
        WAVELET SCALOGRAM — TIME / FREQUENCY / AMPLITUDE
      </div>
      {hasData ? (
        <Plot
          data={data}
          layout={layout}
          config={{ displaylogo: false, responsive: true }}
          useResizeHandler
          style={{ width: '100%', height: 'calc(100% - 30px)' }}
        />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#404040', fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>
          NO SCALOGRAM DATA — RUN SIMULATION
        </div>
      )}
    </div>
  );
};

export default Scalogram3D;