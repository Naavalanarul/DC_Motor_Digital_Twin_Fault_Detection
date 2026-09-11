import React, { useState, useEffect } from 'react';
import { fetchFaultHistory } from '../api';

const FaultHistoryTimeline = ({ motorId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (motorId) {
      setLoading(true);
      fetchFaultHistory(motorId)
        .then(data => setHistory(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [motorId]);

  if (loading) return <div className="panel" style={{ padding: '16px' }}>LOADING HISTORY...</div>;
  if (!history || history.length === 0) return <div className="panel" style={{ padding: '16px' }}>NO SCAN HISTORY</div>;

  return (
    <div className="panel" style={{ padding: '16px', maxHeight: '300px', overflowY: 'auto' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono', color: '#737373', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #2a2a2a' }}>
        FAULT HISTORY
      </div>
      <div className="timeline">
        {history.map((entry, index) => {
          const date = new Date(entry.timestamp);
          const formattedDate = date.toLocaleString();
          
          return (
            <div className="timeline-item" key={entry.id || index}>
              <div className={`timeline-dot status-${entry.status || 'unknown'} filled`}></div>
              <div className="timeline-time">{formattedDate}</div>
              <div className="timeline-content">
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', textTransform: 'uppercase', color: '#a3a3a3' }}>
                  {entry.fault_mode}
                </div>
                <div className="timeline-dbc">
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