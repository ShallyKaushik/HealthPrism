// frontend/src/context/PredictionContext.js

import React, { createContext, useState, useContext } from 'react';

const PredictionContext = createContext();

export function PredictionProvider({ children }) {
  // --- THIS IS THE UPGRADE ---
  // The state is no longer a single object, but an ARRAY.
  // We initialize it by reading the saved *list* from localStorage.
  const [predictionHistory, setPredictionHistory] = useState(() => {
    try {
      const savedHistory = localStorage.getItem('predictionHistory');
      return savedHistory ? JSON.parse(savedHistory) : []; // Default to an empty array
    } catch (error) {
      console.error("Failed to parse history from localStorage", error);
      return [];
    }
  });
  // --- END OF UPGRADE ---

  // We also still want to provide the *latest* prediction for convenience
  const latestPrediction = predictionHistory.length > 0 ? predictionHistory[0].probability : null;

  // This function now ADDS a prediction to the list
  const addPrediction = (predictionData) => {
    try {
      // Create a new prediction object with a timestamp
      const newPrediction = {
        probability: predictionData.probability_high_risk,
        inputs: predictionData.inputs, // We'll save the inputs too!
        timestamp: new Date().toISOString(),
      };

      // Add the new prediction to the *beginning* of the list
      const newHistory = [newPrediction, ...predictionHistory];
      
      // Save the new, longer list back to localStorage
      localStorage.setItem('predictionHistory', JSON.stringify(newHistory));
      setPredictionHistory(newHistory); // Update the global state

    } catch (error) {
      console.error("Failed to save prediction to localStorage", error);
    }
  };

  const value = {
    predictionHistory,  // The full list
    latestPrediction,   // The most recent score
    addPrediction,      // The new function to add a score
  };

  return (
    <PredictionContext.Provider value={value}>
      {children}
    </PredictionContext.Provider>
  );
}

export function usePrediction() {
  return useContext(PredictionContext);
}