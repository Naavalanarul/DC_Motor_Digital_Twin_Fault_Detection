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
      legend: { display: false },
      title: {
        display: true,
        text: 'FFT FREQUENCY SPECTRUM',
        color: '#737373',
        font: { size: 11, family: 'JetBrains Mono', weight: '600' }
      },
      tooltip: {
        callbacks: {
          label: (context) => `AMPLITUDE: ${context.raw.toFixed(4)}`
        },
        backgroundColor: '#0a0a0a',
        titleColor: '#ffffff',
        bodyColor: '#a3a3a3',
        borderColor: '#2a2a2a',
        borderWidth: 1,
        titleFont: { family: 'JetBrains Mono', size: 10 },
        bodyFont: { family: 'JetBrains Mono', size: 10 },
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'FREQUENCY (Hz)', color: '#737373', font: { family: 'JetBrains Mono', size: 10 } },
        grid: { color: '#1f1f1f', lineWidth: 1 },
        ticks: { color: '#737373', font: { family: 'JetBrains Mono', size: 9 }, maxTicksLimit: 15 }
      },
      y: {
        title: { display: true, text: 'AMPLITUDE', color: '#737373', font: { family: 'JetBrains Mono', size: 10 } },
        grid: { color: '#1f1f1f', lineWidth: 1 },
        ticks: { color: '#737373', font: { family: 'JetBrains Mono', size: 9 } },
        type: 'logarithmic'
      }
    }
  };

  let chartFreq = freqData || [];
  let chartAmp = ampData || [];
  
  const maxPoints = 500;
  if (chartFreq.length > maxPoints) {
    const step = Math.ceil(chartFreq.length / maxPoints);
    chartFreq = chartFreq.filter((_, i) => i % step === 0);
    chartAmp = chartAmp.filter((_, i) => i % step === 0);
  }

  // Determine colors based on analysis results - grayscale only
  const backgroundColors = chartFreq.map((freq) => {
    if (!analysisResults) return '#2a2a2a';
    
    const tol = 1.0;
    const harmonics = analysisResults.harmonic_sidebands;
    
    if (harmonics && harmonics.length > 1) {
      for (const h of harmonics) {
        if (Math.abs(freq - h.harmonic_freq) < tol) return '#ffffff'; // Harmonic
        if (Math.abs(freq - h.upper_freq) < tol) return '#a3a3a3';    // Upper sideband
        if (Math.abs(freq - h.lower_freq) < tol) return '#525252';    // Lower sideband
      }
    } else {
      const fund = analysisResults.fundamental_freq;
      const usb = analysisResults.upper_sideband_freq;
      const lsb = analysisResults.lower_sideband_freq;
      
      if (fund && Math.abs(freq - fund) < tol) return '#ffffff';      // Fundamental
      if (usb && Math.abs(freq - usb) < tol) return '#a3a3a3';        // Upper sideband
      if (lsb && Math.abs(freq - lsb) < tol) return '#525252';        // Lower sideband
    }
    
    return '#2a2a2a'; // Noise floor
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

  const isMultiHarmonic = analysisResults && analysisResults.harmonic_sidebands && analysisResults.harmonic_sidebands.length > 1;

  return (
    <div className="panel chart-wrap" style={{ height: '100%', padding: '16px', position: 'relative' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono', color: '#737373', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #2a2a2a' }}>
        FFT FREQUENCY SPECTRUM
      </div>
      {freqData && freqData.length > 0 ? (
        <>
          <Bar options={options} data={data} />
          {analysisResults && (
            <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '4px', background: '#0a0a0a', padding: '8px', border: '1px solid #2a2a2a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#ffffff' }}></div>
                <span style={{ fontFamily: 'JetBrains Mono' }}>{isMultiHarmonic ? 'HARMONICS' : 'FUNDAMENTAL'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#a3a3a3' }}></div>
                <span style={{ fontFamily: 'JetBrains Mono' }}>UPPER SIDEBAND{isMultiHarmonic ? 'S' : ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#525252' }}></div>
                <span style={{ fontFamily: 'JetBrains Mono' }}>LOWER SIDEBAND{isMultiHarmonic ? 'S' : ''}</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#404040', fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>
          NO SPECTRUM DATA — RUN SIMULATION
        </div>
      )}
    </div>
  );
};

export default SpectrumChart;