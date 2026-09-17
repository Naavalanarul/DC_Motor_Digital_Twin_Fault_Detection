import React, { useState, useEffect } from 'react';
import { fetchFaultHistory } from '../api';

const FaultHistoryTimeline = ({ motorId }) => {
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!motorId) return;
    let active = true;
    fetchFaultHistory(motorId)
      .then(history => {
        if (active) setResult({ motorId, history });
      })
      .catch(err => {
        console.error(err);
        if (active) setResult({ motorId, history: [], error: true });
      });
    return () => { active = false; };
  }, [motorId]);

  const loading = Boolean(motorId) && result?.motorId !== motorId;
  const history = result?.motorId === motorId ? result.history : [];
  if (loading) return <div className="panel" style={{ padding: '16px' }}>LOADING HISTORY...</div>;
  if (result?.motorId === motorId && result.error) return <div className="panel" style={{ padding: '16px' }}>FAILED TO LOAD HISTORY</div>;
  if (!history || history.length === 0) return <div className="panel" style={{ padding: '16px' }}>NO SCAN HISTORY</div>;

  return (
    <div className="panel" style={{ padding: '20px', minHeight: '300px', overflowY: 'auto' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono', color: '#737373', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #2a2a2a' }}>
        FAULT HISTORY
      </div>
      <div className="timeline">
        {history.map((entry, index) => {
          const date = new Date(entry.timestamp);
          const formattedDate = date.toLocaleString();
          
          return (
            <div className="timeline-item" key={entry.id || index} style={{ paddingBottom: '20px' }}>
              <div className={`timeline-dot status-${entry.status || 'unknown'} filled`}></div>
              <div className="timeline-time" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>{formattedDate}</div>
              <div className="timeline-content">
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', textTransform: 'uppercase', color: '#a3a3a3', marginBottom: '4px' }}>
                  {entry.fault_mode}
                </div>
                <div className="timeline-dbc" style={{ fontSize: '1.1rem' }}>
                  {typeof entry.peak_dbc === 'number' ? entry.peak_dbc.toFixed(2) : '--'} DBc
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FaultHistoryTimeline;