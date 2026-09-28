from django.contrib.auth import login
from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    Address,
    Brand,
    Cart,
    CartItem,
    Category,
    DiscountCode,
    Order,
    OrderItem,
    Payment,
    Product,
    ProductQuestion,
    Review,
    WishlistItem,
)
from .serializers import (
    AddressSerializer,
    BrandSerializer,
    CartItemSerializer,
    CartSerializer,
    CategorySerializer,
    DiscountCodeSerializer,
    LoginSerializer,
    OrderSerializer,
    PaymentSerializer,
    ProductQuestionSerializer,
    ProductSerializer,
    RegisterSerializer,
    ReviewSerializer,
    WishlistItemSerializer,
)


# ---------------------------------------------------------
# Authentication
# ---------------------------------------------------------


class RegisterAPIView(generics.CreateAPIView):

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        token, _ = Token.objects.get_or_create(
            user=user
        )

        return Response(
            {
                "message": "ثبت‌نام با موفقیت انجام شد.",
                "user_id": user.id,
                "username": user.username,
                "token": token.key,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginAPIView(generics.GenericAPIView):

    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.validated_data["user"]

        token, _ = Token.objects.get_or_create(
            user=user
        )

        return Response(
            {
                "message": "ورود موفق بود.",
                "user_id": user.id,
                "username": user.username,
                "token": token.key,
            }
        )


# ---------------------------------------------------------
# Products
# ---------------------------------------------------------


class ProductListAPIView(generics.ListAPIView):

    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):

        return Product.objects.select_related(
            "category",
            "brand",
        ).prefetch_related(
            "images"
        ).order_by("-id")


class ProductDetailAPIView(generics.RetrieveAPIView):

    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    queryset = Product.objects.select_related(
        "category",
        "brand",
    ).prefetch_related(
        "images"
    )


class CategoryListAPIView(generics.ListAPIView):

    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

    queryset = Category.objects.all().order_by(
        "name"
    )


class BrandListAPIView(generics.ListAPIView):

    serializer_class = BrandSerializer
    permission_classes = [AllowAny]

    queryset = Brand.objects.all().order_by(
        "name"
    )


# ---------------------------------------------------------
# Cart
# ---------------------------------------------------------


class CartAPIView(generics.RetrieveAPIView):

    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):

        cart, _ = Cart.objects.get_or_create(
            user=self.request.user
        )

        return cart


class CartItemCreateAPIView(generics.CreateAPIView):

    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):

        product_id = request.data.get(
            "product"
        )

        quantity = request.data.get(
            "quantity",
            1
        )

        if not product_id:

            return Response(
                {
                    "error": "product is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            quantity = int(quantity)

        except (
            TypeError,
            ValueError
        ):

            return Response(
                {
                    "error": "quantity must be an integer."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quantity < 1:

            return Response(
                {
                    "error": "quantity must be at least 1."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        product = get_object_or_404(
            Product,
            id=product_id
        )

        cart, _ = Cart.objects.get_or_create(
            user=request.user
        )

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={
                "quantity": quantity
            }
        )

        if not created:

            item.quantity += quantity
            item.save(
                update_fields=["quantity"]
            )

        serializer = CartItemSerializer(
            item
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


class CartItemUpdateAPIView(
    generics.UpdateAPIView
):

    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return CartItem.objects.filter(
            cart__user=self.request.user
        )


class CartItemDeleteAPIView(
    generics.DestroyAPIView
):

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return CartItem.objects.filter(
            cart__user=self.request.user
        )


# ---------------------------------------------------------
# Wishlist
# ---------------------------------------------------------


class WishlistListCreateAPIView(
    generics.ListCreateAPIView
):

    serializer_class = WishlistItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return WishlistItem.objects.filter(
            user=self.request.user
        ).select_related(
            "product"
        )

    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user
        )


class WishlistDeleteAPIView(
    generics.DestroyAPIView
):

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return WishlistItem.objects.filter(
            user=self.request.user
        )


# ---------------------------------------------------------
# Addresses
# ---------------------------------------------------------


class AddressListCreateAPIView(
    generics.ListCreateAPIView
):

    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Address.objects.filter(
            user=self.request.user
        ).order_by(
            "-is_default",
            "-id"
        )

    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user
        )


class AddressDetailAPIView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Address.objects.filter(
            user=self.request.user
        )


# ---------------------------------------------------------
# Orders
# ---------------------------------------------------------


class OrderListAPIView(generics.ListAPIView):

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Order.objects.filter(
            user=self.request.user
        ).select_related(
            "address",
            "discount_code",
        ).prefetch_related(
            "items"
        ).order_by(
            "-created_at"
        )


class OrderCreateAPIView(generics.CreateAPIView):

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def create(
        self,
        request,
        *args,
        **kwargs
    ):

        cart_id = request.data.get(
            "cart_id"
        )

        address_id = request.data.get(
            "address_id"
        )

        discount_code_value = request.data.get(
            "discount_code"
        )

        if not cart_id:

            return Response(
                {
                    "error": "cart_id is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not address_id:

            return Response(
                {
                    "error": "address_id is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart = get_object_or_404(
            Cart,
            id=cart_id,
            user=request.user,
        )

        address = get_object_or_404(
            Address,
            id=address_id,
            user=request.user,
        )

        cart_items = list(
            cart.items.select_related(
                "product"
            )
        )

        if not cart_items:

            return Response(
                {
                    "error": "سبد خرید خالی است."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        total_price = 0

        for item in cart_items:

            if item.product.status != "available":

                return Response(
                    {
                        "error": (
                            f"محصول «{item.product.name}» "
                            "در حال حاضر قابل خرید نیست."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if item.product.stock < item.quantity:

                return Response(
                    {
                        "error": (
                            f"موجودی محصول «"
                            f"{item.product.name}» کافی نیست."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            total_price += (
                item.product.consumer_price
                * item.quantity
            )

        discount_code = None
        discount_amount = 0

        if discount_code_value:

            try:

                discount_code = DiscountCode.objects.get(
                    code=discount_code_value,
                    is_active=True,
                )

            except DiscountCode.DoesNotExist:

                return Response(
                    {
                        "error": "کد تخفیف معتبر نیست."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if (
                discount_code.expires_at
                and discount_code.expires_at
                < timezone.now()
            ):

                return Response(
                    {
                        "error": "کد تخفیف منقضی شده است."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if (
                discount_code.max_uses > 0
                and discount_code.used_count
                >= discount_code.max_uses
            ):

                return Response(
                    {
                        "error": "ظرفیت استفاده از کد تخفیف تمام شده است."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            discount_amount = int(
                total_price
                * discount_code.discount_percent
                / 100
            )

        final_price = (
            total_price - discount_amount
        )

        order = Order.objects.create(
            user=request.user,
            address=address,
            discount_code=discount_code,
            total_price=total_price,
            discount_amount=discount_amount,
            final_price=final_price,
            status="pending",
        )

        for item in cart_items:

            OrderItem.objects.create(
                order=order,
                product=item.product,
                product_name=item.product.name,
                unit_price=item.product.consumer_price,
                quantity=item.quantity,
            )

            item.product.stock -= item.quantity

            item.product.save(
                update_fields=["stock"]
            )

        if discount_code:

            discount_code.used_count += 1

            discount_code.save(
                update_fields=["used_count"]
            )

        cart.items.all().delete()

        serializer = OrderSerializer(
            order
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------
# Payments
# ---------------------------------------------------------


class PaymentCreateAPIView(
    generics.CreateAPIView
):

    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def create(
        self,
        request,
        *args,
        **kwargs
    ):

        order_id = kwargs.get(
            "order_id"
        )

        order = get_object_or_404(
            Order,
            id=order_id,
            user=request.user,
        )

        if order.status != "pending":

            return Response(
                {
                    "error": (
                        "این سفارش در انتظار پرداخت نیست."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment = Payment.objects.create(
            order=order,
            amount=order.final_price,
            status="pending",
        )

        serializer = self.get_serializer(
            payment
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


class PaymentListAPIView(
    generics.ListAPIView
):

    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        order_id = self.kwargs.get(
            "order_id"
        )

        return Payment.objects.filter(
            order_id=order_id,
            order__user=self.request.user,
        ).order_by(
            "-created_at"
        )


# ---------------------------------------------------------
# Discount codes
# ---------------------------------------------------------


class DiscountCodeAPIView(
    generics.GenericAPIView
):

    serializer_class = DiscountCodeSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):

        code = request.data.get(
            "code"
        )

        if not code:

            return Response(
                {
                    "error": "کد تخفیف را وارد کنید."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        discount = DiscountCode.objects.filter(
            code=code,
            is_active=True,
        ).first()

        if not discount:

            return Response(
                {
                    "error": "کد تخفیف معتبر نیست."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            DiscountCodeSerializer(
                discount
            ).data
        )


# ---------------------------------------------------------
# Reviews
# ---------------------------------------------------------


class ReviewListCreateAPIView(
    generics.ListCreateAPIView
):

    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):

        product_id = self.kwargs.get(
            "product_id"
        )

        return Review.objects.filter(
            product_id=product_id,
            is_approved=True,
        ).order_by(
            "-created_at"
        )


# ---------------------------------------------------------
# Product questions
# ---------------------------------------------------------


class ProductQuestionListCreateAPIView(
    generics.ListCreateAPIView
):

    serializer_class = ProductQuestionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):

        product_id = self.kwargs.get(
            "product_id"
        )

        return ProductQuestion.objects.filter(
            product_id=product_id,
            is_approved=True,
        ).order_by(
            "-created_at"
        )