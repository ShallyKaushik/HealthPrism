// frontend/src/components/Navbar.js

import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 1. IMPORT THE "AUTH BRAIN"
import './Navbar.css';

function Navbar() {
  // 2. GET THE TOKEN AND LOGOUT FUNCTION FROM THE CONTEXT
  const { token, logout } = useAuth();

  return (
    <header className="navbar-header">
      <nav className="navbar-container">
        {/* 1. Logo */}
        <div className="navbar-logo">
          <Link to="/">
            🩺 HeartHealth
          </Link>
        </div>
        
        {/* 2. Navigation Links (Unchanged) */}
        <ul className="navbar-links">
          <li>
            <NavLink to="/">Home</NavLink>
          </li>
          <li>
            <NavLink to="/features">Features</NavLink>
          </li>
          <li>
            <NavLink to="/nutrition">Nutrition</NavLink>
          </li>
          <li>
            <NavLink to="/stress">Stress Management</NavLink>
          </li>
          <li>
            <NavLink to="/about">About</NavLink>
          </li>
          <li>
            <NavLink to="/chatbot">Chatbot</NavLink>
          </li>
        </ul>

        {/* 3. DYNAMIC ACTION BUTTONS */}
        <div className="navbar-actions">
          {token ? (
            // --- IF USER IS LOGGED IN ---
            <button onClick={logout} className="navbar-button-secondary">
              Logout
            </button>
          ) : (
            // --- IF USER IS LOGGED OUT ---
            <>
              <Link to="/login" className="navbar-button-secondary">
                Login
              </Link>
              <Link to="/register" className="navbar-button-primary">
                Register
              </Link>
              {/* We can hide "Predict Now" until they log in, 
                  or link it to the /register page */}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;