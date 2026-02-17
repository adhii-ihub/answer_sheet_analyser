
import os
import django
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'exam_evaluator.settings')
django.setup()

from django.test import RequestFactory
from rest_framework.test import force_authenticate
from evaluations.views import UploadView
from users.models import User

def test_upload():
    print("Testing Upload View...")
    user, _ = User.objects.get_or_create(username='testadmin', email='testadmin@example.com')

    factory = RequestFactory()
    
    # Create dummy files
    question_file = SimpleUploadedFile("q.pdf", b"dummy content", content_type="application/pdf")
    answer_file = SimpleUploadedFile("a.pdf", b"dummy content", content_type="application/pdf")
    
    data = {
        'student_name': 'Test Student',
        'exam_name': 'Test Exam 101',
        'question_file': question_file,
        'answer_file': answer_file
    }
    
    request = factory.post('/api/upload/', data, format='multipart')
    force_authenticate(request, user=user)
    
    view = UploadView.as_view()
    
    try:
        response = view(request)
        print(f"Status Code: {response.status_code}")
        if response.status_code != 201:
            print("Response Data:", response.data)
        else:
            print("Success! Submission created.")
    except Exception as e:
        print("CRASHED!")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_upload()
