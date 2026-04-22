import os
import json
from openai import OpenAI

def get_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("WARNING: OPENAI_API_KEY not found in environment variables.")
        return None
    return OpenAI(api_key=api_key)

def generate_response(prompt, max_tokens=500):
    """Generic text generation via OpenAI gpt-4o-mini."""
    client = get_client()
    if not client:
        return "Error: OpenAI API key is missing."
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful and expert AI healthcare assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI Generation Error: {str(e)}")
        return f"Error communicating with AI: {str(e)}"

def generate_heart_explanation(user_data, risk_probability):
    """
    Takes the core ML output and user metrics and asks OpenAI to explain the risk factors.
    Returns a strict JSON format string.
    """
    client = get_client()
    
    # Calculate simple enum string for prompt context
    risk_level = "Low"
    if risk_probability > 0.3: risk_level = "Medium"
    if risk_probability > 0.6: risk_level = "High"

    system_prompt = (
        "You are an expert cardiologist AI. You will be provided with a patient's health metrics and their machine-learning predicted heart risk probability. "
        "You must analyze the inputs and provide a clear, empathetic explanation and simple actionable advice. "
        "You MUST return your response as a raw JSON string matching exactly this format (no markdown code blocks, just raw JSON):\n"
        "{\n"
        '  "risk_score": 0.0,\n'
        '  "risk_level": "Low/Medium/High",\n'
        '  "explanation": "...",\n'
        '  "advice": ["advice 1", "advice 2"]\n'
        "}"
    )

    user_prompt = (
        f"Patient Data: {json.dumps(user_data)}\n"
        f"ML Computed Risk Probability: {risk_probability:.2f}\n"
        f"Generate the comprehensive JSON explanation."
    )

    if not client:
        # Failsafe if no API key
        return {
            "risk_score": float(f"{risk_probability:.2f}"),
            "risk_level": risk_level,
            "explanation": "OpenAI API integration is pending or offline. Please contact your physician for an interpretation of these metrics.",
            "advice": ["Consult a doctor", "Monitor your biometrics regularly"]
        }

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.5,
            response_format={ "type": "json_object" } 
        )
        # Safely parse the JSON string back to a python dictionary
        result_json = json.loads(response.choices[0].message.content)
        return result_json
    except Exception as e:
        print(f"OpenAI Heart Explanation Error: {str(e)}")
        # Failsafe if API throws an error
        return {
            "risk_score": float(f"{risk_probability:.2f}"),
            "risk_level": risk_level,
            "explanation": "We encountered an issue generating your dynamic insight. However, your machine learning prediction succeeded.",
            "advice": ["Follow general heart-healthy guidelines", "Stay hydrated and active"]
        }
