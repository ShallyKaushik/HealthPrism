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

# --- 2. SETUP ---
load_dotenv()
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# --- 3. Initialize Application ---
app = Flask(__name__)
CORS(app) 

# --- 4. Load The *Optimized* Model ---
try:
    model = joblib.load('heart_risk_pipeline.joblib')
    print("✅ OPTIMIZED Model (Top 8 Features) loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

# --- 5. Initialize NLP Analyzer ---
sentiment_analyzer = SentimentIntensityAnalyzer()
print("✅ VADER Sentiment Analyzer loaded successfully!")

# --- 6. Define Feature Lists (Optimized) ---
OPTIMIZED_NUMERIC_FEATURES = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']
OPTIMIZED_CATEGORICAL_FEATURES = ['cp', 'ca', 'thal']
ALL_OPTIMIZED_FEATURES = OPTIMIZED_NUMERIC_FEATURES + OPTIMIZED_CATEGORICAL_FEATURES


# --- 7. Prediction Route (Optimized) ---
@app.route('/api/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Optimized model is not loaded'}), 500
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400

        input_df = pd.DataFrame([data])
        input_df = input_df[ALL_OPTIMIZED_FEATURES]
        
        probabilities = model.predict_proba(input_df)
        risk_probability = float(probabilities[0][0]) # Class 0 (High Risk)

        return jsonify({
            'message': 'Prediction successful',
            'probability_high_risk': risk_probability
        }), 200
    except Exception as e:
        print(f"❌ Error during prediction: {e}")
        return jsonify({'error': f'Internal server error: {e}'}), 500

# --- 8. AI CHATBOT ROUTE (v5.1 - UPGRADED PROMPT) ---
@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    
    # --- THIS IS THE NEW, "ADVANCED" PROMPT ---
    SYSTEM_PROMPT = (
        "You are HealthBot, the friendly AI assistant for **HealthPrism**. "
        "Your goal is to be subtle, on-point, and informative. "
        
        "--- YOUR KNOWLEDGE BASE ---"
        "1.  **Website Name:** HealthPrism."
        "2.  **Mission:** To make healthcare smarter, more accessible, and proactive."
        "3.  **Heart Risk Predictor:** HealthPrism uses an **optimized 8-feature Machine Learning model** (Random Forest) to give a risk score. The 8 features are: age, trestbps, chol, thalach, oldpeak, cp, ca, and thal."
        "4.  **Stress Predictor:** HealthPrism has a *second* ML model that predicts a user's stress level (Low, Moderate, High) based on biometrics like sleep, heart rate, and steps."
        "5.  **AI Planners:** The app has an 'AI Nutrition Planner' and an 'AI Stress Coach' that use the user's heart risk score to generate personalized plans."
        
        "--- YOUR RULES (VERY STRICT) ---"
        "1.  **BE HYPER-CONCISE:** Your answers **MUST be 1-2 sentences. 3 is the absolute maximum.** This is a quick-info bot."
        "2.  **USE YOUR KNOWLEDGE:** Answer questions about HealthPrism using the knowledge base. (e.g., if asked 'how does the predictor work?', mention the 8 optimized features)."
        "3.  **NO MEDICAL ADVICE (BE POLITE):** You are NOT a doctor. You **MUST NOT** give medical advice, diagnoses, or specific number ranges (like 'a healthy BP is 120/80'). "
        "   When you deflect, be polite and natural. Instead of saying 'it falls outside my scope,' say: "
        "   'That's a great question for a doctor, as they can give you advice based on your personal health.' or "
        "   'Specific ranges are different for everyone, so I recommend consulting a medical professional.'"
    )
    # --- END OF NEW PROMPT ---

    data = request.json
    user_message = data.get('messages', [{}])[-1].get('text', '')
    
    risk_score = data.get('riskScore')

    if not user_message: 
        return jsonify({'answer': '...'})
    
    if risk_score is not None:
        risk_percentage = round(risk_score * 100, 1)
        USER_PROMPT = f"""
        (My current heart risk score is {risk_percentage}%. Keep this in mind, but DO NOT mention it unless I ask about it.)
        User's question: "{user_message}"
        """
    else:
        USER_PROMPT = user_message
    
    try:
        apiKey = os.getenv("GEMINI_API_KEY")
        if not apiKey: raise Exception("GEMINI_API_KEY not found")
            
        apiUrl = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key={apiKey}"
        
        payload = {
            "contents": [{"parts": [{"text": USER_PROMPT}]}],
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]}
        }
        headers = {'Content-Type': 'application/json'}
        
        response = requests.post(apiUrl, json=payload, headers=headers, verify=False)
        response.raise_for_status() 
        result = response.json()
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        if not text: raise Exception("No text found in API response")
        return jsonify({'answer': text})
    except Exception as e:
        print(f"❌ Error processing chatbot request: {e}")
        return jsonify({'answer': 'Sorry, I\'m facing a technical issue.'}), 500

# --- 9. AI NUTRITION PLANNER ROUTE ---
@app.route('/api/nutrition-planner', methods=['POST'])
def nutrition_planner():
    SYSTEM_PROMPT = (
        "You are an expert AI Nutritionist... "
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
    Please generate a 3-day sample meal plan for me...
    - My LATEST HEART RISK SCORE: {risk_text}
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
        response = requests.post(apiUrl, json=payload, headers=headers, verify=False)
        response.raise_for_status()
        result = response.json()
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        if not text: raise Exception("No text found in API response")
        return jsonify({'meal_plan': text})
    except Exception as e:
        print(f"❌ Error processing nutrition plan request: {e}")
        return jsonify({'error': 'Sorry, I\'m facing a technical issue.'}), 500

# --- 10. ADVANCED AI STRESS COACH (GenAI + NLP) ---
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
    Please generate a 2-3 step, simple stress-relief plan for me...
    - My LATEST HEART RISK SCORE: {risk_text}
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
        response = requests.post(apiUrl, json=payload, headers=headers, verify=False)
        response.raise_for_status()
        result = response.json()
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        if not text: raise Exception("No text found in API response")
        return jsonify({'stress_plan': text})
    except Exception as e:
        print(f"❌ Error processing stress plan request: {e}")
        return jsonify({'error': 'Sorry, I\'m facing a technical issue.'}), 500

# --- 11. Run the Application ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)