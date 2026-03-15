import requests
import json

url = "http://127.0.0.1:5000/api/predict"
payload = {
    "age": 45,
    "trestbps": 120,
    "chol": 220,
    "thalach": 150,
    "oldpeak": 1.5,
    "cp": 1,
    "ca": 0,
    "thal": 2
}
headers = {'Content-Type': 'application/json'}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=4))
except Exception as e:
    print(f"Failed to connect or error occurred: {e}")
