# backend/app.py

import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

# --- 1. IMPORTS FOR ADVANCED FEATURES ---
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import urllib3
from rppg import extract_heart_rate
import cv2
import numpy as np
import base64
from report_parser import analyze_report
from werkzeug.utils import secure_filename
import tempfile

# --- 2. SETUP ---
load_dotenv()
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# --- 3. Initialize Application ---
app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
CORS(app) 
app.config['MAX_CONTENT_LENGTH'] = 64 * 1024 * 1024  # 64MB limit

# --- 4. Load ALL OUR ML Models ---

# Model 1: Heart Risk (Optimized 8-Feature)
try:
    heart_model_path = os.path.join(BASE_DIR, 'heart_risk_pipeline.joblib')
    heart_model = joblib.load(heart_model_path)
    print(f"✅ OPTIMIZED Heart Model loaded from {heart_model_path}")
except Exception as e:
    print(f"❌ Error loading Heart model: {e}")
    heart_model = None

# Model 2: Stress Predictor (NEW v2 with NLP)
try:
    stress_model = joblib.load('stress_model_v2.joblib')
    print("✅ NEW Stress Model v2 (with NLP) loaded successfully!")
except Exception as e:
    print(f"❌ Error loading Stress model v2: {e}")
    stress_model = None
# --- END OF MODEL LOADING ---

# --- 5. Initialize NLP Analyzer ---
sentiment_analyzer = SentimentIntensityAnalyzer()
print("✅ VADER Sentiment Analyzer loaded successfully!")

# --- 6. Define Feature Lists ---
# For Heart Model
HEART_NUMERIC_FEATURES = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']
HEART_CATEGORICAL_FEATURES = ['cp', 'ca', 'thal']
ALL_HEART_FEATURES = HEART_NUMERIC_FEATURES + HEART_CATEGORICAL_FEATURES

# For Stress Model (from train_stress_model.py)
STRESS_NUMERIC_FEATURES = [
    'Age', 'Sleep Duration', 'Quality of Sleep', 
    'Physical Activity Level', 'Heart Rate', 'Daily Steps',
    'Systolic BP', 'Diastolic BP', 'Sentiment_Score'
]
STRESS_CATEGORICAL_FEATURES = [
    'Gender', 'Occupation', 'BMI Category'
]
ALL_STRESS_FEATURES = STRESS_NUMERIC_FEATURES + STRESS_CATEGORICAL_FEATURES

# --- NEW: CATCH-ALL ROUTE TO SERVE REACT APP ---
# This must be defined before your /api routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


# --- 7. Heart Prediction Route ---
@app.route('/api/predict', methods=['POST'])
def predict():
    if heart_model is None:
        return jsonify({'error': 'Optimized heart model is not loaded'}), 500
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400

        input_df = pd.DataFrame([data])
        input_df = input_df[ALL_HEART_FEATURES]
        
        probabilities = heart_model.predict_proba(input_df)
        risk_probability = float(probabilities[0][0]) # Class 0 (High Risk)

        return jsonify({
            'message': 'Prediction successful',
            'probability_high_risk': risk_probability
        }), 200
    except Exception as e:
        print(f" Error during heart prediction: {e}")
        return jsonify({'error': f'Internal server error: {e}'}), 500

# --- 8. NEW: Stress Prediction Route (V2 with NLP) ---
@app.route('/api/predict-stress', methods=['POST'])
def predict_stress():
    if stress_model is None:
        return jsonify({'error': 'Stress model is not loaded'}), 500
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
        
        # 1. NLP Sentiment Calculation
        journal_text = data.get('journal_text', '')
        if journal_text:
            sentiment_dict = sentiment_analyzer.polarity_scores(journal_text)
            sentiment_score = sentiment_dict['compound']
        else:
            sentiment_score = 0.0 # Default if no text provided

        data['Sentiment_Score'] = sentiment_score

        # 2. Handle Blood Pressure string split
        try:
            bp_split = data['Blood Pressure'].split('/')
            data['Systolic BP'] = int(bp_split[0])
            data['Diastolic BP'] = int(bp_split[1])
        except Exception as e:
            print(f"Error splitting BP: {e}")
            return jsonify({'error': 'Invalid Blood Pressure format. Must be "Systolic/Diastolic" (e.g., "120/80")'}), 400
        
        # 3. Cast numeric features to float (React sends them as strings)
        for col in STRESS_NUMERIC_FEATURES:
            if col in data and col != 'Sentiment_Score':
                try:
                    data[col] = float(data[col])
                except ValueError:
                    return jsonify({'error': f'Invalid numeric value for {col}'}), 400

        # 4. Create DataFrame and Predict
        input_df = pd.DataFrame([data])
        input_df = input_df[ALL_STRESS_FEATURES]
        
        prediction_array = stress_model.predict(input_df)
        stress_level = prediction_array[0] 
        
        return jsonify({
            'message': 'Stress prediction successful',
            'stress_level': stress_level,
            'sentiment_score': sentiment_score
        }), 200
        
    except Exception as e:
        print(f"❌ Error during stress prediction: {e}")
        return jsonify({'error': f'Internal server error: {e}'}), 500
# --- END OF NEW STRESS ROUTE ---


# --- 9. AI CHATBOT ROUTE (GenAI) ---
@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    SYSTEM_PROMPT = (
        "You are HealthBot, a friendly and helpful AI assistant..." 
    )
    data = request.json or {}
    messages = data.get('messages', [])
    
    if not messages: 
        return jsonify({'answer': 'Hi there! How can I help you today?'})
        
    user_message = messages[-1].get('text', '')
    if not user_message: return jsonify({'answer': '...'})
    
    try:
        apiKey = os.getenv("GEMINI_API_KEY")
        if not apiKey: raise Exception("GEMINI_API_KEY not found")
        
        # 1. FIXED MODEL NAME AND REMOVED THE KEY FROM THE URL
        apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
        
        payload = {
            "contents": [{"parts": [{"text": user_message}]}],
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]}
        }
        
        # 2. ADDED THE KEY SECURELY TO THE HEADERS INSTEAD
        headers = {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey 
        }
        
        response = requests.post(apiUrl, json=payload, headers=headers, verify=False)
        response.raise_for_status()
        result = response.json()
        
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        if not text: raise Exception("No text found in API response")
        
        return jsonify({'answer': text})
        
    except Exception as e:
        print(f"❌ Error processing chatbot request: {e}")
        return jsonify({'error': 'Sorry, I\'m facing a technical issue.'}), 500

# --- 10. AI NUTRITION PLANNER ROUTE (GenAI + Risk Score) ---
@app.route('/api/nutrition-planner', methods=['POST'])
def nutrition_planner():
    SYSTEM_PROMPT = (
        "You are an expert AI Nutritionist..." 
    )
    data = request.json
    age = data.get('age'); goal = data.get('goal'); restrictions = data.get('restrictions'); risk_score = data.get('riskScore') 
    if not age or not goal: return jsonify({'error': '...'}), 400
    risk_text = "N/A"
    if risk_score is not None:
        risk_percentage = round(risk_score * 100, 1)
        if risk_score > 0.7: risk_text = f"{risk_percentage}% (VERY HIGH risk...)"
        elif risk_score > 0.5: risk_text = f"{risk_percentage}% (HIGH risk...)"
        elif risk_score > 0.3: risk_text = f"{risk_percentage}% (BORDERLINE...)"
        else: risk_text = f"{risk_percentage}% (LOW risk...)"
    USER_PROMPT = f"""
    Please generate a 3-day sample meal plan for me.
    - My Age: {age}
    - My Health Goal: {goal}
    - My Dietary Restrictions: {restrictions}
    - My LATEST HEART RISK SCORE: {risk_text}
    **IMPORTANT**: You MUST tailor the meal plan to be appropriate for my heart risk score.
    """
    try:
        apiKey = os.getenv("GEMINI_API_KEY")
        if not apiKey: raise Exception("GEMINI_API_KEY not found")
        apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
        payload = {
            "contents": [{"parts": [{"text": USER_PROMPT}]}],
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]}
        }
        headers = {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey 
        }
        response = requests.post(apiUrl, json=payload, headers=headers, verify=False)
        response.raise_for_status()
        result = response.json()
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        if not text: raise Exception("No text found in API response")
        return jsonify({'meal_plan': text})
    except Exception as e:
        print(f"❌ Error processing nutrition plan request: {e}")
        return jsonify({'error': 'Sorry, I\'m facing a technical issue.'}), 500

# --- 11. ADVANCED AI STRESS COACH (GenAI + NLP) ---
@app.route('/api/stress-coach', methods=['POST'])
def stress_coach():
    SYSTEM_PROMPT = (
        "You are an AI Stress & Wellness Coach..."
    )
    data = request.json
    user_text = data.get('user_text'); risk_score = data.get('riskScore') 
    if not user_text: return jsonify({'error': 'Missing form data.'}), 400
    sentiment = sentiment_analyzer.polarity_scores(user_text)
    sentiment_score = sentiment['compound']
    if sentiment_score < -0.5: sentiment_label = "Very Negative"
    elif sentiment_score < 0: sentiment_label = "Negative"
    elif sentiment_score == 0: sentiment_label = "Neutral"
    else: sentiment_label = "Positive"
    risk_text = "N/A"
    if risk_score is not None:
        risk_percentage = round(risk_score * 100, 1)
        if risk_score > 0.5: risk_text = f"{risk_percentage}% (HIGH risk)"
        else: risk_text = f"{risk_percentage}% (LOW/BORDERLINE risk)"
    USER_PROMPT = f"""
    Please generate a 2-3 step, simple stress-relief plan for me.
    - The User's Raw Feeling: "{user_text}"
    - My NLP Model's Sentiment Analysis: {sentiment_label} (Score: {sentiment_score})
    - My LATEST HEART RISK SCORE: {risk_text}
    """
    try:
        apiKey = os.getenv("GEMINI_API_KEY")
        if not apiKey: raise Exception("GEMINI_API_KEY not found")
        apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
        payload = {
            "contents": [{"parts": [{"text": USER_PROMPT}]}],
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]}
        }
        headers = {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey 
        }
        response = requests.post(apiUrl, json=payload, headers=headers, verify=False)
        response.raise_for_status()
        result = response.json()
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        if not text: raise Exception("No text found in API response")
        return jsonify({'stress_plan': text})
    except Exception as e:
        print(f"❌ Error processing stress plan request: {e}")
        return jsonify({'error': 'Sorry, I\'m facing a technical issue.'}), 500

# --- 12. rPPG Heart Rate Route ---
@app.route('/api/rppg', methods=['POST'])
def rppg_heart_rate():
    try:
        data = request.json
        frames_b64 = data.get('frames', [])
        fps = data.get('fps', 30)

        if not frames_b64 or len(frames_b64) < 100:
            return jsonify({'error': 'At least 100 frames required for accurate measurement'}), 400

        print(f"DEBUG: Received {len(frames_b64)} frames. Approximate payload size: {len(request.data) / 1024 / 1024:.2f} MB")

        # Decode frames
        frames = []
        for i, b64 in enumerate(frames_b64):
            try:
                img_data = base64.b64decode(b64.split(',')[1])
                np_arr = np.frombuffer(img_data, np.uint8)
                img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                if img is not None:
                    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    frames.append(img)
            except Exception as e:
                continue

        print(f"DEBUG: Successfully decoded {len(frames)} frames.")

        if len(frames) < 50:
            return jsonify({'error': 'Not enough valid frames decoded'}), 400

        print("DEBUG: Starting heart rate extraction...")
        heart_rate = extract_heart_rate(frames, fps)
        print(f"DEBUG: Heart rate extraction successful: {heart_rate}")
        return jsonify({'heart_rate': heart_rate, 'message': 'Heart rate measured successfully'}), 200

    except ValueError as e:
        print(f"DEBUG: ValueError in rPPG: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        import traceback
        print(f"❌ Error in rPPG: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error during heart rate processing'}), 500

# --- 13. Medical Report Analysis Route ---
@app.route('/api/analyze-report', methods=['POST'])
def analyze_medical_report():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        filename = secure_filename(file.filename)
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        try:
            results = analyze_report(tmp_path)
            # Remove temp file
            os.remove(tmp_path)
            
            if "error" in results:
                return jsonify({'error': results['error']}), 422 # Unprocessable Entity
                
            return jsonify({
                'message': 'Report analyzed successfully',
                'extracted_data': results
            }), 200
        except Exception as e:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            print(f"❌ Error during report analysis: {e}")
            return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

# --- 14. Run the Application ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)