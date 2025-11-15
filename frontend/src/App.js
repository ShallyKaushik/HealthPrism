// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PredictionProvider } from './context/PredictionContext'; 

// --- Import All Your Reusable Components ---
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatbotIcon from './components/ChatbotIcon';
import ScrollToTop from './components/ScrollToTop'; // <-- 1. IMPORT THE FIX

// --- Import All Your Pages ---
import DashboardPage from './pages/DashboardPage';
import PredictorPage from './pages/PredictorPage';
// FeaturesPage is now part of DashboardPage
import AboutPage from './pages/AboutPage';
import ChatbotPage from './pages/ChatbotPage';
import NutritionPage from './pages/NutritionPage';
import StressPage from './pages/StressPage';         // The AI Coach page
import StressTestPage from './pages/StressTestPage';   // The ML Predictor page

function App() {
  return (
    <Router>
      <PredictionProvider>
        <ScrollToTop /> {/* <-- 2. ADD THE FIX HERE */}
        <div className="App">
          
          <Navbar />
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/predict" element={<PredictorPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/chatbot" element={<ChatbotPage />} /> 
              <Route path="/nutrition" element={<NutritionPage />} />
              <Route path="/stress" element={<StressPage />} />
              <Route path="/stress-test" element={<StressTestPage />} />
            </Routes>
          </main>
          
          <ChatbotIcon />
          <Footer />

        </div>
      </PredictionProvider>
    </Router>
  );
}

export default App;