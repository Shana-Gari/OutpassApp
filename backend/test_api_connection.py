import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def test_login():
    print(f"Testing connection to {BASE_URL}...")
    try:
        # 1. Login
        login_url = f"{BASE_URL}/auth/admin-login/"
        payload = {
            "phone": "9999999999",
            "password": "pass" # This is likely wrong based on logs, logs showed password=phone
        }
        # In logs: Login Attempt: Phone=9999999999, Password=9999999999
        payload["password"] = "9999999999"

        print(f"Attempting login with {payload['phone']}...")
        response = requests.post(login_url, json=payload)
        
        if response.status_code == 200:
            print("Login Successful!")
            token = response.json().get('access')
            return token
        else:
            print(f"Login Failed: {response.status_code} {response.text}")
            return None

    except Exception as e:
        print(f"Connection Error: {e}")
        return None

def test_endpoints(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Test Guardians (The one that 404'd)
    # The client was calling /api/students/guardians/ (404)
    # The code says /api/guardians/
    
    urls_to_test = [
        "/students/",
        "/guardians/",
        "/students/guardians/", # Testing the 404 path
    ]
    
    for path in urls_to_test:
        url = f"{BASE_URL}{path}"
        print(f"\nTesting {url}...")
        resp = requests.get(url, headers=headers)
        print(f"Status: {resp.status_code}")
        if resp.status_code != 200:
             print(f"Response: {resp.text[:100]}...")

if __name__ == "__main__":
    token = test_login()
    if token:
        test_endpoints(token)
