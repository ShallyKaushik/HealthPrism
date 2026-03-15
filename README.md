# HealthPrism 🩺💎

**HealthPrism** is a state-of-the-art health diagnostic and wellness intelligence platform. It combines predictive machine learning models with advanced generative AI coaching to provide a 360-degree view of your wellbeing.

---

## 🚀 Key Features

- **❤️ Heart Risk Assessment**: High-accuracy prediction using an optimized 8-feature ML pipeline.
- **🧠 Advanced Stress Coaching**: NLP-enhanced stress detection using physiological data and journal sentiment analysis.
- **💬 AI HealthBot**: A personal wellness assistant powered by Google Gemini.
- **🥗 Personalized Nutrition**: Meal plans generated dynamically based on your real-time heart health metrics.
- **📊 Health Timeline**: Track your diagnostic results over time with interactive charts.
- **🔐 Secure Auth**: Robust user authentication system powered by JWT and MongoDB.

---

## 🛠️ Technology Stack

| Layer | Component |
| :--- | :--- |
| **Frontend** | React 19, Tailwind CSS, Framer Motion, Recharts |
| **Backend** | Flask (Python), JWT, Bcrypt |
| **Machine Learning** | Scikit-Learn, Joblib, VADER Sentiment |
| **Artificial Intelligence** | Google Gemini 1.5 Flash |
| **Database** | MongoDB (Local/Cloud Support) |

---

## 📂 Project Structure

- `frontend/`: The React application UI and components.
- `backend/`: Flask API, ML models (`.joblib`), and AI integration logic.
- `heart_data.csv` & `stress_data.csv`: Source datasets for model training.
- `train_*.py`: Model training and retraining pipelines for environment synchronization.

---

## 🛠️ Setup & Execution

### 1. Prerequisites
- Python 3.9+
- Node.js & npm
- MongoDB (running locally or a cloud URI)

### 2. Backend Setup
```bash
cd backend
python -m venv hola
.\hola\Scripts\activate  # Windows
# source hola/bin/activate  # Linux/Mac
pip install -r requirements.txt
python app.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. Configuration
Create a `backend/.env` file with:
```env
GEMINI_API_KEY="your_api_key_here"
MONGO_URI="mongodb://localhost:27017/"
SECRET_KEY="your_secret_key"
JWT_SECRET_KEY="your_jwt_secret"
```

---

## 🧠 How It Works

1. **Diagnostics**: When you submit your health metrics, the backend pipes them into pre-trained **Random Forest** and **Decision Tree** models.
2. **Sentiment Analysis**: For stress tests, the system uses **VADER** to score the emotional tone of your journal entries, which acts as a pivot feature for the stress model.
3. **Generative Coaching**: The **Gemini AI** receives your diagnostic "Risk Score" and provides context-aware advice (e.g., suggesting low-sodium meals if heart risk is high).

---

## ⚖️ License
Personal/Educational Use.

*Disclaimer: HealthPrism is a diagnostic assistant and not a replacement for professional medical advice.*
