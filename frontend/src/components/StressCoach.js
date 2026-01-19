// frontend/src/components/StressCoach.js

import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './StressCoach.css'; // We will update this
import { FaPaperPlane } from 'react-icons/fa';
import { usePrediction } from '../context/PredictionContext'; // Get the global brain

function StressCoach() {
  // --- 1. THIS IS THE NEW STATE ---
  // We now store the user's typed text, not a 'topic'
  const [userText, setUserText] = useState('');
  // --- END OF NEW STATE ---

  const [plan, setPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { latestPrediction } = usePrediction(); // Get the user's risk score

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPlan('');
    setError(null);

    // --- 2. THIS IS THE NEW PAYLOAD ---
    // It sends the raw text to be analyzed by VADER on the backend
    const payload = {
      user_text: userText, // Send the raw text
      riskScore: latestPrediction // Send the score to the AI
    };
    // --- END OF NEW PAYLOAD ---

    try {
      // Use environment variable for API URL
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.post(
        `${API_URL}/api/stress-coach`,
        payload
      );
      setPlan(response.data.stress_plan);
    } catch (err) {
      console.error("Error generating stress plan:", err);
      setError("Sorry, I couldn't generate a plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="stress-coach-card">
      <div className="coach-header">
        <h2>✨ Your AI Wellness Coach</h2>
        <p>Feeling overwhelmed? Tell me what's on your mind and get an instant, actionable plan.</p>
      </div>

      {/* --- 3. THIS IS THE NEW FORM --- */}
      <form onSubmit={handleSubmit} className="coach-form">
        <label>
          How are you feeling right now?
          {/* We replaced the <select> with a <textarea> */}
          <textarea
            name="user_text"
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            placeholder="e.g., 'I'm feeling overwhelmed by work deadlines and haven't been sleeping well...'"
            rows={4}
            required
          />
        </label>

        <button type="submit" className="generate-button" disabled={isLoading}>
          {isLoading ? 'Generating...' : (
            <>
              <FaPaperPlane /> Get My 2-Minute Plan
            </>
          )}
        </button>
      </form>
      {/* --- END OF NEW FORM --- */}

      {/* --- The Result (No change) --- */}
      {error && <div className="coach-error">{error}</div>}

      {plan && (
        <div className="coach-result">
          <h3>Here is your personalized stress plan:</h3>
          <div className="coach-plan-markdown">
            <ReactMarkdown>
              {plan}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default StressCoach;