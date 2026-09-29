const API_BASE = "http://127.0.0.1:8000";

const token = localStorage.getItem("lia_token");

const userInfo = document.getElementById("user-info");
const ordersList = document.getElementById("orders-list");
const messageBox = document.getElementById("profile-message");

function showMessage(message, type = "info") {
    messageBox.innerHTML = `
        <div class="profile-message ${type}">
            ${message}
        </div>
    `;
}

async function api(url, options = {}) {
    const response = await fetch(API_BASE + url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
            ...(options.headers || {})
        }
    });

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(
            data?.detail ||
            data?.error ||
            "خطایی در ارتباط با سرور رخ داد."
        );
    }

    return data;
}

function formatPrice(value) {
    return Number(value || 0).toLocaleString("fa-IR") + " تومان";
}

function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function statusText(status) {
    const statuses = {
        pending: "در انتظار پرداخت",
        paid: "پرداخت شده",
        processing: "در حال پردازش",
        shipped: "ارسال شده",
        delivered: "تحویل شده",
        cancelled: "لغو شده"
    };

    return statuses[status] || status || "-";
}

async function loadUser() {

    const userId = localStorage.getItem("lia_user_id");
    const username = localStorage.getItem("lia_username");

    if (!username) {
        userInfo.innerHTML = `
            <div class="empty-state">
                اطلاعات حساب پیدا نشد.
            </div>
        `;
        return;
    }

    userInfo.innerHTML = `
        <div class="user-info">

            <div class="info-item">
                <span class="info-label">نام کاربری</span>
                <span class="info-value">
                    ${username}
                </span>
            </div>

            <div class="info-item">
                <span class="info-label">شناسه کاربر</span>
                <span class="info-value">
                    ${userId || "-"}
                </span>
            </div>

            <div class="info-item">
                <span class="info-label">وضعیت حساب</span>
                <span class="info-value">
                    فعال
                </span>
            </div>

            <div class="info-item">
                <span class="info-label">احراز هویت</span>
                <span class="info-value">
                    وارد شده
                </span>
            </div>

        </div>
    `;
}

async function loadOrders() {
    try {
        const data = await api("/api/orders/");

        const orders = Array.isArray(data)
            ? data
            : Array.isArray(data.results)
                ? data.results
                : [];

        if (!orders.length) {
            ordersList.innerHTML = `
                <div class="empty-state">
                    هنوز سفارشی ثبت نکرده‌اید.
                </div>
            `;
            return;
        }

        orders.sort((a, b) => Number(b.id) - Number(a.id));

        ordersList.innerHTML = orders.map(order => {

            const total = order.final_price ?? order.total_price ?? 0;

            return `
                <div class="order-item">

                    <div class="order-row">
                        <strong>
                            سفارش #${Number(order.id).toLocaleString("fa-IR")}
                        </strong>

                        <span class="order-status">
                            ${statusText(order.status)}
                        </span>
                    </div>

                    <div class="order-row">
                        <span>مبلغ</span>
                        <strong>${formatPrice(total)}</strong>
                    </div>

                    <div class="order-row">
                        <span>تاریخ ثبت</span>
                        <span>${formatDate(order.created_at)}</span>
                    </div>

                    <div style="margin-top:15px;">
                        <a
                            href="order.html?order_id=${order.id}"
                            class="btn"
                        >
                            مشاهده سفارش
                        </a>
                    </div>

                </div>
            `;
        }).join("");

    } catch (error) {

        ordersList.innerHTML = `
            <div class="empty-state">
                دریافت سفارش‌ها با خطا مواجه شد.
            </div>
        `;
    }
}

function showSection(section) {

    const accountSection =
        document.getElementById("account-section");

    const ordersSection =
        document.getElementById("orders-section");

    if (section === "orders") {
        accountSection.style.display = "none";
        ordersSection.style.display = "block";
    } else {
        accountSection.style.display = "block";
        ordersSection.style.display = "none";
    }
}

function logoutUser() {

    localStorage.removeItem("lia_token");

    window.location.href = "index.html";
}

async function initProfile() {

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        await Promise.all([
            loadUser(),
            loadOrders()
        ]);
    } catch (error) {
        showMessage(error.message, "error");
    }
}

initProfile();
