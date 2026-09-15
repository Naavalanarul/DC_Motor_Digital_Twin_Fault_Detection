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
      line: { tension: 0.1, borderWidth: 1 }
    },
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'ACOUSTIC PRESSURE WAVEFORM',
        color: '#737373',
        font: { size: 11, family: 'JetBrains Mono', weight: '600' }
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Time (s)', color: '#737373', font: { family: 'JetBrains Mono', size: 10 } },
        grid: { color: '#1f1f1f', lineWidth: 1 },
        ticks: { color: '#737373', font: { family: 'JetBrains Mono', size: 9 }, maxTicksLimit: 10 }
      },
      y: {
        title: { display: true, text: 'Pressure (Pa)', color: '#737373', font: { family: 'JetBrains Mono', size: 10 } },
        grid: { color: '#1f1f1f', lineWidth: 1 },
        ticks: { color: '#737373', font: { family: 'JetBrains Mono', size: 9 } }
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
        label: 'Pressure',
        data: chartPressure,
        borderColor: '#a3a3a3',
        backgroundColor: 'transparent',
      },
    ],
  };

  const peakHz = acousticData?.spectral_peak_hz;
  const status = acousticData?.status;
  
  let statusColor = '#404040'; // healthy
  if (status === 'warning') statusColor = '#8a8a8a';
  if (status === 'fault') statusColor = '#ffffff';

  return (
    <div className="panel chart-wrap" style={{ height: '100%', padding: '16px' }}>
      <div className="chart-title">ACOUSTIC PRESSURE WAVEFORM</div>
      {acousticData && chartTime.length > 0 ? (
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <Line options={options} data={data} />
          {peakHz !== undefined && (
            <div style={{ position: 'absolute', top: '0', right: '0', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '4px', background: '#0a0a0a', padding: '10px', border: `1px solid ${statusColor}` }}>
              <div style={{ color: '#737373', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SPECTRAL PEAK</div>
              <div style={{ color: statusColor, fontSize: '1.1rem', fontWeight: '700', fontFamily: 'JetBrains Mono' }}>{peakHz.toFixed(1)} Hz</div>
              <div style={{ color: '#737373', fontSize: '0.65rem', marginTop: '4px' }}>STATUS: <span style={{ color: statusColor, fontWeight: '700', textTransform: 'uppercase' }}>{status?.toUpperCase()}</span></div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#404040' }}>
          NO ACOUSTIC DATA
        </div>
      )}
    </div>
  );
};

export default AcousticChart;