import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "exam_evaluator.settings")
django.setup()

from apps.accounts.models import Teacher

def create_test_user():
    username = "testteacher"
    password = "testpassword123"
    email = "teacher@example.com"
    
    if not Teacher.objects.filter(username=username).exists():
        Teacher.objects.create_user(username=username, password=password, email=email)
        print(f"User '{username}' created.")
    else:
        print(f"User '{username}' already exists.")

if __name__ == "__main__":
    create_test_user()
