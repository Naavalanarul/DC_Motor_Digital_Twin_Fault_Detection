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
      point: {
        radius: 0
      },
      line: {
        tension: 0.1,
        borderWidth: 1.5
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Motor Current Waveform',
        color: '#f3f4f6',
        font: {
          size: 16,
          family: 'Fira Sans',
          weight: '600'
        }
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time (seconds)',
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(0, 212, 255, 0.1)'
        },
        ticks: {
          color: '#9ca3af',
          maxTicksLimit: 10
        }
      },
      y: {
        title: {
          display: true,
          text: 'Current (Amps)',
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(0, 212, 255, 0.1)'
        },
        ticks: {
          color: '#9ca3af'
        }
      }
    }
  };

  // Subsample data if it's too large to improve render performance
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
        borderColor: '#d62728', // Matplotlib default red
        backgroundColor: 'rgba(214, 39, 40, 0.5)',
      },
    ],
  };

  return (
    <div className="glass-panel" style={{ height: '100%', padding: '15px' }}>
      {timeData && timeData.length > 0 ? (
        <Line options={options} data={data} />
      ) : (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
          No data available. Run simulation first.
        </div>
      )}
    </div>
  );
};

export default WaveformChart;
