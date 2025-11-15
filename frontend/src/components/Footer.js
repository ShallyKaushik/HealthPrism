// frontend/src/components/Footer.js

import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css'; // This will load our new dark theme
import { FaLinkedin, FaInstagram, FaGithub } from 'react-icons/fa';

function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        
        {/* Column 1: Logo and Mission */}
        <div className="footer-column footer-logo-section">
          <Link to="/" className="footer-logo">
            🩺 HealthPrism
          </Link>
          <p className="footer-mission">
            Our mission is to make healthcare smarter, more accessible,
            and proactive for everyone.
          </p>
        </div>

        {/* Column 2: Quick Links (Optimized) */}
        <div className="footer-column">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><a href="/#features">Features</a></li>
            <li><Link to="/predict">Heart Predictor</Link></li>
            <li><Link to="/stress-test">Stress Predictor</Link></li>
            <li><Link to="/nutrition">AI Nutritionist</Link></li>
            <li><Link to="/about">About Us</Link></li>
          </ul>
        </div>

        {/* Column 3: Legal (Unchanged) */}
        <div className="footer-column">
          <h4>Legal</h4>
          <ul className="footer-links">
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Column 4: Social (Unchanged) */}
        <div className="footer-column">
          <h4>Follow Us</h4>
          <div className="footer-social-icons">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer"><FaGithub /></a>
          </div>
        </div>

      </div>
      <div className="footer-bottom-bar">
        <p>© {new Date().getFullYear()} HealthPrism. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;