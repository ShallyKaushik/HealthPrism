import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePrediction } from '../context/PredictionContext';
import TherapyHub from '../components/TherapyHub';
import RPPGHeartRate from '../components/RPPGHeartRate';
import { Brain, Camera, Leaf, Activity, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function StressResultCard({ level }) {
  let styleClasses = 'bg-green-50 border-green-200 text-green-700';
  let message = 'Your stress level appears to be low. Keep up the good work!';
  
  if (level === 'Moderate Stress') {
    styleClasses = 'bg-yellow-50 border-yellow-200 text-yellow-700';
    message = 'Your stress level appears to be moderate. It\'s a good time to focus on some wellness activities.';
  } else if (level === 'High Stress') {
    styleClasses = 'bg-red-50 border-red-200 text-red-700';
    message = 'Your stress level appears to be high. Please consider talking to a professional and using our AI Stress Coach for tips.';
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`p-6 rounded-2xl border ${styleClasses} mt-6 shadow-sm`}>
      <h3 className="font-semibold text-sm uppercase tracking-wider opacity-80 mb-2">Prediction Result</h3>
      <div className="text-3xl font-bold mb-3">{level}</div>
      <p className="text-sm font-medium opacity-90">{message}</p>
    </motion.div>
  );
}

function StressTestPage() {
  useEffect(() => {
    document.title = 'Stress Test | HealthPrism';
  }, []);

  const [formData, setFormData] = useState({
    Age: '30',
    Gender: 'Male',
    Occupation: 'Doctor',
    'Sleep Duration': '7',
    'Quality of Sleep': '8',
    'Physical Activity Level': '60',
    'BMI Category': 'Normal',
    'Blood Pressure': '120/80',
    'Heart Rate': '70',
    'Daily Steps': '8000',
  });
  
  const [journalText, setJournalText] = useState("");
  const [result, setResult] = useState(null);
  const [sentimentScore, setSentimentScore] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTherapy, setShowTherapy] = useState(false);
  const [showRppgModal, setShowRppgModal] = useState(false);

  const { addStressPrediction } = usePrediction();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const payload = { ...formData, journal_text: journalText };
      
      const response = await axios.post(`${API_URL}/api/predict-stress`, payload);
      
      const stressLevel = response.data.stress_level;
      setResult(stressLevel);
      setSentimentScore(response.data.sentiment_score);
      setShowTherapy(false);
      
      await addStressPrediction({ stress_level: stressLevel, inputs: formData });
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err.response?.data?.error || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 sm:p-10 rounded-3xl shadow-sm border border-[var(--color-border)]">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl">
            <Brain size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text)]">Stress Level Predictor</h2>
            <p className="text-[var(--color-text-light)]">Analyze your daily biometrics and journal entry to predict stress.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-[var(--color-text)]">How was your day? (Briefly describe your feelings):</label>
            <textarea 
              className="w-full p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-purple-400 outline-none transition-all resize-y min-h-[100px]"
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="I felt really overwhelmed with deadlines today..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
              Age
              <input type="number" name="Age" value={formData.Age} onChange={handleChange} required min="1" max="120" className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-purple-400 outline-none transition-all" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
              Gender
              <select name="Gender" value={formData.Gender} onChange={handleChange} required className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-purple-400 outline-none transition-all">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
              Occupation
              <input type="text" name="Occupation" value={formData.Occupation} onChange={handleChange} required className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-purple-400 outline-none transition-all" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
              Sleep Duration (hrs)
              <input type="number" step="0.1" name="Sleep Duration" value={formData['Sleep Duration']} onChange={handleChange} required className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-purple-400 outline-none transition-all" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
              Quality of Sleep (1-10)
              <input type="number" name="Quality of Sleep" value={formData['Quality of Sleep']} onChange={handleChange} required min="1" max="10" className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-purple-400 outline-none transition-all" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
              Physical Activity (min)
              <input type="number" name="Physical Activity Level" value={formData['Physical Activity Level']} onChange={handleChange} required className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-purple-400 outline-none transition-all" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
              BMI Category
              <select name="BMI Category" value={formData['BMI Category']} onChange={handleChange} required className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-purple-400 outline-none transition-all">
                <option value="Normal">Normal</option>
                <option value="Normal Weight">Normal Weight</option>
                <option value="Overweight">Overweight</option>
                <option value="Obese">Obese</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
              Blood Pressure
              <input type="text" name="Blood Pressure" value={formData['Blood Pressure']} onChange={handleChange} required placeholder="120/80" className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-purple-400 outline-none transition-all" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
              Heart Rate (bpm)
              <div className="relative flex items-center">
                <input type="number" name="Heart Rate" value={formData['Heart Rate']} onChange={handleChange} required className="w-full px-4 py-2.5 pr-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-purple-400 outline-none transition-all" />
                <button type="button" onClick={() => setShowRppgModal(true)} className="absolute right-2 p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors">
                  <Camera size={18} />
                </button>
              </div>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
              Daily Steps
              <input type="number" name="Daily Steps" value={formData['Daily Steps']} onChange={handleChange} required className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-purple-400 outline-none transition-all" />
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {isLoading ? (
              <span className="flex items-center gap-2"><Activity className="animate-spin" size={18} /> Analyzing...</span>
            ) : (
              <>Predict My Stress <ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </motion.div>

      {/* Results Area */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
            {error}
          </motion.div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
            <StressResultCard level={result} />
            
            {sentimentScore !== null && (
              <div className="text-center text-sm text-[var(--color-text-light)]">
                NLP Sentiment Score: <strong className="text-[var(--color-text)]">{sentimentScore.toFixed(2)}</strong>
              </div>
            )}
            
            {!showTherapy ? (
              <div className="glass-panel p-8 rounded-3xl border border-[var(--color-border)] text-center shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <h3 className="text-xl font-bold mb-2 text-[var(--color-text)]">Need immediate relief?</h3>
                <p className="text-[var(--color-text-light)] mb-6">Try our Generative Biofeedback & Cultural Therapy session.</p>
                <button
                  className="mx-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-md transition-all active:scale-95"
                  onClick={() => setShowTherapy(true)}
                >
                  <Leaf size={18} /> Start Therapy Session
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <TherapyHub 
                  initialStressLevel={result} 
                  sentimentScore={sentimentScore} 
                  onExit={() => setShowTherapy(false)} 
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showRppgModal && (
        <RPPGHeartRate 
          onApply={(val) => {
            setFormData(prev => ({ ...prev, 'Heart Rate': String(val) }));
            setShowRppgModal(false);
          }}
          onClose={() => setShowRppgModal(false)}
        />
      )}
    </div>
  );
}

export default StressTestPage;