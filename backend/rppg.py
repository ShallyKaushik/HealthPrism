# backend/rppg.py

import cv2
import numpy as np
from scipy import signal
import time

def extract_heart_rate(frames, fps=30):
    """
    Extract heart rate from a sequence of video frames using rPPG with face detection.

    Args:
        frames: List of numpy arrays (RGB images)
        fps: Frames per second of the video

    Returns:
        heart_rate: Estimated heart rate in BPM
    """
    if len(frames) < 100:
        raise ValueError("Not enough frames for reliable heart rate estimation. Need at least 100 frames.")

    # Load face detector
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    green_signals = []
    last_roi = None
    DETECTION_INTERVAL = 30 # Detect face every 30 frames (1 second)

    for i, frame in enumerate(frames):
        # Convert to grayscale for face detection
        gray = None
        
        # Only detect face every N frames or if we don't have a ROI yet
        if i % DETECTION_INTERVAL == 0 or last_roi is None:
            gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
            
            if len(faces) > 0:
                # Use the first detected face
                x, y, w, h = faces[0]
                # Define ROI as forehead (top part of face)
                roi_y = max(0, y)
                roi_h = int(h * 0.3)
                roi_x = max(0, x + int(w * 0.2))
                roi_w = int(w * 0.6)
                
                # Double check bounds
                roi_h = min(roi_h, frame.shape[0] - roi_y)
                roi_w = min(roi_w, frame.shape[1] - roi_x)
                
                if roi_w > 0 and roi_h > 0:
                    last_roi = (roi_x, roi_y, roi_w, roi_h)

        if last_roi:
            rx, ry, rw, rh = last_roi
            roi = frame[ry:ry+rh, rx:rx+rw]
            green_mean = np.mean(roi[:, :, 1])
            green_signals.append(green_mean)
        else:
            # Fallback to whole frame if no face ever detected
            green_signals.append(np.mean(frame[:, :, 1]))

    if len(green_signals) < 50:
        raise ValueError("Insufficient valid frames with face detection.")

    # Detrend the signal
    green_signals = signal.detrend(green_signals)

    # Apply bandpass filter (0.75-3.5 Hz for heart rate 45-210 BPM)
    b, a = signal.butter(3, [0.75/(fps/2), 3.5/(fps/2)], btype='band')
    filtered_signal = signal.filtfilt(b, a, green_signals)

    # Compute FFT
    fft = np.fft.fft(filtered_signal)
    freqs = np.fft.fftfreq(len(filtered_signal), 1/fps)

    # Find the frequency with maximum power in the heart rate range
    valid_range = (freqs >= 0.75) & (freqs <= 3.5)
    if not np.any(valid_range):
        raise ValueError("No frequencies in valid heart rate range.")

    power = np.abs(fft)**2
    max_power_idx = np.argmax(power[valid_range])
    peak_freq = freqs[valid_range][max_power_idx]

    # Convert frequency to BPM
    heart_rate = peak_freq * 60

    # Validate range
    if not (45 <= heart_rate <= 200):
        raise ValueError(f"Estimated heart rate {heart_rate:.1f} BPM is outside normal range (45-200 BPM). Ensure good lighting and face visibility.")

    return round(heart_rate, 1)