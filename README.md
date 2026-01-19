# 🩺 HealthPrism: AI-Powered Holistic Health Assistant

HealthPrism is a unified "v3.0" digital health platform that bridges the gap between physical diagnostics and daily wellness. Unlike fragmented health apps, HealthPrism combines **Predictive Machine Learning** (for risk assessment) with **Generative AI** (for personalized coaching) to create a connected, "glass-box" health ecosystem.

## 🚀 Key Features

### 🧠 Predictive AI (Machine Learning)
* **Heart Risk Predictor:** An optimized **Random Forest Classifier** trained on clinical data (UCI Heart Disease Dataset). It uses the top 8 impactful features to predict heart disease risk with **98.5% accuracy**.
* **Explainable AI (XAI):** Includes a "Risk Factors" engine that explains *why* a user is at risk (e.g., "High Cholesterol > 200 mg/dl").
* **Stress Level Predictor:** A secondary ML model analyzing 11 biometric & lifestyle markers (Sleep, BP, Steps) to classify stress levels.

### 🤖 Generative AI (Google Gemini API)
* **AI Nutrition Planner:** Generates 3-day meal plans tailored to your specific **Heart Risk Score** (e.g., recommending low-sodium diets for high-risk users).
* **AI Stress Coach:** A hybrid agent that combines **NLP Sentiment Analysis (VADER)** with your Heart Risk Score to provide empathetic, context-aware stress relief plans.
* **AI HealthBot:** A 24/7 assistant for general health Q&A.

### 🛡️ Architecture & Privacy
* **Privacy-First:** No central database. All prediction history is stored locally on the user's device using `localStorage`.
* **Smart Dashboard:** Visualizes health trends over time using interactive charts.
* **Decoupled Stack:** React Frontend + Flask Backend.

---

## 🛠️ Tech Stack

### Frontend
* **React.js:** Core UI framework.
* **Recharts:** For data visualization (prediction history graph).
* **React Router:** For seamless single-page navigation.
* **Context API:** For global state management ("Global Brain").

### Backend
* **Python / Flask:** REST API server.
* **Scikit-Learn:** Machine Learning model training and inference.
* **Pandas:** Data manipulation.
* **VADER Sentiment:** NLP for the Stress Coach.

### AI Services
* **Google Gemini API (1.5 Flash):** For all generative text tasks.

---

## ⚙️ Installation & Setup

Follow these steps to run the project locally.

### Prerequisites
* Node.js & npm installed
* Python 3.8+ installed

### 1. Clone the Repository
```bash
git clone https://github.com/ShallyKaushik/HealthPrism
cd HealthPrism
