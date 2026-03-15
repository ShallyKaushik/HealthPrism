import os
import requests
from dotenv import load_dotenv

load_dotenv()
apiKey = os.getenv("GEMINI_API_KEY")

apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
payload = {
    "contents": [{"parts": [{"text": "Hello, how are you?"}]}],
    "systemInstruction": {"parts": [{"text": "You are a test bot."}]}
}
headers = {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey 
}

try:
    response = requests.post(apiUrl, json=payload, headers=headers)
    print("Status Code:", response.status_code)
    print("Response body:", response.text)
except Exception as e:
    print(f"Request failed: {e}")
