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
          <Link to="/">
            🩺 HeartHealth
          </Link>
        </div>
        
        {/* 2. Navigation Links */}
        <ul className="navbar-links">
          <li>
            <NavLink to="/">Home</NavLink>
          </li>
          {/* --- THIS IS THE FIX --- */}
          {/* This is now an anchor link that scrolls to the #features ID */}
          <li>
            <a href="/#features">Features</a>
          </li>
          {/* --- END OF FIX --- */}
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