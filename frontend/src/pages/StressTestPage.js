import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StressTestPage.css'; // We'll create this next
import { FaBrain } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// We'll create a simple result card for this page
function StressResultCard({ level }) {
  let style = 'stress-low';
  let message = 'Your stress level appears to be low. Keep up the good work!';
  if (level === 'Moderate Stress') {
    style = 'stress-moderate';
    message = 'Your stress level appears to be moderate. It\'s a good time to focus on some wellness activities.';
  } else if (level === 'High Stress') {
    style = 'stress-high';
    message = 'Your stress level appears to be high. Please consider talking to a professional and using our AI Stress Coach for tips.';
  }

  return (
    <div className={`stress-result-card ${style}`}>
      <h3>Prediction Result</h3>
      <div className="stress-level-display">{level}</div>
      <p className="stress-message">{message}</p>
    </div>
  );
}

function StressTestPage() {

  useEffect(() => {
    document.title = 'StressTest :)';
  }, []);

  const [formData, setFormData] = useState({
    Age: '30',
    Gender: 'Male',
    Occupation: 'Doctor',
    'Sleep Duration': '7',
    'Quality of Sleep': '8',
    'Physical Activity Level': '60',
    'BMI Category': 'Normal',
    'Blood Pressure': '120/80',
    'Heart Rate': '70',
    'Daily Steps': '8000',
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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

    try {
      // Use environment variable for API URL
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.post(
        `${API_URL}/api/predict-stress`,
        formData // Send the raw form data
      );
      setResult(response.data.stress_level);
    } catch (err) {
      console.error("❌ Prediction error:", err);
      setError(err.response?.data?.error || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="stress-test-container">
      <div className="stress-test-card">
        <div className="stress-test-header">
          <span className="header-icon"><FaBrain /></span>
          <h2>ML Stress Predictor</h2>
          <p>Enter your daily biometrics to get an instant stress level prediction.</p>
        </div>

        <form className="prediction-form" onSubmit={handleSubmit}>
          <div className="form-grid">

            {/* --- All 10 Features --- */}
            <label>Age
              <input type="number" name="Age" value={formData.Age} onChange={handleChange} required min="1" max="120" />
            </label>
            <label>Gender
              <select name="Gender" value={formData.Gender} onChange={handleChange} required>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>
            <label>Occupation
              <input type="text" name="Occupation" value={formData.Occupation} onChange={handleChange} required />
            </label>
            <label>Sleep Duration (hours)
              <input type="number" step="0.1" name="Sleep Duration" value={formData['Sleep Duration']} onChange={handleChange} required />
            </label>
            <label>Quality of Sleep (1-10)
              <input type="number" name="Quality of Sleep" value={formData['Quality of Sleep']} onChange={handleChange} required min="1" max="10" />
            </label>
            <label>Physical Activity (mins/day)
              <input type="number" name="Physical Activity Level" value={formData['Physical Activity Level']} onChange={handleChange} required />
            </label>
            <label>BMI Category
              <select name="BMI Category" value={formData['BMI Category']} onChange={handleChange} required>
                <option value="Normal">Normal</option>
                <option value="Normal Weight">Normal Weight</option>
                <option value="Overweight">Overweight</option>
                <option value="Obese">Obese</option>
              </select>
            </label>
            <label>Blood Pressure (e.g., 120/80)
              <input type="text" name="Blood Pressure" value={formData['Blood Pressure']} onChange={handleChange} required />
            </label>
            <label>Heart Rate (bpm)
              <input type="number" name="Heart Rate" value={formData['Heart Rate']} onChange={handleChange} required />
            </label>
            <label>Daily Steps
              <input type="number" name="Daily Steps" value={formData['Daily Steps']} onChange={handleChange} required />
            </label>

          </div>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Predict My Stress'}
          </button>
        </form>
      </div>

      {/* --- Result Area --- */}
      <div className="results-container">
        {error && <div className="error-message">{error}</div>}

        {result && (
          <>
            <StressResultCard level={result} />
            {/* This is the "advanced" part: a button to your AI coach */}
            <div className="coach-cta">
              <h3>Not sure what to do next?</h3>
              <p>Get a personalized plan from our AI Stress Coach.</p>
              <button
                className="coach-button"
                onClick={() => navigate('/stress')}
              >
                Go to AI Stress Coach
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StressTestPage;