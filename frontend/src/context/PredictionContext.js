import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const PredictionContext = createContext();

export function PredictionProvider({ children }) {
  const { token, user } = useAuth();
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [stressHistory, setStressHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_URL = 'http://127.0.0.1:5000/api';
  console.log("DEBUG: PredictionContext initialized with API_URL:", API_URL);

  // Fetch history when token changes (user logs in/out)
  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) {
        setPredictionHistory([]);
        setStressHistory([]);
        return;
      }

      setLoading(true);
      try {
        const [heartRes, stressRes] = await Promise.all([
          axios.get(`${API_URL}/predictions/heart`),
          axios.get(`${API_URL}/predictions/stress`)
        ]);
        setPredictionHistory(heartRes.data.history || []);
        setStressHistory(stressRes.data.history || []);
      } catch (error) {
        console.error("Failed to fetch prediction history", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token, API_URL]);

  const latestPrediction = predictionHistory.length > 0 ? predictionHistory[0].probability : null;
  const latestStress = stressHistory.length > 0 ? stressHistory[0].stress_level : null;

  const addPrediction = async (predictionData) => {
    if (!token) {
      console.log("DEBUG: addPrediction failed - no token");
      return;
    }
    console.log("DEBUG: addPrediction called with:", predictionData);
    try {
      const resp = await axios.post(`${API_URL}/predictions/heart`, {
        probability: predictionData.probability_high_risk,
        inputs: predictionData.inputs
      });
      console.log("DEBUG: addPrediction response:", resp.data);
      
      // Refresh history
      const res = await axios.get(`${API_URL}/predictions/heart`);
      setPredictionHistory(res.data.history || []);
    } catch (error) {
      console.error("DEBUG: Failed to save heart prediction", error);
    }
  };

  const addStressPrediction = async (stressData) => {
    if (!token) {
      console.log("DEBUG: addStressPrediction failed - no token");
      return;
    }
    console.log("DEBUG: addStressPrediction called with:", stressData);
    try {
      const resp = await axios.post(`${API_URL}/predictions/stress`, {
        stress_level: stressData.stress_level,
        inputs: stressData.inputs
      });
      console.log("DEBUG: addStressPrediction response:", resp.data);
      
      // Refresh history
      const res = await axios.get(`${API_URL}/predictions/stress`);
      setStressHistory(res.data.history || []);
    } catch (error) {
      console.error("DEBUG: Failed to save stress prediction", error);
    }
  };

  const value = {
    predictionHistory,
    stressHistory,
    latestPrediction,
    latestStress,
    addPrediction,
    addStressPrediction,
    loading
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