// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PredictionProvider } from './context/PredictionContext'; 
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

import DashboardLayout from './components/DashboardLayout';
import ScrollToTop from './components/ScrollToTop'; // Fixes page-load scroll bug

// --- Import All Your Pages ---
import DashboardPage from './pages/DashboardPage';   // Your homepage
import PredictorPage from './pages/PredictorPage';   // The 8-feature heart predictor
import AboutPage from './pages/AboutPage';        // The "About" page
import NutritionPage from './pages/NutritionPage'; // The "Nutrition" page
import StressPage from './pages/StressPage';     // The "AI Stress Coach" page
import StressTestPage from './pages/StressTestPage'; // <-- 1. IMPORT YOUR NEW ML STRESS PAGE
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import Chatbot from './components/Chatbot';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <PredictionProvider>
            <ScrollToTop /> {/* This fixes the scroll bug on page navigation */}
        <div className="App bg-[var(--color-bg)] min-h-screen text-[var(--color-text)]">
          <Routes>
            {/* Protected Routes encapsulated in DashboardLayout */}
            <Route path="/" element={<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/predict" element={<ProtectedRoute><DashboardLayout><PredictorPage /></DashboardLayout></ProtectedRoute>} />
            
            <Route path="/nutrition" element={<ProtectedRoute><DashboardLayout><NutritionPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/stress" element={<ProtectedRoute><DashboardLayout><StressPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/stress-test" element={<ProtectedRoute><DashboardLayout><StressTestPage /></DashboardLayout></ProtectedRoute>} />
            
            <Route path="/admin" element={<ProtectedRoute adminOnly={true}><DashboardLayout><AdminPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><DashboardLayout><ProfilePage /></DashboardLayout></ProtectedRoute>} />

            {/* Public Routes with no Dashboard Layout */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </div>
            <Chatbot />
          </PredictionProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;