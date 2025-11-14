import React from 'react';
import './AboutPage.css'; // We will create this CSS file
import { Link } from 'react-router-dom';
// import teamImg2 from '../assets/22.jpg';
// Placeholder images for the team. You can replace these.
const teamImg1 = 'https://media.licdn.com/dms/image/v2/D5603AQHeZfEHpJWjhQ/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1732206982236?e=2147483647&v=beta&t=7VjHl6c8Xbfk6vsJX9P1wzfb7TM6wWU0J9PPbb3BJJE    ';
const teamImg2 = 'https://media.licdn.com/dms/image/v2/D5603AQHnat6pB9zsow/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1718306574291?e=1764201600&v=beta&t=UQDfPMnatiTjJdQ0tc3MQw38wzJUVx7gB2_xYtMcCyY';
const teamImg3 = 'data:image/jpeg;base64,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';

function AboutPage() {
  return (
    <div className="about-page-container">
      
      {/* --- 1. Header --- */}
      <div className="about-header">
        <h1>Our Mission</h1>
        <p>
          We're leveraging advanced AI to make proactive healthcare smarter, 
          more accessible, and personalized for everyone.
        </p>
      </div>

      {/* --- 2. Our Story Section --- */}
      <div className="about-content">
        <div className="about-card">
          <h2>Our Story</h2>
          <p>
           HeartHealth: Your AI-Powered Wellness Partner
           HeartHealth started as a student research project driven by one 
           question — Can machine learning help predict heart disease risks earlier and 
           more accurately than traditional methods?What began as curiosity has now 
           evolved into a smart AI-powered health assistant. Our mission goes beyond 
           diagnosing illness — we aim to promote proactive wellness.
          </p>
          <p>
            Our team of passionate CSE students is dedicated to building
            intelligent tools that make healthcare more personal and predictive. 
            By transforming complex medical data into simple, actionable insights, 
            HeartHealth empowers users to take charge of their health — every day, w
            ith confidence.
          </p>
        </div>

        {/* --- 3. Meet the Team Section --- */}
        <div className="team-section">
          <h2>Meet the Team </h2>
          <div className="team-grid">
            
            <div className="team-member-card">
              <img src={teamImg1} alt="Team Member 1" />
              <h3>Aryan Gupta</h3>
              <p></p>
            </div>
            
            <div className="team-member-card">
              <img src={teamImg2} alt="Team Member 2" />
              <h3>Souryapriya Choudhary</h3>
              <p></p>
            </div>
            
            <div className="team-member-card">
              <img src={teamImg3} alt="Team Member 3" />
              <h3>Shelly Kaushik</h3>
              <p></p>
            </div>

          </div>
        </div>

        {/* --- 4. Call to Action (CTA) --- */}
        <div className="about-cta-section">
          <h2>Join Us on Our Mission</h2>
          <p>
            Take the first step towards proactive health. 
            Get your free, instant risk prediction today.
          </p> {/* <-- THIS IS THE FIX (was </D>) */}
          <Link to="/predict" className="about-cta-button">
            Predict Your Risk Now
          </Link>
        </div>
      </div>

    </div>
  );
}

export default AboutPage;