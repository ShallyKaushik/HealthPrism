// frontend/src/pages/RegisterPage.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthForm.css'; // Import the shared CSS

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // Use 'loading' from context to disable the button
  const { register, error, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(username, password);
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
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
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
              minLength={6} // Good to enforce a minimum
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