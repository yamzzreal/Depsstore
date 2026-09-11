import { getDB } from "./jsonbin.js";

/* =========================================
   DEPS STORE - PRODUCT STORE
   ========================================= */

/* Helper selector */
const $ = (selector) => document.querySelector(selector);

/* =========================================
   FORMAT MONEY
   ========================================= */

const money = (n) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(n) || 0);
};

/* =========================================
   ESCAPE HTML
   ========================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================
   PRODUCT CARD
   ========================================= */

function card(p) {

    const id = encodeURIComponent(p?.id || "");
    const name = escapeHTML(p?.name || "Produk");
    const image = escapeHTML(p?.image || "");
    const category = escapeHTML(p?.category || "Lainnya");
    const description = escapeHTML(
        p?.description ||
        "Produk digital berkualitas dari DEPS STORE."
    );

    const price = money(p?.price);

    const stockNumber = Number(p?.stock) || 0;

    const stockHTML = stockNumber > 0
        ? `● Stok ${stockNumber}`
        : `● Habis`;

    const imageHTML = image
        ? `
            <img
                src="${image}"
                alt="${name}"
                loading="lazy"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
            >
            <span
                class="material-symbols-outlined placeholder"
                style="display:none;"
            >
                inventory_2
            </span>
        `
        : `
            <span class="material-symbols-outlined placeholder">
                inventory_2
            </span>
        `;

    return `
        <article class="card">

            <div class="thumb">
                ${imageHTML}
            </div>

            <div class="info">

                <div class="cat">
                    ${category}
                </div>

                <div class="name">
                    ${name}
                </div>

                <div class="desc">
                    ${description}
                </div>

                <div class="bottom">

                    <div>

                        <div class="price">
                            ${price}
                        </div>

                        <div class="stock">
                            ${stockHTML}
                        </div>

                    </div>

                    <button
                        class="btn"
                        type="button"
                        onclick="location.href='transaksi.html?product=${id}'"
                        ${stockNumber <= 0 ? "disabled" : ""}
                    >
                        <span class="material-symbols-outlined">
                            shopping_cart
                        </span>
                    </button>

                </div>

            </div>

        </article>
    `;
}

/* =========================================
   RENDER FOOTER
   ========================================= */

function renderFooter(db) {

    const settings = db?.settings || {};

    /* -------------------------------------
       STORE DESCRIPTION
       ------------------------------------- */

    const storeDescription =
        settings.storeDescription ||
        "Store digital dengan produk berkualitas dan pengalaman belanja yang sederhana.";

    const aboutUs =
        settings.aboutUs ||
        "DEPS STORE menyediakan berbagai produk digital untuk kebutuhan kamu.";

    const aboutText = $("#aboutText");
    const footerAbout = $("#footerAbout");

    if (aboutText) {
        aboutText.textContent = storeDescription;
    }

    if (footerAbout) {
        footerAbout.textContent = aboutUs;
    }

    /* -------------------------------------
       WHATSAPP
       ------------------------------------- */

    const waLink = $("#waLink");
    const waText = $("#waText");

    if (waLink && settings.whatsapp) {

        let whatsapp = String(settings.whatsapp)
            .replace(/\D/g, "");

        /* Indonesia 08xxxx -> 628xxxx */
        if (whatsapp.startsWith("08")) {
            whatsapp = "62" + whatsapp.substring(1);
        }

        waLink.href = `https://wa.me/${whatsapp}`;

        if (waText) {
            waText.textContent =
                settings.whatsappLabel ||
                "Chat WhatsApp";
        }

    } else {

        if (waLink) {
            waLink.removeAttribute("href");
        }

        if (waText) {
            waText.textContent =
                "WhatsApp CS belum diatur";
        }
    }

    /* -------------------------------------
       SOCIAL MEDIA
       ------------------------------------- */

    const socials = $("#socials");

    if (!socials) return;

    const socialList = [
        {
            key: "instagram",
            name: "Instagram",
            icon: "photo_camera"
        },
        {
            key: "telegram",
            name: "Telegram",
            icon: "send"
        },
        {
            key: "tiktok",
            name: "TikTok",
            icon: "music_note"
        },
        {
            key: "youtube",
            name: "YouTube",
            icon: "play_circle"
        }
    ];

    const activeSocials = socialList.filter(
        item => settings[item.key]
    );

    if (!activeSocials.length) {

        socials.innerHTML = `
            <span class="footer-muted">
                Belum diatur
            </span>
        `;

        return;
    }

    socials.innerHTML = activeSocials
        .map(item => {

            const url = escapeHTML(
                settings[item.key]
            );

            return `
                <a
                    class="social"
                    href="${url}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <span class="material-symbols-outlined">
                        ${item.icon}
                    </span>

                    <small>
                        ${item.name}
                    </small>
                </a>
            `;
        })
        .join("");
}

/* =========================================
   RENDER PRODUCTS
   ========================================= */

async function render() {

    const grid = $("#productGrid");

    if (!grid) {
        console.warn(
            "DEPS STORE: #productGrid tidak ditemukan."
        );
        return;
    }

    /* Loading */
    grid.innerHTML = `
        <div class="empty">
            Memuat produk...
        </div>
    `;

    try {

        /* ---------------------------------
           AMBIL DATABASE DARI JSONBIN
           --------------------------------- */

        const db = await getDB();

        console.log(
            "DEPS STORE database:",
            db
        );

        /* ---------------------------------
           FOOTER
           --------------------------------- */

        renderFooter(db);

        /* ---------------------------------
           PRODUCTS
           --------------------------------- */

        let products = Array.isArray(db?.products)
            ? db.products
            : [];

        /* ---------------------------------
           SEARCH
           --------------------------------- */

        const searchInput = $("#search");

        const query = (
            searchInput?.value || ""
        )
            .trim()
            .toLowerCase();

        /* ---------------------------------
           CATEGORY
           --------------------------------- */

        const categorySelect = $("#category");

        const selectedCategory =
            categorySelect?.value || "";

        /* ---------------------------------
           FILTER
           --------------------------------- */

        products = products.filter(product => {

            const searchText = `
                ${product?.name || ""}
                ${product?.description || ""}
                ${product?.category || ""}
            `.toLowerCase();

            const matchSearch =
                !query ||
                searchText.includes(query);

            const matchCategory =
                !selectedCategory ||
                product?.category === selectedCategory;

            return matchSearch && matchCategory;
        });

        /* ---------------------------------
           RENDER PRODUCT
           --------------------------------- */

        if (products.length) {

            grid.innerHTML = products
                .map(product => card(product))
                .join("");

        } else {

            grid.innerHTML = `
                <div class="empty">

                    <span
                        class="material-symbols-outlined"
                        style="font-size:42px;"
                    >
                        inventory_2
                    </span>

                    <div style="margin-top:10px;">
                        Belum ada produk.
                    </div>

                    <small>
                        Tambahkan produk dari dashboard admin.
                    </small>

                </div>
            `;
        }

        /* ---------------------------------
           LOAD CATEGORY
           --------------------------------- */

        if (
            categorySelect &&
            !categorySelect.dataset.loaded
        ) {

            const categories = Array.isArray(
                db?.categories
            )
                ? db.categories
                : [];

            categories.forEach(category => {

                if (!category) return;

                const value =
                    escapeHTML(category);

                categorySelect.insertAdjacentHTML(
                    "beforeend",
                    `<option value="${value}">
                        ${value}
                    </option>`
                );
            });

            categorySelect.dataset.loaded = "1";
        }

    } catch (error) {

        console.error(
            "DEPS STORE JSONBin:",
            error
        );

        grid.innerHTML = `
            <div class="empty">

                <span
                    class="material-symbols-outlined"
                    style="font-size:42px;"
                >
                    error
                </span>

                <div style="margin-top:10px;">
                    Gagal memuat produk
                </div>

                <small>
                    ${escapeHTML(
                        error?.message ||
                        "Terjadi kesalahan saat mengambil data."
                    )}
                </small>

            </div>
        `;
    }
}

/* =========================================
   SEARCH
   ========================================= */

const searchInput = $("#search");

if (searchInput) {

    searchInput.addEventListener(
        "input",
        render
    );
}

/* =========================================
   CATEGORY FILTER
   ========================================= */

const categorySelect = $("#category");

if (categorySelect) {

    categorySelect.addEventListener(
        "change",
        render
    );
}

/* =========================================
   INITIAL LOAD
   ========================================= */

render();
