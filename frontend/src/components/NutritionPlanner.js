// frontend/src/components/NutritionPlanner.js

import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown'; // Make sure you've run: npm install react-markdown
import './NutritionPlanner.css';
import { FaPaperPlane } from 'react-icons/fa';
import { usePrediction } from '../context/PredictionContext'; // <-- 1. IMPORT THE GLOBAL BRAIN

function NutritionPlanner() {
  const [formData, setFormData] = useState({
    age: '30',
    goal: 'lower cholesterol',
    restrictions: 'none',
  });
  const [mealPlan, setMealPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { latestPrediction } = usePrediction(); // <-- 2. GET THE LATEST RISK SCORE

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMealPlan('');
    setError(null);

    // --- 3. THIS IS THE NEW PAYLOAD ---
    // We now send the form data *AND* the latest risk score
    const payload = {
      ...formData,
      riskScore: latestPrediction // This will be the score (e.g., 0.02) or null
    };
    // --- END OF NEW PAYLOAD ---

    try {
      // Use environment variable for API URL
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.post(
        `${API_URL}/api/nutrition-planner`,
        payload // Send the new, combined payload
      );
      setMealPlan(response.data.meal_plan);

    } catch (err) {
      console.error("Error generating meal plan:", err);
      setError("Sorry, I couldn't generate a meal plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="nutrition-planner-card">
      <div className="planner-header">
        <h2>✨ Your AI Nutrition Planner</h2>
        <p>Enter your goals and let our AI create a custom sample meal plan for you.</p>
      </div>

      {/* --- 4. NEW: Show the user their score --- */}
      {latestPrediction !== null && (
        <div className="latest-risk-display">
          ✨ Your plan will be tailored for your latest risk score: <strong>{(latestPrediction * 100).toFixed(1)}%</strong>
        </div>
      )}

      {/* --- The Form --- */}
      <form onSubmit={handleSubmit} className="planner-form">
        <div className="form-grid">
          <label>
            Your Age:
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="e.g., 35"
              required
            />
          </label>
          <label>
            Primary Health Goal:
            <select name="goal" value={formData.goal} onChange={handleChange}>
              <option value="lower cholesterol">Lower Cholesterol</option>
              <option value="lose weight">Lose Weight</option>
              <option value="general heart health">General Heart Health</option>
              <option value="build muscle">Build Muscle</option>
            </select>
          </label>
          <label>
            Dietary Restrictions:
            <input
              type="text"
              name="restrictions"
              value={formData.restrictions}
              onChange={handleChange}
              placeholder="e.g., vegetarian, gluten-free"
              required
            />
          </label>
        </div>
        <button type="submit" className="generate-button" disabled={isLoading}>
          {isLoading ? 'Generating...' : (
            <>
              <FaPaperPlane /> Generate My Plan
            </>
          )}
        </button>
      </form>

      {/* --- The Result --- */}
      {error && <div className="planner-error">{error}</div>}

      {mealPlan && (
        <div className="planner-result">
          <h3>Here is your 3-Day Sample Plan:</h3>
          <div className="meal-plan-markdown">
            <ReactMarkdown>
              {mealPlan}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default NutritionPlanner;