from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import User
from .serializers import UserSerializer,RegisterSerializer,LoginSerializer
from django.contrib.auth.hashers import check_password

# Create your views here.
@api_view(["GET"])
@permission_classes([IsAuthenticated])
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
            return Response({"msg":"Invalid email or password"},status=401)
        if user.check_password(serializer.validated_data["password"]):
            token, created = Token.objects.get_or_create(user=user)
            user_serializer = UserSerializer(user)
            return Response({"msg":"Login successful","user":user_serializer.data,"token": token.key})
        else:
            return Response({"msg":"Invalid email or password"},status=401)
    else:
        return Response(serializer.errors,status=400)

@api_view(["POST"])
def Register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user_serializer = UserSerializer(user)
        return Response({"msg":"user created","user":user_serializer.data},status=201)
    else:
        return Response(serializer.errors,status=400)