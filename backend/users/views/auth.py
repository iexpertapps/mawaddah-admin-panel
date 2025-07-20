from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from users.serializers import UserSerializer


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login endpoint that returns user data and token
    """
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'error': 'Email and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(request, username=email, password=password)
    
    if user is None:
        return Response({
            'error': 'Invalid email or password'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if not user.is_active:
        return Response({
            'error': 'Account is disabled'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Create or get token
    token, created = Token.objects.get_or_create(user=user)
    
    # Return user data and token
    serializer = UserSerializer(user)
    return Response({
        'user': serializer.data,
        'token': token.key,
        'message': 'Login successful'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """
    Logout endpoint that invalidates the token
    """
    try:
        # Delete the token
        request.user.auth_token.delete()
    except:
        pass
    
    # Logout user (for session-based auth)
    logout(request)
    
    return Response({
        'message': 'Logout successful'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def me_view(request):
    """
    Get current user profile
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data) 