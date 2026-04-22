import React, { useEffect } from 'react';
import NutritionPlanner from '../components/NutritionPlanner';
import { Utensils } from 'lucide-react';
import { motion } from 'framer-motion';

function NutritionPage() {
  useEffect(() => {
    document.title = 'Nutrition | HealthPrism';
  }, []);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-12">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col items-center justify-center text-center p-8 lg:p-12 glass-panel rounded-3xl shadow-sm border border-[var(--color-border)] mb-4"
      >
        <div className="p-4 bg-green-100 text-green-600 rounded-full mb-6">
          <Utensils size={36} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">Eat for Your Health</h1>
        <p className="text-[var(--color-text-light)] max-w-2xl text-lg">
          Discover how smart food choices can directly impact your cardiovascular health and support your wellness goals.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <NutritionPlanner />
      </motion.div>

    </div>
  );
}

export default NutritionPage;