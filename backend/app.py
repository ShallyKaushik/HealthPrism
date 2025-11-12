# app.py (rewritten)
import os
import joblib
import pandas as pd
import requests
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- 1. IMPORTS ---
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

# JWT imports: we'll try to import the newer helper, otherwise provide a compatible fallback.
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
)

# Try to import optional verification helper (newer versions)
try:
    from flask_jwt_extended import verify_jwt_in_request_optional  # available in newer v4.x
    _HAS_VERIFY_OPTIONAL = True
except Exception:
    # Fallback for older versions
    from flask_jwt_extended import verify_jwt_in_request
    from flask_jwt_extended.exceptions import NoAuthorizationError
    _HAS_VERIFY_OPTIONAL = False

load_dotenv()

# --- 2. Initialize Application ---
app = Flask(__name__)
CORS(app)

# --- 3. CONFIGURATION ---
db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'database.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-secret-key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'default-jwt-key')

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)


# -------------------------
# 4. DATABASE MODELS
# -------------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    predictions = db.relationship('Prediction', backref='user', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)


class Prediction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    probability = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, server_default=db.func.now())
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # input fields
    age = db.Column(db.Integer)
    sex = db.Column(db.Integer)
    cp = db.Column(db.Integer)
    trestbps = db.Column(db.Integer)
    chol = db.Column(db.Integer)
    fbs = db.Column(db.Integer)
    restecg = db.Column(db.Integer)
    thalach = db.Column(db.Integer)
    exang = db.Column(db.Integer)
    oldpeak = db.Column(db.Float)
    slope = db.Column(db.Integer)
    ca = db.Column(db.Integer)
    thal = db.Column(db.Integer)


# -------------------------
# 5. Load ML model
# -------------------------
MODEL_FILE = 'heart_risk_pipeline.joblib'
try:
    model = joblib.load(MODEL_FILE)
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

NUMERIC_FEATURES = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']
CATEGORICAL_FEATURES = ['sex', 'cp', 'fbs', 'restecg', 'exang', 'slope', 'ca', 'thal']
ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


# -------------------------
# Utility: optional JWT verify (supports old/new versions)
# -------------------------
def optionally_verify_jwt():
    """
    Verify JWT if present. Works with both older and newer flask-jwt-extended versions.
    Returns: None (but sets current identity for get_jwt_identity()).
    """
    if _HAS_VERIFY_OPTIONAL:
        # newer function: does the job and won't pre-parse the body unexpectedly
        verify_jwt_in_request_optional()
        return
    # fallback for older versions
    try:
        verify_jwt_in_request()
    except NoAuthorizationError:
        # no token present — that's fine
        return


# -------------------------
# 6. AUTH ROUTES
# -------------------------
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json(force=True, silent=True)
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400

        if User.query.filter_by(username=data.get('username')).first():
            return jsonify({'error': 'Username already exists'}), 400

        new_user = User(username=data.get('username'))
        new_user.set_password(data.get('password'))
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User registered successfully', 'user_id': new_user.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json(force=True, silent=True)
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400

        user = User.query.filter_by(username=data.get('username')).first()

        if user and user.check_password(data.get('password')):
            access_token = create_access_token(identity=user.id)
            return jsonify({'access_token': access_token}), 200

        return jsonify({'error': 'Invalid username or password'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# -------------------------
# 7. Prediction Route (fixed: manual JWT verify)
# -------------------------
@app.route('/api/predict', methods=['POST'])
def predict():
    # verify token if present (but don't let JWT pre-parse/raise 422)
    optionally_verify_jwt()
    current_user_id = get_jwt_identity()

    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500

    try:
        # parse robustly even if content-type header is missing
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400

        # Debug log (server console)
        print("📦 Received predict payload:", data)

        # validate presence of required features
        missing = [f for f in ALL_FEATURES if f not in data]
        if missing:
            return jsonify({'error': f'Missing fields: {missing}'}), 400

        # Build dataframe and cast types
        input_df = pd.DataFrame([data])
        for col in NUMERIC_FEATURES:
            input_df[col] = input_df[col].astype(float)
        for col in CATEGORICAL_FEATURES:
            input_df[col] = input_df[col].astype(int)

        input_df = input_df[ALL_FEATURES]

        # Model inference
        probabilities = model.predict_proba(input_df)
        # depending on how your pipeline arranges classes, choose appropriate index; using [0][0] like your code
        risk_probability = float(probabilities[0][0])

        # Save if user is authenticated
        if current_user_id:
            try:
                new_prediction = Prediction(
                    probability=risk_probability,
                    user_id=current_user_id,
                    age=int(data.get('age')),
                    sex=int(data.get('sex')),
                    cp=int(data.get('cp')),
                    trestbps=int(data.get('trestbps')),
                    chol=int(data.get('chol')),
                    fbs=int(data.get('fbs')),
                    restecg=int(data.get('restecg')),
                    thalach=int(data.get('thalach')),
                    exang=int(data.get('exang')),
                    oldpeak=float(data.get('oldpeak')),
                    slope=int(data.get('slope')),
                    ca=int(data.get('ca')),
                    thal=int(data.get('thal')),
                )
                db.session.add(new_prediction)
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"❌ Error saving prediction to DB: {e}")

        return jsonify({
            'message': 'Prediction successful',
            'probability_high_risk': risk_probability
        }), 200

    except Exception as e:
        print(f"❌ Error during prediction: {e}")
        return jsonify({'error': f'Internal server error: {e}'}), 500


# -------------------------
# 8. PREDICTION HISTORY ROUTE
# -------------------------
from flask_jwt_extended import jwt_required  # keep decorator for protected history

@app.route('/api/prediction-history', methods=['GET'])
@jwt_required()
def prediction_history():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        predictions = Prediction.query.filter_by(user_id=current_user_id).order_by(Prediction.timestamp.desc()).all()

        history = [
            {
                'id': p.id,
                'probability': p.probability,
                'timestamp': p.timestamp.isoformat(),
                'inputs': {
                    'age': p.age, 'sex': p.sex, 'cp': p.cp, 'trestbps': p.trestbps,
                    'chol': p.chol, 'fbs': p.fbs, 'restecg': p.restecg,
                    'thalach': p.thalach, 'exang': p.exang, 'oldpeak': p.oldpeak,
                    'slope': p.slope, 'ca': p.ca, 'thal': p.thal
                }
            }
            for p in predictions
        ]

        return jsonify(username=user.username, history=history), 200
    except Exception as e:
        print(f"❌ Error fetching history: {e}")
        return jsonify({'error': f'Internal server error: {e}'}), 500


# -------------------------
# 9. ANONYMOUS AI ROUTES (minor bug fixes)
# -------------------------
@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    SYSTEM_PROMPT = "You are HealthBot, a friendly and helpful AI assistant..."
    data = request.get_json(force=True, silent=True) or {}
    user_message = (data.get('messages', [{}])[-1].get('text', '')).strip()
    if not user_message:
        return jsonify({'answer': '...'}), 200

    try:
        apiKey = os.getenv("GEMINI_API_KEY")
        if not apiKey:
            raise Exception("GEMINI_API_KEY not found")

        # NOTE: user should replace the below URL with the correct, up-to-date API endpoint for their model.
        apiUrl = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key={apiKey}"
        payload = {
            "contents": [{"parts": [{"text": user_message}]}],
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]}
        }
        headers = {'Content-Type': 'application/json'}
        response = requests.post(apiUrl, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        if not text:
            raise Exception("No text found in API response")
        return jsonify({'answer': text}), 200
    except Exception as e:
        print(f"❌ Error processing chatbot request: {e}")
        return jsonify({'answer': 'Sorry, I\'m facing a technical issue.'}), 500


@app.route('/api/nutrition-planner', methods=['POST'])
def nutrition_planner():
    SYSTEM_PROMPT = "You are an expert AI Nutritionist..."
    data = request.get_json(force=True, silent=True) or {}
    age = data.get('age'); goal = data.get('goal'); restrictions = data.get('restrictions'); risk_score = data.get('riskScore')
    if not age or not goal:
        return jsonify({'error': 'Missing required fields (age or goal).'}), 400

    risk_text = "N/A"
    if risk_score is not None:
        risk_percentage = round(risk_score * 100, 1)
        if risk_score > 0.7:
            risk_text = f"{risk_percentage}% (VERY HIGH risk...)"
        elif risk_score > 0.5:
            risk_text = f"{risk_percentage}% (HIGH risk...)"
        elif risk_score > 0.3:
            risk_text = f"{risk_percentage}% (BORDERLINE...)"
        else:
            risk_text = f"{risk_percentage}% (LOW risk...)"

    USER_PROMPT = f"""
Please generate a 3-day sample meal plan for me.
- My Age: {age}
- My Health Goal: {goal}
- My Dietary Restrictions: {restrictions}
- My LATEST HEART RISK SCORE: {risk_text}
IMPORTANT: You MUST tailor the meal plan to be appropriate for my heart risk score.
"""
    try:
        apiKey = os.getenv("GEMINI_API_KEY")
        if not apiKey:
            raise Exception("GEMINI_API_KEY not found")

        apiUrl = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.S5-flash-preview-09-2025:generateContent?key={apiKey}"
        payload = {
            "contents": [{"parts": [{"text": USER_PROMPT}]}],
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]}
        }
        headers = {'Content-Type': 'application/json'}
        response = requests.post(apiUrl, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        if not text:
            raise Exception("No text found in API response")
        return jsonify({'meal_plan': text}), 200
    except Exception as e:
        print(f"❌ Error processing nutrition plan request: {e}")
        return jsonify({'error': 'Sorry, I\'m facing a technical issue.'}), 500


@app.route('/api/stress-coach', methods=['POST'])
def stress_coach():
    SYSTEM_PROMPT = "You are an AI Stress & Wellness Coach..."
    data = request.get_json(force=True, silent=True) or {}
    topic = data.get('topic'); risk_score = data.get('riskScore')
    if not topic:
        return jsonify({'error': 'Missing form data.'}), 400

    risk_text = "N/A"
    if risk_score is not None:
        risk_percentage = round(risk_score * 100, 1)
        if risk_score > 0.5:
            risk_text = f"{risk_percentage}% (HIGH risk)"
        else:
            risk_text = f"{risk_percentage}% (LOW/BORDERLINE risk)"

    USER_PROMPT = f"""
Please generate a 2-3 step, simple stress-relief plan for me.
- My Main Stressor: {topic}
- My LATEST HEART RISK SCORE: {risk_text}
Please make the plan specific to my stressor and acknowledge my heart risk level.
"""
    try:
        apiKey = os.getenv("GEMINI_API_KEY")
        if not apiKey:
            raise Exception("GEMINI_API_KEY not found")

        apiUrl = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key={apiKey}"
        payload = {
            "contents": [{"parts": [{"text": USER_PROMPT}]}],
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]}
        }
        headers = {'Content-Type': 'application/json'}
        response = requests.post(apiUrl, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        if not text:
            raise Exception("No text found in API response")
        return jsonify({'stress_plan': text}), 200
    except Exception as e:
        print(f"❌ Error processing stress plan request: {e}")
        return jsonify({'error': 'Sorry, I\'m facing a technical issue.'}), 500


# -------------------------
# 10. Run the Application
# -------------------------
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    print("✅ Server running on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
