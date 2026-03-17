import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './RPPGHeartRate.css'; // We will create this next

function RPPGHeartRate({ onApply, onClose }) {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(15); // 15 seconds measurement
  const [bpm, setBpm] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const dataPointsRef = useRef({ r: [], g: [], b: [] }); // Upgrade to RGB
  const timestampsRef = useRef([]);

  const RECORD_DURATION = 15; // seconds

  // Start Camera on Mount
  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: { ideal: 30 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
          };
        }
      } catch (err) {
        console.error("Webcam Error:", err);
        setError("Failed to access camera. Please allow camera permissions.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Frame Processing Loop
  const processFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    
    // Ensure video is playing and has frames
    if (video.readyState < 2) { 
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Draw Video to Canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Define ROI (Region of Interest) - center forehead / upper face
    const boxWidth = 60;
    const boxHeight = 40;
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = (canvas.height / 3) - (boxHeight / 2);

    // Draw Static Boundary Box overlay
    ctx.strokeStyle = '#22c55e'; 
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    ctx.fillStyle = '#22c55e';
    ctx.font = '12px Arial';
    ctx.fillText("Align Forehead Here", boxX - 25, boxY - 10);

    // Extract Pixel Data from ROI only if recording
    if (isRecording) {
      try {
        const imgData = ctx.getImageData(boxX, boxY, boxWidth, boxHeight);
        const pixels = imgData.data;
        let redSum = 0, greenSum = 0, blueSum = 0;
        let count = 0;

        for (let i = 0; i < pixels.length; i += 4) {
          redSum += pixels[i];
          greenSum += pixels[i + 1];
          blueSum += pixels[i + 2];
          count++;
        }

        dataPointsRef.current.r.push(redSum / count);
        dataPointsRef.current.g.push(greenSum / count);
        dataPointsRef.current.b.push(blueSum / count);
        timestampsRef.current.push(performance.now());
      } catch (err) {
        console.error("Error processing frame data:", err);
      }
    }

    // Always continue loop for continuous preview
    animationRef.current = requestAnimationFrame(processFrame);
  };

  // Frame Processing Loop Controller
  useEffect(() => {
    if (isCameraReady) {
      animationRef.current = requestAnimationFrame(processFrame);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isCameraReady, isRecording]); // Re-bind to capture latest isRecording state

  // Recording Timer Controller
  useEffect(() => {
    let timer = null;

    if (isRecording && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsRecording(false);
            calculateBpm(); // Call backend on finish
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  const startMeasurement = () => {
    setBpm(null);
    setError(null);
    setCountdown(RECORD_DURATION);
    dataPointsRef.current = { r: [], g: [], b: [] };
    timestampsRef.current = [];
    setIsRecording(true);
  };

  const calculateBpm = async () => {
    setIsLoading(true);
    setError(null);

    const values = dataPointsRef.current;
    const timestamps = timestampsRef.current;

    if (values.g.length < 30) {
      setError("Not enough data received. Please try again.");
      setIsLoading(false);
      return;
    }

    // Estimate FPS from timestamps
    // Delta average
    let totalDelta = 0;
    for (let i = 1; i < timestamps.length; i++) {
      totalDelta += (timestamps[i] - timestamps[i - 1]);
    }
    const avgDeltaMs = totalDelta / (timestamps.length - 1);
    const estimatedFps = 1000 / avgDeltaMs;

    console.log(`DEBUG rPPG: Captured ${values.length} frames. Estimated FPS: ${estimatedFps.toFixed(2)}`);

    try {
       const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
       const response = await axios.post(`${API_URL}/api/rppg`, {
           r: values.r,
           g: values.g,
           b: values.b,
           fps: Number(estimatedFps.toFixed(2))
       });
       
       if (response.data.bpm > 0) {
           setBpm(response.data.bpm);
       } else {
           setError(response.data.message || "Could not detect pulse smoothly.");
       }

    } catch (err) {
        console.error("rPPG calculation error:", err);
        setError("Error communicating with backend server.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="rppg-modal-overlay">
      <div className="rppg-content-card">
        <div className="rppg-header">
          <h3>Camera Heart Rate Monitor (rPPG)</h3>
          <button className="rppg-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="rppg-body">
          {error && <div className="rppg-error-alert">{error}</div>}

          <div className="rppg-preview-panel">
            <video ref={videoRef} autoPlay playsInline muted className="hidden-video" style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }} />
            <canvas ref={canvasRef} width="320" height="240" className="rppg-canvas-feed" />
            
            {/* Visual countdown overlay during recording */}
            {isRecording && (
                <div className="rppg-recording-overlay">
                    <span className="countdown-number">{countdown}s</span>
                    <p className="countdown-hint">Remain Still...</p>
                </div>
            )}
          </div>

          <p className="rppg-instructions">
            Align your forehead inside the green box. 
            <span style={{ color: '#f59e0b', display: 'block', marginTop: '4px', fontWeight: '600' }}>
              ⚠️ Make sure box is over SKIN (forehead), NOT hair or glasses
            </span>
            Stay completely still and maintain normal breathing for 15 seconds.
          </p>

          <div className="rppg-actions">
            {!isRecording && !isLoading && !bpm && (
              <button className="rppg-start-btn" onClick={startMeasurement} disabled={!isCameraReady}>
                {isCameraReady ? "Start 15s Measurement" : "Loading Camera..."}
              </button>
            )}

            {isRecording && (
              <button className="rppg-recording-btn" disabled>
                Measuring Pulse...
              </button>
            )}

            {isLoading && (
              <button className="rppg-loading-btn" disabled>
                Calculating Heart Rate...
              </button>
            )}

            {bpm && (
              <div className="rppg-results">
                <p>Estimated Heart Rate</p>
                <div className="rppg-bpm-display">{Math.round(bpm)} <span>BPM</span></div>
                
                <div className="results-actions">
                  <button className="rppg-apply-btn" onClick={() => onApply(Math.round(bpm))}>
                    Apply Reading
                  </button>
                  <button className="rppg-retry-btn" onClick={startMeasurement}>
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RPPGHeartRate;
