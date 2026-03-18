// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PredictionProvider } from './context/PredictionContext'; 
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

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
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <PredictionProvider>
            <ScrollToTop /> {/* This fixes the scroll bug on page navigation */}
        <div className="App">
          
          <Navbar />
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/predict" element={<ProtectedRoute><PredictorPage /></ProtectedRoute>} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/chatbot" element={<ChatbotPage />} /> 
              <Route path="/nutrition" element={<ProtectedRoute><NutritionPage /></ProtectedRoute>} />
              <Route path="/stress" element={<ProtectedRoute><StressPage /></ProtectedRoute>} />
              
              {/* --- 2. ADD THE NEW ROUTE --- */}
              {/* This is the new page for your 2nd ML model */}
              <Route path="/stress-test" element={<ProtectedRoute><StressTestPage /></ProtectedRoute>} />
              
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              <Route path="/admin" element={
                <ProtectedRoute adminOnly={true}>
                  <AdminPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          
          <ChatbotIcon />
            <Footer />

          </div>
          </PredictionProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;