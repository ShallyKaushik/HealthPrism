// frontend/src/pages/StressPage.js

import React from 'react';
import './StressPage.css';
import { FaBrain, FaBed, FaRunning, FaChevronRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import StressCoach from '../components/StressCoach';
import BreathingExercise from '../components/BreathingExercise'; // <-- 1. IMPORT IT

function StressPage() {
  return (
    <div className="stress-page-container">
      
      {/* --- 1. Header --- */}
      <div className="stress-header">
        <h1>Calm Your Mind, Heal Your Heart</h1>
        <p>
          Managing stress is not just about mental well-being—it's
          a critical part of cardiovascular health.
        </p>
      </div>

      <div className="stress-content">

        {/* --- 2. AI COACH SECTION --- */}
        <StressCoach /> 

        {/* --- 3. NEW BREATHING TOOL --- */}
        <BreathingExercise /> {/* <-- 2. ADD IT HERE */}

        {/* --- 4. "Why It Matters" Section --- */}
        <div className="stress-card">
          <h2>The Stress-Heart Connection</h2>
          {/* ... all your static content ... */}
          <p>
            When you're stressed, your body releases hormones...
          </p>
          <ul className="stress-list">
            <li><FaChevronRight /> High blood pressure</li>
            {/* ... etc ... */}
          </ul>
        </div>

        {/* --- 5. Actionable Techniques Section --- */}
        <div className="stress-section">
          <h2>Simple Techniques for a Calmer You</h2>
          <div className="technique-grid">
            {/* ... all your technique cards ... */}
          </div>
        </div>

        {/* --- 6. CTA Section --- */}
        <div className="stress-cta-section">
          <h2>Ready to See Your Full Picture?</h2>
          {/* ... all your CTA content ... */}
        </div>
      </div>
    </div>
  );
}

export default StressPage;