from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import User
from .serializers import UserSerializer,RegisterSerializer,LoginSerializer
from django.contrib.auth.hashers import check_password

# Create your views here.
@api_view(["GET"])
def index(request):
    user = User.objects.all()
    serializer = UserSerializer(user,many=True)
    
    return Response(serializer.data)

@api_view(["GET"])
def health(request):
    return Response({"Status": "ok"})

@api_view(["POST"])
def Login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data["email"]
        user = User.objects.filter(email=email).first()
        if user is None:
            return Response({"msg":"Invalid email or password"})
        if check_password(serializer.validated_data["password"],user.pwd):
            return Response({"msg":"Login successful"})
        else:
            return Response({"msg":"Invalid email or password"},status=400)
    else:
        return Response(serializer.errors)

@api_view(["POST"])
def Register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"msg":"user created"})
    else:
        return Response(serializer.errors)