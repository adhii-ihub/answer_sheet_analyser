from django.contrib.auth.models import AbstractUser
from django.db import models

class Teacher(AbstractUser):
    """
    Custom user model for teachers.
    Extends AbstractUser to allow for future expansion if needed.
    """
    department = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.email})"
