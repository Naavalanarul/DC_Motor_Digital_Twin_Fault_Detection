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

const WaveformChart = ({ timeData, currentData }) => {
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
        text: 'MOTOR CURRENT WAVEFORM',
        color: '#737373',
        font: { size: 11, family: 'JetBrains Mono', weight: '600' }
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'TIME (s)', color: '#737373', font: { family: 'JetBrains Mono', size: 10 } },
        grid: { color: '#1f1f1f', lineWidth: 1 },
        ticks: { color: '#737373', font: { family: 'JetBrains Mono', size: 9 }, maxTicksLimit: 10 }
      },
      y: {
        title: { display: true, text: 'CURRENT (A)', color: '#737373', font: { family: 'JetBrains Mono', size: 10 } },
        grid: { color: '#1f1f1f', lineWidth: 1 },
        ticks: { color: '#737373', font: { family: 'JetBrains Mono', size: 9 } }
      }
    }
  };

  const maxPoints = 1000;
  let chartTime = timeData || [];
  let chartCurrent = currentData || [];
  
  if (chartTime.length > maxPoints) {
    const step = Math.ceil(chartTime.length / maxPoints);
    chartTime = chartTime.filter((_, i) => i % step === 0);
    chartCurrent = chartCurrent.filter((_, i) => i % step === 0);
  }

  const data = {
    labels: chartTime.map(t => typeof t === 'number' ? t.toFixed(3) : t),
    datasets: [
      {
        label: 'Current',
        data: chartCurrent,
        borderColor: '#a3a3a3',
        backgroundColor: 'transparent',
      },
    ],
  };

  return (
    <div className="panel chart-wrap" style={{ height: '100%', padding: '16px' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono', color: '#737373', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #2a2a2a' }}>
        MOTOR CURRENT WAVEFORM
      </div>
      {timeData && timeData.length > 0 ? (
        <Line options={options} data={data} />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#404040', fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>
          NO WAVEFORM DATA — RUN SIMULATION
        </div>
      )}
    </div>
  );
};

export default WaveformChart;