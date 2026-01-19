// frontend/src/pages/PredictorPage.js

// --- 1. THIS IS THE FIX ---
// We now import useState AND useEffect on the *same line*.
import React, { useState, useEffect } from 'react';
// --- END OF FIX ---

import axios from 'axios';
import './PredictorPage.css';
import ResultCard from '../components/ResultCard';
import { usePrediction } from '../context/PredictionContext';
import RiskFactors from '../components/RiskFactors'; // Your "Explainability" component

function PredictorPage() {
  
  // --- 2. THIS IS THE NEW "DYNAMIC TITLE" FEATURE ---
  useEffect(() => {
    document.title = 'Heart Risk Predictor - HealthPrism';
  }, []); // The empty array [] means it only runs on load
  // --- END OF NEW FEATURE ---

  // The form state is now the 8 optimized features
  const [formData, setFormData] = useState({
    // Numeric (5)
    age: '63', 
    trestbps: '145', 
    chol: '233',
    thalach: '150', 
    oldpeak: '2.3', 
    // Categorical (3)
    cp: '3', 
    ca: '0', 
    thal: '1'
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { addPrediction } = usePrediction(); // Use addPrediction for history

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    // Create the 8-feature payload
    const payload = {
      age: Number(formData.age),
      trestbps: Number(formData.trestbps),
      chol: Number(formData.chol),
      thalach: Number(formData.thalach),
      oldpeak: Number(formData.oldpeak),
      cp: Number(formData.cp),
      ca: Number(formData.ca),
      thal: Number(formData.thal)
    };
    
    // Check for any NaN values
    const invalidFields = Object.entries(payload).filter(([key, value]) => isNaN(value));
    if (invalidFields.length > 0) {
      const fieldNames = invalidFields.map(([k]) => k).join(', ');
      setError(`Invalid data format. Please check all fields. (${fieldNames})`);
      setIsLoading(false);
      return;
    }
    
    try {
      // Call the single, optimized /api/predict route
      // Use environment variable for API URL
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.post(
        `${API_URL}/api/predict`,
        payload
      );
      
      const riskScore = response.data.probability_high_risk;
      
      // Save to global "brain" (which saves to history)
      addPrediction({
        probability_high_risk: riskScore,
        inputs: payload 
      });
      
      setResult(response.data); // Save for local display

    } catch (err) {
      console.error("❌ Prediction error:", err);
      setError(err.response?.data?.error || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="predictor-container">
      <div className="predictor-card">
        <div className="predictor-header">
          <span className="header-icon">🩺</span>
          <h2>Heart Risk Predictor</h2>
          <p>Enter your 8 key health metrics, selected by our AI, to get an instant risk prediction.</p>
        </div>

        {/* --- The 8-Feature Form --- */}
        <form className="prediction-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            
            {/* --- Numeric Features (5) --- */}
            <label>Age
              <input type="number" name="age" value={formData.age} onChange={handleChange} required min="1" max="120"/>
            </label>
            <label>Resting BP (trestbps)
              <input type="number" name="trestbps" value={formData.trestbps} onChange={handleChange} required min="50" max="250"/>
            </label>
            <label>Cholesterol (chol)
              <input type="number" name="chol" value={formData.chol} onChange={handleChange} required min="100" max="600"/>
            </label>
            <label>Max Heart Rate (thalach)
              <input type="number" name="thalach" value={formData.thalach} onChange={handleChange} required min="60" max="220"/>
            </label>
            <label>Oldpeak
              <input type="number" step="0.1" name="oldpeak" value={formData.oldpeak} onChange={handleChange} required min="0" max="10"/>
            </label>
            
            {/* --- Categorical Features (3) --- */}
            <label>Chest Pain (cp)
              <select name="cp" value={formData.cp} onChange={handleChange} required>
                <option value="3">Type 3 (Asymptomatic)</option>
                <option value="0">Type 0 (Typical Angina)</option>
                <option value="1">Type 1 (Atypical Angina)</option>
                <option value="2">Type 2 (Non-anginal)</option>
              </select>
            </label>
            <label>Major Vessels (ca)
              <select name="ca" value={formData.ca} onChange={handleChange} required>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </label>
            <label>Thal
              <select name="thal" value={formData.thal} onChange={handleChange} required>
                <option value="2">2 (Normal)</option>
                <option value="1">1 (Fixed Defect)</option>
                <option value="3">3 (Reversible Defect)</option>
                <option value="0">0</option>
              </select>
            </label>
            
          </div>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Predict Risk (Optimized Model)'}
          </button>
        </form>
      </div>

      {/* --- This is the result area --- */}
      <div className="results-container">
        {error && <div className="error-message">{error}</div>}
        
        {/* This is your existing ResultCard */}
        {result && <ResultCard probability={result.probability_high_risk} />}
        
        {/* This is the "Glass Box" component */}
        {result && (
          <RiskFactors 
            formData={formData} 
            probability={result.probability_high_risk} 
          />
        )}

      </div>
    </div>
  );
}

export default PredictorPage;