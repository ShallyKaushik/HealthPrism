// frontend/src/components/Navbar.js

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { token, user, logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        
        {/* 1. Logo & Brand */}
        <Link to="/" className="navbar-logo">
          🩺 HealthPrism
        </Link>

        {/* 2. Navigation Links */}
        <ul className="navbar-links">
          <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link></li>
          <li><Link to="/nutrition" className={location.pathname === '/nutrition' ? 'active' : ''}>Nutrition</Link></li>
          <li><Link to="/stress-test" className={location.pathname === '/stress-test' ? 'active' : ''}>Stress Predictor</Link></li>
          <li><Link to="/chatbot" className={location.pathname === '/chatbot' ? 'active' : ''}>Chatbot</Link></li>
          {user?.is_admin && (
            <li><Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''} style={{color: 'var(--color-accent)', fontWeight: 'bold'}}>Admin</Link></li>
          )}
        </ul>

        {/* 3. Action Buttons */}
        <div className="navbar-actions">
          {token ? (
            <>
              <Link to="/profile" className="navbar-avatar-link" title="View Profile">
                <div className="navbar-avatar-initial">
                  {user?.fullname ? user.fullname.charAt(0).toUpperCase() : 'U'}
                </div>
              </Link>
              <button onClick={logout} className="navbar-button-secondary">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="navbar-button-secondary">
              Login
            </Link>
          )}
          <Link to="/predict" className="navbar-button-primary">
            Predict Now
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;