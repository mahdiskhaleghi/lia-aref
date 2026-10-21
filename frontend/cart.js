const API_BASE = "http://127.0.0.1:8000";

const cartContent =
    document.getElementById("cart-content");

const cartCount =
    document.getElementById("cart-count");


function getCart() {

    return JSON.parse(
        localStorage.getItem("lia_cart") || "[]"
    );

}


function saveCart(cart) {

    localStorage.setItem(
        "lia_cart",
        JSON.stringify(cart)
    );

}


function updateCartCount() {

    const cart = getCart();

    let count = 0;

    cart.forEach(item => {

        count += Number(
            item.quantity || 1
        );

    });

    if (cartCount) {
        cartCount.textContent = count;
    }

}


function formatPrice(price) {

    return Number(price || 0).toLocaleString("fa-IR")
        + " تومان";

}


/* =========================
   گرفتن اطلاعات کامل محصول
========================= */

async function enrichCartItem(item) {

    if (
        item.price &&
        item.image
    ) {
        return item;
    }


    try {

        const response = await fetch(
            `${API_BASE}/api/products/${item.productId}/`
        );


        if (!response.ok) {
            return item;
        }


        const product =
            await response.json();


        item.name =
            product.name ||
            item.name;


        item.price =
            Number(product.consumer_price || 0);


        item.image =
            product.image ||
            "";


        return item;

    } catch (error) {

        console.error(
            "خطا در دریافت اطلاعات محصول:",
            error
        );

        return item;

    }

}


/* =========================
   تکمیل اطلاعات سبد
========================= */

async function enrichCart() {

    const cart = getCart();


    if (!cart.length) {
        return cart;
    }


    const updatedCart =
        await Promise.all(
            cart.map(item =>
                enrichCartItem(item)
            )
        );


    saveCart(updatedCart);

    return updatedCart;

}


/* =========================
   سبد خالی
========================= */

function renderEmptyCart() {

    cartContent.innerHTML = `

        <div class="empty-cart">

            <h2>
                سبد خرید شما خالی است
            </h2>

            <p>
                هنوز محصولی به سبد خرید اضافه نکرده‌اید.
            </p>

            <a
                href="index.html"
                class="checkout-btn"
            >
                مشاهده محصولات
            </a>

        </div>

    `;

}


/* =========================
   نمایش سبد
========================= */

function renderCart(cart) {

    if (!cart.length) {

        renderEmptyCart();

        updateCartCount();

        return;

    }


    let total = 0;

    let quantityTotal = 0;


    const itemsHTML =
        cart.map((item, index) => {

            const price =
                Number(item.price || 0);

            const quantity =
                Number(item.quantity || 1);

            const itemTotal =
                price * quantity;


            total += itemTotal;

            quantityTotal += quantity;


            let imageHTML =
                `<div class="cart-item-image">
                    <span>تصویر ندارد</span>
                 </div>`;


            if (item.image) {

                let imageURL =
                    item.image;


                if (
                    !imageURL.startsWith("http")
                ) {

                    imageURL =
                        `${API_BASE}${imageURL}`;

                }


                imageHTML = `

                    <div class="cart-item-image">

                        <img
                            src="${imageURL}"
                            alt="${escapeHtml(item.name)}"
                            onerror="this.parentElement.innerHTML='<span>تصویر ندارد</span>'"
                        >

                    </div>

                `;

            }


            return `

                <div class="cart-item">

                    ${imageHTML}


                    <div class="cart-item-info">

                        <h3>
                            ${escapeHtml(item.name)}
                        </h3>


                        <div class="cart-price">

                            ${formatPrice(price)}

                        </div>


                        <div class="quantity-box">

                            <button
                                class="quantity-btn"
                                onclick="changeQuantity(${index}, -1)"
                            >
                                −
                            </button>


                            <span class="quantity-number">
                                ${quantity}
                            </span>


                            <button
                                class="quantity-btn"
                                onclick="changeQuantity(${index}, 1)"
                            >
                                +
                            </button>

                        </div>


                        <button
                            class="remove-btn"
                            onclick="removeItem(${index})"
                        >
                            حذف از سبد
                        </button>

                    </div>


                    <div class="cart-item-total">

                        ${formatPrice(itemTotal)}

                    </div>

                </div>

            `;

        }).join("");


    cartContent.innerHTML = `

        <div class="cart-layout">


            <div class="cart-items">

                ${itemsHTML}

            </div>


            <aside class="cart-summary">

                <h2>
                    خلاصه سفارش
                </h2>


                <div class="summary-row">

                    <span>
                        تعداد کالا
                    </span>

                    <span>
                        ${quantityTotal.toLocaleString("fa-IR")}
                    </span>

                </div>


                <div class="summary-row summary-total">

                    <span>
                        مبلغ کل
                    </span>

                    <span>
                        ${formatPrice(total)}
                    </span>

                </div>


                <a
                    href="checkout.html"
                    class="checkout-btn"
                >
                    ادامه به پرداخت
                </a>


                <a
                    href="index.html"
                    class="continue-btn"
                >
                    ادامه خرید
                </a>

            </aside>


        </div>

    `;


    updateCartCount();

}


/* =========================
   تغییر تعداد
========================= */

function changeQuantity(index, change) {

    const cart = getCart();

    if (!cart[index]) {
        return;
    }


    cart[index].quantity =
        Number(cart[index].quantity || 1)
        + change;


    if (cart[index].quantity <= 0) {

        cart.splice(index, 1);

    }


    saveCart(cart);

    renderCart(cart);

}


/* =========================
   حذف محصول
========================= */

function removeItem(index) {

    const cart = getCart();

    if (!cart[index]) {
        return;
    }


    cart.splice(index, 1);


    saveCart(cart);

    renderCart(cart);

}


/* =========================
   جلوگیری از HTML Injection
========================= */

function escapeHtml(text) {

    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================
   شروع
========================= */

async function initCart() {

    updateCartCount();


    const cart = getCart();


    if (!cart.length) {

        renderEmptyCart();

        return;

    }


    cartContent.innerHTML = `

        <div class="loading-cart">
            در حال بارگذاری اطلاعات محصولات...
        </div>

    `;


    const updatedCart =
        await enrichCart();


    renderCart(updatedCart);

}


initCart();