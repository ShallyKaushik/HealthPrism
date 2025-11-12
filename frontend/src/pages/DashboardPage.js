// frontend/src/pages/DashboardPage.js

import React from 'react';
import { Link } from 'react-router-dom';
import './DashboardPage.css'; 

// --- 1. IMPORT WHAT YOU NEED ---
import { usePrediction } from '../context/PredictionContext'; // Your "global brain"
import ResultCard from '../components/ResultCard';          // Your beautiful result card
import { 
  FaStar, FaRegEdit, FaBrain, FaSeedling, 
  FaHeartbeat, FaAppleAlt, FaMoon, FaCommentDots, FaBell 
} from 'react-icons/fa';

// Your existing illustration import
const heroIllustration = "https://firebasestorage.googleapis.com/v0/b/handy-f131a.appspot.com/o/storyset%2FDoctor-amico.svg?alt=media&token=855e712c-238d-42de-8e6d-7c645d064c1c";

function DashboardPage() {
  
  // --- 2. GET THE LATEST PREDICTION FROM THE "BRAIN" ---
  const { latestPrediction } = usePrediction();

  return (
    <div className="homepage-container">
      
      {/* --- 3. NEW DYNAMIC WELCOME BANNER --- */}
      <section className="dynamic-welcome-section">
        {latestPrediction === null ? (
          // --- STATE 1: NO PREDICTION YET ---
          <div className="welcome-prompt-card">
            <h2>Welcome to HeartHealth!</h2>
            <p>You haven't taken a prediction yet. Get your free, anonymous heart risk score in just 2 minutes.</p>
            <Link to="/predict" className="hero-button-primary">
              Get Started Now
            </Link>
          </div>
        ) : (
          // --- STATE 2: PREDICTION EXISTS ---
          <div className="welcome-result-card">
            <div className="welcome-result-header">
              <h2>Welcome Back!</h2>
              <p>Here is your most recent prediction, stored securely on this device. You can use this score to generate a personalized nutrition plan.</p>
            </div>
            {/* We re-use the SAME result card from the predictor page! */}
            <ResultCard probability={latestPrediction} />
          </div>
        )}
      </section>
      
      {/* --- 4. HERO SECTION (Your existing content) --- */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-headline">
            Understand Your Heart Health. Instantly.
          </h1>
          <p className="hero-subheading">
            AI-powered insights for your heart, mind, and body. Personalized
            recommendations that adapt to your health data.
          </p>
          <div className="hero-actions">
            <Link to="/predict" className="hero-button-primary">
              Get Your Free Prediction
            </Link>
          </div>
        </div>
        <div className="hero-image-container">
          <img 
            src={heroIllustration} 
            alt="AI Health Assistant" 
            className="hero-image"
          />
        </div>
      </section>

      {/* --- 5. HOW IT WORKS SECTION (Your existing content) --- */}
      <section className="how-it-works-section">
        <h2 className="section-heading">How It Works</h2>
        <p className="section-subheading">Get your personalized plan in three simple steps.</p>
        <div className="how-it-works-steps">
          
          <div className="step-card">
            <div className="step-icon"><FaRegEdit /></div>
            <h3>1. Enter Your Details</h3>
            <p>Securely provide your key health metrics, lifestyle habits, and medical history.</p>
          </div>
          
          <div className="step-card">
            <div className="step-icon"><FaBrain /></div>
            <h3>2. AI Analyzes Your Data</h3>
            <p>Our advanced AI analyzes your data against millions of data points to find hidden patterns.</p>
          </div>
          
          <div className="step-card">
            <div className="step-icon"><FaSeedling /></div>
            <h3>3. Get Your Personalized Plan</h3>
            <p>Receive actionable insights for nutrition, stress, and wellness, tailored just for you.</p>
          </div>

        </div>
      </section>

      {/* --- 6. FEATURES SECTION (Your existing content) --- */}
      <section className="features-section">
        <h2 className="section-heading">A Complete Health Assistant</h2>
        <p className="section-subheading">One platform for all your proactive health needs.</p>
        <div className="features-grid">
          
          <div className="feature-card">
            <div className="feature-icon" style={{color: '#e74c3c'}}><FaHeartbeat /></div>
            <h3>Heart Risk Prediction</h3>
            <p>Understand your cardiovascular risk with our core AI model.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon" style={{color: 'var(--color-secondary)'}}><FaAppleAlt /></div>
            <h3>Smart Nutrition Plan</h3>
            <p>Get food recommendations based on your predictions and goals.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{color: 'var(--color-primary)'}}><FaMoon /></div>
            <h3>Stress & Sleep Management</h3>
            <p>Techniques and tracking to improve your mental well-being.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{color: 'var(--color-accent)'}}><FaCommentDots /></div>
            <h3>AI Health Chatbot</h3>
            <p>Ask questions and get instant, helpful answers 24/7.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{color: '#f39c12'}}><FaBell /></div>
            <h3>Emergency Alert System</h3>
            <p>Proximity-based alerts for high-risk users (coming soon).</p>
          </div>

        </div>
      </section>

      {/* --- 7. SOCIAL PROOF SECTION (Your existing content) --- */}
      <section className="social-proof-section">
        <div className="stat-card">
          <h3><FaStar style={{color: '#f1c40f'}} /> 4.9*</h3>
          <p>Average user rating from 2,000+ reviews</p>
        </div>
        <div className="stat-card">
          <h3>HHS Aligned</h3>
          <p>Our model is built on data aligned with public health standards</p>
        </div>
        <div className="stat-card">
          <h3>2M+</h3>
          <p>Predictions delivered to our users last year</p>
        </div>
      </section>
      
    </div>
  );
}

export default DashboardPage;