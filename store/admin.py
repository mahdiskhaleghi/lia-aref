from django.contrib import admin

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
    ProductImage,
    ProductQuestion,
    Review,
    WishlistItem,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "name",
    )

    search_fields = (
        "name",
    )


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "name",
    )

    search_fields = (
        "name",
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "name",
        "brand",
        "category",
        "consumer_price",
        "stock",
        "status",
    )

    list_filter = (
        "status",
        "brand",
        "category",
    )

    search_fields = (
        "name",
        "description",
    )

    list_select_related = (
        "brand",
        "category",
    )


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "product",
        "is_main",
        "created_at",
    )

    list_filter = (
        "is_main",
    )

    search_fields = (
        "product__name",
    )


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "created_at",
        "updated_at",
    )

    search_fields = (
        "user__username",
    )


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "cart",
        "product",
        "quantity",
    )

    search_fields = (
        "product__name",
        "cart__user__username",
    )


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "product",
        "created_at",
    )

    search_fields = (
        "user__username",
        "product__name",
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "recipient_name",
        "phone",
        "province",
        "city",
        "is_default",
    )

    list_filter = (
        "province",
        "city",
        "is_default",
    )

    search_fields = (
        "user__username",
        "recipient_name",
        "phone",
        "postal_code",
    )


@admin.register(DiscountCode)
class DiscountCodeAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "code",
        "discount_percent",
        "max_uses",
        "used_count",
        "is_active",
        "expires_at",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "code",
    )


class OrderItemInline(admin.TabularInline):

    model = OrderItem

    extra = 0

    readonly_fields = (
        "product_name",
        "unit_price",
        "quantity",
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "final_price",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "user__username",
        "id",
    )

    inlines = [
        OrderItemInline,
    ]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "order",
        "product_name",
        "unit_price",
        "quantity",
    )

    search_fields = (
        "product_name",
        "order__user__username",
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "order",
        "amount",
        "tracking_code",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "tracking_code",
        "order__user__username",
    )


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "product",
        "name",
        "rating",
        "is_approved",
        "created_at",
    )

    list_filter = (
        "rating",
        "is_approved",
    )

    search_fields = (
        "product__name",
        "name",
        "comment",
    )


@admin.register(ProductQuestion)
class ProductQuestionAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "product",
        "name",
        "is_approved",
        "created_at",
    )

    list_filter = (
        "is_approved",
    )

    search_fields = (
        "product__name",
        "name",
        "question",
        "answer",
    )