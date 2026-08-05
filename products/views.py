from django.shortcuts import render, get_object_or_404
from .models import Product,Transaction
from . import serializers as s
from rest_framework.decorators import api_view,permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

# Create your views here.
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def index(request,id=None):
    if id is None:
        product = Product.objects.all()
        serializer = s.ProductSerializer(product,many=True)
        return Response(serializer.data)
    else:
        product = get_object_or_404(Product,id=id)
        serializer = s.ProductSerializer(product)
        return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_product(request):
    serializer = s.AddProductSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"msg":"new product added."},status=201)
    else:
        return Response(serializer.errors,status=400)
    
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_product(request,id):
    product = Product.objects.filter(id=id).first()
    if product is None:
        return Response({"msg":"not found"},status=404)
    product.delete()
    return Response({"msg":"product deleted"},status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_product(request,name):
    product = Product.objects.filter(name__iexact=name) 
    if not product:
        return Response({"msg":"not found"},status=404)  
    else:
        serializer = s.ProductSerializer(product,many=True)
        return Response(serializer.data)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def filter_product(request):
    category = request.query_params.get("category")
    if category:
        product = Product.objects.filter(category__icontains=category.lower()) 
        if not product:
            return Response({"msg":"not found"},status=404)  
        else:
            serializer = s.ProductSerializer(product,many=True)
            return Response(serializer.data)
    else:
        return Response({"msg":"invalid parameter"},status=400)

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update(request,id):
    product = get_object_or_404(Product,id=id)
    serializer = s.UpdateSerializer(product,data=request.data,partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"msg": "data updated"},status=200)
    else:
        return Response(serializer.errors,status=400)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def restock(request,id):
    data= request.data.copy()
    data["product"] = id
    serializer = s.ReStockSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response({"msg": "restocked"},status=200)
    else:
        return Response(serializer.errors)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transaction(request,id=None):
    if id is None:
        transaction = Transaction.objects.all()
        serializer = s.TransactionSerializer(transaction,many=True)
        return Response(serializer.data)
    else:
        transaction = get_object_or_404(Transaction,id=id)
        serializer = s.TransactionSerializer(transaction)
        return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def make_transaction(request):
    serializer = s.CreateTransactionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"msg":"created new transaction record"},status=201)
    else:
        return Response(serializer.errors,status=400)
    
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_transaction(request,id):
    transaction = get_object_or_404(Transaction,id=id)
    serializer = s.UpdateTransactionSerializer(transaction,data=request.data,partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"msg": "data updated"},status=200)
    else:
        return Response(serializer.errors,status=400)