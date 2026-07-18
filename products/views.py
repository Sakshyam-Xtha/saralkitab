from django.shortcuts import render
from .models import Product,Transaction
from . import serializers as s
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Create your views here.
@api_view(["GET"])
def index(request):
    product = Product.objects.all()
    serializer = s.ProductSerializer(product,many=True)
    return Response(serializer.data)

@api_view(["POST"])
def add_product(request):
    serializer = s.AddProductSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"msg":"new product added."},status=400)
    else:
        return Response(serializer.errors)
    
@api_view(["PATCH"])
def update(request,id):
    product = Product.objects.get(id=id)
    serializer = s.UpdateSerializer(product,data=request.data,partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"msg": "data updated"},status=200)
    else:
        return Response(serializer.errors)

@api_view(["GET"])
def transaction(request):
    product = Transaction.objects.all()
    serializer = s.TransactionSerializer(product,many=True)
    return Response(serializer.data)