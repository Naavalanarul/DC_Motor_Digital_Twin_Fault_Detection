import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AcousticChart = ({ acousticData }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    elements: {
      point: { radius: 0 },
      line: { tension: 0.1, borderWidth: 1.5 }
    },
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Acoustic Pressure Waveform',
        color: '#f4f4f4',
        font: { size: 16, family: 'Fira Sans', weight: '600' }
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Time (seconds)', color: '#a2a2a2' },
        grid: { color: 'rgba(154, 154, 154, 0.1)' },
        ticks: { color: '#a2a2a2', maxTicksLimit: 10 }
      },
      y: {
        title: { display: true, text: 'Pressure (Pa)', color: '#a2a2a2' },
        grid: { color: 'rgba(154, 154, 154, 0.1)' },
        ticks: { color: '#a2a2a2' }
      }
    }
  };

  const maxPoints = 1000;
  let chartTime = acousticData?.time || [];
  let chartPressure = acousticData?.acoustic_pressure || [];
  
  if (chartTime.length > maxPoints) {
    const step = Math.ceil(chartTime.length / maxPoints);
    chartTime = chartTime.filter((_, i) => i % step === 0);
    chartPressure = chartPressure.filter((_, i) => i % step === 0);
  }

  const data = {
    labels: chartTime.map(t => typeof t === 'number' ? t.toFixed(3) : t),
    datasets: [
      {
        label: 'Acoustic Pressure',
        data: chartPressure,
        borderColor: '#9a9a9a',
        backgroundColor: 'rgba(154, 154, 154, 0.2)',
      },
    ],
  };

  const peakHz = acousticData?.spectral_peak_hz;
  const status = acousticData?.status;
  
  let statusColor = '#6e6e6e'; // healthy: recessive
  if (status === 'warning') statusColor = '#bdbdbd';
  if (status === 'fault') statusColor = '#ffffff'; // fault: brightest

  return (
    <div className="glass-panel" style={{ height: '100%', padding: '15px', position: 'relative' }}>
      {acousticData && chartTime.length > 0 ? (
        <>
          <Line options={options} data={data} />
          {peakHz !== undefined && (
            <div style={{ position: 'absolute', top: '15px', right: '20px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(0, 0, 0, 0.6)', padding: '10px', borderRadius: '4px', border: `1px solid ${statusColor}` }}>
              <div style={{ color: 'var(--text-secondary)' }}>SPECTRAL PEAK</div>
              <div style={{ color: statusColor, fontSize: '1.2rem', fontWeight: 'bold' }}>{peakHz.toFixed(1)} Hz</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>STATUS: <span style={{ color: statusColor, fontWeight: 'bold', textTransform: 'uppercase' }}>{status}</span></div>
            </div>
          )}
        </>
      ) : (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a2a2a2' }}>
          No acoustic data available.
        </div>
      )}
    </div>
  );
};

export default AcousticChart;