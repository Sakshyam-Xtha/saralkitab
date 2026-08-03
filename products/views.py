from django.shortcuts import render
from .models import Product,Transaction
from . import serializers as s
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Create your views here.
@api_view(["GET"])
def index(request,id=None):
    if id is None:
        product = Product.objects.all()
        serializer = s.ProductSerializer(product,many=True)
        return Response(serializer.data)
    else:
        product = Product.objects.get(id=id)
        serializer = s.ProductSerializer(product)
        return Response(serializer.data)

@api_view(["POST"])
def add_product(request):
    serializer = s.AddProductSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"msg":"new product added."},status=400)
    else:
        return Response(serializer.errors)
    
@api_view(['DELETE'])
def delete_product(request,id):
    product = Product.objects.filter(id=id).first()
    if product is None:
        return Response({"msg":"not found"},status=404)
    product.delete()
    return Response({"msg":"product deleted"},status=200)
    
@api_view(["PATCH"])
def update(request,id):
    product = Product.objects.get(id=id)
    serializer = s.UpdateSerializer(product,data=request.data,partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"msg": "data updated"},status=200)
    else:
        return Response(serializer.errors)

@api_view(["PATCH"])
def restock(request,id):
    product = Product.objects.get(id=id)
    serializer = s.ReStockSerializer(product,data=request.data,partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"msg": "restocked"},status=200)
    else:
        return Response(serializer.errors)

@api_view(["GET"])
def transaction(request,id=None):
    if id is None:
        transaction = Transaction.objects.all()
        serializer = s.TransactionSerializer(transaction,many=True)
        return Response(serializer.data)
    else:
        transaction = Transaction.objects.get(id=id)
        serializer = s.TransactionSerializer(transaction)
        return Response(serializer.data)

@api_view(["POST"])
def make_transaction(request):
    serializer = s.CreateTransactionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"msg":"created new transaction record"},status=400)
    else:
        return Response(serializer.errors)