from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import User
from .serializers import UserSerializer
from .views import UserListView, UserDetailView


# Create your views here.
