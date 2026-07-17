from rest_framework import serializers
from .models import User
from django.contrib.auth.hashers import make_password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["name","email","phone"]
        
class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(max_length=200)
    phone_num = serializers.IntegerField()
    password = serializers.CharField(max_length=200)
    
    class Meta:
        model = User
        fields = ["username","email","phone_num","password"]
        
    def create(self,validated_data):
        return User.objects.create(
            name=validated_data["username"],
            email=validated_data["email"],
            phone=validated_data["phone_num"],
            pwd=make_password(validated_data["password"])
        )