// frontend/src/pages/StressPage.js

import React, { useState, useEffect } from 'react';
import './StressPage.css';
import { FaBrain, FaBed, FaRunning, FaChevronRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import StressCoach from '../components/StressCoach';       // Your AI Coach
import BreathingExercise from '../components/BreathingExercise'; // Your Breathing Tool

function StressPage() {
  useEffect(() => {
    document.title = 'Heart Risk Predictor - HealthPrism';
  }, []);
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

        {/* --- 3. INTERACTIVE BREATHING TOOL --- */}
        <BreathingExercise />

        {/* --- 4. "Why It Matters" Section (COMPLETE CONTENT) --- */}
        <div className="stress-card">
          <h2>The Stress-Heart Connection</h2>
          <p>
            When you're stressed, your body releases hormones like adrenaline and cortisol.
            This can temporarily increase your heart rate and blood pressure.
            Over time, chronic (long-term) stress can contribute to:
          </p>
          {/* This list was missing */}
          <ul className="stress-list">
            <li><FaChevronRight /> High blood pressure</li>
            <li><FaChevronRight /> Artery-damaging inflammation</li>
            <li><FaChevronRight /> Unhealthy habits (like poor diet or lack of sleep)</li>
          </ul>
          <p>
            The good news is that simple, daily practices can make a huge difference.
          </p>
        </div>

        {/* --- 5. Actionable Techniques Section (COMPLETE CONTENT) --- */}
        <div className="stress-section">
          <h2>Simple Techniques for a Calmer You</h2>
          {/* This grid was missing */}
          <div className="technique-grid">
            
            <div className="technique-card">
              <div className="technique-icon" style={{ backgroundColor: '#f3e8ff', color: 'var(--color-accent)' }}>
                <FaBrain />
              </div>
              <h3>Mindful Breathing</h3>
              <p>
                Take 5 minutes. Inhale slowly for 4 seconds, hold for 4, and 
                exhale slowly for 6. This can calm your nervous system instantly.
              </p>
            </div>
            
            <div className="technique-card">
              <div className="technique-icon" style={{ backgroundColor: '#e0f3ff', color: 'var(--color-primary)' }}>
                <FaBed />
              </div>
              <h3>Prioritize Sleep</h3>
              <p>
                Aim for 7-9 hours of quality sleep. A lack of sleep raises 
                cortisol levels. Create a relaxing bedtime routine.
              </p>
            </div>

            <div className="technique-card">
              <div className="technique-icon" style={{ backgroundColor: '#e0fff0', color: 'var(--color-secondary)' }}>
                <FaRunning />
              </div>
              <h3>Active Movement</h3>
              <p>
                Physical activity is a powerful stress reducer. Even a 
                20-minute walk can clear your mind and lower blood pressure.
              </p>
            </div>

          </div>
        </div>

        {/* --- 6. CTA Section --- */}
        <div className="stress-cta-section">
          <h2>Ready to See Your Full Picture?</h2>
          <p>
            Your risk score is the first step. See how your vitals stack up, 
            then use these tips to start your health journey.
          </p>
          <Link to="/predict" className="stress-cta-button">
            Get Your Free Prediction
          </Link>
        </div>
      </div>
    </div>
  );
}

export default StressPage;