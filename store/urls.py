from django.urls import path

from .payment_views import (
    PaymentSandboxAPIView,
    PaymentSandboxFailAPIView,
)

from .views import (
    AddressDetailAPIView,
    AddressListCreateAPIView,
    BrandListAPIView,
    CartAPIView,
    CartItemCreateAPIView,
    CartItemDeleteAPIView,
    CartItemUpdateAPIView,
    CategoryListAPIView,
    DiscountCodeAPIView,
    LoginAPIView,
    OrderCreateAPIView,
    OrderListAPIView,
    PaymentCreateAPIView,
    PaymentListAPIView,
    ProductDetailAPIView,
    ProductListAPIView,
    ProductQuestionListCreateAPIView,
    RegisterAPIView,
    ReviewListCreateAPIView,
    WishlistDeleteAPIView,
    WishlistListCreateAPIView,
)


urlpatterns = [
    path(
        "register/",
        RegisterAPIView.as_view(),
        name="register",
    ),

    path(
        "login/",
        LoginAPIView.as_view(),
        name="login",
    ),

    path(
        "products/",
        ProductListAPIView.as_view(),
        name="products",
    ),

    path(
        "products/<int:pk>/",
        ProductDetailAPIView.as_view(),
        name="product-detail",
    ),

    path(
        "categories/",
        CategoryListAPIView.as_view(),
        name="categories",
    ),

    path(
        "brands/",
        BrandListAPIView.as_view(),
        name="brands",
    ),

    path(
        "cart/",
        CartAPIView.as_view(),
        name="cart",
    ),

    path(
        "cart/items/",
        CartItemCreateAPIView.as_view(),
        name="cart-item-create",
    ),

    path(
        "cart/items/<int:pk>/",
        CartItemUpdateAPIView.as_view(),
        name="cart-item-update",
    ),

    path(
        "cart/items/<int:pk>/delete/",
        CartItemDeleteAPIView.as_view(),
        name="cart-item-delete",
    ),

    path(
        "wishlist/",
        WishlistListCreateAPIView.as_view(),
        name="wishlist",
    ),

    path(
        "wishlist/<int:pk>/",
        WishlistDeleteAPIView.as_view(),
        name="wishlist-delete",
    ),

    path(
        "addresses/",
        AddressListCreateAPIView.as_view(),
        name="addresses",
    ),

    path(
        "addresses/<int:pk>/",
        AddressDetailAPIView.as_view(),
        name="address-detail",
    ),

    path(
        "orders/",
        OrderListAPIView.as_view(),
        name="orders",
    ),

    path(
        "orders/create/",
        OrderCreateAPIView.as_view(),
        name="order-create",
    ),

    path(
        "orders/<int:order_id>/payments/",
        PaymentListAPIView.as_view(),
        name="payment-list",
    ),

    path(
        "orders/<int:order_id>/payments/create/",
        PaymentCreateAPIView.as_view(),
        name="payment-create",
    ),

    path(
        "payments/<int:payment_id>/sandbox-success/",
        PaymentSandboxAPIView.as_view(),
        name="sandbox-payment-success",
    ),

    path(
        "payments/<int:payment_id>/sandbox-fail/",
        PaymentSandboxFailAPIView.as_view(),
        name="sandbox-payment-fail",
    ),

    path(
        "discounts/check/",
        DiscountCodeAPIView.as_view(),
        name="discount-check",
    ),

    path(
        "products/<int:product_id>/reviews/",
        ReviewListCreateAPIView.as_view(),
        name="product-reviews",
    ),

    path(
        "products/<int:product_id>/questions/",
        ProductQuestionListCreateAPIView.as_view(),
        name="product-questions",
    ),
]