from rest_framework import serializers
from .models import User
from django.contrib.auth.hashers import make_password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username","email","contact"]
        
class RegisterSerializer(serializers.ModelSerializer):
    phone_num = serializers.CharField(max_length=200)   
    class Meta:
        model = User
        fields = ["username","email","phone_num","password"]
        
    def create(self,validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            contact=validated_data["phone_num"],
            password=validated_data['password']
        )

    def validate_email(self,value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email is already registered.")
        return value
        
class LoginSerializer(serializers.Serializer):
    password = serializers.CharField(max_length=1000)
    email = serializers.CharField(max_length=200)