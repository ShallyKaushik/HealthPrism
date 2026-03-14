// frontend/src/pages/HeartMonitorPage.js

import React, { useEffect } from 'react';
import HeartMonitor from '../components/HeartMonitor';
import './HeartMonitorPage.css';

function HeartMonitorPage() {
  useEffect(() => {
    document.title = 'Heart Monitor - HealthPrism';
  }, []);

  return (
    <div className="heart-monitor-page">
      <div className="container">
        <h1>🩺 Heart Rate Monitor</h1>
        <p>Welcome to HealthPrism's advanced heart rate monitoring feature. Using remote photoplethysmography (rPPG), we can measure your heart rate non-invasively through your device's camera.</p>
        <HeartMonitor />
      </div>
    </div>
  );
}

export default HeartMonitorPage;