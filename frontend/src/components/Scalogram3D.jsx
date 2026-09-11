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
          [0.5, '#7a7a7a'],
          [1, '#ffffff'],
        ],
        showscale: true,
        colorbar: {
          title: { text: 'Amplitude', font: { color: '#a3a3a3', size: 11 } },
          tickfont: { color: '#a3a3a3', size: 10 },
          outlinewidth: 0,
          len: 0.7,
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
      margin: { l: 0, r: 0, t: 10, b: 0 },
      font: { family: 'Fira Sans, sans-serif', color: '#a3a3a3' },
      scene: {
        xaxis: {
          title: { text: 'Time (s)', font: { color: '#a3a3a3', size: 11 } },
          gridcolor: 'rgba(255,255,255,0.12)',
          zerolinecolor: 'rgba(255,255,255,0.2)',
          color: '#a3a3a3',
          backgroundcolor: 'rgba(0,0,0,0)',
        },
        yaxis: {
          title: { text: 'Frequency (Hz)', font: { color: '#a3a3a3', size: 11 } },
          gridcolor: 'rgba(255,255,255,0.12)',
          zerolinecolor: 'rgba(255,255,255,0.2)',
          color: '#a3a3a3',
          backgroundcolor: 'rgba(0,0,0,0)',
        },
        zaxis: {
          title: { text: 'Amplitude', font: { color: '#a3a3a3', size: 11 } },
          gridcolor: 'rgba(255,255,255,0.12)',
          zerolinecolor: 'rgba(255,255,255,0.2)',
          color: '#a3a3a3',
          backgroundcolor: 'rgba(0,0,0,0)',
        },
        camera: { eye: { x: 1.6, y: -1.6, z: 0.9 } },
      },
    }),
    []
  );

  return (
    <div className="glass-panel" style={{ height: '100%', padding: '15px', position: 'relative' }}>
      <div
        style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          fontWeight: 600,
          letterSpacing: '1px',
          marginBottom: '4px',
        }}
      >
        WAVELET SCALOGRAM — TIME / FREQUENCY / AMPLITUDE
      </div>
      {hasData ? (
        <Plot
          data={data}
          layout={layout}
          config={{ displaylogo: false, responsive: true }}
          useResizeHandler
          style={{ width: '100%', height: 'calc(100% - 24px)' }}
        />
      ) : (
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dim)',
          }}
        >
          No scalogram data available. Run simulation first.
        </div>
      )}
    </div>
  );
};

export default Scalogram3D;