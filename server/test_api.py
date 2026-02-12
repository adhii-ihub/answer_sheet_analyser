"""
Quick test script for the AI Exam Evaluation API
Run this to verify the backend is working correctly
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_api():
    print("🧪 Testing AI Exam Evaluation API\n")
    
    # Test 1: Health check (Swagger UI)
    print("1. Testing Swagger UI...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("   ✅ Swagger UI is accessible\n")
        else:
            print(f"   ❌ Swagger UI returned status {response.status_code}\n")
    except Exception as e:
        print(f"   ❌ Error: {e}\n")
    
    # Test 2: Login
    print("2. Testing login...")
    try:
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        response = requests.post(
            f"{BASE_URL}/api/auth/login/",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get("tokens", {}).get("access")
            print("   ✅ Login successful")
            print(f"   Token: {access_token[:50]}...\n")
            
            # Test 3: Dashboard with token
            print("3. Testing dashboard (authenticated)...")
            headers = {"Authorization": f"Bearer {access_token}"}
            response = requests.get(f"{BASE_URL}/api/dashboard/", headers=headers)
            
            if response.status_code == 200:
                dashboard_data = response.json()
                print("   ✅ Dashboard accessible")
                print(f"   Total uploads: {dashboard_data.get('total_uploads', 0)}")
                print(f"   Average score: {dashboard_data.get('average_score', 'N/A')}\n")
            else:
                print(f"   ❌ Dashboard returned status {response.status_code}\n")
                
        else:
            print(f"   ❌ Login failed with status {response.status_code}")
            print(f"   Response: {response.text}\n")
            
    except Exception as e:
        print(f"   ❌ Error: {e}\n")
    
    print("=" * 50)
    print("✅ API Testing Complete!")
    print("=" * 50)
    print("\n📝 Next Steps:")
    print("1. Open http://localhost:8000/ in your browser")
    print("2. Test endpoints via Swagger UI")
    print("3. Upload exam files to test AI evaluation")

if __name__ == "__main__":
    test_api()
