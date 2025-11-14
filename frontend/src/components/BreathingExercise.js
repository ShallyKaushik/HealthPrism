// frontend/src/components/BreathingExercise.js

import React, { useState, useEffect, useRef } from 'react';
import './BreathingExercise.css';
import { FaPlay, FaStop } from 'react-icons/fa';

function BreathingExercise() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [text, setText] = useState('Press Start to Begin');
  
  // We use refs to safely manage the timeouts
  const timeoutRef1 = useRef(null);
  const timeoutRef2 = useRef(null);
  const timeoutRef3 = useRef(null);

  const cycleInstructions = () => {
    // 1. Inhale
    setText('Inhale slowly...');
    timeoutRef1.current = setTimeout(() => {
      // 2. Hold
      setText('Hold...');
    }, 4000); // 4-second inhale

    timeoutRef2.current = setTimeout(() => {
      // 3. Exhale
      setText('Exhale slowly...');
    }, 8000); // 4-second hold

    timeoutRef3.current = setTimeout(() => {
      // 4. Loop
      cycleInstructions();
    }, 14000); // 6-second exhale
  };

  const startAnimation = () => {
    setIsAnimating(true);
    cycleInstructions();
  };

  const stopAnimation = () => {
    setIsAnimating(false);
    setText('Press Start to Begin');
    // Clear all scheduled timeouts to stop the loop
    clearTimeout(timeoutRef1.current);
    clearTimeout(timeoutRef2.current);
    clearTimeout(timeoutRef3.current);
  };

  // Cleanup effect in case the component unmounts
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef1.current);
      clearTimeout(timeoutRef2.current);
      clearTimeout(timeoutRef3.current);
    };
  }, []);

  return (
    <div className="breathing-tool-card">
      <h2>A 1-Minute Calming Exercise</h2>
      <p>Follow the visual guide to center your mind.</p>
      
      <div className="breathing-ui-container">
        {/* The animation classes are controlled by 'isAnimating' and 'text' */}
        <div 
          className={`breathing-circle ${isAnimating ? (text === 'Inhale slowly...' ? 'inhale' : (text === 'Hold...' ? 'hold' : 'exhale')) : ''}`}
        >
          <div className="breathing-circle-inner">
            <span className="breathing-text">{text}</span>
          </div>
        </div>
      </div>
      
      <div className="breathing-controls">
        {!isAnimating ? (
          <button className="control-button start" onClick={startAnimation}>
            <FaPlay /> Start
          </button>
        ) : (
          <button className="control-button stop" onClick={stopAnimation}>
            <FaStop /> Stop
          </button>
        )}
      </div>
    </div>
  );
}

export default BreathingExercise;