"""
edugrade/wsgi.py — WSGI application entry point for EduGrade AI.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "edugrade.settings")
application = get_wsgi_application()
