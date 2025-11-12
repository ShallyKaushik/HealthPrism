// frontend/src/components/ResultCard.js

import React, { useState } from 'react';
import './ResultCard.css';
import { FaMapMarkerAlt } from 'react-icons/fa'; // <-- 1. IMPORT NEW ICON

// This function is the "brain" of the component
const getRiskDetails = (probability) => {
  const probPercent = probability * 100;

  if (probPercent > 90) {
    return {
      level: 'Critical Risk',
      message: 'Your results indicate a critical risk. Please consult a medical professional immediately.',
      style: 'risk-critical', // We use this to show the button
    };
  }
  if (probPercent > 70) {
    return {
      level: 'Very High Risk',
      message: 'Your results indicate a very high risk. We recommend scheduling a consultation with your doctor.',
      style: 'risk-very-high',
    };
  }
  if (probPercent > 50) {
    return {
      level: 'High Risk',
      message: 'Your results indicate a high risk. Please monitor your health and consider speaking with a doctor.',
      style: 'risk-high',
    };
  }
  if (probPercent > 30) {
    return {
      level: 'Borderline',
      message: 'Your risk is borderline. This is a good time to focus on positive lifestyle changes.',
      style: 'risk-borderline',
    };
  }
  // If none of the above, it's low risk
  return {
    level: 'Low Risk',
    message: 'Your results indicate a low risk. Keep up your healthy lifestyle!',
    style: 'risk-low',
  };
};

// This is the component itself
function ResultCard({ probability }) {
  // --- 2. ADD NEW STATE FOR GEOLOCATION ERRORS ---
  const [geoError, setGeoError] = useState(null);
  
  const riskDetails = getRiskDetails(probability);
  const probabilityPercent = (probability * 100).toFixed(2);

  // --- 3. ADD NEW FUNCTION TO FIND A DOCTOR ---
  const handleFindDoctor = () => {
    setGeoError(null); // Clear any old errors
    
    // Check if the browser supports Geolocation
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    // Ask the user for their location
    navigator.geolocation.getCurrentPosition(
      // Success callback:
      (position) => {
        const { latitude, longitude } = position.coords;
        // Create a Google Maps URL to search for "doctors near me"
        const googleMapsUrl = `https://www.google.com/maps/search/doctors+near+me/@${latitude},${longitude},15z`;
        
        // Open this URL in a new tab
        window.open(googleMapsUrl, '_blank');
      },
      // Error callback:
      (err) => {
        setGeoError("Unable to get your location. Please check your browser's permissions and try again.");
      }
    );
  };
  
  return (
    // We use the dynamic style here
    <div className={`result-card ${riskDetails.style}`}>
      <h3>Prediction Result</h3>
      <p className="probability">
        {probabilityPercent} %
      </p>
      <p>Probability of High Risk</p>
      
      <div className="risk-level-display">
        {riskDetails.level}
      </div>
      <p className="risk-message">{riskDetails.message}</p>

      {/* --- 4. NEW: EMERGENCY ALERT BUTTON --- */}
      {/* This block ONLY renders if the risk is 'risk-critical' */}
      {riskDetails.style === 'risk-critical' && (
        <div className="emergency-button-container">
          <button className="emergency-button" onClick={handleFindDoctor}>
            <FaMapMarkerAlt /> Find a Doctor Near You
          </button>
          {/* Show an error if geolocation fails */}
          {geoError && <p className="geo-error">{geoError}</p>}
        </div>
      )}
    </div>
  );
}

export default ResultCard;