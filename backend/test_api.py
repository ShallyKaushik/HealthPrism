import requests
import json
import time

url = "http://127.0.0.1:5000/api/predict-stress"
payload = {
    "Age": "30",
    "Gender": "Male",
    "Occupation": "Doctor",
    "Sleep Duration": "7",
    "Quality of Sleep": "8",
    "Physical Activity Level": "60",
    "BMI Category": "Normal",
    "Blood Pressure": "120/80",
    "Heart Rate": "70",
    "Daily Steps": "8000",
    "journal_text": "I had a terrible day today."
}
headers = {'Content-Type': 'application/json'}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=4))
except Exception as e:
    print(f"Failed to connect or error occurred: {e}")
