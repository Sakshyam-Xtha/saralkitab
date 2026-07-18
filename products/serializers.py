from rest_framework import serializers
from .models import Transaction,Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"

class AddProductSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(max_length=200)
    supplier_contact = serializers.CharField(max_length=20)
    quantity = serializers.IntegerField(min_value=1)
    
    class Meta:
        model = Product
        fields = ['product_name','cost_price','selling_price','quantity','supplier_contact','category']

    def create(self, validated_data):
        return Product.objects.create(
            name=validated_data["product_name"],
            cost_price=validated_data["cost_price"],
            selling_price=validated_data["selling_price"],
            stock=validated_data["quantity"],
            supplier_phone=validated_data["supplier_contact"],
            category=validated_data["category"]
        )

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = "__all__"
        
        
