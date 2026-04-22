// frontend/src/pages/FeaturesPage.js

import React from 'react';
import './FeaturesPage.css'; // We'll create this CSS file next
import { 
  FaHeartbeat, FaAppleAlt, FaMoon, FaBell 
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

function FeaturesPage() {
  return (
    <div className="features-page-container">
      <div className="features-header">
        <h1>Our Features</h1>
        <p>A complete, proactive approach to your personal health.</p>
      </div>

      <div className="features-content-grid">

        {/* --- Feature 1: Heart Risk --- */}
        <div className="feature-item-card">
          <div className="feature-item-icon" style={{ color: '#e74c3c' }}>
            <FaHeartbeat />
          </div>
          <h2>Heart Risk Prediction</h2>
          <p>
            The core of our platform. Our AI model analyzes 13 key health 
            metrics—from cholesterol to ECG results—to provide a precise, 
            personalized risk score. It's proactive health, simplified.
          </p>
          <Link to="/predict" className="feature-item-button">
            Try the Predictor
          </Link>
        </div>

        {/* --- Feature 2: Nutrition --- */}
        <div className="feature-item-card">
          <div className="feature-item-icon" style={{ color: 'var(--color-secondary)' }}>
            <FaAppleAlt />
          </div>
          <h2>Smart Nutrition Plan</h2>
          <p>
            Your health risk isn't just a number, it's a starting point. 
            We provide smart, actionable nutrition plans that adapt to your 
            risk profile, helping you make sustainable, heart-healthy choices.
          </p>
          <Link to="/nutrition" className="feature-item-button disabled">
            ON TRIAL (CHECK IT OUT)
          </Link>
        </div>

        {/* --- Feature 3: Stress & Sleep --- */}
        <div className="feature-item-card">
          <div className="feature-item-icon" style={{ color: 'var(--color-primary)' }}>
            <FaMoon />
          </div>
          <h2>Stress & Sleep Management</h2>
          <p>
            Mental and physical health are deeply connected. Our platform 
            provides tools, techniques, and trackers to help you manage stress 
            and improve your sleep quality, both of which directly impact heart health.
          </p>
          <Link to="/stress" className="feature-item-button disabled">
            Coming Soon
          </Link>
        </div>

        {/* --- Feature 5: Emergency Alert --- */}
        <div className="feature-item-card">
          <div className="feature-item-icon" style={{ color: '#f39c12' }}>
            <FaBell />
          </div>
          <h2>Emergency Alert System</h2>
          <p>
            For high-risk users, peace of mind is critical. Our future Emergency
            Alert system will be designed to provide proximity-based alerts and 
            connect you with local health services when you need it most.
          </p>
          <Link to="#" className="feature-item-button disabled">
            Coming Soon
          </Link>
        </div>

      </div>
    </div>
  );
}

export default FeaturesPage;