
import requests
import json
import os

BASE_URL = "http://localhost:8000"

def test_upload():
    print("🚀 Starting Upload Test...")
    
    # Files
    files_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    question_path = os.path.join(files_dir, "question.png")
    answer_path = os.path.join(files_dir, "answer.png")
    rubric_path = os.path.join(files_dir, "rudris.png") # Assuming this is rubric
    
    if not all(os.path.exists(p) for p in [question_path, answer_path, rubric_path]):
        print(f"❌ Missing test files in {files_dir}")
        return

    # 1. Login
    print("1. Logging in...")
    try:
        resp = requests.post(f"{BASE_URL}/api/auth/login/", json={
            "username": "admin", 
            "password": "admin123"
        })
        if resp.status_code != 200:
            print(f"❌ Login failed: {resp.text}")
            return
        token = resp.json()['tokens']['access']
        print("   ✅ Login successful")
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return

    # 2. Upload
    print("2. Uploading files...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        files = {
            'question_file': open(question_path, 'rb'),
            'answer_file': open(answer_path, 'rb'),
            'rubric_file': open(rubric_path, 'rb')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/upload/",
            headers=headers,
            files=files
        )
        
        if response.status_code == 201:
            print("   ✅ Upload successful! Gemini is processing...")
            data = response.json()
            print(json.dumps(data, indent=2))
        else:
            print(f"   ❌ Upload failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error during upload: {e}")
    finally:
        for f in files.values():
            f.close()

if __name__ == "__main__":
    test_upload()
