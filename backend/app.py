# backend/app.py

import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()

# --- 1. Initialize Application ---
app = Flask(__name__)
CORS(app) 

# --- 2. Load The *Optimized* Model ---
# We only load our one, final, optimized model
try:
    model = joblib.load('heart_risk_pipeline.joblib')
    print("✅ OPTIMIZED Model (Top 8 Features) loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

# --- 3. Define Feature Lists (Optimized) ---
# This list MUST match the 8 features we just trained on
OPTIMIZED_NUMERIC_FEATURES = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']
OPTIMIZED_CATEGORICAL_FEATURES = ['cp', 'ca', 'thal']
ALL_OPTIMIZED_FEATURES = OPTIMIZED_NUMERIC_FEATURES + OPTIMIZED_CATEGORICAL_FEATURES


# --- 4. Prediction Route (Now uses 8 features) ---
@app.route('/api/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Optimized model is not loaded'}), 500
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400

        # Create the DataFrame using *only* our 8 selected features
        input_df = pd.DataFrame([data])
        
        # We must re-order them to be 100% sure
        input_df = input_df[ALL_OPTIMIZED_FEATURES]
        
        # The pipeline will handle the rest
        probabilities = model.predict_proba(input_df)
        risk_probability = float(probabilities[0][0]) # Class 0 (High Risk)

        return jsonify({
            'message': 'Prediction successful',
            'probability_high_risk': risk_probability
        }), 200
    except Exception as e:
        print(f"❌ Error during prediction: {e}")
        return jsonify({'error': f'Internal server error: {e}'}), 500

# --- 5. All Anonymous AI Routes ---
# (Your Chatbot, Nutrition, and Stress routes are all here,
# unchanged, and will work perfectly)

@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    SYSTEM_PROMPT = (
        "You are HealthBot, a friendly and helpful AI assistant... " 
    )
    data = request.json
    user_message = data.get('messages', [{}])[-1].get('text', '')
    if not user_message: return jsonify({'answer': '...'})
    try:
        apiKey = os.getenv("GEMINI_API_KEY")
        if not apiKey: raise Exception("GEMINI_API_KEY not found")
        apiUrl = f"https{':'}//generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key={apiKey}"
        payload = {
            "contents": [{"parts": [{"text": user_message}]}],
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]}
        }
        headers = {'Content-Type': 'application/json'}
        response = requests.post(apiUrl, json=payload, headers=headers)
        response.raise_for_status() 
        result = response.json()
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        if not text: raise Exception("No text found in API response")
        return jsonify({'answer': text})
    except Exception as e:
        print(f"❌ Error processing chatbot request: {e}")
        return jsonify({'answer': 'Sorry, I\'m facing a technical issue.'}), 500

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
        apiUrl = f"https{':'}//generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key={apiKey}"
        payload = {
            "contents": [{"parts": [{"text": USER_PROMPT}]}],
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]}
        }
        headers = {'Content-Type': 'application/json'}
        response = requests.post(apiUrl, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        if not text: raise Exception("No text found in API response")
        return jsonify({'meal_plan': text})
    except Exception as e:
        print(f"❌ Error processing nutrition plan request: {e}")
        return jsonify({'error': 'Sorry, I\'m facing a technical issue.'}), 500

@app.route('/api/stress-coach', methods=['POST'])
def stress_coach():
    SYSTEM_PROMPT = (
        "You are an AI Stress & Wellness Coach..."
    )
    data = request.json
    topic = data.get('topic'); risk_score = data.get('riskScore') 
    if not topic: return jsonify({'error': 'Missing form data.'}), 400
    risk_text = "N/A"
    if risk_score is not None:
        risk_percentage = round(risk_score * 100, 1)
        if risk_score > 0.5: risk_text = f"{risk_percentage}% (HIGH risk)"
        else: risk_text = f"{risk_percentage}% (LOW/BORDERLINE risk)"
    USER_PROMPT = f"""
    Please generate a 2-3 step, simple stress-relief plan for me.
    - My Main Stressor: {topic}
    - My LATEST HEART RISK SCORE: {risk_text}
    Please make the plan specific to my stressor and acknowledge my heart risk level.
    """
    try:
        apiKey = os.getenv("GEMINI_API_KEY")
        if not apiKey: raise Exception("GEMINI_API_KEY not found")
        apiUrl = f"https{':'}//generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key={apiKey}"
        payload = {
            "contents": [{"parts": [{"text": USER_PROMPT}]}],
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]}
        }
        headers = {'Content-Type': 'application/json'}
        response = requests.post(apiUrl, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        if not text: raise Exception("No text found in API response")
        return jsonify({'stress_plan': text})
    except Exception as e:
        print(f"❌ Error processing stress plan request: {e}")
        return jsonify({'error': 'Sorry, I\'m facing a technical issue.'}), 500

# --- 6. Run the Application ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)