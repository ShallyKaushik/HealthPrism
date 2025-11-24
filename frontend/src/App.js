// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PredictionProvider } from './context/PredictionContext'; 

// --- Import All Your Reusable Components ---
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatbotIcon from './components/ChatbotIcon';
import ScrollToTop from './components/ScrollToTop'; // Fixes page-load scroll bug

// --- Import All Your Pages ---
import DashboardPage from './pages/DashboardPage';   // Your homepage
import PredictorPage from './pages/PredictorPage';   // The 8-feature heart predictor
import AboutPage from './pages/AboutPage';        // The "About" page
import ChatbotPage from './pages/ChatbotPage';      // The "Chatbot" page
import NutritionPage from './pages/NutritionPage'; // The "Nutrition" page
import StressPage from './pages/StressPage';     // The "AI Stress Coach" page
import StressTestPage from './pages/StressTestPage'; // <-- 1. IMPORT YOUR NEW ML STRESS PAGE

function App() {
  return (
    <Router>
      <PredictionProvider>
        <ScrollToTop /> {/* This fixes the scroll bug on page navigation */}
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
              
              {/* --- 2. ADD THE NEW ROUTE --- */}
              {/* This is the new page for your 2nd ML model */}
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