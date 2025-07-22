from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from users.serializers import UserSerializer
from rest_framework.authtoken.models import Token

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    """
    Register a new user.
    """
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    Login endpoint.
    """
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(request, username=email, password=password)
        if user:
            login(request, user)
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import logging, traceback
        logging.exception("Error in login_view")
        return Response({"detail": f"Internal server error: {str(e)}", "trace": traceback.format_exc()}, status=500)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    Logout endpoint.
    """
    logout(request)
    return Response({'message': 'Logged out successfully'})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    """
    Returns the authenticated user.
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data) 