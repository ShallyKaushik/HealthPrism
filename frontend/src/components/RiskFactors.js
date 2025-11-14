// frontend/src/components/RiskFactors.js

import React from 'react';
import './RiskFactors.css'; // We'll create this next
// Import some icons for our list
import { FaArrowUp, FaArrowDown, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

// --- THIS IS THE "RULES ENGINE" ---
// It analyzes the form data and the final probability
function analyzeRiskFactors(formData, probability) {
  const factors = [];
  
  // Convert all form data to numbers for easy comparison
  const data = {
    age: Number(formData.age),
    trestbps: Number(formData.trestbps),
    chol: Number(formData.chol),
    thalach: Number(formData.thalach),
    oldpeak: Number(formData.oldpeak),
    cp: Number(formData.cp),
    ca: Number(formData.ca),
    thal: Number(formData.thal),
  };

  // --- POSITIVE FACTORS (Things you're doing well) ---
  if (probability < 0.3) {
    factors.push({
      text: 'Your key indicators (like Chest Pain Type, Thal, and CA) are all in a healthy range.',
      severity: 'good'
    });
    if (data.thalach > 160) {
      factors.push({
        text: `Your Max Heart Rate (${data.thalach}) is excellent, indicating good cardiac fitness.`,
        severity: 'good'
      });
    }
  }

  // --- HIGH-RISK FACTORS (The "Why") ---
  // We'll show these if the risk is at least Borderline
  if (probability >= 0.3) {
    if (data.cp === 0) {
      factors.push({
        text: 'Chest Pain Type 0 (Typical Angina) is the strongest predictor of high risk.',
        severity: 'high'
      });
    }
    if (data.thal === 3) {
      factors.push({
        text: 'A Thal test result of 3 (Reversible Defect) is a critical risk indicator.',
        severity: 'high'
      });
    }
    if (data.ca > 1) {
      factors.push({
        text: `Having ${data.ca} major vessels blocked (CA) is a significant risk factor.`,
        severity: 'high'
      });
    }
    if (data.oldpeak > 2.0) {
      factors.push({
        text: `An Oldpeak of ${data.oldpeak} is high, which often indicates significant heart stress.`,
        severity: 'high'
      });
    }
    
    // --- MEDIUM-RISK FACTORS ---
    if (data.thalach < 130) {
      factors.push({
        text: `A low Max Heart Rate (${data.thalach}) during a stress test can be a sign of poor cardiac fitness.`,
        severity: 'medium'
      });
    }
    if (data.age > 55) {
      factors.push({
        text: `Age (${data.age}) is a contributing risk factor.`,
        severity: 'low'
      });
    }
    if (data.trestbps > 140) {
      factors.push({
        text: `Your Resting BP (${data.trestbps}) is elevated.`,
        severity: 'low'
      });
    }
    if (data.chol > 240) {
      factors.push({
        text: `Your Cholesterol level (${data.chol}) is high.`,
        severity: 'low'
      });
    }
  }

  return factors;
}


// --- The Component Itself ---
function RiskFactors({ formData, probability }) {
  const factors = analyzeRiskFactors(formData, probability);

  // If there are no factors to show, don't render anything
  if (factors.length === 0) {
    return null;
  }

  const isHighRisk = probability >= 0.3;

  return (
    <div className="risk-factors-card">
      <h3>{isHighRisk ? 'Your Primary Risk Factors' : 'Your Positive Factors'}</h3>
      <ul className="risk-factors-list">
        {factors.map((factor, index) => (
          <li key={index} className={`factor-${factor.severity}`}>
            {/* Show a different icon based on severity */}
            {factor.severity === 'good' ? <FaCheckCircle /> : <FaExclamationTriangle />}
            <span>{factor.text}</span>
          </li>
        ))}
      </ul>
      {isHighRisk && (
        <p className="disclaimer">
          This is not medical advice. These are the factors your score is based on.
          Please consult a doctor to understand your results.
        </p>
      )}
    </div>
  );
}

export default RiskFactors;