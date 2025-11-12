// frontend/src/pages/NutritionPage.js

import React from 'react';
import './NutritionPage.css';
import { FaFish, FaLeaf, FaCarrot, FaChevronRight } from 'react-icons/fa';
import NutritionPlanner from '../components/NutritionPlanner'; // <-- 1. IMPORT IT

// (Your placeholder meal image variables are here...)
const mealImg1 = '...';
const mealImg2 = '...';
const mealImg3 = '...';

function NutritionPage() {
  return (
    <div className="nutrition-page-container">
      
      {/* --- 1. Header --- */}
      <div className="nutrition-header">
        <h1>Eat for Your Heart</h1>
        <p>
          Discover how smart food choices can directly impact your
          cardiovascular health and support your wellness goals.
        </p>
      </div>

      <div className="nutrition-content">
        
        {/* --- 2. NEW AI PLANNER SECTION --- */}
        <NutritionPlanner /> {/* <-- 2. ADD IT HERE */}

        {/* --- 3. Food Groups Section (Your old content) --- */}
        <div className="nutrition-section">
          <h2>Heart-Healthy Food Groups</h2>
          <div className="food-group-grid">
            {/* ...all your food group cards... */}
          </div>
        </div>

        {/* --- 4. Sample Meal Ideas (Your old content) --- */}
        <div className="nutrition-section">
          <h2>Sample Meal Ideas</h2>
          <div className="meal-ideas-grid">
            {/* ...all your meal cards... */}
          </div>
        </div>

        {/* --- 5. Quick Tips Section (Your old content) --- */}
        <div className="nutrition-section">
          <h2>Quick Tips for Success</h2>
          <ul className="quick-tips-list">
            {/* ...all your quick tips... */}
          </ul>
        </div>

      </div>
    </div>
  );
}

export default NutritionPage;