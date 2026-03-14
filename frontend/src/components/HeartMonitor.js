// frontend/src/components/HeartMonitor.js

import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import './HeartMonitor.css';

function HeartMonitor({ onHeartRateMeasured }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [heartRate, setHeartRate] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const framesRef = React.useRef([]);

  useEffect(() => {
    let videoElement = null; // Store reference for cleanup

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoElement = videoRef.current; // Capture for cleanup
        }
      } catch (err) {
        setError('Camera access denied. Please allow camera permissions and try again.');
      }
    };
    startCamera();

    return () => {
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureFrame = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video && video.videoWidth > 0) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    return null;
  };

  const startRecording = async () => {
    setIsRecording(true);
    framesRef.current = [];
    setHeartRate(null);
    setError(null);

    const RECORD_SECONDS = 10;
    const FPS = 30;
    const MAX_TICKS = RECORD_SECONDS * FPS; // ~300 frames

    // Ensure video is ready before capturing frames
    const ensureVideoReady = () => {
      return new Promise(resolve => {
        const check = () => {
          const video = videoRef.current;
          if (video && video.videoWidth > 0 && video.readyState >= 2) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    };

    await ensureVideoReady();

    let tickCount = 0;

    const interval = setInterval(() => {
      tickCount += 1;
      const remainingSeconds = Math.ceil((MAX_TICKS - tickCount) / FPS);
      setCountdown(Math.max(0, remainingSeconds));

      const frame = captureFrame();
      if (frame) {
        framesRef.current.push(frame);
      }

      if (tickCount >= MAX_TICKS) {
        clearInterval(interval);
        setIsRecording(false);
        processFrames(framesRef.current);
      }
    }, 1000 / FPS); // 30 fps
  };

  const processFrames = async (capturedFrames) => {
    // Debug: how many frames were captured
    console.log('Captured frames:', capturedFrames?.length);

    if (!capturedFrames || capturedFrames.length < 100) {
      setError('Not enough frames captured. Please ensure your face is visible and try again.');
      return;
    }

    setError('Processing... Please wait.');

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${API_URL}/api/rppg`, {
        frames: capturedFrames,
        fps: 30
      }, {
        timeout: 60000 // 60 second timeout
      });

      const hr = response.data.heart_rate;
      setHeartRate(hr);
      setError(null);
      if (onHeartRateMeasured) {
        onHeartRateMeasured(hr);
      }
    } catch (err) {
      console.error('rPPG API Error:', err);
      if (err.response) {
        console.error('Error Status:', err.response.status);
        console.error('Error Data:', err.response.data);
      }
      const errorMsg = err.response?.data?.error || 'Error measuring heart rate. Please check your connection and try again.';
      setError(errorMsg);
    }
  };

  return (
    <div className="heart-monitor">
      <h3>🩺 Heart Rate Monitor (rPPG)</h3>
      <p>Position your face in the camera frame, ensure good lighting, and click "Start Measurement" to detect your heart rate using remote photoplethysmography.</p>

      <div className="video-container">
        <video ref={videoRef} autoPlay muted playsInline className="video-feed"></video>
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        {isRecording && (
          <div className="overlay">
            <div className="countdown">Recording: {countdown}s</div>
          </div>
        )}
      </div>

      <div className="controls">
        <button onClick={startRecording} disabled={isRecording} className="start-btn">
          {isRecording ? 'Recording...' : 'Start Measurement'}
        </button>
      </div>

      {heartRate && (
        <div className="result">
          <h4>✅ Heart Rate Detected: {heartRate} BPM</h4>
          <p>This is your estimated resting heart rate. Normal range: 60-100 BPM.</p>
        </div>
      )}

      {error && <p className="error">❌ {error}</p>}

      <div className="tips">
        <h5>Tips for accurate measurement:</h5>
        <ul>
          <li>Ensure your face is well-lit and centered in the frame</li>
          <li>Stay still and avoid talking during measurement</li>
          <li>Remove glasses if they reflect light</li>
          <li>Measurement takes about 10 seconds</li>
        </ul>
      </div>
    </div>
  );
}

export default HeartMonitor;