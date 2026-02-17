
import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'exam_evaluator.settings')
django.setup()

from django.test import RequestFactory
from rest_framework.test import force_authenticate
from evaluations.views import DashboardView
from users.models import User
from evaluations.models import Submission

def test_dashboard():
    print("Testing Dashboard View for ALL users...")
    users = User.objects.all()
    count = users.count()
    print(f"Found {count} users.")

    for user in users:
        print(f"--------------------------------------------------")
        print(f"Testing for user: {user.username} (ID: {user.id})")
        
        factory = RequestFactory()
        request = factory.get('/api/dashboard/')
        force_authenticate(request, user=user)
        
        view = DashboardView.as_view()
        
        try:
            response = view(request)
            print(f"Status Code: {response.status_code}")
            if response.status_code != 200:
                print("Response Data:", response.data)
            else:
                print("Success!")
        except Exception as e:
            print(f"CRASHED for user {user.username}!")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_dashboard()
