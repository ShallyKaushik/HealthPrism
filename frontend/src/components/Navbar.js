// frontend/src/components/Navbar.js

import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <header className="navbar-header">
      <nav className="navbar-container">
        {/* 1. Logo */}
        <div className="navbar-logo">
          {/* --- THIS IS THE CHANGE --- */}
          <Link to="/">
            🩺 HealthPrism
          </Link>
          {/* --- END OF CHANGE --- */}
        </div>
        
        {/* 2. Navigation Links */}
        <ul className="navbar-links">
          <li>
            <NavLink to="/">Home</NavLink>
          </li>
          <li>
            <a href="/#features">Features</a>
          </li>
          <li>
            <NavLink to="/nutrition">Nutrition</NavLink>
          </li>
          <li>
            <NavLink to="/stress-test">Stress Predictor</NavLink>
          </li>
          <li>
            <NavLink to="/about">About</NavLink>
          </li>
          <li>
            <NavLink to="/chatbot">Chatbot</NavLink>
          </li>
        </ul>

        {/* 3. Action Buttons */}
        <div className="navbar-actions">
          <Link to="/predict" className="navbar-button-primary">
            Predict Now
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;