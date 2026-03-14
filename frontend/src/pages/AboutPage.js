import React, {useEffect} from 'react';
import './AboutPage.css'; // We will create this CSS file
import { Link } from 'react-router-dom';
// import teamImg2 from '../assets/22.jpg';
// Placeholder images for the team. You can replace these.
const teamImg2 = 'https://media.licdn.com/dms/image/v2/D4D03AQEs6MYhJgT46g/profile-displayphoto-scale_400_400/B4DZrGB_uRGgAg-/0/1764259004965?e=1775088000&v=beta&t=EcHJnmpo7lM1i7p8YW9P9d2JPNbARfwrVVXLfP2TQEQ';
const teamImg3 = 'https://media.licdn.com/dms/image/v2/D5603AQHnat6pB9zsow/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1718306574291?e=1775088000&v=beta&t=F13I6qh5rMAOWtJq3ancpU3rEFppCfj32I-0I3h61n4';
const teamImg1 = 'https://media.licdn.com/dms/image/v2/D5603AQHeZfEHpJWjhQ/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1732206982236?e=1775088000&v=beta&t=3cnhb8Yy52Apj4zdrFL3j7KeQKZ7B4pm2aq2__3UuDk';
function AboutPage() {


  useEffect(() => {
    document.title = 'About :)';
  }, []);

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
              <h3>Shelly Kaushik</h3>
              <p></p>
            </div>
            
            <div className="team-member-card">
              <img src={teamImg2} alt="Team Member 2" />
              <h3>Souryapriya Choudhary</h3>
              <p></p>
            </div>
            
            <div className="team-member-card">
              <img src={teamImg3} alt="Team Member 3" />
              <h3>Aryan Gupta</h3>
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
