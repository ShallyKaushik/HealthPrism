// frontend/src/context/PredictionContext.js

import React, { createContext, useState, useContext } from 'react';

// 1. Create the context
const PredictionContext = createContext();

// 2. Create the "Provider" component
// This component will wrap your entire app and "provide" the global state
export function PredictionProvider({ children }) {
  const [latestPrediction, setLatestPrediction] = useState(null);

  // This is the function our PredictorPage will call
  const storePrediction = (riskScore) => {
    setLatestPrediction(riskScore);
  };

  const value = {
    latestPrediction,
    storePrediction,
  };

  return (
    <PredictionContext.Provider value={value}>
      {children}
    </PredictionContext.Provider>
  );
}

// 3. Create a custom "hook" to make it easy to use
// Any component can now call usePrediction() to get the data
export function usePrediction() {
  return useContext(PredictionContext);
}