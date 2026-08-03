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

class UpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model=Product
        fields="__all__"
        
    def update(self,instance,validated_data):
        instance.name = validated_data.get("name", instance.name)
        instance.stock = validated_data.get("stock", instance.stock)
        instance.cost_price = validated_data.get(
            "cost_price",
            instance.cost_price
        )
        instance.selling_price = validated_data.get(
            "selling_price",
            instance.selling_price
        )
        instance.supplier_phone = validated_data.get("supplier_phone",instance.supplier_phone)
        instance.category = validated_data.get("category",instance.category)
        
        instance.save()

        return instance
class ReStockSerializer(serializers.ModelSerializer):
    class Meta:
        model=Product
        fields=['stock']
        
    def update(self,instance,validated_data):
        instance.stock = validated_data.get("stock") + instance.stock

        instance.save()

        return instance

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = "__all__"
        
class CreateTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            "product",
            "transaction_type",
            "quantity",
            "payment_type",
        ]

    def create(self, validated_data):
        product = validated_data["product"]
        quantity = validated_data["quantity"]
        transaction_type = validated_data["transaction_type"]

        if transaction_type == Transaction.TransactionType.SALE:
            if product.stock < quantity:
                raise serializers.ValidationError(
                    {"quantity": "Not enough stock."}
                )
            product.stock -= quantity

        elif transaction_type == Transaction.TransactionType.RETURN:
            product.stock += quantity

        product.save()

        return Transaction.objects.create(
            product=product,
            transaction_type=transaction_type,
            quantity=quantity,
            payment_type=validated_data["payment_type"],
            unit_cost_price=product.cost_price,
            unit_selling_price=product.selling_price,
        )
        
