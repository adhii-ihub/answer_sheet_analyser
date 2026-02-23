from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


def _token_response(user):
    """Return the token + user dict the frontend expects."""
    refresh = RefreshToken.for_user(user)
    return {
        "tokens": {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        },
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """
    POST /api/auth/login/
    Body: { "email": "...", "password": "..." }
    """
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")

    if not email or not password:
        return Response(
            {"detail": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Django's default backend uses username; look up by email first
    try:
        user_obj = User.objects.get(email=email)
        username = user_obj.username
    except User.DoesNotExist:
        return Response(
            {"detail": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response(
            {"detail": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    return Response(_token_response(user), status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    """
    POST /api/auth/register/
    Body: { "username": "...", "email": "...", "password": "...", "password2": "..." }
    """
    username = request.data.get("username", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")
    password2 = request.data.get("password2", password)

    if not username or not email or not password:
        return Response(
            {"detail": "Username, email, and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if password != password2:
        return Response(
            {"detail": "Passwords do not match."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {"detail": "A user with this email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"detail": "A user with this username already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(username=username, email=email, password=password)
    return Response(_token_response(user), status=status.HTTP_201_CREATED)
