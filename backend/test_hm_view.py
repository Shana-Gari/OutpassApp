import requests

BASE_URL = 'http://127.0.0.1:8000/api'
PHONE = '6666666660'
PASSWORD = 'password' # Wait, password is phone? check User model or set_password logic. Usually phone is used. 
# User said "Phone Number as Password". User model check_password -> raw_password == self.phone.
# So password is likely '6666666660'.

def test_hm_dashboard():
    # Login
    print(f"Logging in as {PHONE}...")
    resp = requests.post(f"{BASE_URL}/auth/admin-login/", json={
        'phone': PHONE,
        'password': PHONE
    })
    
    if resp.status_code != 200:
        print("Login failed:", resp.text)
        return
    
    data = resp.json()
    token = data['access']
    print("Login success. Token:", token[:20], "...")
    
    # Fetch Dashboard
    headers = {'Authorization': f'Bearer {token}'}
    print("Fetching /staff/dashboard/?status=pending ...")
    resp = requests.get(f"{BASE_URL}/staff/dashboard/?status=pending", headers=headers)
    
    print(f"Status: {resp.status_code}")
    print("Response:", resp.text)

if __name__ == "__main__":
    test_hm_dashboard()
