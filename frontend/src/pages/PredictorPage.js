import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePrediction } from '../context/PredictionContext';
import ResultCard from '../components/ResultCard';
import RiskFactors from '../components/RiskFactors';
import RPPGHeartRate from '../components/RPPGHeartRate';
import { HeartPulse, Camera, ChevronRight, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function PredictorPage() {
  useEffect(() => {
    document.title = 'Heart Risk Predictor | HealthPrism';
  }, []);

  const [formData, setFormData] = useState({
    age: '63', 
    trestbps: '145', 
    chol: '233',
    thalach: '150', 
    oldpeak: '2.3', 
    cp: '3', 
    ca: '0', 
    thal: '1'
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRppgModal, setShowRppgModal] = useState(false);

  const { addPrediction } = usePrediction();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    const payload = {
      age: Number(formData.age),
      trestbps: Number(formData.trestbps),
      chol: Number(formData.chol),
      thalach: Number(formData.thalach),
      oldpeak: Number(formData.oldpeak),
      cp: Number(formData.cp),
      ca: Number(formData.ca),
      thal: Number(formData.thal)
    };
    
    const invalidFields = Object.entries(payload).filter(([key, value]) => isNaN(value));
    if (invalidFields.length > 0) {
      setError(`Invalid data format. Please check all fields. (${invalidFields.map(([k]) => k).join(', ')})`);
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/predict', payload);
      const riskScore = response.data.probability_high_risk;
      
      await addPrediction({ probability_high_risk: riskScore, inputs: payload });
      setResult(response.data);
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err.response?.data?.error || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-12">
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Left Column: Form */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} 
          className="w-full md:w-1/2 glass-panel p-6 sm:p-8 rounded-3xl shadow-sm border border-[var(--color-border)]"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 text-[var(--color-primary)] rounded-2xl">
              <HeartPulse size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">Heart Risk Assessment</h2>
              <p className="text-sm text-[var(--color-text-light)]">Enter 8 key metrics to predict risk</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
                Age
                <input type="number" name="age" value={formData.age} onChange={handleChange} required min="1" max="120" className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all" />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
                Resting BP (mmHg)
                <input type="number" name="trestbps" value={formData.trestbps} onChange={handleChange} required min="50" max="250" className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all" />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
                Cholesterol (mg/dl)
                <input type="number" name="chol" value={formData.chol} onChange={handleChange} required min="100" max="600" className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all" />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
                Max Heart Rate
                <div className="relative flex items-center">
                  <input type="number" name="thalach" value={formData.thalach} onChange={handleChange} required min="60" max="220" className="w-full px-4 py-2.5 pr-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all" />
                  <button type="button" onClick={() => setShowRppgModal(true)} className="absolute right-2 p-1.5 text-[var(--color-primary)] hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Measure using camera">
                    <Camera size={18} />
                  </button>
                </div>
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
                ST Depression
                <input type="number" step="0.1" name="oldpeak" value={formData.oldpeak} onChange={handleChange} required min="0" max="10" className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all" />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
                Chest Pain Type
                <select name="cp" value={formData.cp} onChange={handleChange} required className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all">
                  <option value="3">Asymptomatic</option>
                  <option value="0">Typical Angina</option>
                  <option value="1">Atypical Angina</option>
                  <option value="2">Non-anginal</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
                Major Vessels
                <select name="ca" value={formData.ca} onChange={handleChange} required className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all">
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-text)]">
                Thalassemia
                <select name="thal" value={formData.thal} onChange={handleChange} required className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all">
                  <option value="2">Normal</option>
                  <option value="1">Fixed Defect</option>
                  <option value="3">Reversible Defect</option>
                  <option value="0">Unknown</option>
                </select>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-semibold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex items-center gap-2"><Activity className="animate-spin" size={18} /> Processing...</span>
              ) : (
                <>Run Assessment <ChevronRight size={18} /></>
              )}
            </button>
          </form>
        </motion.div>

        {/* Right Column: Results */}
        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
                {error}
              </motion.div>
            )}

            {!result && !isLoading && !error && (
              <motion.div className="flex flex-col items-center justify-center h-full min-h-[300px] glass-panel rounded-3xl border border-[var(--color-border)] border-dashed text-[var(--color-text-light)]">
                <Activity size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                <p>Fill out the form to generate health insights.</p>
              </motion.div>
            )}

            {result && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-6">
                <ResultCard probability={result.probability_high_risk} />
                <RiskFactors formData={formData} probability={result.probability_high_risk} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showRppgModal && (
        <RPPGHeartRate 
          onApply={(val) => {
            setFormData(prev => ({ ...prev, thalach: String(val) }));
            setShowRppgModal(false);
          }}
          onClose={() => setShowRppgModal(false)}
        />
      )}
    </div>
  );
}

export default PredictorPage;