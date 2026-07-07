# backend/app.py

import joblib
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
import numpy as np

# --- 1. IMPORTS FOR ADVANCED FEATURES ---
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import urllib3
import jwt
import bcrypt
import datetime
from functools import wraps
from pymongo import MongoClient
from bson.objectid import ObjectId

# --- 2. SETUP ---
load_dotenv(override=True)
import sklearn

from services.openai_service import generate_heart_explanation
from services.nutrition_rag_service import rag_service as nutrition_rag_service
from services.chatbot_service import chatbot_service
from services.ai_router import ai_router

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
# Strict CORS for production
CORS(app, origins=[os.getenv("FRONTEND_URL", "*")])

# --- 3.1 MongoDB Setup ---
mongo_uri = os.getenv("MONGO_URI")
try:
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    db = client['HealthPrism']
    users_collection = db.users
    heart_predictions_collection = db.heart_predictions
    stress_predictions_collection = db.stress_predictions
    chats_collection = db.chats
    print(f"Connected to MongoDB. Database: {db.name}")
    print(f"DEBUG: Collections: {db.list_collection_names()}")
except Exception as e:
    print(f"Warning: Could not connect to MongoDB. Database features will be disabled. Error: {e}")
    db = None
    users_collection = None
    heart_predictions_collection = None
    stress_predictions_collection = None
    chats_collection = None

# --- 3.2 JWT & Auth Helpers ---
SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your_jwt_secret_key")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
            if users_collection is None:
                return jsonify({'error': 'Database is unavailable!'}), 503
            current_user = users_collection.find_one({'_id': ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'error': 'User not found!'}), 401
        except Exception as e:
            return jsonify({'error': 'Token is invalid!', 'message': str(e)}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if not current_user.get('is_admin', False):
            return jsonify({'error': 'Admin privilege required!'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

# --- 4. Load ALL OUR ML Models ---

# Model 1: Heart Risk (Optimized 8-Feature)
try:
    heart_model = joblib.load('heart_risk_pipeline.joblib')
    print("OPTIMIZED Heart Model (Top 8 Features) loaded successfully!")
except Exception as e:
    print(f"Error loading Heart model: {e}")
    heart_model = None

# Model 2: Stress Predictor (NEW v2 with NLP)
try:
    stress_model = joblib.load('stress_model_v2.joblib')
    print("NEW Stress Model v2 (with NLP) loaded successfully!")
except Exception as e:
    print(f"Error loading Stress model v2: {e}")
    stress_model = None
# --- END OF MODEL LOADING ---

# --- 5. Initialize NLP Analyzer ---
sentiment_analyzer = SentimentIntensityAnalyzer()
print("VADER Sentiment Analyzer loaded successfully!")

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
        
        # Add OpenAI generated explanation
        explanation_data = generate_heart_explanation(data, risk_probability)

        return jsonify({
            'message': 'Prediction successful',
            'probability_high_risk': risk_probability,
            'ai_explanation': explanation_data
        }), 200
    except Exception as e:
        print(f" Error during heart prediction: {e}")
        return jsonify({'error': f'Internal server error: {e}'}), 500

# --- 7.5 NEW: Nutrition Plan Route (Direct OpenAI) ---
@app.route('/api/nutrition-plan', methods=['POST'])
def nutrition_plan():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
            
        plan = nutrition_rag_service.build_nutrition_plan(data)
        
        # DEBUG: Log the plan structure before returning
        if plan and 'days' in plan:
            print("--- NUTRITION PLAN OUTPUT ---")
            for d in plan['days']:
                dishes = [m.get('dish', '?') for m in d.get('meals', [])]
                print(f"  Day {d.get('day')}: {dishes}")
            print("--- END ---")
        
        return jsonify(plan), 200
    except Exception as e:
        print(f"Error generating nutrition plan: {e}")
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
        print(f"Error during stress prediction: {e}")
        return jsonify({'error': f'Internal server error: {e}'}), 500
# --- END OF NEW STRESS ROUTE ---

# --- 8.0 NEW: rPPG Heart Rate Calculation Route ---
@app.route('/api/rppg', methods=['POST'])
def calculate_rppg():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
            
        r_vals = data.get('r', [])
        g_vals = data.get('g', [])
        b_vals = data.get('b', [])
        values = data.get('values', []) # Fallback for old single-channel
        
        fps = data.get('fps', 30.0)
        
        # 1. Calculate combined Signal using selection
        if r_vals and g_vals and b_vals and len(g_vals) >= 30:
            # --- ADVANCED POS (Plane-Orthogonal-to-Skin) ALGORITHM ---
            R = np.array(r_vals, dtype=float)
            G = np.array(g_vals, dtype=float)
            B = np.array(b_vals, dtype=float)
            
            # Normalize with mean (avoid zero division)
            Rn = R / (np.mean(R) + 1e-6)
            Gn = G / (np.mean(G) + 1e-6)
            Bn = B / (np.mean(B) + 1e-6)
            
            # Create Projection vectors
            S1 = Rn - Gn
            S2 = Rn + Gn - 2 * Bn
            
            # Combine based on standard deviation ratios (motion cancel)
            std1 = np.std(S1)
            std2 = np.std(S2)
            alpha = std1 / (std2 + 1e-6)
            
            y = S1 + alpha * S2
        elif values and len(values) >= 30:
            # Fallback to single channel Green (backward compatibility)
            y = np.array(values, dtype=float)
        else:
            return jsonify({'error': 'Insufficient data points (need at least 30)'}), 400
            
        from scipy.signal import butter, filtfilt, welch
            
        # 2. Detrend (remove slow drift)
        y = y - np.mean(y)
        
        # 3. Butterworth Bandpass Filter (0.75 Hz to 3.5 Hz)
        try:
            nyquist = fps / 2.0
            low = 0.75 / nyquist
            high = 3.5 / nyquist
            b, a = butter(2, [low, high], btype='bandpass')
            y_filtered = filtfilt(b, a, y)
        except Exception as e:
            print(f"Filter error: {e}, falling back to standard signal")
            y_filtered = y
            
        # 4. Welch's Method for Power Spectral Density (PSD) estimation
        try:
            n_seg = min(len(y_filtered), 128) # Segment size for averaging
            f, pxx = welch(y_filtered, fs=fps, nperseg=n_seg, nfft=1024)
        except Exception as e:
            print(f"Welch error: {e}, falling back to FFT")
            # Fallback to FFT on filtered signal
            n = len(y_filtered)
            f = np.fft.fftfreq(n, 1/fps)
            pxx = np.abs(np.fft.fft(y_filtered))
             
        # Find peak only in allowable heart rate band (45 - 210 BPM)
        mask = (f >= 0.75) & (f <= 3.5)
        f_valid = f[mask]
        pxx_valid = pxx[mask]
        
        if len(pxx_valid) == 0:
             return jsonify({'bpm': 0, 'message': 'No periodic heart rate signal found'}), 200
             
        peak_idx = np.argmax(pxx_valid)
        bpm = f_valid[peak_idx] * 60
        
        return jsonify({
            'message': 'Advanced rPPG (POS + Butterworth + Welch) calculation successful',
            'bpm': round(float(bpm), 1)
        }), 200
        
    except Exception as e:
        print(f"Error during advanced rPPG calculation: {e}")
        return jsonify({'error': f'Internal server error: {e}'}), 500
# --- END OF rPPG ROUTE ---


# --- 8.1 AUTH ROUTES ---

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        if not data or not data.get('email') or not data.get('password') or not data.get('fullname'):
            return jsonify({'error': 'Name, email and password are required'}), 400
        
        fullname = data.get('fullname')
        email = data.get('email')
        password = data.get('password')
        
        if len(password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400

        if users_collection is None:
            return jsonify({'error': 'Database is unavailable!'}), 503

        if users_collection.find_one({'email': email}):
            return jsonify({'error': 'User with this email already exists'}), 400
            
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        user_id = users_collection.insert_one({
            'fullname': fullname,
            'email': email,
            'password': hashed_password,
            'is_admin': data.get('is_admin', False),
            'created_at': datetime.datetime.utcnow()
        }).inserted_id
        
        return jsonify({'message': 'User registered successfully', 'user_id': str(user_id)}), 201
    except Exception as e:
         return jsonify({'error': f'Internal server error: {e}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
            
        email = data.get('email')
        password = data.get('password')
        
        if users_collection is None:
            return jsonify({'error': 'Database is unavailable!'}), 503

        user = users_collection.find_one({'email': email})
        if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
            
        token = jwt.encode({
            'user_id': str(user['_id']),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, JWT_SECRET_KEY, algorithm="HS256")
        
        user_data = {k: v for k, v in user.items() if k != 'password'}
        user_data['_id'] = str(user_data['_id'])

        return jsonify({
            'message': 'Login successful',
            'access_token': token,
            'user': user_data
        }), 200
    except Exception as e:
        return jsonify({'error': f'Internal server error: {e}'}), 500

@app.route('/api/debug/db', methods=['GET'])
def debug_db():
    try:
        if db is None:
            return jsonify({'error': 'Database is unavailable!'}), 503
        stats = {
            'db_name': db.name,
            'collections': db.list_collection_names(),
            'user_count': users_collection.count_documents({}),
            'heart_count': heart_predictions_collection.count_documents({}),
            'stress_count': stress_predictions_collection.count_documents({})
        }
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users', methods=['GET'])
@token_required
@admin_required
def get_all_users(current_user):
    try:
        users = list(users_collection.find({}, {'password': 0}))
        for user in users:
            user['_id'] = str(user['_id'])
        return jsonify({'users': users}), 200
    except Exception as e:
        return jsonify({'error': f'Internal server error: {e}'}), 500

# --- 8.2 PREDICTION STORAGE ROUTES ---

@app.route('/api/predictions/heart', methods=['POST'])
@token_required
def save_heart_prediction(current_user):
    print(f"DEBUG: save_heart_prediction called by {current_user['email']}")
    try:
        if heart_predictions_collection is None:
            return jsonify({'error': 'Database is unavailable!'}), 503
        data = request.json
        print(f"DEBUG: Received data: {data}")
        prediction_entry = {
            'user_id': str(current_user['_id']),
            'probability': data.get('probability'),
            'inputs': data.get('inputs'),
            'timestamp': datetime.datetime.utcnow()
        }
        result = heart_predictions_collection.insert_one(prediction_entry)
        print(f"DEBUG: Successfully saved heart prediction: {result.inserted_id}")
        return jsonify({'message': 'Heart prediction saved successfully'}), 201
    except Exception as e:
        print(f"DEBUG: ERROR saving heart prediction: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/predictions/heart', methods=['GET'])
@token_required
def get_heart_history(current_user):
    try:
        if heart_predictions_collection is None:
            return jsonify({'history': []}), 200 # Return empty history if DB is down
        history = list(heart_predictions_collection.find({'user_id': str(current_user['_id'])}).sort('timestamp', -1))
        for item in history:
            item['_id'] = str(item['_id'])
        return jsonify({'history': history}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predictions/stress', methods=['POST'])
@token_required
def save_stress_prediction(current_user):
    print(f"DEBUG: save_stress_prediction called by {current_user['email']}")
    try:
        if stress_predictions_collection is None:
            return jsonify({'error': 'Database is unavailable!'}), 503
        data = request.json
        print(f"DEBUG: Received data: {data}")
        prediction_entry = {
            'user_id': str(current_user['_id']),
            'stress_level': data.get('stress_level'),
            'inputs': data.get('inputs'),
            'timestamp': datetime.datetime.utcnow()
        }
        result = stress_predictions_collection.insert_one(prediction_entry)
        print(f"DEBUG: Successfully saved stress prediction: {result.inserted_id}")
        return jsonify({'message': 'Stress prediction saved successfully'}), 201
    except Exception as e:
        print(f"DEBUG: ERROR saving stress prediction: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/predictions/stress', methods=['GET'])
@token_required
def get_stress_history(current_user):
    try:
        if stress_predictions_collection is None:
            return jsonify({'history': []}), 200 # Return empty history if DB is down
        history = list(stress_predictions_collection.find({'user_id': str(current_user['_id'])}).sort('timestamp', -1))
        for item in history:
            item['_id'] = str(item['_id'])
        return jsonify({'history': history}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


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
        # Construct the context for the router
        user_data = {
            "age": age,
            "goal": goal,
            "restrictions": restrictions,
            "health_context": f"Latest heart risk score: {risk_text}"
        }
        
        # Use AI Router for high-availability generation
        text = ai_router.generate_response(
            query=USER_PROMPT,
            user_data=user_data,
            history=[],
            context=SYSTEM_PROMPT
        )
        
        if not text: raise Exception("AI Router returned empty response")
        return jsonify({'meal_plan': text})
    except Exception as e:
        print(f"Error processing nutrition plan request: {e}")
        return jsonify({'error': str(e)}), 500






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
        # Construct the context for the router
        user_data = {
            "feeling": user_text,
            "sentiment": f"{sentiment_label} (Score: {sentiment_score})",
            "health_context": f"Latest heart risk score: {risk_text}"
        }
        
        # Use AI Router for high-availability generation
        text = ai_router.generate_response(
            query=USER_PROMPT,
            user_data=user_data,
            history=[],
            context=SYSTEM_PROMPT
        )
        
        if not text: raise Exception("AI Router returned empty response")
        return jsonify({'stress_plan': text})
    except Exception as e:
        print(f"Error processing stress plan request: {e}")
        return jsonify({'error': str(e)}), 500






# --- 12. RAG-Powered Chat with Health Domain Guardrails ---

@app.route('/api/rag-status', methods=['GET'])
def rag_status():
    """Health check endpoint for the RAG system."""
    try:
        from services.chatbot_service import chatbot_service as cs
        status = {
            'rag_active': cs.collection is not None,
            'chunks_loaded': cs.collection.count() if cs.collection else 0,
            'embedding_model': 'text-embedding-3-small',
            'guardrail': 'health-domain-only',
            'version': 'RAG v2.0'
        }
        return jsonify(status), 200
    except Exception as e:
        return jsonify({'rag_active': False, 'error': str(e)}), 200

@app.route('/api/chat', methods=['POST'])
@token_required
def chat(current_user):
    try:
        data = request.json
        user_query = data.get('message')
        if not user_query:
            return jsonify({'error': 'Message is required'}), 400

        # 1. Fetch History from DB (Last 10 messages)
        history_cursor = chats_collection.find(
            {'user_id': str(current_user['_id'])}
        ).sort('timestamp', -1).limit(10)
        
        # Reverse to get chronological order
        history = []
        for doc in list(history_cursor)[::-1]:
            history.append({'role': 'user', 'content': doc['message']})
            history.append({'role': 'assistant', 'content': doc['reply']})

        # 2. Prepare User Profile Context
        profile = {
            "fullname": current_user.get("fullname", "User"),
            "age": current_user.get("age", "30s"),
            "weight": current_user.get("weight", "--"),
            "diet_type": current_user.get("diet_type", "balanced health"),
            "goal": current_user.get("goal", "optimal wellness"),
            "risk_level": "Normal",
            "stress_level": "Stable"
        }
        
        # Latest heart prediction
        latest_heart = heart_predictions_collection.find_one(
            {'user_id': str(current_user['_id'])},
            sort=[('timestamp', -1)]
        )
        if latest_heart:
            prob = latest_heart.get('probability', 0)
            profile["risk_level"] = "High" if prob > 0.6 else "Medium" if prob > 0.3 else "Low"

        # Latest stress prediction
        latest_stress = stress_predictions_collection.find_one(
            {'user_id': str(current_user['_id'])},
            sort=[('timestamp', -1)]
        )
        if latest_stress:
            profile["stress_level"] = latest_stress.get('risk_level', 'Stable')

        # 3. Check health domain guardrail (pre-check for response metadata)
        from services.chatbot_service import is_health_related
        is_health = is_health_related(user_query)

        # 4. Generate response via RAG-powered ChatbotService
        reply = chatbot_service.generate_chat_response(user_query, profile, history)

        # 5. Save to History
        chats_collection.insert_one({
            'user_id': str(current_user['_id']),
            'message': user_query,
            'reply': reply,
            'timestamp': datetime.datetime.utcnow()
        })

        # 6. Return with metadata
        response_data = {
            'reply': reply,
            'rag_powered': chatbot_service.collection is not None,
            'health_domain': is_health,
        }

        return jsonify(response_data), 200

    except Exception as e:
        print(f"Chat API Error: {str(e)}")
        return jsonify({'error': 'Failed to process chat session'}), 500

if __name__ == '__main__':
    # Respect PORT env var for deployment (e.g. Render/Heroku)
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)