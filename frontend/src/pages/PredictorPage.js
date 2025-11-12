// frontend/src/pages/PredictorPage.js

import React, { useState } from 'react';
import axios from 'axios';
import './PredictorPage.css';
import ResultCard from '../components/ResultCard';
import { useAuth } from '../context/AuthContext';
import { usePrediction } from '../context/PredictionContext';

function PredictorPage() {
  const [formData, setFormData] = useState({
    // Use strings for initial state to match form values
    age: '63', 
    sex: '1', 
    cp: '3', 
    trestbps: '145', 
    chol: '233',
    fbs: '1', 
    restecg: '0', 
    thalach: '150', 
    exang: '0',
    oldpeak: '2.3', 
    slope: '0', 
    ca: '0', 
    thal: '1'
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { token } = useAuth();
  const { storePrediction } = usePrediction();

  // --- THIS IS THE FIX ---
  // A much simpler handleChange function.
  // It just stores the raw value from the form.
  // No parsing, no complex logic.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value 
    }));
  };
  // --- END OF FIX ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    // Build headers
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Create payload, converting all values from state to numbers
    // This is the correct place to do the conversion.
    const payload = {
      age: Number(formData.age),
      sex: Number(formData.sex),
      cp: Number(formData.cp),
      trestbps: Number(formData.trestbps),
      chol: Number(formData.chol),
      fbs: Number(formData.fbs),
      restecg: Number(formData.restecg),
      thalach: Number(formData.thalach),
      exang: Number(formData.exang),
      oldpeak: Number(formData.oldpeak),
      slope: Number(formData.slope),
      ca: Number(formData.ca),
      thal: Number(formData.thal)
    };
    
    // Check for any NaN values, which can happen if a field is empty
    const invalidFields = Object.entries(payload).filter(([key, value]) => isNaN(value));
    if (invalidFields.length > 0) {
      const fieldNames = invalidFields.map(([k]) => k).join(', ');
      setError(`Invalid data format. Please check all fields are filled correctly. (${fieldNames})`);
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await axios.post(
        'http://127.0.0.1:5000/api/predict',
        payload,
        { headers }
      );
      
      const riskScore = response.data.probability_high_risk;
      storePrediction(riskScore);
      setResult(response.data);

    } catch (err) {
      console.error("❌ Prediction error:", err);
      if (err.response) {
        console.error("Response status:", err.response.status);
        console.error("Response data:", err.response.data);
      }
      
      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(err.response?.data?.error || "An unexpected error occurred.");
      }
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
          <p>Enter your health metrics to get an instant risk prediction.</p>
        </div>

        <form className="prediction-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            
            {/* --- Numeric Features --- */}
            <label>Age
              <input 
                type="number" 
                name="age" 
                value={formData.age} 
                onChange={handleChange} 
                required 
                min="1"
                max="120"
              />
            </label>
            <label>Resting BP (trestbps)
              <input 
                type="number" 
                name="trestbps" 
                value={formData.trestbps} 
                onChange={handleChange} 
                required 
                min="50"
                max="250"
              />
            </label>
            <label>Cholesterol (chol)
              <input 
                type="number" 
                name="chol" 
                value={formData.chol} 
                onChange={handleChange} 
                required 
                min="100"
                max="600"
              />
            </label>
            <label>Max Heart Rate (thalach)
              <input 
                type="number" 
                name="thalach" 
                value={formData.thalach} 
                onChange={handleChange} 
                required 
                min="60"
                max="220"
              />
            </label>
            <label>Oldpeak
              <input 
                type="number" 
                step="0.1" 
                name="oldpeak" 
                value={formData.oldpeak} 
                onChange={handleChange} 
                required 
                min="0"
                max="10"
              />
            </label>
            
            <div className="form-spacer"></div> 

            {/* --- Categorical Features (as dropdowns) --- */}
            <label>Sex
              <select name="sex" value={formData.sex} onChange={handleChange} required>
                <option value="1">Male</option>
                <option value="0">Female</option>
              </select>
            </label>
            <label>Chest Pain (cp)
              <select name="cp" value={formData.cp} onChange={handleChange} required>
                <option value="3">Type 3 (Asymptomatic)</option>
                <option value="0">Type 0 (Typical Angina)</option>
                <option value="1">Type 1 (Atypical Angina)</option>
                <option value="2">Type 2 (Non-anginal)</option>
              </select>
            </label>
            <label>Fasting BS &gt; 120 (fbs)
              <select name="fbs" value={formData.fbs} onChange={handleChange} required>
                <option value="0">False</option>
                <option value="1">True</option>
              </select>
            </label>
            <label>Resting ECG (restecg)
              <select name="restecg" value={formData.restecg} onChange={handleChange} required>
                <option value="0">Type 0</option>
                <option value="1">Type 1</option>
                <option value="2">Type 2</option>
              </select>
            </label>
            <label>Exercise Angina (exang)
              <select name="exang" value={formData.exang} onChange={handleChange} required>
                <option value="0">No</option>
                <option value="1">Yes</option>
              </select>
            </label>
            <label>Slope
              <select name="slope" value={formData.slope} onChange={handleChange} required>
                <option value="2">Type 2 (Downsloping)</option>
                <option value="1">Type 1 (Flat)</option>
                <option value="0">Type 0 (Upsloping)</option>
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
            {isLoading ? 'Analyzing...' : 'Predict Risk'}
          </button>
        </form>
      </div>

      <div className="results-container">
        {error && <div className="error-message">{error}</div>}
        {result && <ResultCard probability={result.probability_high_risk} />}
      </div>
    </div>
  );
}

export default PredictorPage;