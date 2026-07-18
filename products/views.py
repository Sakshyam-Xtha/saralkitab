from django.shortcuts import render
from .models import Product,Transaction
from .serializers import ProductSerializer,TransactionSerializer,AddProductSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Create your views here.
@api_view(["GET"])
def index(request):
    product = Product.objects.all()
    serializer = ProductSerializer(product,many=True)
    return Response(serializer.data)

@api_view(["POST"])
def add_product(request):
    serializer = AddSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"msg":"new product added."})
    else:
        return Response(serializer.errors)

@api_view(["GET"])
def transaction(request):
    product = Transaction.objects.all()
    serializer = TransactionSerializer(product,many=True)
    return Response(serializer.data)