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
            category=validated_data["category"].lower()
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
        instance.category = validated_data.get("category",instance.category).lower()
        
        instance.save()

        return instance
class ReStockSerializer(serializers.ModelSerializer):
    class Meta:
        model=Transaction
        fields = [
            "product",
            "quantity",
            "payment_type",
            "unit_cost_price",
            "unit_selling_price",
        ]
        
    def create(self,validated_data):
        if validated_data["quantity"] <= 0:
            raise serializers.ValidationError(
                {"quantity":"invalid value"}
            )

        product = validated_data["product"]
        product.stock += validated_data["quantity"]
        product.cost_price = validated_data["unit_cost_price"]
        product.selling_price = validated_data["unit_selling_price"]
        
        product.save()
        
        return Transaction.objects.create(
            product=product,
            transaction_type=Transaction.TransactionType.RESTOCK,
            quantity=validated_data["quantity"],
            payment_type=validated_data["payment_type"],
            unit_cost_price=validated_data["unit_cost_price"],
            unit_selling_price=validated_data["unit_selling_price"],
        )

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
        
class UpdateTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model=Transaction
        fields="__all__"
        
    def update(self,instance,validated_data):
        old_product = instance.product
        old_transaction_type = instance.transaction_type
        old_quantity = instance.quantity
        new_product = validated_data.get("product", instance.product)
        instance.payment_type = validated_data.get("payment_type",instance.payment_type)
        instance.transaction_type = validated_data.get("transaction_type",instance.transaction_type)
        instance.product = validated_data.get("product",instance.product)
        instance.quantity = validated_data.get("quantity",instance.quantity)
        
        #step-1 rollback
        if old_transaction_type == Transaction.TransactionType.SALE:
            old_product.stock += old_quantity
        elif old_transaction_type == Transaction.TransactionType.RETURN:
            old_product.stock -= old_quantity
        elif old_transaction_type == Transaction.TransactionType.RESTOCK:
            old_product.stock -= old_quantity

        # when the product is included in the payload it is a fresh instance
        # with stale stock, so carry the rollback value into it before applying
        if new_product.pk == old_product.pk:
            new_product.stock = old_product.stock
        
        #step-2 applying new changes   
        if instance.transaction_type == Transaction.TransactionType.SALE:
            if new_product.stock < instance.quantity:
                        raise serializers.ValidationError(
                            {"quantity": "Not enough stock."}
                        ) 
            new_product.stock -= instance.quantity
        elif instance.transaction_type == Transaction.TransactionType.RETURN:
            new_product.stock += instance.quantity
        elif instance.transaction_type == Transaction.TransactionType.RESTOCK:
            new_product.stock += instance.quantity
        
        #step-3 saving the changes
        old_product.save()
        new_product.save()
        instance.save()

        return instance