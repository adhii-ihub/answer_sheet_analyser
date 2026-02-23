from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import login_view, register_view

urlpatterns = [
    path('login/', login_view, name='auth_login'),
    path('register/', register_view, name='auth_register'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
