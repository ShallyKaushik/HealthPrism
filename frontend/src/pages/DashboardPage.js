import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrediction } from '../context/PredictionContext';
import { 
  HeartPulse, 
  Brain, 
  Utensils, 
  Activity, 
  ArrowRight,
  TrendingDown,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const PIE_COLORS = ['#EF4444', '#F59E0B', '#10B981'];

function DashboardPage() {
  const { user } = useAuth();
  const { predictionHistory, latestPrediction, stressHistory, latestStress } = usePrediction();
  const [aiGenerating, setAiGenerating] = useState(true);

  useEffect(() => {
    document.title = 'Dashboard | HealthPrism';
    
    if (predictionHistory?.length > 0 || stressHistory?.length > 0) {
      const timer = setTimeout(() => setAiGenerating(false), 1500);
      return () => clearTimeout(timer);
    } else {
      setAiGenerating(false);
    }
  }, [predictionHistory, stressHistory]);

  const hasHeartData = predictionHistory && predictionHistory.length > 0;
  const hasStressData = stressHistory && stressHistory.length > 0;
  const hasAnyData = hasHeartData || hasStressData;

  const chartData = hasHeartData ? predictionHistory
    .map(item => ({
      name: new Date(item.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      Risk: parseFloat((item.probability * 100).toFixed(1)),
    }))
    .reverse() : [];

  // Heart Data 
  const riskValue = latestPrediction !== null ? (latestPrediction * 100).toFixed(1) : null;
  const isHighRisk = latestPrediction > 0.6;
  const riskColor = isHighRisk ? 'text-red-500' : latestPrediction > 0.3 ? 'text-yellow-500' : 'text-green-500';

  // Stress Data
  const getStressBadge = (level) => {
    if (level === 'High Stress') return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' };
    if (level === 'Moderate Stress') return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' };
    return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' };
  };

  return (
    <div className="flex flex-col gap-6 pb-12 w-full">
      
      {/* 1. Hero Section Fixes */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start p-6 lg:p-10 rounded-3xl bg-gradient-to-br from-blue-700 to-blue-500 text-white shadow-lg overflow-hidden relative w-full"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Welcome back, {user?.fullname?.split(' ')[0] || 'User'}!</h2>
            <p className="text-white max-w-xl text-base opacity-95 font-medium">
              Track your cardiovascular health, explore customized nutrition plans, and stay ahead of your stress levels—all in one place.
            </p>
          </div>
          <Link 
            to="/predict" 
            className="shrink-0 bg-white text-blue-700 hover:bg-blue-50 px-8 py-3.5 rounded-xl font-bold shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            Start Full Health Assessment <ArrowRight size={18} />
          </Link>
        </div>
      </motion.div>

      {/* 2 & 4. Dynamic Core Metrics Grid */}
      <AnimatePresence>
        {hasAnyData && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {hasHeartData && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 rounded-3xl shadow-sm border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-2xl">
                    <HeartPulse size={24} />
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium text-blue-500">
                    Latest <Activity size={14} />
                  </span>
                </div>
                <p className="text-[var(--color-text-light)] text-sm font-semibold mb-1 uppercase tracking-wider">Heart Risk Score</p>
                <div className="flex items-baseline gap-2">
                  <h3 className={`text-4xl font-bold ${riskColor}`}>{riskValue}%</h3>
                  <span className="text-sm font-medium text-[var(--color-text-light)]">probability</span>
                </div>
              </motion.div>
            )}

            {hasStressData && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 rounded-3xl shadow-sm border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-500 rounded-2xl">
                    <Brain size={24} />
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStressBadge(latestStress).bg} ${getStressBadge(latestStress).text}`}>
                    {latestStress.split(' ')[0]}
                  </span>
                </div>
                <p className="text-[var(--color-text-light)] text-sm font-semibold mb-1 uppercase tracking-wider">Stress Level</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold text-[var(--color-text)]">{latestStress}</h3>
                </div>
              </motion.div>
            )}

            {/* If there's partial data, we can fill the 3rd slot with a CTA to explore other tools or just let the grid naturally fill 2 columns */}
            {hasAnyData && (!hasHeartData || !hasStressData) && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 rounded-3xl shadow-sm border border-[var(--color-border)] border-dashed flex flex-col items-center justify-center text-center">
                <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">Incomplete Profile</h3>
                <p className="text-sm text-[var(--color-text-light)] mb-4">Complete both Heart and Stress assessments for a holistic view.</p>
                <Link to={!hasHeartData ? "/predict" : "/stress-test"} className="text-[var(--color-primary)] font-semibold hover:underline">
                  Take the {!hasHeartData ? "Heart Risk" : "Stress"} Assessment
                </Link>
              </motion.div>
            )}

            {/* If they have both, we show a Nutrition CTA card to keep symmetry */}
            {hasHeartData && hasStressData && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 rounded-3xl shadow-sm border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-colors flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-2xl">
                    <Utensils size={24} />
                  </div>
                </div>
                <p className="text-[var(--color-text-light)] text-sm font-semibold mb-2 uppercase tracking-wider">Nutrition Optimizer</p>
                <p className="text-[var(--color-text)] font-medium text-sm flex-1">
                  Ready to combat your risk factors with a personalized meal plan?
                </p>
                <Link to="/nutrition" className="text-[var(--color-primary)] font-bold text-sm flex items-center gap-1 hover:underline mt-2">
                  Generate Plan <ArrowRight size={14} />
                </Link>
              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* 3 & 7. Charts & AI Insights Section with Empty States */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Health Trends Column (Span 2) */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="glass-panel p-6 rounded-3xl shadow-sm border border-[var(--color-border)] h-full flex flex-col">
            <h3 className="text-xl font-bold text-[var(--color-text)] mb-6 flex items-center gap-2">
              <BarChart2 size={22} className="text-[var(--color-primary)]" /> Health Trends Over Time
            </h3>
            
            {hasHeartData && chartData.length > 0 ? (
              <div className="flex-1 min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-light)', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-light)', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-white)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Risk" 
                      stroke="var(--color-primary)" 
                      strokeWidth={3}
                      dot={{ r: 5, strokeWidth: 2, fill: 'var(--color-bg-white)' }}
                      activeDot={{ r: 7, stroke: 'var(--color-primary)', strokeWidth: 3, fill: '#fff' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 w-full flex flex-col items-center justify-center text-[var(--color-text-light)] py-12">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <Activity size={32} className="opacity-50" />
                </div>
                <p className="font-semibold text-[var(--color-text)] text-lg mb-1">No data yet.</p>
                <p className="text-sm">Start your first assessment to unlock trends.</p>
                <Link to="/predict" className="mt-6 px-6 py-2.5 bg-[var(--color-bg-white)] border border-[var(--color-border)] rounded-xl font-medium text-[var(--color-text)] hover:border-[var(--color-primary)] transition-all">
                  Take Assessment
                </Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* AI Insight Column */}
        <div className="flex flex-col gap-6 h-full">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-1 rounded-3xl h-full shadow-sm border border-[var(--color-border)]">
            <div className={`rounded-[22px] p-6 h-full flex flex-col ${hasAnyData ? 'bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/10' : 'bg-transparent'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={22} className={hasAnyData ? "text-purple-500" : "text-gray-400"} />
                <h3 className="font-bold text-xl text-[var(--color-text)]">AI Health Insight</h3>
              </div>
              
              {!hasAnyData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <p className="font-medium text-[var(--color-text-light)]">Insights will appear after analysis.</p>
                </div>
              ) : aiGenerating ? (
                <div className="space-y-4 animate-pulse pt-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 pt-4 mt-4"></div>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[15px] font-medium text-[var(--color-text)] leading-relaxed flex-1">
                  Based on your most recent data, your risk algorithm indicates <strong className={riskColor}>{isHighRisk ? 'elevated concern' : 'low concern'}</strong> due to:
                  <ul className="mt-4 space-y-3">
                    {hasHeartData && latestPrediction && (
                      <li className="flex items-start gap-3">
                        <div className={`mt-1.5 w-2 h-2 rounded-full ${isHighRisk ? 'bg-red-400' : 'bg-green-400'} shrink-0`}></div>
                        <span>Heart risk probability is at <strong>{riskValue}%</strong></span>
                      </li>
                    )}
                    {hasStressData && latestStress && (
                      <li className="flex items-start gap-3">
                        <div className={`mt-1.5 w-2 h-2 rounded-full ${getStressBadge(latestStress).dot} shrink-0`}></div>
                        <span>Reported stress levels are <strong>{latestStress.toLowerCase()}</strong></span>
                      </li>
                    )}
                    <li className="flex items-start gap-3">
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-400 shrink-0"></div>
                      <span>Review your personalized nutrition plan to target deficiencies.</span>
                    </li>
                  </ul>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

export default DashboardPage;