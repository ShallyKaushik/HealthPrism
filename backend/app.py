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

# --- 4. Load ALL OUR ML Models ---

# Model 1: Heart Risk (Optimized 8-Feature)
try:
    heart_model = joblib.load('heart_risk_pipeline.joblib')
    print("✅ OPTIMIZED Heart Model (Top 8 Features) loaded successfully!")
except Exception as e:
    print(f"❌ Error loading Heart model: {e}")
    heart_model = None

# Model 2: Stress Predictor (NEW)
try:
    stress_model = joblib.load('stress_model.joblib')
    print("✅ NEW Stress Model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading Stress model: {e}")
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
    'Systolic BP', 'Diastolic BP'
]
STRESS_CATEGORICAL_FEATURES = [
    'Gender', 'Occupation', 'BMI Category'
]
ALL_STRESS_FEATURES = STRESS_NUMERIC_FEATURES + STRESS_CATEGORICAL_FEATURES


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
        print(f"❌ Error during heart prediction: {e}")
        return jsonify({'error': f'Internal server error: {e}'}), 500

# --- 8. NEW: Stress Prediction Route ---
@app.route('/api/predict-stress', methods=['POST'])
def predict_stress():
    if stress_model is None:
        return jsonify({'error': 'Stress model is not loaded'}), 500
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
        
        # We need to handle the Blood Pressure string split
        try:
            bp_split = data['Blood Pressure'].split('/')
            data['Systolic BP'] = int(bp_split[0])
            data['Diastolic BP'] = int(bp_split[1])
        except Exception as e:
            print(f"Error splitting BP: {e}")
            return jsonify({'error': 'Invalid Blood Pressure format. Must be "Systolic/Diastolic" (e.g., "120/80")'}), 400
        
        # Create DataFrame from the 10 input features
        input_df = pd.DataFrame([data])
        input_df = input_df[ALL_STRESS_FEATURES]
        
        # The model's pipeline will do all the scaling/encoding
        # It will predict "Low Stress", "Moderate Stress", or "High Stress"
        prediction_array = stress_model.predict(input_df)
        stress_level = prediction_array[0] # Get the string from the array
        
        return jsonify({
            'message': 'Stress prediction successful',
            'stress_level': stress_level
        }), 200
        
    except Exception as e:
        print(f"❌ Error during stress prediction: {e}")
        return jsonify({'error': f'Internal server error: {e}'}), 500
# --- END OF NEW STRESS ROUTE ---


# --- 9. AI CHATBOT ROUTE (GenAI) ---
@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    # ... (your existing chatbot code, no changes) ...
    SYSTEM_PROMPT = (
        "You are HealthBot, a friendly and helpful AI assistant..." 
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
        response = requests.post(apiUrl, json=payload, headers=headers, verify=False)
        response.raise_for_status() 
        result = response.json()
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        if not text: raise Exception("No text found in API response")
        return jsonify({'answer': text})
    except Exception as e:
        print(f"❌ Error processing chatbot request: {e}")
        return jsonify({'answer': 'Sorry, I\'m facing a technical issue.'}), 500

# --- 10. AI NUTRITION PLANNER ROUTE (GenAI + Risk Score) ---
@app.route('/api/nutrition-planner', methods=['POST'])
def nutrition_planner():
    # ... (your existing nutrition code, no changes) ...
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
    # ... (your existing stress coach code, no changes) ...
    SYSTEM_PROMPT = (
        "You are an AI Stress & Wellness Coach..."
    )
    data = request.json
    user_text = data.get('user_text'); risk_score = data.get('riskScore') 
    if not user_text: return jsonify({'error': 'Missing form data.'}), 400
    sentiment = sentiment_analyzer.polarity_scores(user_text)
    # ... (rest of NLP logic) ...
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

# --- 12. Run the Application ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)