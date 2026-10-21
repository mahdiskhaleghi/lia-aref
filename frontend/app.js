const API_BASE = "http://127.0.0.1:8000/api";

const categoriesGrid = document.getElementById("categories-grid");
const brandsGrid = document.getElementById("brands-grid");
const bestsellersGrid = document.getElementById("bestsellers-grid");
const popularGrid = document.getElementById("popular-grid");
const newProductsGrid = document.getElementById("new-products-grid");
const cartCount = document.getElementById("cart-count");


/* =========================================
   CATEGORIES
========================================= */

const MAIN_CATEGORIES = [
    {
        name: "آرایشی",
        keywords: [
            "کانسیلر",
            "ریمل",
            "رژ لب",
            "رژ",
            "خط چشم",
            "CC کرم",
            "DD کرم",
            "BB کرم"
        ],
        image: "https://s3.liateam.ir/lamia/public/category/banner_portrait_image/27371-1753797631.jpg"
    },

    {
        name: "ضد آفتاب",
        keywords: [
            "بدون رنگ",
            "ضد آفتاب, رنگی",
            "رنگی",
            "ضد آفتاب"
        ],
        image: "https://s3.liateam.ir/lamia/public/category/banner_portrait_image/35111-1753797586.jpg"
    },

    {
        name: "عطر و خوشبوکننده",
        keywords: [
            "بادی میست",
            "عطر",
            "مام رول"
        ],
        image: "https://s3.liateam.ir/lamia/public/category/banner_portrait_image/20080-1776771969.jpg"
    },

    {
        name: "سرم تخصصی",
        keywords: [
            "سرم تخصصی صورت",
            "سرم و روغن, سرم تخصصی صورت",
            "ناحیه چشم",
            "مو"
        ],
        image: "https://s3.liateam.ir/lamia/public/category/banner_portrait_image/24513-1753016659.jpg"
    },

    {
        name: "کرم",
        keywords: [
            "کرم تخصصی صورت",
            "کرم تخصصی بدن",
            "کرم تخصصی بدن, مراقبت از ناخن",
            "بدن, بدن, مراقبت از ناخن"
        ],
        image: "https://s3.liateam.ir/lamia/public/category/banner_portrait_image/3870-1753016707.jpg"
    },

    {
        name: "دهان و دندان",
        keywords: [
            "خمیر دندان, خمیر دندان",
            "خمیر دندان",
            "خوشبو کننده دهان",
            "دهان شویه"
        ],
        image: "https://s3.liateam.ir/lamia/public/category/banner_portrait_image/81752-1754122645.jpg"
    },

    {
        name: "روغن و لوسیون",
        keywords: [
            "لوسیون",
            "لوسیون, روغن و لوسیون",
            "روغن مو",
            "روغن بدن"
        ],
        image: "https://s3.liateam.ir/lamia/public/category/banner_portrait_image/32521-1754137613.jpg"
    },

    {
        name: "شوینده و پاک کننده",
        keywords: [
            "فوم",
            "ژل شستشو",
            "میسلار",
            "محلول دو فازی",
            "پن",
            "صابون بهداشتی",
            "تونر"
        ],
        image: "http://127.0.0.1:8000/media/products/source-399-1.png"
    },

    {
        name: "ماسک تخصصی",
        keywords: [
            "ماسک صورت",
            "ماسک مو"
        ],
        image: "http://127.0.0.1:8000/media/categories/mask.jpg"
    },

    {
        name: "شامپو تخصصی",
        keywords: [
            "شامپو بدن تخصصی",
            "شامپو  سر تخصصی",
            "کیت تخصصی مو, شامپو  سر تخصصی, مو"
        ],
        image: "http://127.0.0.1:8000/media/categories/shampoo.png"
    },

    {
        name: "کیت تخصصی",
        keywords: [
            "کیت تخصصی مو",
            "کیت تخصصی مو, مو",
            "کیت تخصصی مو, شامپو  سر تخصصی, مو",
            "صورت"
        ],
        image: "https://s3.liateam.ir/lamia/public/category/banner_portrait_image/300-1754137579.jpg"
    }
];


/* =========================================
   TEXT NORMALIZATION
========================================= */

function normalizeText(text) {

    return String(text || "")
        .trim()
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/\u200c/g, " ")
        .replace(/\s+/g, " ")
        .toLowerCase();

}


/* =========================================
   CATEGORY MATCH
========================================= */

function belongsToCategory(product, category) {

    if (!product.category) {
        return false;
    }

    const categoryName =
        normalizeText(product.category.name);

    return category.keywords.some(keyword =>
        categoryName.includes(
            normalizeText(keyword)
        )
    );

}


/* =========================================
   IMAGE URL
========================================= */

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


/* =========================================
   PRICE
========================================= */

function formatPrice(price) {

    if (!price) {
        return "قیمت نامشخص";
    }

    return `${Number(price).toLocaleString("fa-IR")} تومان`;

}


/* =========================================
   API ARRAY
========================================= */

function getArray(data) {

    if (Array.isArray(data)) {
        return data;
    }

    if (
        data &&
        Array.isArray(data.results)
    ) {
        return data.results;
    }

    return [];

}


/* =========================================
   CATEGORY CARDS
========================================= */

function renderCategoryCards(products) {

    if (!categoriesGrid) {
        return;
    }

    categoriesGrid.innerHTML = "";

    MAIN_CATEGORIES.forEach(category => {

        const categoryProducts =
            products.filter(product =>
                belongsToCategory(product, category)
            );


        const card =
            document.createElement("article");

        card.className = "category-card";


        let imageHTML;


        if (category.image) {

            imageHTML = `
                <img
                    class="category-image"
                    src="${category.image}"
                    alt="${category.name}"
                    loading="lazy"
                >
            `;

        } else {

            imageHTML = `
                <div
                    class="category-image-placeholder"
                    aria-label="${category.name}"
                ></div>
            `;

        }


        card.innerHTML = `

            ${imageHTML}

            <div class="category-card-overlay"></div>

            <div class="category-card-content">

                <h3>
                    ${category.name}
                </h3>

                <span class="category-count">
                    ${categoryProducts.length.toLocaleString("fa-IR")}
                    محصول
                </span>

            </div>

        `;


        card.addEventListener(
            "click",
            () =>
                showCategoryProducts(
                    category,
                    categoryProducts
                )
        );


        categoriesGrid.appendChild(card);

    });

}


/* =========================================
   CATEGORY PRODUCTS
========================================= */

function showCategoryProducts(
    category,
    products
) {

    const section =
        document.getElementById(
            "new-products"
        );

    if (!section) {
        return;
    }


    section.scrollIntoView({
        behavior: "smooth"
    });


    const title =
        section.querySelector(
            ".section-heading h2"
        );


    const subtitle =
        section.querySelector(
            ".section-heading span"
        );


    if (subtitle) {
        subtitle.textContent =
            category.name;
    }


    if (title) {
        title.textContent =
            "محصولات این دسته";
    }


    renderProducts(
        newProductsGrid,
        products
    );

}


/* =========================================
   ESCAPE QUOTES
========================================= */

function escapeQuotes(text) {

    return String(text)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");

}


/* =========================================
   PRODUCT CARD
========================================= */

function renderProduct(product) {

    const imageUrl =
        getImageUrl(product.image);


    let statusText = "موجود";


    if (product.status === "out_of_stock") {
        statusText = "ناموجود";
    }


    if (product.status === "coming_soon") {
        statusText = "به‌زودی";
    }


    const imageHTML = imageUrl

        ? `
            <img
                class="product-image"
                src="${imageUrl}"
                alt="${product.name}"
                loading="lazy"
            >
        `

        : `
            <div class="product-image-placeholder">
                بدون تصویر
            </div>
        `;


    return `

        <article class="product-card">

            <a href="product.html?id=${product.id}">

                <div class="product-image-wrapper">

                    ${imageHTML}

                </div>

            </a>


            <div class="product-info">

                ${
                    product.brand
                        ? `
                            <div class="product-brand">
                                ${product.brand.name}
                            </div>
                        `
                        : ""
                }


                <a
                    href="product.html?id=${product.id}"
                    class="product-name"
                >
                    ${product.name}
                </a>


                <div class="product-price">
                    ${formatPrice(
                        product.consumer_price
                    )}
                </div>


                <div class="product-status">
                    ${statusText}
                </div>

            </div>


            ${
                product.status !== "out_of_stock"

                    ? `

                        <button
                            class="add-cart"
                            type="button"
                            aria-label="افزودن به سبد خرید"
                            onclick="addToCart(
                                ${product.id},
                                '${escapeQuotes(product.name)}'
                            )"
                        >

                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >

                                <path
                                    d="M6 7h12l1 13H5L6 7Z"
                                ></path>

                                <path
                                    d="M9 7a3 3 0 0 1 6 0"
                                ></path>

                            </svg>

                        </button>

                    `

                    : ""
            }

        </article>

    `;

}


/* =========================================
   RENDER PRODUCTS
========================================= */

function renderProducts(
    container,
    products
) {

    if (!container) {
        return;
    }


    if (!products.length) {

        container.innerHTML = `
            <div class="loading">
                محصولی برای نمایش وجود ندارد.
            </div>
        `;

        return;
    }


    container.innerHTML =
        products
            .map(renderProduct)
            .join("");

}


/* =========================================
   FETCH PRODUCTS
========================================= */

async function fetchProducts(sortType) {

    const response =
        await fetch(
            `${API_BASE}/products/?sort=${sortType}`
        );


    if (!response.ok) {

        throw new Error(
            `خطا در دریافت محصولات (${sortType})`
        );

    }


    const data =
        await response.json();


    return getArray(data);

}


/* =========================================
   LOAD PRODUCTS
========================================= */

async function loadProducts() {

    try {

        const allProducts =
            await fetchProducts("newest");


        renderCategoryCards(
            allProducts
        );


        const bestsellers =
            await fetchProducts(
                "bestsellers"
            );


        const popular =
            await fetchProducts(
                "popular"
            );


        const newest =
            await fetchProducts(
                "newest"
            );


        renderProducts(
            bestsellersGrid,
            bestsellers.slice(0, 5)
        );


        renderProducts(
            popularGrid,
            popular.slice(0, 5)
        );


        renderProducts(
            newProductsGrid,
            newest.slice(0, 5)
        );


    } catch (error) {

        console.error(error);


        const message = `
            <div class="loading">
                دریافت محصولات با مشکل مواجه شد.
            </div>
        `;


        if (bestsellersGrid) {
            bestsellersGrid.innerHTML =
                message;
        }


        if (popularGrid) {
            popularGrid.innerHTML =
                message;
        }


        if (newProductsGrid) {
            newProductsGrid.innerHTML =
                message;
        }

    }

}


/* =========================================
   LOAD BRANDS
========================================= */

async function loadBrands() {

    if (!brandsGrid) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/brands/`
            );


        if (!response.ok) {

            throw new Error(
                "خطا در دریافت برندها"
            );

        }


        const data =
            await response.json();


        const brands =
            getArray(data);


        brandsGrid.innerHTML = "";


        brands.forEach(brand => {

            const card =
                document.createElement("div");


            card.className =
                "brand-card";


            card.textContent =
                brand.name;


            brandsGrid.appendChild(card);

        });


    } catch (error) {

        console.error(error);


        brandsGrid.innerHTML = `
            <div class="loading">
                دریافت برندها با مشکل مواجه شد.
            </div>
        `;

    }

}


/* =========================================
   UPDATE CART COUNT
   عدد فارسی
========================================= */

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

        cartCount.textContent =
            count.toLocaleString("fa-IR");

    }

}


/* =========================================
   ADD TO CART
========================================= */

function addToCart(
    productId,
    productName
) {

    const cart =
        JSON.parse(
            localStorage.getItem("lia_cart") || "[]"
        );


    const existing =
        cart.find(
            item =>
                item.productId === productId
        );


    if (existing) {

        existing.quantity += 1;

    } else {

        cart.push({

            productId: productId,

            name: productName,

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


/* =========================================
   START
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateCartCount();

        loadBrands();

        loadProducts();

    }
);