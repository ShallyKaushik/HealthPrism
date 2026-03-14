import requests
import json

BASE_URL = "http://127.0.0.1:5000/api"

def test_auth_flow():
    print("--- Testing Auth Flow ---")
    
    # 1. Register a new user
    username = "testuser"
    password = "password123"
    
    print(f"1. Registering user: {username}")
    reg_data = {"username": username, "password": password}
    response = requests.post(f"{BASE_URL}/register", json=reg_data)
    print(f"Response: {response.json()} (Status: {response.status_code})")
    
    if response.status_code != 201 and "already exists" not in response.text:
        print("Registration failed!")
        return

    # 2. Login
    print(f"\n2. Logging in user: {username}")
    login_data = {"username": username, "password": password}
    response = requests.post(f"{BASE_URL}/login", json=login_data)
    print(f"Response Status: {response.status_code}")
    
    if response.status_code != 200:
        print("Login failed!")
        return
        
    token = response.json().get("access_token")
    print("Login successful! Token received.")

    # 3. Try to access admin panel with normal user
    print("\n3. Testing admin route with normal user token")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/users", headers=headers)
    print(f"Response: {response.json()} (Status: {response.status_code})")
    if response.status_code == 403:
        print("Correct: Access denied for normal user.")
    else:
        print("Warning: Normal user accessed admin route!")

    # 4. Create an admin user
    admin_name = "adminuser"
    print(f"\n4. Registering admin user: {admin_name}")
    admin_reg_data = {"username": admin_name, "password": password, "is_admin": True}
    response = requests.post(f"{BASE_URL}/register", json=admin_reg_data)
    print(f"Response: {response.json()} (Status: {response.status_code})")

    # 5. Login as admin
    print(f"\n5. Logging in admin: {admin_name}")
    response = requests.post(f"{BASE_URL}/login", json={"username": admin_name, "password": password})
    admin_token = response.json().get("access_token")
    
    # 6. Access admin panel with admin token
    print("\n6. Testing admin route with admin token")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BASE_URL}/admin/users", headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"Success! Admin retrieved {len(response.json().get('users', []))} users.")
    else:
        print(f"Error: Admin access failed! {response.text}")

if __name__ == "__main__":
    test_auth_flow()
