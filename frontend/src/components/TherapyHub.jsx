import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Headphones, BookOpen, X, Play, Square } from 'lucide-react';

// Cultural Wisdom Text
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
      english: 'For one thus satisfied, the threefold miseries of material existence exist no longer; in such satisfied consciousness, one\'s intelligence is soon well established.',
      citation: 'Chapter 2, Verse 65'
    }
  ]
};

// Activity Components

const ResonanceGrounding = ({ onClose }) => {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const animationRef = useRef(null);

  useEffect(() => {
    if (isHolding) {
      animationRef.current = setInterval(() => {
        setProgress(p => Math.min(p + 2, 100)); // ~5 seconds to fill
      }, 100);
    } else {
      animationRef.current = setInterval(() => {
        setProgress(p => Math.max(p - 5, 0)); // Quickly lose progress if released
      }, 100);
    }
    return () => clearInterval(animationRef.current);
  }, [isHolding]);

  // Morphing path calculation: Chaos to Circle
  const radius = 100;
  const points = 12;
  const path = [];
  
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    // Chaos factor reduces as progress approaches 100
    const chaos = (1 - progress / 100) * 40;
    
    // Use stable pseudo-randomness for the chaotic state
    const randomOffset = Math.sin(i * 1234) * chaos; 
    
    const r = radius + randomOffset;
    const x = 150 + r * Math.cos(angle);
    const y = 150 + r * Math.sin(angle);
    
    if (i === 0) path.push(`M ${x} ${y}`);
    else path.push(`L ${x} ${y}`);
  }

  const isComplete = progress === 100;

  return (
    <motion.div 
      className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 z-50 text-slate-200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button onClick={onClose} className="absolute top-8 left-8 text-slate-400 hover:text-white transition flex items-center gap-2 tracking-widest uppercase text-sm z-50">
        <X size={20} /> Back to Hub
      </button>

      <div className="text-center mb-12">
        <h2 className="text-3xl font-light tracking-widest text-slate-100 mb-4">Resonance Grounding</h2>
        <p className="text-slate-400 font-light max-w-md mx-auto">
          Press and hold to focus your energy and smooth the static into harmony.
        </p>
      </div>

      <div className="relative w-80 h-80 flex items-center justify-center mb-16">
        {/* Glow behind the svg, intensely grows with progress */}
        <div 
          className="absolute rounded-full transition-all duration-300"
          style={{
            width: `${100 + progress}%`,
            height: `${100 + progress}%`,
            background: `radial-gradient(circle, rgba(96,165,250,${progress/200}) 0%, rgba(0,0,0,0) 70%)`,
            boxShadow: `0 0 ${progress}px rgba(96,165,250,${progress/100})`
          }}
        />

        <svg width="300" height="300" viewBox="0 0 300 300" className="relative z-10 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          <motion.path
            d={path.join(' ') + ' Z'}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth={3 + (progress / 20)}
            strokeLinecap="round"
            strokeLinejoin="round"
            transition={{ type: "tween", duration: 0.1 }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isComplete ? '#60a5fa' : '#f43f5e'} transition={{duration: 1}}/>
              <stop offset="100%" stopColor={isComplete ? '#e0f2fe' : '#fb923c'} transition={{duration: 1}}/>
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center progress text */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
             <span className="text-3xl font-extralight tracking-widest text-white drop-shadow-md">
                 {isComplete ? "Harmony" : `${Math.floor(progress)}%`}
             </span>
        </div>
      </div>

      <button
        onMouseDown={() => setIsHolding(true)}
        onMouseUp={() => setIsHolding(false)}
        onMouseLeave={() => setIsHolding(false)}
        onTouchStart={() => setIsHolding(true)}
        onTouchEnd={() => setIsHolding(false)}
        className={`px-12 py-4 rounded-full border border-white/20 transition-all duration-300 backdrop-blur-md uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-white/10 active:scale-95 touch-none select-none
          ${isComplete ? 'bg-blue-500/20 text-blue-200 border-blue-500/50' : 'bg-white/5 text-white'}`}
      >
        {isComplete ? "Release" : "Hold"}
      </button>
    </motion.div>
  );
};

const BinauralAudioActivity = ({ onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioCtxRef = useRef(null);
  const leftOscRef = useRef(null);
  const rightOscRef = useRef(null);
  const gainNodeRef = useRef(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const toggleAudio = () => {
    if (!isPlaying) {
      if (!audioCtxRef.current) {
        // Initialize Web Audio API
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        // Create Master Gain Node
        const masterGain = ctx.createGain();
        masterGain.gain.value = volume;
        masterGain.connect(ctx.destination);
        gainNodeRef.current = masterGain;

        // Base Frequency (Healing 432Hz)
        const baseFreq = 432;
        const offset = 4; // 4Hz difference creates a Theta wave beat in the brain

        // Left Ear
        const leftOsc = ctx.createOscillator();
        leftOsc.type = 'sine';
        leftOsc.frequency.value = baseFreq;
        const leftPan = ctx.createStereoPanner();
        leftPan.pan.value = -1; // Hard left
        leftOsc.connect(leftPan);
        leftPan.connect(masterGain);
        leftOsc.start();
        leftOscRef.current = leftOsc;

        // Right Ear
        const rightOsc = ctx.createOscillator();
        rightOsc.type = 'sine';
        rightOsc.frequency.value = baseFreq + offset;
        const rightPan = ctx.createStereoPanner();
        rightPan.pan.value = 1; // Hard right
        rightOsc.connect(rightPan);
        rightPan.connect(masterGain);
        rightOsc.start();
        rightOscRef.current = rightOsc;
      } else {
        audioCtxRef.current.resume();
      }
      setIsPlaying(true);
    } else {
      if (audioCtxRef.current) {
        audioCtxRef.current.suspend();
      }
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (gainNodeRef.current) {
      // Ramp volume to avoid clicks
      gainNodeRef.current.gain.setTargetAtTime(newVol, audioCtxRef.current.currentTime, 0.05);
    }
  };

  return (
    <motion.div 
      className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 z-50 text-slate-200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button onClick={onClose} className="absolute top-8 left-8 text-slate-400 hover:text-white transition flex items-center gap-2 tracking-widest uppercase text-sm z-50">
        <X size={20} /> Back to Hub
      </button>

      <div className="text-center mb-16">
        <h2 className="text-3xl font-light tracking-widest text-slate-100 mb-4">Binaural Therapy</h2>
        <p className="text-slate-400 font-light max-w-md mx-auto">
          Please wear headphones. A 432Hz base frequency with a 4Hz offset will induce deeply relaxing Theta waves.
        </p>
      </div>

      {/* Visualizer */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-16">
        <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full" />
        
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              className="absolute inset-x-0 h-[2px] bg-indigo-500/50 -rotate-45"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            />
          )}
        </AnimatePresence>

        <motion.div 
          className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 shadow-[0_0_60px_rgba(99,102,241,0.5)] flex items-center justify-center"
          animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} /* 4 seconds = 0.25Hz, but effectively represents the slow theta beat visually */
        >
          {isPlaying ? <Headphones size={48} className="text-white/80" /> : <Headphones size={48} className="text-white/40" />}
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center space-y-8 w-full max-w-xs">
        <button 
          onClick={toggleAudio}
          className="flex items-center justify-center gap-3 w-full py-4 rounded-full border border-white/20 transition-all backdrop-blur-md uppercase tracking-widest text-sm hover:bg-white/10 active:scale-95 bg-white/5"
        >
          {isPlaying ? <><Square size={16} /> Stop Frequency</> : <><Play size={16} /> Start Frequency</>}
        </button>

        <div className="w-full flex flex-col items-center opacity-70 hover:opacity-100 transition-opacity">
          <label className="text-xs tracking-widest uppercase mb-2">Volume</label>
          <input 
            type="range" 
            min="0" max="1" step="0.01" 
            value={volume} 
            onChange={handleVolumeChange} 
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </motion.div>
  );
};

const CulturalWisdomActivity = ({ onClose, stressLevel }) => {
  const verses = gitaVerses[stressLevel] || gitaVerses['Moderate'];
  const verse = verses[0]; // For simplicity, take the first associated verse

  return (
    <motion.div 
      className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 z-50 text-slate-200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button onClick={onClose} className="absolute top-8 left-8 text-slate-400 hover:text-white transition flex items-center gap-2 tracking-widest uppercase text-sm z-50">
        <X size={20} /> Back to Hub
      </button>

      {/* Subtle scrolling background text artifact */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03] flex items-center justify-center whitespace-nowrap">
         <motion.div 
            className="text-[20rem] font-serif italic"
            animate={{ x: [1000, -2000] }}
            transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
         >
             ॐ शान्तिः शान्तिः शान्तिः
         </motion.div>
      </div>

      <div className="max-w-3xl w-full text-center z-10">
        <BookOpen size={24} className="mx-auto text-slate-500 mb-12 opacity-50" />
        
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1.5, ease: "easeOut" }}
        >
            <p className="font-serif italic text-3xl md:text-5xl text-slate-200 mb-12 leading-relaxed tracking-wide drop-shadow-lg">
              "{verse.sanskrit}"
            </p>
        </motion.div>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 2, delay: 1 }}
        >
            <p className="font-sans font-light text-lg md:text-xl text-slate-400 mb-8 leading-relaxed max-w-2xl mx-auto">
              {verse.english}
            </p>
            <div className="w-16 h-px bg-slate-700 mx-auto mb-8"></div>
            <p className="text-sm text-slate-500 tracking-widest uppercase font-semibold">
              The Bhagavad Gita, {verse.citation}
            </p>
        </motion.div>
      </div>
    </motion.div>
  );
};


// Main Hub Component

const TherapyHub = ({ initialStressLevel = 'Moderate', sentimentScore = 0, onExit }) => {
  const [activeActivity, setActiveActivity] = useState(null); // 'resonance', 'audio', 'wisdom'
  
  // Feedback state
  const [currentStressRating, setCurrentStressRating] = useState(5);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Handle Android/Browser back button naturally using URL hashes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#resonance') setActiveActivity('resonance');
      else if (hash === '#audio') setActiveActivity('audio');
      else if (hash === '#wisdom') setActiveActivity('wisdom');
      else setActiveActivity(null);
    };

    // Set initial hash if none exists to establish the "hub" base state
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#hub');
    } else {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const openActivity = (id) => {
    window.location.hash = id;
  };

  const closeActivity = () => {
    window.location.hash = 'hub';
  };

  const handleFeedbackSubmit = () => {
    // Basic logic mapping user's self-reported stress (1-10) to a message
    if (currentStressRating <= 3) {
      setFeedbackMessage("Incredible job. You successfully lowered your heart rate and cleared your mind. Remember this feeling.");
    } else if (currentStressRating <= 7) {
      setFeedbackMessage("Good progress. Your nervous system is stabilizing. Consider doing another session later today.");
    } else {
      setFeedbackMessage("That's okay. High stress takes time to dissipate. We recommend drinking water and stepping away from your screen for 10 minutes.");
    }
    setFeedbackGiven(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-slate-900 to-black font-sans text-slate-200 overflow-y-auto">
      
      {/* Container to restrict max width for large screens */}
      <div className="flex-grow flex flex-col w-full max-w-6xl mx-auto px-6 py-12">
        
        {/* Hub Header */}
        <div className="mb-16">
          <button onClick={onExit} className="mb-8 text-sm tracking-widest uppercase text-slate-500 hover:text-slate-300 transition flex items-center gap-2">
            <X size={16} /> Close Hub
          </button>
          <motion.h1 
            className="text-4xl md:text-5xl font-extralight tracking-wider text-white mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Digital Therapy Hub
          </motion.h1>
          <motion.p 
            className="text-lg text-slate-400 font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Let's bring your stress down from <span className="font-semibold text-slate-200">{initialStressLevel}</span>. Choose an exercise.
          </motion.p>
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          
          {/* Card 1 */}
          <motion.div 
            layoutId="card-resonance"
            onClick={() => openActivity('resonance')}
            className="group cursor-pointer p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition duration-300 relative overflow-hidden flex flex-col h-72"
          >
            <Target size={32} className="text-blue-400 mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-light tracking-wide mb-3">Resonance Grounding</h3>
            <p className="text-slate-400 font-light text-sm leading-relaxed flex-grow">
              An interactive visualizer to smooth mental static into harmony through focused tactile feedback.
            </p>
            <div className="text-xs tracking-widest uppercase text-blue-400/80 font-semibold mt-auto">Open Activity</div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            layoutId="card-audio"
            onClick={() => openActivity('audio')}
            className="group cursor-pointer p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition duration-300 relative overflow-hidden flex flex-col h-72"
          >
            <Headphones size={32} className="text-indigo-400 mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-light tracking-wide mb-3">Binaural Therapy</h3>
            <p className="text-slate-400 font-light text-sm leading-relaxed flex-grow">
              Synthesized 432Hz sine waves mapped with a theta offset to induce a deep meditative state.
            </p>
            <div className="text-xs tracking-widest uppercase text-indigo-400/80 font-semibold mt-auto">Open Activity</div>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            layoutId="card-wisdom"
            onClick={() => openActivity('wisdom')}
            className="group cursor-pointer p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition duration-300 relative overflow-hidden flex flex-col h-72"
          >
            <BookOpen size={32} className="text-purple-400 mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-light tracking-wide mb-3">Cultural Wisdom</h3>
            <p className="text-slate-400 font-light text-sm leading-relaxed flex-grow">
              Centuries-old cognitive reframing techniques presented in an elegant, serene reading environment.
            </p>
            <div className="text-xs tracking-widest uppercase text-purple-400/80 font-semibold mt-auto">Open Activity</div>
          </motion.div>

        </div>

        {/* Efficacy Feedback Loop */}
        <div className="mt-auto pt-12 border-t border-white/10 max-w-2xl mx-auto w-full mb-12">
          {!feedbackGiven ? (
            <div className="text-center">
              <h4 className="text-xl font-light tracking-wider mb-8">How would you rate your stress level right now?</h4>
              
              <div className="flex items-center justify-between mb-2 px-2">
                 <span className="text-xs text-green-400 uppercase tracking-widest">Calm (1)</span>
                 <span className="text-xs text-red-400 uppercase tracking-widest">High (10)</span>
              </div>
              
              <input 
                type="range" 
                min="1" max="10" step="1" 
                value={currentStressRating} 
                onChange={(e) => setCurrentStressRating(parseInt(e.target.value))} 
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white mb-10"
              />
              <div className="text-3xl font-extralight text-white mb-8">{currentStressRating}</div>
              
              <button 
                onClick={handleFeedbackSubmit}
                className="px-10 py-3 bg-white text-slate-900 rounded-full font-semibold tracking-widest uppercase text-sm hover:bg-slate-200 transition shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                Complete Therapy
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-8 bg-white/5 rounded-3xl border border-white/10"
            >
              <h4 className="text-2xl font-light tracking-wider mb-4 opacity-80">Feedback Recorded</h4>
              <p className="font-light text-slate-300 leading-relaxed mb-8">{feedbackMessage}</p>
              <button 
                onClick={onExit}
                className="px-8 py-3 border border-white/20 rounded-full tracking-widest uppercase text-sm hover:bg-white/10 transition"
              >
                Return to Dashboard
              </button>
            </motion.div>
          )}
        </div>

      </div>

      {/* Activity Modals */}
      <AnimatePresence>
        {activeActivity === 'resonance' && <ResonanceGrounding onClose={closeActivity} />}
        {activeActivity === 'audio' && <BinauralAudioActivity onClose={closeActivity} />}
        {activeActivity === 'wisdom' && <CulturalWisdomActivity onClose={closeActivity} stressLevel={initialStressLevel} />}
      </AnimatePresence>

    </div>
  );
};

export default TherapyHub;
