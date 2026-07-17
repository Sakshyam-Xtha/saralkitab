from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import User
from .serializers import UserSerializer,RegisterSerializer

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
def Register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"msg":"user created"})
    else:
        return Response(serializer.errors)