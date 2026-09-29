const API_BASE = "http://127.0.0.1:8000";

const paymentContent = document.getElementById("payment-content");

const token = localStorage.getItem("lia_token");

function formatPrice(price) {
    return Number(price || 0).toLocaleString("fa-IR") + " تومان";
}

function getOrderId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("order_id");
}

function showMessage(message, type) {
    const box = document.getElementById("payment-message");

    if (!box) return;

    box.className = `payment-message ${type}`;
    box.textContent = message;
}

async function getOrder(orderId) {
    const response = await fetch(`${API_BASE}/api/orders/`, {
        headers: {
            "Authorization": `Token ${token}`
        }
    });

    if (!response.ok) {
        throw new Error("دریافت سفارش انجام نشد.");
    }

    const data = await response.json();

    const orders = Array.isArray(data)
        ? data
        : (data.results || []);

    return orders.find(order => Number(order.id) === Number(orderId));
}

async function createPayment(orderId) {
    const response = await fetch(
        `${API_BASE}/api/orders/${orderId}/payments/create/`,
        {
            method: "POST",
            headers: {
                "Authorization": `Token ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.detail ||
            "ایجاد پرداخت انجام نشد."
        );
    }

    return data;
}

async function sandboxSuccess(paymentId) {
    const response = await fetch(
        `${API_BASE}/api/payments/${paymentId}/sandbox-success/`,
        {
            method: "POST",
            headers: {
                "Authorization": `Token ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.detail ||
            "پرداخت موفق نشد."
        );
    }

    return data;
}

async function sandboxFail(paymentId) {
    const response = await fetch(
        `${API_BASE}/api/payments/${paymentId}/sandbox-fail/`,
        {
            method: "POST",
            headers: {
                "Authorization": `Token ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.detail ||
            "پرداخت ناموفق شد."
        );
    }

    return data;
}

function renderPayment(order, payment) {

    paymentContent.innerHTML = `
        <div class="payment-card">

            <div class="payment-summary">

                <div class="summary-box">
                    <span>شماره سفارش</span>
                    <strong>#${Number(order.id).toLocaleString("fa-IR")}</strong>
                </div>

                <div class="summary-box">
                    <span>مبلغ قابل پرداخت</span>
                    <strong>${formatPrice(order.final_price)}</strong>
                </div>

            </div>

            <div class="payment-method">

                <div class="payment-method-title">
                    پرداخت آنلاین
                </div>

                <div class="payment-method-description">
                    در این نسخه، پرداخت به صورت آزمایشی انجام می‌شود.
                    برای تست کامل فرآیند فروشگاه می‌توانید پرداخت موفق
                    یا ناموفق را انتخاب کنید.
                </div>

            </div>

            <div class="payment-actions">

                <button
                    id="success-payment-btn"
                    class="payment-btn payment-btn-success"
                    type="button"
                >
                    پرداخت موفق
                </button>

                <button
                    id="fail-payment-btn"
                    class="payment-btn payment-btn-fail"
                    type="button"
                >
                    شبیه‌سازی پرداخت ناموفق
                </button>

            </div>

            <div id="payment-message" class="payment-message"></div>

        </div>
    `;

    document
        .getElementById("success-payment-btn")
        .addEventListener("click", async () => {

            const button = document.getElementById(
                "success-payment-btn"
            );

            button.disabled = true;
            button.textContent = "در حال پردازش...";

            try {

                const result = await sandboxSuccess(
                    payment.id
                );

                showMessage(
                    result.message ||
                    "پرداخت با موفقیت انجام شد.",
                    "success"
                );

                setTimeout(() => {
                    window.location.href =
                        `order.html?order_id=${order.id}`;
                }, 1200);

            } catch (error) {

                showMessage(
                    error.message,
                    "error"
                );

                button.disabled = false;
                button.textContent = "پرداخت موفق";
            }
        });

    document
        .getElementById("fail-payment-btn")
        .addEventListener("click", async () => {

            const button = document.getElementById(
                "fail-payment-btn"
            );

            button.disabled = true;
            button.textContent = "در حال پردازش...";

            try {

                const result = await sandboxFail(
                    payment.id
                );

                showMessage(
                    result.message ||
                    "پرداخت ناموفق ثبت شد.",
                    "error"
                );

                setTimeout(() => {
                    window.location.href =
                        `order.html?order_id=${order.id}`;
                }, 1200);

            } catch (error) {

                showMessage(
                    error.message,
                    "error"
                );

                button.disabled = false;
                button.textContent =
                    "شبیه‌سازی پرداخت ناموفق";
            }
        });
}

async function initPayment() {

    if (!token) {
        paymentContent.innerHTML = `
            <div class="payment-card">
                برای پرداخت ابتدا وارد حساب کاربری شوید.
            </div>
        `;
        return;
    }

    const orderId = getOrderId();

    if (!orderId) {
        paymentContent.innerHTML = `
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
            paymentContent.innerHTML = `
                <div class="payment-card">
                    <h3>این سفارش قابل پرداخت نیست.</h3>
                    <p>
                        وضعیت فعلی سفارش:
                        ${order.status || "-"}
                    </p>
                    <br>
                    <a href="order.html?order_id=${order.id}">
                        مشاهده سفارش
                    </a>
                </div>
            `;
            return;
        }

        const payment = await createPayment(order.id);

        renderPayment(order, payment);

    } catch (error) {

        paymentContent.innerHTML = `
            <div class="payment-card">
                <div class="payment-message error">
                    ${escapeHtml(error.message)}
                </div>
            </div>
        `;
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

initPayment();
