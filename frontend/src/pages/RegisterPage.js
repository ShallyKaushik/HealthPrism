// frontend/src/pages/RegisterPage.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthForm.css'; // Import the shared CSS

function RegisterPage() {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Use 'loading' from context to disable the button
  const { register, error, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(fullname, email, password);
    // The context handles navigation on success
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        
        <div className="auth-header">
          <h1>Create Your Account</h1>
          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-form-group">
            <label htmlFor="fullname">Full Name</label>
            <input
              type="text"
              id="fullname"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="auth-form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8} // Enforce minimum 8 characters
              placeholder="Min. 8 characters"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

      </div>
    </div>
  );
}

export default RegisterPage;