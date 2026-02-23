import requests
import os
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"
USERNAME = "testteacher"
PASSWORD = "testpassword123"

def main():
    # 0. Health Check
    try:
        print("Checking server connectivity...")
        requests.get(BASE_URL.replace("/api", "/admin/login/"), timeout=15)
        print("Server is reachable.")
    except Exception as e:
        print(f"Server unreachable: {e}")
        return

    # 1. Login to get Token
    print("Logging in...")
    login_url = f"{BASE_URL}/auth/token/"
    try:
        response = requests.post(login_url, json={"username": USERNAME, "password": PASSWORD}, timeout=10)
        response.raise_for_status()
        tokens = response.json()
        access_token = tokens['access']
        print("Login successful. Token acquired.")
    except Exception as e:
        print(f"Login Failed: {e}")
        if response:
            print(response.text)
        return

    # 2. Upload Exam
    print("\nUploading Exam...")
    upload_url = f"{BASE_URL}/upload-exams/"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Path to our test PDF
    pdf_path = os.path.join(os.getcwd(), '713323TS001_19IT701.pdf')
    if not os.path.exists(pdf_path):
        print(f"Test file not found: {pdf_path}")
        return

    qp_path = os.path.join(os.getcwd(), 'ip iae2.pdf')
    if not os.path.exists(qp_path):
        print(f"Question paper not found: {qp_path}")
        return

    try:
        with open(pdf_path, 'rb') as f, open(qp_path, 'rb') as qp:
            files = [
                ('files', (os.path.basename(pdf_path), f, 'application/pdf')),
                ('question_paper', (os.path.basename(qp_path), qp, 'application/pdf'))
            ]
            data = {
                'title': 'Test Exam Session with Question Paper',
                'description': 'Automated test upload',
                'max_marks': 100,
                'rubric': 'Evaluate for correctness against the attached question paper.'
            }
            
            response = requests.post(upload_url, headers=headers, data=data, files=files, timeout=60)
            response.raise_for_status()
            print("Upload successful!")
            session_data = response.json()
            session_id = session_data['id']
            print(f"Exam Session ID: {session_id}")
            
            # 3. Poll for Results (optional, just to check if processing started)
            print("\nWaiting for processing (poll results)...")
            results_url = f"{BASE_URL}/results/{session_id}/"
            for _ in range(5):
                time.sleep(2)
                res = requests.get(results_url, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    submissions = data.get('submissions', [])
                    if submissions:
                        sub = submissions[0]
                        print(f"Submission status: Processed={sub['processed']}, Marks={sub['total_marks_awarded']}")
                        if sub['processed']:
                            print("Processing completed!")
                            break
    except Exception as e:
        print(f"Upload/Check Failed: {e}")
        if 'response' in locals() and response:
            print(response.text)

if __name__ == "__main__":
    main()
