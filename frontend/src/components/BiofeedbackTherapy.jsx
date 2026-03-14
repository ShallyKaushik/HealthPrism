import React, { useState, useEffect } from 'react';

// Cultural Therapy Text categorized by emotion
const gitaVerses = {
  High: [
    {
      sanskrit: 'मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः। आगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत।।',
      english: 'O son of Kunti, the nonpermanent appearance of happiness and distress, and their disappearance in due course, are like the appearance and disappearance of winter and summer seasons. They arise from sense perception, O scion of Bharata, and one must learn to tolerate them without being disturbed.',
      citation: 'Chapter 2, Verse 14'
    }
  ],
  Moderate: [
    {
      sanskrit: 'बन्धुरात्मात्मनस्तस्य येनात्मैवात्मना जितः। अनात्मनस्तु शत्रुत्वे वर्तेतात्मैव शत्रुवत्।।',
      english: 'For him who has conquered the mind, the mind is the best of friends; but for one who has failed to do so, his mind will remain the greatest enemy.',
      citation: 'Chapter 6, Verse 6'
    }
  ],
  Low: [
    {
      sanskrit: 'प्रसादे सर्वदुःखानां हानिरस्योपजायते। प्रसन्नचेतसो ह्याशु बुद्धिः पर्यवतिष्ठते।।',
      english: 'For one thus satisfied (in Krishna consciousness), the threefold miseries of material existence exist no longer; in such satisfied consciousness, one\'s intelligence is soon well established.',
      citation: 'Chapter 2, Verse 65'
    }
  ]
};

const BiofeedbackTherapy = ({ stressLevel = 'Moderate', sentimentScore = 0, onClose }) => {
  // Phase logic: 0 = Inhale, 1 = Hold, 2 = Exhale
  const [phase, setPhase] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Dynamic timing for 4-7-8 breathing
  // If highly negative sentiment, start faster and slow down over 3 cycles
  const getCycleTimes = () => {
    let speedMultiplier = 1;
    if (sentimentScore <= -0.5) {
      if (cycleCount === 0) speedMultiplier = 0.5; // Twice as fast
      else if (cycleCount === 1) speedMultiplier = 0.75; // 1.5x as fast
      else if (cycleCount === 2) speedMultiplier = 0.9; // Slightly faster
    }
    return [4000 * speedMultiplier, 7000 * speedMultiplier, 8000 * speedMultiplier]; // Inhale, Hold, Exhale
  };

  useEffect(() => {
    if (!isActive || cycleCount >= 3) return;

    const times = getCycleTimes();
    let timeout;

    if (phase === 0) {
      // Inhale -> Hold
      timeout = setTimeout(() => setPhase(1), times[0]);
    } else if (phase === 1) {
      // Hold -> Exhale
      timeout = setTimeout(() => setPhase(2), times[1]);
    } else if (phase === 2) {
      // Exhale -> Inhale (Next cycle)
      timeout = setTimeout(() => {
        setPhase(0);
        setCycleCount(prev => prev + 1);
      }, times[2]);
    }

    return () => clearTimeout(timeout);
  }, [phase, cycleCount, isActive, sentimentScore]); // Added dependencies for stability

  // Styling based on phase
  const getOrbStyle = () => {
    // Determine color based on stress level and cycle progress
    // High = Warm/Orange -> Cool/Blue
    let colorClass = 'bg-blue-400 shadow-[0_0_100px_rgba(96,165,250,0.6)]';
    if (stressLevel === 'High') {
      if (cycleCount === 0) colorClass = 'bg-orange-500 shadow-[0_0_100px_rgba(249,115,22,0.6)]';
      else if (cycleCount === 1) colorClass = 'bg-yellow-400 shadow-[0_0_100px_rgba(250,204,21,0.6)]';
      else colorClass = 'bg-teal-400 shadow-[0_0_100px_rgba(45,212,191,0.6)]';
    } else if (stressLevel === 'Moderate') {
       if (cycleCount === 0) colorClass = 'bg-purple-400 shadow-[0_0_100px_rgba(192,132,252,0.6)]';
       else colorClass = 'bg-indigo-400 shadow-[0_0_100px_rgba(129,140,248,0.6)]';
    }

    // Determine scale based on phase
    let scale = 'scale-100'; // Exhale/Start
    if (phase === 0) scale = 'scale-150'; // Inhaling (expanding)
    else if (phase === 1) scale = 'scale-150'; // Holding (stay max)
    else if (phase === 2) scale = 'scale-100'; // Exhaling (shrinking)
    
    // Set transition duration based on the actual time so it's smooth
    const times = getCycleTimes();
    
    return { colorClass, scale, times };
  };

  const { colorClass, scale, times } = getOrbStyle();
  
  // Dynamic inline style for smooth transitions that strictly match the algorithm
  const orbTransitionStyle = {
      transitionDuration: phase === 0 ? `${times[0]}ms` : phase === 1 ? '100ms' : `${times[2]}ms`,
      transitionTimingFunction: 'ease-in-out',
      transitionProperty: 'transform, background-color, box-shadow'
  };

  const verse = gitaVerses[stressLevel]?.[0] || gitaVerses['Moderate'][0];

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center text-center bg-gradient-to-b from-slate-900 to-black font-sans overflow-hidden">
      
      {/* Header */}
      <div className="absolute top-12 w-full text-center px-4">
        <h1 className="text-2xl font-light tracking-wider text-slate-300 opacity-80">Biofeedback Therapy</h1>
        <p className="text-xs text-slate-500 mt-2 tracking-widest uppercase">4-7-8 Breathing Technique</p>
      </div>

      {/* Main Visualizer & Typography */}
      <div className="flex flex-col items-center justify-center flex-grow -mt-16 w-full">
        
        {/* Dynamic Instruction Text - MASSIVE */}
        <div className="h-24 flex items-center justify-center mb-8">
          <p className="text-5xl md:text-6xl font-extralight tracking-widest text-slate-200 transition-opacity duration-500">
            {cycleCount >= 3 ? "Complete" : 
             phase === 0 ? "Inhale..." : 
             phase === 1 ? "Hold..." : "Exhale..."}
          </p>
        </div>

        {/* The Breathing Orb */}
        <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center mt-12 mb-12">
            <div 
                className={`rounded-full ${colorClass} ${scale}`}
                style={{
                    width: '100%',
                    height: '100%',
                    ...orbTransitionStyle
                }}
            ></div>
        </div>

        {/* Cycle Counter */}
        {cycleCount < 3 && (
            <p className="text-sm text-slate-500 tracking-widest uppercase mt-4">
                Cycle {cycleCount + 1} of 3
            </p>
        )}

        {/* Finish / Close Button */}
        {cycleCount >= 3 && (
            <button 
                onClick={onClose}
                className="mt-12 rounded-full px-8 py-3 bg-white/10 hover:bg-white/20 transition backdrop-blur-md border border-white/20 text-white tracking-widest uppercase text-sm"
            >
                Close Therapy
            </button>
        )}

      </div>

      {/* Cultural Therapy Text (Bottom) */}
      <div className="absolute bottom-12 w-full max-w-2xl text-center px-6 opacity-60">
        <p className="italic font-serif text-lg md:text-xl text-slate-300 mb-3 leading-relaxed">
            "{verse.sanskrit}"
        </p>
        <p className="font-light text-sm md:text-base text-slate-400 leading-relaxed px-4">
            {verse.english}
        </p>
        <p className="text-xs text-slate-500 mt-4 tracking-widest uppercase">
            — The Bhagavad Gita, {verse.citation}
        </p>
      </div>

    </div>
  );
};

export default BiofeedbackTherapy;
