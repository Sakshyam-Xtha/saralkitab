from rest_framework import serializers
from .models import Transaction,Product
from django.db import transaction

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"

class AddProductSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(max_length=200)
    supplier_contact = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    quantity = serializers.IntegerField(min_value=1)
    payment_type = serializers.ChoiceField(
                    choices=Transaction.PaymentType.choices
                )
    class Meta:
        model = Product
        fields = ['product_name','cost_price','selling_price','quantity','supplier_contact','category','payment_type']

    def create(self, validated_data):
        with transaction.atomic():
            product= Product.objects.create(
                            name=validated_data["product_name"],
                            cost_price=validated_data["cost_price"],
                            selling_price=validated_data["selling_price"],
                            stock=validated_data["quantity"],
                            supplier_phone=validated_data.get("supplier_contact") or "",
                            category=validated_data["category"].lower()
                        )
            if validated_data["quantity"] > 0:
                Transaction.objects.create(
                            product=product,
                            transaction_type=Transaction.TransactionType.RESTOCK,
                            quantity=validated_data["quantity"],
                            payment_type=validated_data["payment_type"],
                            unit_cost_price=validated_data["cost_price"],
                            unit_selling_price=validated_data["selling_price"],
                        )
            return product    

class UpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model=Product
        fields="__all__"
        
    def update(self,instance,validated_data):
        with transaction.atomic():
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
    unit_cost_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False
    )
    unit_selling_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False
    )

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
        with transaction.atomic():
            if validated_data["quantity"] <= 0:
                raise serializers.ValidationError(
                    {"quantity":"invalid value"}
                )

            product = Product.objects.select_for_update().get(
                pk=validated_data["product"].pk
            )
            cost = validated_data.get("unit_cost_price", product.cost_price)
            sell = validated_data.get("unit_selling_price", product.selling_price)
            product.stock += validated_data["quantity"]
            product.cost_price = cost
            product.selling_price = sell
            
            product.save()
            
            return Transaction.objects.create(
                product=product,
                transaction_type=Transaction.TransactionType.RESTOCK,
                quantity=validated_data["quantity"],
                payment_type=validated_data["payment_type"],
                unit_cost_price=cost,
                unit_selling_price=sell,
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
        with transaction.atomic():
            product = Product.objects.select_for_update().get(
                pk=validated_data["product"].pk
            )
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
        with transaction.atomic():
            old_product = Product.objects.select_for_update().get(
                pk=validated_data["product"].pk
            )
            old_transaction_type = instance.transaction_type
            old_quantity = instance.quantity
            new_product_id = validated_data.get(
                "product",
                instance.product
            ).pk

            new_product = Product.objects.select_for_update().get(
                pk=new_product_id
            )
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