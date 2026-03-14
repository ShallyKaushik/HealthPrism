
import cv2
import numpy as np
import sys
import os

# Add the current directory to path so we can import rppg
sys.path.append(os.getcwd())

try:
    from rppg import extract_heart_rate
    print("Successfully imported extract_heart_rate")
except ImportError as e:
    print(f"Failed to import extract_heart_rate: {e}")
    sys.exit(1)

def test_face_detection():
    print("Testing CascadeClassifier...")
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    if face_cascade.empty():
        print("❌ Error: CascadeClassifier is empty! Classifier file not found.")
    else:
        print("✅ CascadeClassifier loaded successfully.")

def test_extract_heart_rate_dummy():
    print("Testing extract_heart_rate with dummy frames...")
    # Create 120 dummy frames (640x480 RGB)
    frames = [np.zeros((480, 640, 3), dtype=np.uint8) for _ in range(120)]
    # Add some "green" signal oscillation
    for i, frame in enumerate(frames):
        # Heart rate ~60 BPM = 1 Hz. At 30 FPS, this is 1 cycle per 30 frames.
        val = 128 + 10 * np.sin(2 * np.pi * 1 * i / 30)
        frame[:, :, 1] = int(val)
    
    try:
        hr = extract_heart_rate(frames, fps=30)
        print(f"✅ Extracted Heart Rate: {hr} BPM")
    except Exception as e:
        print(f"❌ Error during extraction: {e}")

if __name__ == "__main__":
    test_face_detection()
    test_extract_heart_rate_dummy()
