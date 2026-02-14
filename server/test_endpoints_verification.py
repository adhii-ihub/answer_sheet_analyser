import requests
import sys

BASE_URL = "http://localhost:8000/api/"

endpoints = [
    ("/upload/", "POST"),
    ("/history/", "GET"),
    ("/dashboard/", "GET"),
    ("/analytics/", "GET"),
]

def test_endpoints():
    print(f"Testing endpoints at {BASE_URL}...")
    success = True
    for endpoint, method in endpoints:
        url = f"{BASE_URL}{endpoint}"
        try:
            if method == "GET":
                response = requests.get(url)
            elif method == "POST":
                # Just checking if the endpoint exists, 401/403/400 are fine, 404 is bad
                response = requests.post(url)
            
            print(f"[{method}] {endpoint} -> Status: {response.status_code}")
            
            if response.status_code == 404:
                print(f"❌ Error: {endpoint} not found!")
                success = False
            else:
                print(f"✅ {endpoint} exists.")
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Error: Could not connect to {url}. Is the server running?")
            sys.exit(1)
            
    if success:
        print("\nAll endpoints verified!")
    else:
        print("\nSome endpoints are missing.")

if __name__ == "__main__":
    test_endpoints()
