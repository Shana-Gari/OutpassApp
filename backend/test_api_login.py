import requests
import json

url = 'http://127.0.0.1:8000/api/auth/login/'
data = {
    'phone': '9000000001',
    'password': 'IES_SDA',
    'role': 'PARENT'
}

print(f"Testing Login to {url}...")
try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
