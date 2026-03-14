// frontend/src/pages/NutritionPage.js

import React, {useEffect} from 'react';
import './NutritionPage.css';
import NutritionPlanner from '../components/NutritionPlanner'; // <-- 1. IMPORT IT

function NutritionPage() {

  
    useEffect(() => {
      document.title = 'Nutrition :)';
    }, []);
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

       

      </div>
    </div>
  );
}

export default NutritionPage;