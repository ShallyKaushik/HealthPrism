import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePrediction } from '../context/PredictionContext';
import { useAuth } from '../context/AuthContext';
import { 
  Utensils, Coffee, Sun, Moon, Sparkles, Activity, FileText, RefreshCw, Target, ShieldAlert, ChevronRight, Info, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Skeleton Component for Loading State
const SkeletonCard = () => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 animate-pulse">
    <div className="flex justify-between mb-6">
      <div className="w-12 h-12 bg-gray-100 rounded-2xl"></div>
      <div className="flex gap-2">
        <div className="w-16 h-4 bg-gray-50 rounded-md"></div>
        <div className="w-16 h-4 bg-gray-50 rounded-md"></div>
      </div>
    </div>
    <div className="h-4 bg-gray-100 rounded w-1/4 mb-4"></div>
    <div className="h-8 bg-gray-100 rounded w-3/4 mb-6"></div>
    <div className="space-y-3">
      <div className="h-3 bg-gray-50 rounded w-full"></div>
      <div className="h-3 bg-gray-50 rounded w-5/6"></div>
    </div>
    <div className="mt-8 pt-4 border-t border-gray-50 h-10 w-full bg-gray-50/50 rounded-xl"></div>
  </div>
);

function NutritionPlanner() {
  const { user } = useAuth();
  const { latestPrediction } = usePrediction();
  
  const [formData, setFormData] = useState({
    age: '30',
    goal: 'lower cholesterol',
    diet_type: 'vegetarian',
    cuisine: 'Indian',
    allergies: '',
    disliked_foods: '',
    calories: ''
  });
  
  const [mealPlan, setMealPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState(1);
  const [showAltFor, setShowAltFor] = useState(null); // {day, type}

  const riskLabel = latestPrediction > 0.6 ? 'High' : latestPrediction > 0.3 ? 'Moderate' : 'Low';
  const riskColor = riskLabel === 'High' ? 'bg-red-500' : riskLabel === 'Moderate' ? 'bg-yellow-500' : 'bg-emerald-500';

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        allergies: user.allergies || prev.allergies,
        disliked_foods: user.dislikes || prev.disliked_foods
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setMealPlan(null);
    setError(null);
    setActiveDay(1);
    setShowAltFor(null);

    const payload = {
      ...formData,
      risk_level: riskLabel,
      risk_score: latestPrediction,
      weight: 75
    };

    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const response = await axios.post(`${API_URL}/api/nutrition-plan`, payload);
      setMealPlan(response.data);
    } catch (err) {
      console.error("Error generating meal plan:", err);
      setError("AI engine is currently rebooting. Please try again in a few seconds.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderMealCard = (dayNum, type, data, Icon, accentColor, bgAccent) => {
    const hasAlt = data.alternatives && data.alternatives.length > 0;
    const isShowingAlt = showAltFor?.day === dayNum && showAltFor?.type === type;
    
    return (
      <motion.div 
        whileHover={{ y: -5, scale: 1.01 }}
        className="bg-white p-7 rounded-[2.5rem] shadow-md border border-gray-100 flex flex-col h-full transition-all relative overflow-hidden"
      >
        {/* Subtle Side Accent */}
        <div className={`absolute top-0 left-0 w-1.5 h-full ${bgAccent}`}></div>

        <div className="flex justify-between items-start mb-6">
          <div className={`w-14 h-14 rounded-2xl ${bgAccent} ${accentColor} flex items-center justify-center shadow-inner`}>
            <Icon size={28} />
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end mt-1">
            {data.tags?.map((tag, i) => (
              <span key={i} className="px-2.5 py-1 bg-gray-50 border border-gray-100 text-[9px] font-black uppercase tracking-wider rounded-lg text-gray-500">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{type}</span>
        <h4 className="text-2xl font-black text-gray-900 mb-4 leading-tight">{data.main}</h4>
        
        <div className="flex-1 mb-6">
          <div className="flex items-start gap-2.5 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 italic">
            <Info size={16} className={`${accentColor} mt-0.5 shrink-0`} />
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              {data.why}
            </p>
          </div>
        </div>

        <div className="pt-5 border-t border-gray-50">
          <button 
            onClick={() => setShowAltFor(isShowingAlt ? null : { day: dayNum, type })}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-black text-[10px] tracking-widest ${isShowingAlt ? accentColor + ' ' + bgAccent : 'bg-gray-50 text-gray-400 hover:bg-gray-100/80 hover:text-gray-600'}`}
          >
            <span>{isShowingAlt ? 'CLOSE OPTIONS' : 'VIEW ALTERNATIVES'}</span>
            <ChevronRight size={16} className={`transition-transform duration-300 ${isShowingAlt ? 'rotate-90' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isShowingAlt && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-2">
                  {hasAlt ? data.alternatives.map((alt, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/70 border border-transparent shadow-sm text-[11px] font-bold text-gray-700 hover:bg-white hover:border-gray-100 transition-all">
                      <div className={`w-1.5 h-1.5 rounded-full ${bgAccent}`} />
                      {alt}
                    </div>
                  )) : (
                    <div className="p-3 text-[11px] text-gray-400 font-medium italic text-center">
                      No alternatives available.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-10 p-4 pb-20">
      
      {/* Configuration Header */}
      <motion.div 
        id="nutrition-setup-form"
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 print:hidden relative overflow-hidden"
      >
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 -z-0"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-lg shadow-indigo-200">
              <Sparkles size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">AI Nutrition Planner</h2>
              <p className="text-sm text-gray-500 font-medium tracking-wide">Precision health engine tailored to your metabolism.</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => window.print()} className="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-black text-xs rounded-2xl transition-all flex items-center gap-2 border border-gray-100">
                <FileText size={16} /> PRINT
             </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <label className="flex flex-col gap-2.5">
              <span className="text-[11px] font-black uppercase text-indigo-600/80 tracking-widest ml-1">Health Goal</span>
              <select name="goal" value={formData.goal} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50/80 rounded-2xl text-gray-800 font-bold border border-transparent focus:bg-white focus:border-indigo-100 outline-none transition-all cursor-pointer">
                <option value="lower cholesterol">Lower Cholesterol</option>
                <option value="lose weight">Lose Weight</option>
                <option value="muscle gain">Muscle Gain</option>
                <option value="manage blood pressure">Blood Pressure</option>
              </select>
            </label>
            <label className="flex flex-col gap-2.5">
              <span className="text-[11px] font-black uppercase text-indigo-600/80 tracking-widest ml-1">Diet Type</span>
              <select name="diet_type" value={formData.diet_type} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50/80 rounded-2xl text-gray-800 font-bold border border-transparent focus:bg-white focus:border-indigo-100 outline-none transition-all cursor-pointer">
                <option value="vegetarian">Vegetarian (Pure)</option>
                <option value="vegan">Vegan</option>
                <option value="non-vegetarian">Non-Vegetarian</option>
              </select>
            </label>
            <label className="flex flex-col gap-2.5">
              <span className="text-[11px] font-black uppercase text-indigo-600/80 tracking-widest ml-1">Cuisine</span>
              <select name="cuisine" value={formData.cuisine} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50/80 rounded-2xl text-gray-800 font-bold border border-transparent focus:bg-white focus:border-indigo-100 outline-none transition-all cursor-pointer">
                <option value="Indian">Indian Cuisine</option>
                <option value="Western">Western / Modern</option>
                <option value="Mediterranean">Mediterranean</option>
                <option value="Asian">Asian Fusion</option>
              </select>
            </label>
            <label className="flex flex-col gap-2.5">
              <span className="text-[11px] font-black uppercase text-indigo-600/80 tracking-widest ml-1">Daily Calories</span>
              <input type="number" name="calories" value={formData.calories} onChange={handleChange} placeholder="e.g. 1800" className="w-full px-5 py-4 bg-gray-50/80 rounded-2xl text-gray-800 font-bold border border-transparent focus:bg-white focus:border-indigo-100 outline-none transition-all" />
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label className="flex flex-col gap-2.5">
                <span className="text-[11px] font-black uppercase text-red-500/80 tracking-widest ml-1">Personal Constraints</span>
                <input type="text" name="disliked_foods" value={formData.disliked_foods} onChange={handleChange} placeholder="Any food to avoid? (Mushrooms, Olives, etc.)" className="w-full px-6 py-4 bg-gray-50/80 rounded-2xl text-gray-800 font-bold border border-transparent focus:bg-white focus:border-indigo-100 outline-none transition-all" />
              </label>
            </div>
            <div className="flex items-end">
              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full py-4 flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? <><Activity className="animate-spin" size={20} /> Validating Schema...</> : <><RefreshCw size={20} /> GENERATE MEAL PLAN</>}
              </button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Error State */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-4 text-red-600 font-bold">
          <ShieldAlert size={24} />
          {error}
        </motion.div>
      )}

      {/* Plan Results */}
      <AnimatePresence mode="wait">
        {mealPlan && !isLoading && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="flex flex-col gap-10">
            
            {/* Hero Profile Card */}
            <div className="relative p-10 rounded-[3rem] bg-gradient-to-br from-indigo-600 to-purple-700 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10">
                <div className="flex flex-col gap-4">
                  <span className="text-white/70 font-black text-xs uppercase tracking-[0.3em]">Health Assessment</span>
                  <h3 className="text-4xl font-black text-white leading-tight">Personal Profile</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white font-black text-[10px] uppercase tracking-widest">{formData.diet_type}</span>
                    <span className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white font-black text-[10px] uppercase tracking-widest">{formData.cuisine}</span>
                    <span className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white font-black text-[10px] uppercase tracking-widest">{mealPlan.summary?.goal}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 md:min-w-[350px]">
                  <div className="flex flex-col gap-2">
                    <span className="text-white/60 font-black text-[10px] uppercase tracking-widest">Heart Risk</span>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${riskColor} shadow-[0_0_12px_rgba(255,255,255,0.4)]`}></div>
                      <span className="text-2xl font-black text-white uppercase">{riskLabel}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-white/60 font-black text-[10px] uppercase tracking-widest">Daily Focus</span>
                    <div className="flex flex-col gap-1">
                      {mealPlan.summary?.focus?.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Target size={12} className="text-indigo-200" />
                          <span className="text-xs font-bold text-white/90">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Day Selector & Sub-Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-6 print:hidden">
              <div className="flex bg-gray-100/80 p-1.5 rounded-[1.5rem] shadow-inner border border-gray-100">
                {mealPlan.days?.map(d => (
                  <button 
                    key={d.day} 
                    onClick={() => { setActiveDay(d.day); setShowAltFor(null); }}
                    className={`px-8 py-3 rounded-[1.2rem] text-xs font-black tracking-widest transition-all ${activeDay === d.day ? 'bg-white shadow-md text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    DAY {d.day}
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                 <button 
                   onClick={() => document.getElementById('nutrition-setup-form')?.scrollIntoView({ behavior: 'smooth' })}
                   className="flex items-center gap-2.5 px-6 py-3 text-xs font-black border border-gray-200 bg-white rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-gray-500"
                 >
                   <Edit3 size={16} /> Customize
                 </button>
                 <button onClick={() => handleSubmit()} className="flex items-center gap-2.5 px-6 py-3 text-xs font-black bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all uppercase tracking-widest">
                   <RefreshCw size={16} /> REGENERATE
                 </button>
              </div>
            </div>

            {/* Principles Bar */}
            <div className="flex flex-wrap gap-4 py-2 px-2">
              {mealPlan.principles?.map((p, i) => (
                <div key={i} className="px-5 py-3 rounded-full bg-indigo-50/50 border border-indigo-100/50 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">{p}</span>
                </div>
              ))}
            </div>

            {/* Meal Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
              {mealPlan.days?.find(d => d.day === activeDay)?.meals && (
                <>
                  {renderMealCard(activeDay, 'Breakfast', mealPlan.days.find(d => d.day === activeDay).meals.breakfast, Coffee, 'text-orange-600', 'bg-orange-50')}
                  {renderMealCard(activeDay, 'Lunch', mealPlan.days.find(d => d.day === activeDay).meals.lunch, Sun, 'text-amber-600', 'bg-amber-50')}
                  {renderMealCard(activeDay, 'Dinner', mealPlan.days.find(d => d.day === activeDay).meals.dinner, Moon, 'text-blue-600', 'bg-blue-50')}
                </>
              )}
            </div>

            {/* Fallback Warning */}
            {mealPlan.warnings && (
              <div className="p-6 bg-orange-50 border border-orange-100 rounded-[2rem] flex items-center gap-4 text-orange-700 font-bold -mt-10 mb-20 shadow-sm">
                <ShieldAlert size={24} className="shrink-0" />
                <p className="text-sm">Note: {mealPlan.warnings[0]}</p>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default NutritionPlanner;