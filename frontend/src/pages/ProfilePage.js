import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrediction } from '../context/PredictionContext';
import './ProfilePage.css';
import { FaUserCircle, FaHeartbeat, FaBrain } from 'react-icons/fa';

function ProfilePage() {
  const { user } = useAuth();
  const { predictionHistory, stressHistory, loading } = usePrediction();

  if (loading) {
    return <div className="profile-loading">Loading history...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-initial-large">
            {user?.fullname ? user.fullname.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-info">
            <h1>{user?.fullname}</h1>
            <p>{user?.email}</p>
          </div>
        </div>

        <div className="history-sections">
          {/* Heart Prediction History */}
          <section className="history-section">
            <div className="section-title">
              <FaHeartbeat className="icon-heart" />
              <h2>Heart Risk History</h2>
            </div>
            {predictionHistory.length > 0 ? (
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Risk Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictionHistory.map((item, index) => (
                      <tr key={index}>
                        <td>{new Date(item.timestamp).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</td>
                        <td className="risk-value">{(item.probability * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No heart predictions found.</p>
            )}
          </section>

          {/* Stress Prediction History */}
          <section className="history-section">
            <div className="section-title">
              <FaBrain className="icon-stress" />
              <h2>Stress Level History</h2>
            </div>
            {stressHistory.length > 0 ? (
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Stress Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stressHistory.map((item, index) => (
                      <tr key={index}>
                        <td>{new Date(item.timestamp).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</td>
                        <td className={`stress-value ${item.stress_level.toLowerCase().replace(' ', '-')}`}>
                          {item.stress_level}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No stress tests found.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
