import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SpectrumChart = ({ freqData, ampData, analysisResults }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'FFT Frequency Spectrum',
        color: '#f3f4f6',
        font: {
          size: 16,
          family: 'Inter',
          weight: '600'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => `Amplitude: ${context.raw.toFixed(4)}`
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Frequency (Hz)',
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(0, 212, 255, 0.05)'
        },
        ticks: {
          color: '#9ca3af',
          maxTicksLimit: 15
        }
      },
      y: {
        title: {
          display: true,
          text: 'Amplitude',
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(0, 212, 255, 0.1)'
        },
        ticks: {
          color: '#9ca3af'
        },
        type: 'logarithmic'
      }
    }
  };

  let chartFreq = freqData || [];
  let chartAmp = ampData || [];
  
  // Downsample for rendering
  const maxPoints = 500;
  if (chartFreq.length > maxPoints) {
    const step = Math.ceil(chartFreq.length / maxPoints);
    chartFreq = chartFreq.filter((_, i) => i % step === 0);
    chartAmp = chartAmp.filter((_, i) => i % step === 0);
  }

  // Determine colors based on analysis results
  const backgroundColors = chartFreq.map((freq) => {
    if (!analysisResults) return 'rgba(0, 212, 255, 0.3)';
    
    const fund = analysisResults.fundamental_freq;
    const usb = analysisResults.upper_sideband_freq;
    const lsb = analysisResults.lower_sideband_freq;
    
    // Tolerance for matching floating point frequencies
    const tol = 1.0;
    
    if (fund && Math.abs(freq - fund) < tol) return '#00d4ff'; // Cyan
    if (usb && Math.abs(freq - usb) < tol) return '#f97316'; // Orange
    if (lsb && Math.abs(freq - lsb) < tol) return '#eab308'; // Yellow
    
    return 'rgba(0, 212, 255, 0.2)'; // Dim
  });

  const data = {
    labels: chartFreq.map(f => typeof f === 'number' ? f.toFixed(1) : f),
    datasets: [
      {
        label: 'Amplitude',
        data: chartAmp,
        backgroundColor: backgroundColors,
        barPercentage: 1.0,
        categoryPercentage: 1.0,
      },
    ],
  };

  return (
    <div className="glass-panel" style={{ height: '100%', padding: '15px', position: 'relative' }}>
      {freqData && freqData.length > 0 ? (
        <>
          <Bar options={options} data={data} />
          {analysisResults && (
            <div style={{ position: 'absolute', top: '15px', right: '20px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#00d4ff' }}></div>
                <span>Fundamental</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#f97316' }}></div>
                <span>Upper Sideband</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#eab308' }}></div>
                <span>Lower Sideband</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
          No data available. Run simulation first.
        </div>
      )}
    </div>
  );
};

export default SpectrumChart;
