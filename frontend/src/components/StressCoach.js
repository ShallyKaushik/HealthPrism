// frontend/src/components/StressCoach.js

import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './StressCoach.css'; // We will create this
import { FaPaperPlane } from 'react-icons/fa';
import { usePrediction } from '../context/PredictionContext'; // Get the global brain

function StressCoach() {
  const [topic, setTopic] = useState('Work');
  const [plan, setPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { latestPrediction } = usePrediction(); // Get the user's risk score

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPlan('');
    setError(null);

    const payload = {
      topic: topic,
      riskScore: latestPrediction // Send the score to the AI
    };

    try {
      const response = await axios.post(
        'http://127.0.0.1:5000/api/stress-coach',
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
        <p>Feeling overwhelmed? Select your main stressor and get an instant, actionable plan.</p>
      </div>

      {/* --- The Form --- */}
      <form onSubmit={handleSubmit} className="coach-form">
        <label>
          What's your main source of stress right now?
          <select name="topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="Work">Work</option>
            <option value="Family">Family</option>
            <option value="Finances">Finances</option>
            <option value="Health Concerns">Health Concerns</option>
            <option value="General Anxiety">General Anxiety</option>
          </select>
        </label>
        
        <button type="submit" className="generate-button" disabled={isLoading}>
          {isLoading ? 'Generating...' : (
            <>
              <FaPaperPlane /> Get My 2-Minute Plan
            </>
          )}
        </button>
      </form>

      {/* --- The Result --- */}
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