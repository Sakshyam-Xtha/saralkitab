from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=200)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    supplier_phone = models.CharField(max_length=20)
    category = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Transaction(models.Model):

    class TransactionType(models.TextChoices):
        SALE = "SALE", "Sale"
        RETURN = "RETURN", "Return"
        RESTOCK = "RESTOCK", "Restock"

    class PaymentType(models.TextChoices):
        CASH = "CASH", "Cash"
        ESEWA = "ESEWA", "eSewa"
        KHALTI = "KHALTI", "Khalti"
        CARD = "CARD", "Card"
        BANK = "BANK", "Bank Transfer"

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="transactions"
    )

    transaction_type = models.CharField(
        max_length=10,
        choices=TransactionType.choices
    )

    quantity = models.PositiveIntegerField()

    payment_type = models.CharField(
        max_length=10,
        choices=PaymentType.choices
    )

    unit_cost_price = models.DecimalField(
    max_digits=10,
    decimal_places=2
)

    unit_selling_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type} - {self.product.name} ({self.quantity})"