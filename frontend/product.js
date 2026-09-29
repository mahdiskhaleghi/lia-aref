const API_BASE = "http://127.0.0.1:8000/api";

const loading = document.getElementById("product-loading");
const content = document.getElementById("product-content");
const errorBox = document.getElementById("product-error");

const mainImage = document.getElementById("product-main-image");
const thumbnails = document.getElementById("product-thumbnails");

const productBrand = document.getElementById("product-brand");
const productName = document.getElementById("product-name");
const productPrice = document.getElementById("product-price");
const productStatus = document.getElementById("product-status");

const productDescription =
    document.getElementById("product-description");

const specificationsBox =
    document.getElementById("product-specifications-box");

const specifications =
    document.getElementById("product-specifications");

const addToCartButton =
    document.getElementById("add-to-cart-button");

const cartCount =
    document.getElementById("cart-count");

const galleryPrev =
    document.getElementById("gallery-prev");

const galleryNext =
    document.getElementById("gallery-next");

const thumbnailsPrev =
    document.getElementById("thumbnails-prev");

const thumbnailsNext =
    document.getElementById("thumbnails-next");

const galleryCurrent =
    document.getElementById("gallery-current");

const galleryTotal =
    document.getElementById("gallery-total");


let galleryImages = [];
let currentImageIndex = 0;


/* =========================
   گرفتن ID محصول
========================= */

function getProductId() {

    const params =
        new URLSearchParams(window.location.search);

    return params.get("id");
}


/* =========================
   آدرس تصویر
========================= */

function getImageUrl(image) {

    if (!image) {
        return "";
    }

    if (
        image.startsWith("http://") ||
        image.startsWith("https://")
    ) {
        return image;
    }

    if (image.startsWith("/")) {
        return `http://127.0.0.1:8000${image}`;
    }

    return `http://127.0.0.1:8000/media/${image}`;
}


/* =========================
   قیمت
========================= */

function formatPrice(price) {

    if (
        price === null ||
        price === undefined
    ) {
        return "قیمت نامشخص";
    }

    return `${Number(price).toLocaleString("fa-IR")} تومان`;
}


/* =========================
   وضعیت
========================= */

function getStatusText(product) {

    if (product.status === "out_of_stock") {
        return "ناموجود";
    }

    if (product.status === "coming_soon") {
        return "به‌زودی";
    }

    if (Number(product.stock) > 0) {
        return `موجود — ${Number(product.stock).toLocaleString("fa-IR")} عدد`;
    }

    return "موجود";
}


/* =========================
   نمایش تصویر اصلی
========================= */

function showMainImage(index) {

    if (!galleryImages.length) {

        mainImage.innerHTML = `
            <div class="image-placeholder">
                بدون تصویر
            </div>
        `;

        return;
    }

    currentImageIndex = index;

    const image =
        galleryImages[currentImageIndex];

    const imageUrl =
        getImageUrl(image);


    mainImage.innerHTML = `
        <img
            src="${imageUrl}"
            alt="${productName.textContent}"
        >
    `;


    if (galleryCurrent) {
        galleryCurrent.textContent =
            currentImageIndex + 1;
    }


    if (galleryTotal) {
        galleryTotal.textContent =
            galleryImages.length;
    }


    document
        .querySelectorAll(".product-thumbnail")
        .forEach((button, buttonIndex) => {

            button.classList.toggle(
                "active",
                buttonIndex === currentImageIndex
            );

        });


    scrollThumbnailIntoView();
}


/* =========================
   اسکرول thumbnail فعال
========================= */

function scrollThumbnailIntoView() {

    const active =
        document.querySelector(
            ".product-thumbnail.active"
        );

    if (!active) {
        return;
    }

    active.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
    });
}


/* =========================
   ساخت گالری
========================= */

function renderGallery(product) {

    galleryImages = [];

    thumbnails.innerHTML = "";


    /*
       عکس اصلی Product
    */

    if (product.image) {

        galleryImages.push(
            product.image
        );

    }


    /*
       عکس‌های ProductImage
    */

    if (Array.isArray(product.images)) {

        product.images.forEach(item => {

            if (
                item.image &&
                !galleryImages.includes(item.image)
            ) {

                galleryImages.push(
                    item.image
                );

            }

        });

    }


    /*
       اگر هیچ عکسی نبود
    */

    if (!galleryImages.length) {

        showMainImage(0);

        return;
    }


    /*
       ساخت thumbnail تمام عکس‌ها
    */

    galleryImages.forEach(
        (image, index) => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "product-thumbnail";


            button.innerHTML = `
                <img
                    src="${getImageUrl(image)}"
                    alt="تصویر ${index + 1}"
                    loading="eager"
                    decoding="async"
                >
            `;


            button.addEventListener(
                "click",
                () => {

                    showMainImage(index);

                }
            );


            thumbnails.appendChild(button);

        }
    );


    /*
       نمایش عکس اول
    */

    showMainImage(0);
}


/* =========================
   عکس قبلی
========================= */

function showPreviousImage() {

    if (!galleryImages.length) {
        return;
    }

    let newIndex =
        currentImageIndex - 1;


    if (newIndex < 0) {

        newIndex =
            galleryImages.length - 1;

    }


    showMainImage(newIndex);
}


/* =========================
   عکس بعدی
========================= */

function showNextImage() {

    if (!galleryImages.length) {
        return;
    }

    let newIndex =
        currentImageIndex + 1;


    if (
        newIndex >=
        galleryImages.length
    ) {

        newIndex = 0;

    }


    showMainImage(newIndex);
}


/* =========================
   اسکرول thumbnail ها
========================= */

function scrollThumbnailsLeft() {

    thumbnails.scrollBy({
        left: -300,
        behavior: "smooth"
    });

}


function scrollThumbnailsRight() {

    thumbnails.scrollBy({
        left: 300,
        behavior: "smooth"
    });

}


/* =========================
   مشخصات
========================= */

function renderSpecifications(product) {

    specifications.innerHTML = "";

    const data =
        product.specifications;


    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data) ||
        Object.keys(data).length === 0
    ) {

        specificationsBox.hidden = true;

        return;
    }


    specificationsBox.hidden = false;


    Object.entries(data).forEach(
        ([key, value]) => {

            const row =
                document.createElement("div");

            row.className =
                "specification-row";


            const keyElement =
                document.createElement("span");

            keyElement.className =
                "specification-key";

            keyElement.textContent =
                key;


            const valueElement =
                document.createElement("span");

            valueElement.className =
                "specification-value";

            valueElement.textContent =
                value;


            row.appendChild(keyElement);
            row.appendChild(valueElement);

            specifications.appendChild(row);

        }
    );
}


/* =========================
   افزودن به سبد
========================= */

function addToCart(product) {

    const cart =
        JSON.parse(
            localStorage.getItem("lia_cart") || "[]"
        );


    const existing =
        cart.find(
            item =>
                Number(item.productId) ===
                Number(product.id)
        );


    if (existing) {

        existing.quantity =
            Number(existing.quantity || 0) + 1;

    } else {

        cart.push({

            productId: product.id,

            name: product.name,

            price: product.consumer_price,

            image: product.image || "",

            quantity: 1

        });

    }


    localStorage.setItem(
        "lia_cart",
        JSON.stringify(cart)
    );


    updateCartCount();


    alert(
        "محصول به سبد خرید اضافه شد."
    );
}


/* =========================
   تعداد سبد
========================= */

function updateCartCount() {

    const cart =
        JSON.parse(
            localStorage.getItem("lia_cart") || "[]"
        );


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


/* =========================
   نمایش محصول
========================= */

function renderProduct(product) {

    document.title =
        `${product.name} | لیا عارف`;


    productBrand.textContent =
        product.brand
            ? product.brand.name
            : "";


    productName.textContent =
        product.name;


    productPrice.textContent =
        formatPrice(
            product.consumer_price
        );


    productStatus.textContent =
        getStatusText(product);


    productDescription.textContent =
        product.description ||
        "توضیحاتی برای این محصول ثبت نشده است.";


    renderGallery(product);

    renderSpecifications(product);


    if (
        product.status === "out_of_stock"
    ) {

        addToCartButton.disabled = true;

        addToCartButton.textContent =
            "محصول ناموجود است";

    } else {

        addToCartButton.disabled = false;

        addToCartButton.textContent =
            "افزودن به سبد خرید";


        addToCartButton.onclick =
            () => addToCart(product);

    }


    loading.hidden = true;

    content.hidden = false;
}


/* =========================
   دریافت محصول
========================= */

async function loadProduct() {

    const productId =
        getProductId();


    if (!productId) {

        loading.hidden = true;

        errorBox.textContent =
            "شناسه محصول پیدا نشد.";

        errorBox.hidden = false;

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/products/${productId}/`
            );


        if (!response.ok) {

            throw new Error(
                "محصول پیدا نشد."
            );

        }


        const product =
            await response.json();


        renderProduct(product);

    } catch (error) {

        console.error(error);


        loading.hidden = true;

        errorBox.textContent =
            "دریافت اطلاعات محصول با مشکل مواجه شد.";

        errorBox.hidden = false;

    }
}


/* =========================
   دکمه‌های گالری
========================= */

if (galleryPrev) {

    galleryPrev.addEventListener(
        "click",
        showPreviousImage
    );

}


if (galleryNext) {

    galleryNext.addEventListener(
        "click",
        showNextImage
    );

}


if (thumbnailsPrev) {

    thumbnailsPrev.addEventListener(
        "click",
        scrollThumbnailsLeft
    );

}


if (thumbnailsNext) {

    thumbnailsNext.addEventListener(
        "click",
        scrollThumbnailsRight
    );

}


/* =========================
   کیبورد
========================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "ArrowLeft") {

            showPreviousImage();

        }

        if (event.key === "ArrowRight") {

            showNextImage();

        }

    }
);


/* =========================
   شروع
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateCartCount();

        loadProduct();

    }
);