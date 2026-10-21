const API_BASE = "http://127.0.0.1:8000";

const checkoutForm = document.getElementById("checkout-form");
const checkoutMessage = document.getElementById("checkout-message");
const checkoutSummaryContent = document.getElementById(
    "checkout-summary-content"
);
const submitOrderButton = document.getElementById("submit-order-btn");
const cartCount = document.getElementById("cart-count");

function getToken() {
    return localStorage.getItem("lia_token");
}

function getLocalCart() {
    try {
        const cart = JSON.parse(
            localStorage.getItem("lia_cart") || "[]"
        );

        return Array.isArray(cart) ? cart : [];
    } catch (error) {
        console.error("Cart parse error:", error);
        return [];
    }
}

function getProductId(item) {
    return Number(
        item.productId ??
        item.product_id ??
        item.product
    );
}

function saveLocalCart(cart) {
    localStorage.setItem(
        "lia_cart",
        JSON.stringify(cart)
    );
}

function formatPrice(price) {
    return `${Number(price || 0).toLocaleString("fa-IR")} تومان`;
}

function updateCartCount() {
    const cart = getLocalCart();

    let count = 0;

    cart.forEach(item => {
        count += Number(item.quantity || 1);
    });

    if (cartCount) {
        cartCount.textContent =
            count.toLocaleString("fa-IR");
    }
}

function showMessage(message, type = "info") {
    if (!checkoutMessage) {
        return;
    }

    checkoutMessage.textContent = message;

    checkoutMessage.className =
        `checkout-message ${type}`;
}

function getHeaders(token) {
    return {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`
    };
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);

    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }

    if (!response.ok) {
        const message =
            data?.error ||
            data?.detail ||
            data?.message ||
            data?.non_field_errors?.[0] ||
            "خطایی در ارتباط با سرور رخ داد.";

        throw new Error(message);
    }

    return data;
}

function showEmptyCart() {
    checkoutSummaryContent.innerHTML = `
        <div class="checkout-empty">

            <p>
                سبد خرید شما خالی است.
            </p>

            <a href="index.html">
                بازگشت به فروشگاه
            </a>

        </div>
    `;

    if (checkoutForm) {
        checkoutForm.style.display = "none";
    }
}

function renderSummary(cart) {
    if (!checkoutSummaryContent) {
        return;
    }

    if (!cart.length) {
        showEmptyCart();
        return;
    }

    let total = 0;

    const itemsHtml = cart.map(item => {

        const quantity =
            Number(item.quantity || 1);

        const price =
            Number(item.price || 0);

        const itemTotal =
            price * quantity;

        total += itemTotal;

        return `
            <div class="summary-item">

                <div>

                    <div class="summary-item-name">
                        ${escapeHtml(
                            item.name || "محصول"
                        )}
                    </div>

                    <div class="summary-item-meta">
                        تعداد:
                        ${quantity.toLocaleString("fa-IR")}
                    </div>

                </div>

                <div class="summary-item-price">
                    ${formatPrice(itemTotal)}
                </div>

            </div>
        `;
    }).join("");

    checkoutSummaryContent.innerHTML = `
        <div class="summary-items">
            ${itemsHtml}
        </div>

        <div class="summary-total">

            <span>
                مبلغ کل
            </span>

            <span>
                ${formatPrice(total)}
            </span>

        </div>
    `;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function enrichCartItem(item) {

    if (
        item.price &&
        item.name
    ) {
        return item;
    }

    try {

        const product = await apiRequest(
            `${API_BASE}/api/products/${getProductId(item)}/`
        );

        return {
            ...item,
            name:
                product.name ||
                item.name ||
                "محصول",
            price:
                Number(product.consumer_price || 0),
            image:
                product.image || item.image || ""
        };

    } catch (error) {

        console.error(
            "Product enrichment error:",
            error
        );

        return item;
    }
}

async function enrichCart(cart) {

    const updatedCart =
        await Promise.all(
            cart.map(item =>
                enrichCartItem(item)
            )
        );

    saveLocalCart(updatedCart);

    return updatedCart;
}

async function getBackendCart(token) {

    return await apiRequest(
        `${API_BASE}/api/cart/`,
        {
            method: "GET",
            headers: getHeaders(token)
        }
    );
}

async function createBackendCartItem(
    token,
    productId,
    quantity
) {

    return await apiRequest(
        `${API_BASE}/api/cart/items/`,
        {
            method: "POST",
            headers: getHeaders(token),
            body: JSON.stringify({
                product: Number(productId),
                quantity: Number(quantity)
            })
        }
    );
}

async function updateBackendCartItem(
    token,
    itemId,
    quantity
) {

    return await apiRequest(
        `${API_BASE}/api/cart/items/${itemId}/`,
        {
            method: "PATCH",
            headers: getHeaders(token),
            body: JSON.stringify({
                quantity: Number(quantity)
            })
        }
    );
}

async function deleteBackendCartItem(
    token,
    itemId
) {

    return await apiRequest(
        `${API_BASE}/api/cart/items/${itemId}/delete/`,
        {
            method: "DELETE",
            headers: getHeaders(token)
        }
    );
}

async function syncCartWithBackend(
    token,
    localCart
) {

    let backendCart =
        await getBackendCart(token);

    const backendItems =
        Array.isArray(backendCart.items)
            ? backendCart.items
            : [];

    const localProductIds =
        new Set(
            localCart.map(item =>
                getProductId(item)
            )
        );

    /*
     * حذف محصولاتی که در LocalStorage
     * وجود ندارند ولی در Backend Cart هستند.
     */
    for (const backendItem of backendItems) {

        const backendProductId =
            Number(backendItem.product);

        if (
            !localProductIds.has(
                backendProductId
            )
        ) {

            await deleteBackendCartItem(
                token,
                backendItem.id
            );
        }
    }

    /*
     * دوباره Cart Backend را می‌گیریم
     * تا وضعیت نهایی را داشته باشیم.
     */
    backendCart =
        await getBackendCart(token);

    const currentBackendItems =
        Array.isArray(backendCart.items)
            ? backendCart.items
            : [];

    for (const localItem of localCart) {

        const productId =
            Number(getProductId(localItem));

        const quantity =
            Number(localItem.quantity || 1);

        if (!productId) {
            throw new Error(
                "شناسه محصول در سبد خرید نامعتبر است."
            );
        }

        const backendItem =
            currentBackendItems.find(
                item =>
                    Number(item.product) ===
                    productId
            );

        if (backendItem) {

            if (
                Number(backendItem.quantity) !==
                quantity
            ) {

                await updateBackendCartItem(
                    token,
                    backendItem.id,
                    quantity
                );
            }

        } else {

            await createBackendCartItem(
                token,
                productId,
                quantity
            );
        }
    }

    /*
     * وضعیت نهایی Cart Backend
     */
    return await getBackendCart(token);
}

async function createAddress(
    token,
    formData
) {

    const addressData = {

        title: "آدرس اصلی",

        recipient_name:
            formData.fullName,

        phone:
            formData.phone,

        province:
            formData.province,

        city:
            formData.city,

        address:
            formData.address,

        postal_code:
            formData.postalCode,

        is_default: true
    };

    return await apiRequest(
        `${API_BASE}/api/addresses/`,
        {
            method: "POST",
            headers: getHeaders(token),
            body: JSON.stringify(addressData)
        }
    );
}

async function createOrder(
    token,
    cartId,
    addressId
) {

    return await apiRequest(
        `${API_BASE}/api/orders/create/`,
        {
            method: "POST",
            headers: getHeaders(token),
            body: JSON.stringify({
                cart_id: cartId,
                address_id: addressId
            })
        }
    );
}

function getFormData() {

    return {

        fullName:
            document
                .getElementById("full-name")
                .value
                .trim(),

        phone:
            document
                .getElementById("phone")
                .value
                .trim(),

        province:
            document
                .getElementById("province")
                .value
                .trim(),

        city:
            document
                .getElementById("city")
                .value
                .trim(),

        address:
            document
                .getElementById("address")
                .value
                .trim(),

        postalCode:
            document
                .getElementById("postal-code")
                .value
                .trim()
    };
}

function validateForm(data) {

    if (!data.fullName) {
        return "نام و نام خانوادگی را وارد کنید.";
    }

    if (!data.phone) {
        return "شماره تماس را وارد کنید.";
    }

    if (!data.province) {
        return "استان را وارد کنید.";
    }

    if (!data.city) {
        return "شهر را وارد کنید.";
    }

    if (!data.address) {
        return "آدرس کامل را وارد کنید.";
    }

    if (!data.postalCode) {
        return "کد پستی را وارد کنید.";
    }

    if (data.postalCode.length !== 10) {
        return "کد پستی باید ۱۰ رقم باشد.";
    }

    return null;
}

async function initializeCheckout() {

    const token = getToken();

    if (!token) {

        showMessage(
            "برای تکمیل سفارش ابتدا وارد حساب کاربری خود شوید.",
            "error"
        );

        if (submitOrderButton) {
            submitOrderButton.disabled = true;
        }

        return;
    }

    let cart = getLocalCart();

    if (!cart.length) {
        showEmptyCart();
        return;
    }

    try {

        cart =
            await enrichCart(cart);

        renderSummary(cart);

    } catch (error) {

        console.error(
            "Checkout initialization error:",
            error
        );

        renderSummary(cart);
    }
}

if (checkoutForm) {

    checkoutForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const token =
                getToken();

            if (!token) {

                showMessage(
                    "ابتدا وارد حساب کاربری خود شوید.",
                    "error"
                );

                return;
            }

            const localCart =
                getLocalCart();

            if (!localCart.length) {

                showMessage(
                    "سبد خرید شما خالی است.",
                    "error"
                );

                return;
            }

            const formData =
                getFormData();

            const validationError =
                validateForm(formData);

            if (validationError) {

                showMessage(
                    validationError,
                    "error"
                );

                return;
            }

            try {

                submitOrderButton.disabled =
                    true;

                submitOrderButton.textContent =
                    "در حال ثبت سفارش...";

                showMessage(
                    "در حال آماده‌سازی سفارش...",
                    "info"
                );

                /*
                 * 1. هماهنگ کردن سبد LocalStorage
                 * با سبد Backend
                 */
                const backendCart =
                    await syncCartWithBackend(
                        token,
                        localCart
                    );

                if (!backendCart.id) {
                    throw new Error(
                        "سبد خرید Backend پیدا نشد."
                    );
                }

                if (
                    !Array.isArray(
                        backendCart.items
                    ) ||
                    backendCart.items.length === 0
                ) {

                    throw new Error(
                        "سبد خرید Backend خالی است."
                    );
                }

                /*
                 * 2. ساخت آدرس
                 */
                showMessage(
                    "در حال ثبت اطلاعات ارسال...",
                    "info"
                );

                const address =
                    await createAddress(
                        token,
                        formData
                    );

                if (!address.id) {
                    throw new Error(
                        "آدرس ایجاد نشد."
                    );
                }

                /*
                 * 3. ایجاد سفارش
                 */
                showMessage(
                    "در حال ثبت سفارش...",
                    "info"
                );

                const order =
                    await createOrder(
                        token,
                        backendCart.id,
                        address.id
                    );

                if (!order.id) {
                    throw new Error(
                        "سفارش ایجاد نشد."
                    );
                }

                /*
                 * 4. پاک کردن LocalStorage Cart
                 *
                 * Backend هم خودش Cart را
                 * بعد از ایجاد Order پاک می‌کند.
                 */
                saveLocalCart([]);

                updateCartCount();

                showMessage(
                    "سفارش با موفقیت ثبت شد.",
                    "success"
                );

                submitOrderButton.textContent =
                    "سفارش ثبت شد";

                /*
                 * 5. انتقال به صفحه سفارش
                 */
                setTimeout(
                    function() {

                        window.location.href =
                            `order.html?order_id=${encodeURIComponent(
                                order.id
                            )}`;

                    },
                    700
                );

            } catch (error) {

                console.error(
                    "Create order error:",
                    error
                );

                showMessage(
                    error.message ||
                    "ثبت سفارش انجام نشد.",
                    "error"
                );

                submitOrderButton.disabled =
                    false;

                submitOrderButton.textContent =
                    "ثبت سفارش";
            }
        }
    );
}

updateCartCount();
initializeCheckout();