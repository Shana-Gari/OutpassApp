import requests

BASE_URL = "http://127.0.0.1:8000/api"

def test():
    try:
        # Login
        resp = requests.post(f"{BASE_URL}/auth/admin-login/", json={"phone": "9999999999", "password": "pass"}) # Assuming password logic
        # Actually logic is phone=password for dev.
        resp = requests.post(f"{BASE_URL}/auth/admin-login/", json={"phone": "9999999999", "password": "9999999999"})
        
        if resp.status_code != 200:
            print(f"Login Failed: {resp.status_code}")
            return

        token = resp.json()['access']
        headers = {"Authorization": f"Bearer {token}"}

        # Check Guardians
        resp = requests.get(f"{BASE_URL}/guardians/", headers=headers)
        print(f"GET /guardians/: {resp.status_code}")
        
        # Check Students Guardians (expect 404)
        resp = requests.get(f"{BASE_URL}/students/guardians/", headers=headers)
        print(f"GET /students/guardians/: {resp.status_code}")

    except Exception as e:
        print(e)

if __name__ == "__main__":
    test()
