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

  if (loading) return <div className="glass-panel" style={{ padding: '16px' }}>Loading history...</div>;
  if (!history || history.length === 0) return <div className="glass-panel" style={{ padding: '16px' }}>No scan history found.</div>;

  return (
    <div className="glass-panel" style={{ padding: '20px', maxHeight: '300px', overflowY: 'auto' }}>
      <h3 className="card-title">Fault History</h3>
      <div className="timeline">
        {history.map((entry, index) => {
          const date = new Date(entry.timestamp);
          const formattedDate = date.toLocaleString();
          
          return (
            <div className="timeline-item" key={entry.id || index}>
              <div className={`timeline-dot status-${entry.status || 'unknown'}`}></div>
              <div className="timeline-time">{formattedDate}</div>
              <div className="timeline-content">
                <div>{entry.fault_mode}</div>
                <div className="timeline-dbc">
                  {typeof entry.peak_dbc === 'number' ? entry.peak_dbc.toFixed(2) : '--'} dBc
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
