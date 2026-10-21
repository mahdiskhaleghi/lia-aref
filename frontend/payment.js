const API_BASE = "http://127.0.0.1:8000";

const token = localStorage.getItem("lia_token");
const content = document.getElementById("payment-content");

function price(value) {
    return Number(value || 0).toLocaleString("fa-IR") + " تومان";
}

function orderIdFromUrl() {
    return new URLSearchParams(window.location.search).get("order_id");
}

function message(text, type = "error") {
    const box = document.getElementById("payment-message");

    if (!box) return;

    box.className = "payment-message " + type;
    box.textContent = text;
}

async function api(url, options = {}) {

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Token ${token}`;
    }

    const response = await fetch(API_BASE + url, {
        ...options,
        headers
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.detail ||
            "خطایی در ارتباط با سرور رخ داد."
        );
    }

    return data;
}

async function getOrder(id) {

    const data = await api("/api/orders/");

    const orders = Array.isArray(data)
        ? data
        : (data.results || []);

    return orders.find(
        order => Number(order.id) === Number(id)
    );
}

async function createPayment(orderId) {

    return await api(
        `/api/orders/${orderId}/payments/create/`,
        {
            method: "POST",
            body: "{}"
        }
    );
}

function render(order, payment) {

    content.innerHTML = `
        <div class="payment-card">

            <div class="payment-summary">

                <div class="summary-box">
                    <span>شماره سفارش</span>
                    <strong>
                        #${Number(order.id).toLocaleString("fa-IR")}
                    </strong>
                </div>

                <div class="summary-box">
                    <span>مبلغ قابل پرداخت</span>
                    <strong>
                        ${price(order.final_price)}
                    </strong>
                </div>

            </div>

            <div class="payment-method">

                <div class="payment-method-title">
                    پرداخت آنلاین
                </div>

                <div class="payment-method-description">
                    پرداخت آزمایشی فروشگاه لیا عارف
                </div>

            </div>

            <div class="payment-actions">

                <button
                    id="success-payment"
                    class="payment-btn payment-btn-success"
                    type="button"
                >
                    پرداخت موفق
                </button>

                <button
                    id="fail-payment"
                    class="payment-btn payment-btn-fail"
                    type="button"
                >
                    پرداخت ناموفق
                </button>

            </div>

            <div id="payment-message"
                 class="payment-message">
            </div>

        </div>
    `;

    document
        .getElementById("success-payment")
        .addEventListener("click", () =>
            finishPayment(payment.id, true)
        );

    document
        .getElementById("fail-payment")
        .addEventListener("click", () =>
            finishPayment(payment.id, false)
        );
}

async function finishPayment(paymentId, success) {

    const successButton =
        document.getElementById("success-payment");

    const failButton =
        document.getElementById("fail-payment");

    successButton.disabled = true;
    failButton.disabled = true;

    try {

        const url = success
            ? `/api/payments/${paymentId}/sandbox-success/`
            : `/api/payments/${paymentId}/sandbox-fail/`;

        const result = await api(url, {
            method: "POST",
            body: "{}"
        });

        message(
            result.message ||
            (success
                ? "پرداخت با موفقیت انجام شد."
                : "پرداخت ناموفق ثبت شد."),
            success ? "success" : "error"
        );

        if (success) {

            setTimeout(() => {
                window.location.href =
                    "order.html?order_id=" +
                    orderIdFromUrl();
            }, 1200);

        } else {

            successButton.disabled = false;
            failButton.disabled = false;
        }

    } catch (error) {

        message(error.message, "error");

        successButton.disabled = false;
        failButton.disabled = false;
    }
}

async function initPayment() {

    if (!content) return;

    if (!token) {

        content.innerHTML = `
            <div class="payment-card">
                برای پرداخت ابتدا وارد حساب کاربری شوید.
            </div>
        `;

        return;
    }

    const orderId = orderIdFromUrl();

    if (!orderId) {

        content.innerHTML = `
            <div class="payment-card">
                شماره سفارش مشخص نشده است.
            </div>
        `;

        return;
    }

    try {

        const order = await getOrder(orderId);

        if (!order) {
            throw new Error("سفارش پیدا نشد.");
        }

        if (order.status !== "pending") {

            content.innerHTML = `
                <div class="payment-card">
                    <h3>این سفارش قابل پرداخت نیست.</h3>
                    <p>
                        وضعیت سفارش:
                        ${order.status}
                    </p>
                </div>
            `;

            return;
        }

        const payment = await createPayment(order.id);

        render(order, payment);

    } catch (error) {

        content.innerHTML = `
            <div class="payment-card">

                <div class="payment-message error">
                    ${error.message}
                </div>

            </div>
        `;
    }
}

initPayment();
