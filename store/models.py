from django.conf import settings
from django.db import models


class Category(models.Model):

    name = models.CharField(
        max_length=200
    )

    def __str__(self):
        return self.name


class Brand(models.Model):

    name = models.CharField(
        max_length=200,
        unique=True
    )

    def __str__(self):
        return self.name


class Product(models.Model):

    STATUS_CHOICES = [
        ("available", "موجود"),
        ("out_of_stock", "ناموجود"),
        ("coming_soon", "به‌زودی"),
    ]

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products"
    )

    brand = models.ForeignKey(
        Brand,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products"
    )

    name = models.CharField(
        max_length=300
    )

    consumer_price = models.PositiveIntegerField(
        default=0
    )

    manufacturer_price = models.PositiveIntegerField(
        default=0
    )

    discount_percent = models.PositiveIntegerField(
        default=0
    )

    description = models.TextField(
        blank=True
    )

    image = models.ImageField(
        upload_to="products/",
        blank=True,
        null=True
    )

    stock = models.PositiveIntegerField(
        default=0
    )

    specifications = models.JSONField(
        default=dict,
        blank=True
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="available"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.name

    @property
    def final_price(self):

        if self.discount_percent <= 0:
            return self.consumer_price

        discount = (
            self.consumer_price
            * self.discount_percent
            / 100
        )

        return int(
            self.consumer_price - discount
        )


class ProductImage(models.Model):

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images"
    )

    image = models.ImageField(
        upload_to="products/gallery/"
    )

    is_main = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return (
            f"{self.product.name} - "
            f"image {self.id}"
        )


class Cart(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):

        return (
            f"سبد خرید {self.user.username}"
        )


class CartItem(models.Model):

    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="cart_items"
    )

    quantity = models.PositiveIntegerField(
        default=1
    )

    class Meta:

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "cart",
                    "product"
                ],
                name="unique_cart_product"
            )
        ]

    def __str__(self):

        return (
            f"{self.product.name} "
            f"x {self.quantity}"
        )


class WishlistItem(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist_items"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="wishlist_items"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "user",
                    "product"
                ],
                name="unique_wishlist_product"
            )
        ]

    def __str__(self):

        return (
            f"{self.user.username} - "
            f"{self.product.name}"
        )


class Address(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="addresses"
    )

    title = models.CharField(
        max_length=100,
        default="آدرس اصلی"
    )

    recipient_name = models.CharField(
        max_length=200
    )

    phone = models.CharField(
        max_length=30
    )

    province = models.CharField(
        max_length=100
    )

    city = models.CharField(
        max_length=100
    )

    address = models.TextField()

    postal_code = models.CharField(
        max_length=20
    )

    is_default = models.BooleanField(
        default=False
    )

    def __str__(self):

        return (
            f"{self.recipient_name} - "
            f"{self.city}"
        )


class DiscountCode(models.Model):

    code = models.CharField(
        max_length=50,
        unique=True
    )

    discount_percent = models.PositiveIntegerField(
        default=0
    )

    max_uses = models.PositiveIntegerField(
        default=0
    )

    used_count = models.PositiveIntegerField(
        default=0
    )

    is_active = models.BooleanField(
        default=True
    )

    expires_at = models.DateTimeField(
        null=True,
        blank=True
    )

    def __str__(self):

        return self.code


class Order(models.Model):

    STATUS_CHOICES = [
        ("pending", "در انتظار پرداخت"),
        ("paid", "پرداخت شده"),
        ("processing", "در حال پردازش"),
        ("shipped", "ارسال شده"),
        ("delivered", "تحویل داده شده"),
        ("cancelled", "لغو شده"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders"
    )

    address = models.ForeignKey(
        Address,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders"
    )

    discount_code = models.ForeignKey(
        DiscountCode,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders"
    )

    total_price = models.PositiveIntegerField(
        default=0
    )

    discount_amount = models.PositiveIntegerField(
        default=0
    )

    final_price = models.PositiveIntegerField(
        default=0
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):

        return (
            f"سفارش #{self.id} - "
            f"{self.user.username}"
        )


class OrderItem(models.Model):

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    product_name = models.CharField(
        max_length=300
    )

    unit_price = models.PositiveIntegerField(
        default=0
    )

    quantity = models.PositiveIntegerField(
        default=1
    )

    def __str__(self):

        return (
            f"{self.product_name} "
            f"x {self.quantity}"
        )


class Payment(models.Model):

    STATUS_CHOICES = [
        ("pending", "در انتظار پرداخت"),
        ("successful", "موفق"),
        ("failed", "ناموفق"),
    ]

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="payments"
    )

    amount = models.PositiveIntegerField(
        default=0
    )

    tracking_code = models.CharField(
        max_length=100,
        blank=True
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return (
            f"Payment #{self.id} - "
            f"Order #{self.order_id}"
        )


class Review(models.Model):

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews"
    )

    name = models.CharField(
        max_length=100
    )

    rating = models.PositiveIntegerField(
        default=5
    )

    comment = models.TextField()

    is_approved = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return (
            f"{self.product.name} - "
            f"{self.rating}"
        )


class ProductQuestion(models.Model):

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="questions"
    )

    name = models.CharField(
        max_length=100
    )

    question = models.TextField()

    answer = models.TextField(
        blank=True
    )

    is_approved = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return (
            f"{self.product.name} - "
            f"Question #{self.id}"
        )