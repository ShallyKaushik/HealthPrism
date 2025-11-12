// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // 1. IMPORT THE AUTHPROVIDER
import { PredictionProvider } from './context/PredictionContext';

// Import Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatbotIcon from './components/ChatbotIcon';

// Import Pages
import DashboardPage from './pages/DashboardPage';
import PredictorPage from './pages/PredictorPage';
import FeaturesPage from './pages/FeaturesPage';
import AboutPage from './pages/AboutPage';
import ChatbotPage from './pages/ChatbotPage';
import NutritionPage from './pages/NutritionPage';
import StressPage from './pages/StressPage';
import LoginPage from './pages/LoginPage';     // 2. IMPORT THE NEW PAGES
import RegisterPage from './pages/RegisterPage'; // 2. IMPORT THE NEW PAGES

function App() {
  return (
    <Router>
      {/* 3. WRAP EVERYTHING IN AUTHPROVIDER */}
      <AuthProvider>
        <PredictionProvider>
          <div className="App">
            <Navbar />
            
            <main className="main-content">
              <Routes>
                {/* Your existing routes */}
                <Route path="/" element={<DashboardPage />} />
                <Route path="/predict" element={<PredictorPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/chatbot" element={<ChatbotPage />} /> 
                <Route path="/nutrition" element={<NutritionPage />} />
                <Route path="/stress" element={<StressPage />} />

                {/* 4. ADD THE NEW AUTH ROUTES */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Routes>
            </main>
            
            <ChatbotIcon />
            <Footer />
          </div>
        </PredictionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;