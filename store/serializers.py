from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers

from .models import (
    Address,
    Brand,
    Cart,
    CartItem,
    Category,
    DiscountCode,
    Order,
    Payment,
    Product,
    ProductImage,
    ProductQuestion,
    Review,
    WishlistItem,
)


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    class Meta:
        model = get_user_model()
        fields = [
            "username",
            "password",
        ]

    def create(self, validated_data):

        return get_user_model().objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
        )


class LoginSerializer(serializers.Serializer):

    username = serializers.CharField()

    password = serializers.CharField(
        write_only=True
    )

    def validate(self, attrs):

        user = authenticate(
            username=attrs.get("username"),
            password=attrs.get("password"),
        )

        if user is None:
            raise serializers.ValidationError(
                "نام کاربری یا رمز عبور اشتباه است."
            )

        attrs["user"] = user

        return attrs


class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category

        fields = [
            "id",
            "name",
        ]


class BrandSerializer(serializers.ModelSerializer):

    class Meta:
        model = Brand

        fields = [
            "id",
            "name",
        ]


class ProductImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProductImage

        fields = [
            "id",
            "image",
            "is_main",
            "created_at",
        ]

        read_only_fields = [
            "created_at",
        ]


class ProductSerializer(serializers.ModelSerializer):

    category = CategorySerializer(
        read_only=True
    )

    brand = BrandSerializer(
        read_only=True
    )

    images = ProductImageSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Product

        fields = [
            "id",
            "name",
            "description",
            "consumer_price",
            "manufacturer_price",
            "discount_percent",
            "stock",
            "status",
            "category",
            "brand",
            "image",
            "images",
            "specifications",
            "view_count",
        ]


class CartProductSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product

        fields = [
            "id",
            "name",
            "consumer_price",
            "discount_percent",
            "image",
            "stock",
            "status",
        ]


class CartItemSerializer(serializers.ModelSerializer):

    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all()
    )

    product_details = CartProductSerializer(
        source="product",
        read_only=True
    )

    class Meta:
        model = CartItem

        fields = [
            "id",
            "cart",
            "product",
            "product_details",
            "quantity",
        ]

        read_only_fields = [
            "cart",
            "product_details",
        ]

    def validate_quantity(self, value):

        if value < 1:
            raise serializers.ValidationError(
                "تعداد باید حداقل ۱ باشد."
            )

        return value


class CartSerializer(serializers.ModelSerializer):

    items = CartItemSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Cart

        fields = [
            "id",
            "user",
            "items",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "user",
            "items",
        ]


class WishlistItemSerializer(serializers.ModelSerializer):

    product = ProductSerializer(
        read_only=True
    )

    product_id = serializers.PrimaryKeyRelatedField(
        source="product",
        queryset=Product.objects.all(),
        write_only=True
    )

    class Meta:
        model = WishlistItem

        fields = [
            "id",
            "product",
            "product_id",
        ]


class AddressSerializer(serializers.ModelSerializer):

    class Meta:
        model = Address

        fields = [
            "id",
            "title",
            "recipient_name",
            "phone",
            "province",
            "city",
            "address",
            "postal_code",
            "is_default",
        ]


class ReviewSerializer(serializers.ModelSerializer):

    class Meta:
        model = Review

        fields = [
            "id",
            "product",
            "name",
            "rating",
            "comment",
            "is_approved",
            "created_at",
        ]

        read_only_fields = [
            "created_at",
        ]


class ProductQuestionSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProductQuestion

        fields = [
            "id",
            "product",
            "name",
            "question",
            "answer",
            "is_approved",
            "created_at",
        ]

        read_only_fields = [
            "answer",
            "created_at",
        ]


class DiscountCodeSerializer(serializers.ModelSerializer):

    class Meta:
        model = DiscountCode

        fields = [
            "id",
            "code",
            "discount_percent",
            "max_uses",
            "used_count",
            "is_active",
            "expires_at",
        ]

        read_only_fields = [
            "used_count",
        ]


class PaymentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Payment

        fields = [
            "id",
            "order",
            "amount",
            "tracking_code",
            "status",
            "created_at",
        ]

        read_only_fields = [
            "status",
            "tracking_code",
            "created_at",
        ]


class OrderSerializer(serializers.ModelSerializer):

    address = AddressSerializer(
        read_only=True
    )

    items = serializers.SerializerMethodField()

    class Meta:
        model = Order

        fields = [
            "id",
            "user",
            "address",
            "items",
            "total_price",
            "discount_amount",
            "final_price",
            "status",
            "discount_code",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "user",
            "items",
            "total_price",
            "discount_amount",
            "final_price",
            "status",
            "created_at",
            "updated_at",
        ]

    def get_items(self, obj):

        return [
            {
                "id": item.id,
                "product": (
                    item.product.id
                    if item.product
                    else None
                ),
                "product_name": item.product_name,
                "unit_price": item.unit_price,
                "quantity": item.quantity,
            }
            for item in obj.items.all()
        ]