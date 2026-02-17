import os
import django
from django.core.files.uploadedfile import SimpleUploadedFile

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'exam_evaluator.settings')
django.setup()

from users.models import User
from evaluations.models import Submission, Exam
from rest_framework.test import APIRequestFactory, force_authenticate
from evaluations.views import UploadView

def repro_bulk_upload():
    print("🚀 Starting Bulk Upload Reproduction...")
    
    # 1. Setup User
    user, created = User.objects.get_or_create(username="bulk_test_user", email="bulk@test.com")
    print(f"👤 User: {user.username}")

    # 2. Prepare Dummy Files
    question_content = b"%PDF-1.4 header dummy content for question"
    answer_content_1 = b"%PDF-1.4 header dummy content for answer 1"
    answer_content_2 = b"%PDF-1.4 header dummy content for answer 2"
    
    question_file = SimpleUploadedFile("question.pdf", question_content, content_type="application/pdf")
    answer_file_1 = SimpleUploadedFile("student1.pdf", answer_content_1, content_type="application/pdf")
    answer_file_2 = SimpleUploadedFile("student2.pdf", answer_content_2, content_type="application/pdf")

    factory = APIRequestFactory()
    view = UploadView.as_view()

    # 3. First Upload: New Exam
    print("\n📤 Uploading 1st file (Creating New Exam)...")
    data_1 = {
        'exam_name': 'Bulk Test Exam',
        'question_file': question_file,
        'answer_file': answer_file_1,
        'student_name': 'Student One'
    }
    request_1 = factory.post('/api/upload/', data_1, format='multipart')
    force_authenticate(request_1, user=user)
    response_1 = view(request_1)
    
    if response_1.status_code != 201:
        print(f"❌ First upload failed: {response_1.status_code} - {response_1.data}")
        return

    exam_id = response_1.data.get('exam')
    submission_1_id = response_1.data.get('id')
    print(f"✅ First upload successful. Submission ID: {submission_1_id}, Exam ID: {exam_id}")

    if not exam_id:
        print("❌ No Exam ID returned. Cannot proceed with bulk link.")
        return

    # 4. Second Upload: Link to Existing Exam
    print(f"\n🔗 Uploading 2nd file (Linking to Exam {exam_id})...")
    data_2 = {
        'exam_id': exam_id,
        'answer_file': answer_file_2,
        'student_name': 'Student Two'
    }
    # Note: question_file is NOT sent here
    request_2 = factory.post('/api/upload/', data_2, format='multipart')
    force_authenticate(request_2, user=user)
    response_2 = view(request_2)

    if response_2.status_code != 201:
        print(f"❌ Second upload failed: {response_2.status_code} - {response_2.data}")
        return

    submission_2_id = response_2.data.get('id')
    print(f"✅ Second upload successful. Submission ID: {submission_2_id}")

    # 5. Verify Database State
    s1 = Submission.objects.get(id=submission_1_id)
    s2 = Submission.objects.get(id=submission_2_id)
    
    print("\n🔍 Verifying Database Linkages...")
    print(f"   Submission 1 Exam: {s1.exam.id} ({s1.exam.name})")
    print(f"   Submission 2 Exam: {s2.exam.id} ({s2.exam.name})")
    
    if s1.exam.id == s2.exam.id == exam_id:
        print("✅ SUCCESS: Both submissions linked to the same exam!")
    else:
        print("❌ FAILURE: Exam check mismatch.")

if __name__ == "__main__":
    repro_bulk_upload()
