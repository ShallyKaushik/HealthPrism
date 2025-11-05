import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- 1. Initialize Application ---
app = Flask(__name__)
# This simple CORS is all we need. It will fix the errors.
CORS(app) 

# --- 2. Load The Model ---
try:
    model = joblib.load('heart_risk_pipeline.joblib')
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

# --- 3. Define Feature Lists ---
NUMERIC_FEATURES = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']
CATEGORICAL_FEATURES = ['sex', 'cp', 'fbs', 'restecg', 'exang', 'slope', 'ca', 'thal']
ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


# --- 4. Prediction Route (Simple, No Login) ---
@app.route('/api/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model is not loaded'}), 500

    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400

        input_df = pd.DataFrame([data])
        for col in NUMERIC_FEATURES:
            input_df[col] = input_df[col].astype(float)
        for col in CATEGORICAL_FEATURES:
            input_df[col] = input_df[col].astype(int)
        input_df = input_df[ALL_FEATURES]

        probabilities = model.predict_proba(input_df)
        risk_probability = float(probabilities[0][0]) # Class 0 (High Risk)

        return jsonify({
            'message': 'Prediction successful',
            'probability_high_risk': risk_probability
        }), 200

    except Exception as e:
        print(f"❌ Error during prediction: {e}")
        return jsonify({'error': f'Internal server error: {e}'}), 500

# --- 5. Run the Application ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)