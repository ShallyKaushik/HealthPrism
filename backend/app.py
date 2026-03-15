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
import jwt
import bcrypt
import datetime
from functools import wraps
from pymongo import MongoClient
from bson.objectid import ObjectId

# --- 2. SETUP ---
load_dotenv()
import sklearn
print(f"DEBUG: Sklearn Version: {sklearn.__version__}")
print(f"DEBUG: CWD: {os.getcwd()}")
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
CORS(app)

# --- 3.1 MongoDB Setup ---
mongo_uri = os.getenv("MONGO_URI")
try:
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    db = client['HealthPrism']
    # Trigger connection to verify
    db.command('ismaster')
    users_collection = db.users
    heart_predictions_collection = db.heart_predictions
    stress_predictions_collection = db.stress_predictions
    print(f"✅ Connected to MongoDB. Database: {db.name}")
    print(f"DEBUG: Collections: {db.list_collection_names()}")
except Exception as e:
    print(f"⚠️ Warning: Could not connect to MongoDB. Database features will be disabled. Error: {e}")
    db = None
    users_collection = None
    heart_predictions_collection = None
    stress_predictions_collection = None

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
    print("✅ OPTIMIZED Heart Model (Top 8 Features) loaded successfully!")
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
        
        return jsonify({
            'message': 'Login successful',
            'access_token': token,
            'user': {
                'fullname': user['fullname'],
                'email': user['email'],
                'is_admin': user.get('is_admin', False)
            }
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
        
        apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
        
        payload = {
            "contents": [{"parts": [{"text": user_message}]}],
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

# --- 12. Run the Application ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)