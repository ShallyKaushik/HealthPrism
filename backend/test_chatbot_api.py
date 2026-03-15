import requests
import json

url = "http://127.0.0.1:5000/api/chatbot"
payload = {
    "messages": [
        {"text": "Hello", "sender": "user"}
    ]
}
headers = {'Content-Type': 'application/json'}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=4))
except Exception as e:
    print(f"Failed to connect or error occurred: {e}")
