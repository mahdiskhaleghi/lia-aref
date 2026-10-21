from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Order, Payment, OrderItem, OrderItem
from .serializers import PaymentSerializer


class PaymentSandboxAPIView(generics.GenericAPIView):

    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, payment_id):

        payment = get_object_or_404(
            Payment.objects.select_related("order"),
            id=payment_id,
            order__user=request.user,
        )

        if payment.status != "pending":

            return Response(
                {
                    "error": (
                        "این پرداخت دیگر در وضعیت انتظار نیست."
                    ),
                    "status": payment.status,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        order_items = OrderItem.objects.filter(
            order=payment.order
        ).select_related("product")

        for item in order_items:

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

        for item in order_items:

            item.product.stock -= item.quantity

            item.product.save(
                update_fields=["stock"]
            )

        order_items = OrderItem.objects.filter(
            order=payment.order
        ).select_related("product")

        for item in order_items:

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

        for item in order_items:

            item.product.stock -= item.quantity

            item.product.save(
                update_fields=["stock"]
            )

        payment.status = "successful"

        payment.tracking_code = (
            f"TEST-{payment.id:06d}"
        )

        payment.save(
            update_fields=[
                "status",
                "tracking_code",
            ]
        )

        payment.order.status = "paid"

        payment.order.save(
            update_fields=["status"]
        )

        serializer = self.get_serializer(
            payment
        )

        return Response(
            {
                "message": (
                    "پرداخت آزمایشی با موفقیت انجام شد."
                ),
                "payment": serializer.data,
                "order_id": payment.order.id,
                "order_status": payment.order.status,
            },
            status=status.HTTP_200_OK,
        )


class PaymentSandboxFailAPIView(
    generics.GenericAPIView
):

    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, payment_id):

        payment = get_object_or_404(
            Payment.objects.select_related("order"),
            id=payment_id,
            order__user=request.user,
        )

        if payment.status != "pending":

            return Response(
                {
                    "error": (
                        "این پرداخت دیگر در وضعیت انتظار نیست."
                    ),
                    "status": payment.status,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment.status = "failed"

        payment.save(
            update_fields=["status"]
        )

        serializer = self.get_serializer(
            payment
        )

        return Response(
            {
                "message": "پرداخت آزمایشی ناموفق بود.",
                "payment": serializer.data,
                "order_id": payment.order.id,
                "order_status": payment.order.status,
            },
            status=status.HTTP_200_OK,
        )