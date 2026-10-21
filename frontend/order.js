const API_BASE = "http://127.0.0.1:8000";

const orderContent = document.getElementById("order-content");
const cartCount = document.getElementById("cart-count");

function getToken() {
    return localStorage.getItem("lia_token");
}

function formatPrice(price) {
    return `${Number(price || 0).toLocaleString("fa-IR")} تومان`;
}

function updateCartCount() {
    const cart = JSON.parse(
        localStorage.getItem("lia_cart") || "[]"
    );

    let count = 0;

    cart.forEach(item => {
        count += Number(item.quantity || 1);
    });

    if (cartCount) {
        cartCount.textContent = count.toLocaleString("fa-IR");
    }
}

function getStatusText(status) {
    const statuses = {
        pending: "در انتظار پرداخت",
        paid: "پرداخت شده",
        processing: "در حال پردازش",
        shipped: "ارسال شده",
        delivered: "تحویل شده",
        cancelled: "لغو شده"
    };

    return statuses[status] || status || "نامشخص";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showError(message) {
    orderContent.innerHTML = `
        <div class="order-error">
            ${escapeHtml(message)}

            <div class="order-actions" style="justify-content:center;">
                <a href="index.html" class="order-button">
                    بازگشت به فروشگاه
                </a>

                <a href="cart.html" class="order-button secondary">
                    مشاهده سبد خرید
                </a>
            </div>
        </div>
    `;
}

async function loadLatestOrder() {
    const token = getToken();

    if (!token) {
        showError("برای مشاهده سفارش ابتدا وارد حساب کاربری خود شوید.");
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/api/orders/`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Token ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Orders API error:", data);

            showError(
                data.detail ||
                data.error ||
                "دریافت اطلاعات سفارش انجام نشد."
            );

            return;
        }

        let orders = [];

        if (Array.isArray(data)) {
            orders = data;
        } else if (Array.isArray(data.results)) {
            orders = data.results;
        }

        if (!orders.length) {
            orderContent.innerHTML = `
                <div class="order-empty">
                    <p>هنوز سفارشی ثبت نکرده‌اید.</p>

                    <div class="order-actions" style="justify-content:center;">
                        <a href="index.html" class="order-button">
                            مشاهده محصولات
                        </a>
                    </div>
                </div>
            `;

            return;
        }

        orders.sort((a, b) => {
            return Number(b.id || 0) - Number(a.id || 0);
        });

        renderOrder(orders[0]);

    } catch (error) {
        console.error("Load order error:", error);

        showError(
            "ارتباط با سرور برقرار نشد. مطمئن شوید Django در حال اجراست."
        );
    }
}

function renderOrder(order) {
    const items = Array.isArray(order.items)
        ? order.items
        : [];

    const address = order.address || {};

    const itemsHtml = items.length
        ? items.map(item => {

            const quantity = Number(item.quantity || 0);

            const unitPrice = Number(
                item.unit_price || 0
            );

            const totalItemPrice =
                unitPrice * quantity;

            return `
                <div class="order-item">

                    <div>
                        <div class="order-item-name">
                            ${escapeHtml(
                                item.product_name ||
                                "محصول"
                            )}
                        </div>

                        <div class="order-item-meta">
                            تعداد:
                            ${quantity.toLocaleString("fa-IR")}

                            ×

                            ${formatPrice(unitPrice)}
                        </div>
                    </div>

                    <div class="order-item-price">
                        ${formatPrice(totalItemPrice)}
                    </div>

                </div>
            `;
        }).join("")
        : `
            <div class="order-empty">
                آیتمی برای این سفارش ثبت نشده است.
            </div>
        `;

    orderContent.innerHTML = `

        <div class="order-header">

            <div class="order-number">
                شماره سفارش:
                #${Number(order.id || 0).toLocaleString("fa-IR")}
            </div>

            <div class="order-status">
                ${escapeHtml(
                    getStatusText(order.status)
                )}
            </div>

        </div>

        <div class="order-info">

            <div class="info-item">
                <span class="info-label">
                    گیرنده
                </span>

                <span class="info-value">
                    ${escapeHtml(
                        address.recipient_name || "-"
                    )}
                </span>
            </div>

            <div class="info-item">
                <span class="info-label">
                    شماره تماس
                </span>

                <span class="info-value">
                    ${escapeHtml(
                        address.phone || "-"
                    )}
                </span>
            </div>

            <div class="info-item">
                <span class="info-label">
                    استان
                </span>

                <span class="info-value">
                    ${escapeHtml(
                        address.province || "-"
                    )}
                </span>
            </div>

            <div class="info-item">
                <span class="info-label">
                    شهر
                </span>

                <span class="info-value">
                    ${escapeHtml(
                        address.city || "-"
                    )}
                </span>
            </div>

            <div class="info-item">
                <span class="info-label">
                    کد پستی
                </span>

                <span class="info-value">
                    ${escapeHtml(
                        address.postal_code || "-"
                    )}
                </span>
            </div>

            <div class="info-item">
                <span class="info-label">
                    آدرس
                </span>

                <span class="info-value">
                    ${escapeHtml(
                        address.address || "-"
                    )}
                </span>
            </div>

        </div>

        <h2 style="font-size:20px;margin-bottom:15px;">
            محصولات سفارش
        </h2>

        <div class="order-items">
            ${itemsHtml}
        </div>

        <div class="order-total">

            <span>
                مبلغ نهایی
            </span>

            <span>
                ${formatPrice(order.final_price)}
            </span>

        </div>

        <div class="order-actions">

            <a
                href="index.html"
                class="order-button"
            >
                ادامه خرید
            </a>

            ${
                order.status === "pending"
                    ? `
                        <a
                            href="payment.html?order_id=${encodeURIComponent(order.id)}"
                            class="order-button secondary"
                        >
                            پرداخت سفارش
                        </a>
                    `
                    : ""
            }

        </div>
    `;
}

updateCartCount();
loadLatestOrder();