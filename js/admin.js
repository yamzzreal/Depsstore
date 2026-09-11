import {
    requireAdminSession,
    destroyAdminSession
} from "./auth.js";

import {
    getDB,
    saveDB
} from "./jsonbin.js";

import {
    uploadImage
} from "./cloudinary.js";


/* =========================================
   ADMIN SESSION
   ========================================= */

if (!(await requireAdminSession())) {
    throw new Error("Admin session required");
}


/* =========================================
   STATE
   ========================================= */

let db = {
    products: [],
    categories: [
        "Website",
        "Design",
        "Source Code",
        "Tools"
    ],
    transactions: [],
    settings: {}
};

let editId = null;
let imageUrl = "";


/* =========================================
   HELPERS
   ========================================= */

const $ = (selector) => document.querySelector(selector);

const money = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(n) || 0);


/* Escape HTML agar data produk tidak merusak tabel */
function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================
   NORMALIZE DATABASE
   ========================================= */

function normalizeDB(data) {

    const result = data && typeof data === "object"
        ? data
        : {};

    if (!Array.isArray(result.products)) {
        result.products = [];
    }

    if (!Array.isArray(result.categories)) {
        result.categories = [
            "Website",
            "Design",
            "Source Code",
            "Tools"
        ];
    }

    if (!Array.isArray(result.transactions)) {
        result.transactions = [];
    }

    if (!result.settings || typeof result.settings !== "object") {
        result.settings = {};
    }

    return result;
}


/* =========================================
   LOAD DATABASE
   ========================================= */

async function load() {

    try {

        db = normalizeDB(await getDB());

        console.log(
            "DEPS STORE ADMIN - Database:",
            db
        );

        fillCats();
        fillSettings();
        render();

    } catch (error) {

        console.error(
            "DEPS STORE ADMIN LOAD:",
            error
        );

        alert(
            "Gagal mengambil database:\n\n" +
            (error.message || "Unknown error")
        );
    }
}


/* =========================================
   CATEGORY
   ========================================= */

function fillCats() {

    const category = $("#category");
    const categoryList = $("#categoryList");

    if (category) {

        category.innerHTML = db.categories
            .map(x => `
                <option value="${escapeHTML(x)}">
                    ${escapeHTML(x)}
                </option>
            `)
            .join("");
    }

    if (categoryList) {

        categoryList.innerHTML = db.categories
            .map(x => `
                <div
                    style="
                        padding:6px 0;
                        border-bottom:1px solid #222
                    "
                >
                    ${escapeHTML(x)}
                </div>
            `)
            .join("");
    }
}


/* =========================================
   SETTINGS
   ========================================= */

function fillSettings() {

    const x = db.settings || {};

    const fields = {
        storeDescription: "#storeDescription",
        aboutUs: "#aboutUs",
        whatsapp: "#whatsapp",
        whatsappLabel: "#whatsappLabel",
        instagram: "#instagram",
        telegram: "#telegram",
        tiktok: "#tiktok",
        youtube: "#youtube"
    };

    Object.entries(fields).forEach(
        ([key, selector]) => {

            const element = $(selector);

            if (element) {
                element.value = x[key] || "";
            }
        }
    );
}


/* =========================================
   RENDER PRODUCT TABLE
   ========================================= */

function render() {

    const table = $("#table");

    if (!table) return;


    /* Statistik */
    const totalProducts =
        db.products.length;

    const totalCategories =
        db.categories.length;

    const totalStock =
        db.products.reduce(
            (total, product) =>
                total + (Number(product.stock) || 0),
            0
        );


    window.dispatchEvent(
        new CustomEvent(
            "deps:stats",
            {
                detail: {
                    products: totalProducts,
                    categories: totalCategories,
                    stock: totalStock
                }
            }
        )
    );


    /* Produk */
    if (!db.products.length) {

        table.innerHTML = `
            <table class="table">

                <thead>
                    <tr>
                        <th>Gambar</th>
                        <th>Produk</th>
                        <th>Kategori</th>
                        <th>Harga</th>
                        <th>Stok</th>
                        <th>Aksi</th>
                    </tr>
                </thead>

                <tbody>

                    <tr>
                        <td colspan="6">
                            Belum ada produk.
                        </td>
                    </tr>

                </tbody>

            </table>
        `;

        return;
    }


    table.innerHTML = `
        <table class="table">

            <thead>

                <tr>
                    <th>Gambar</th>
                    <th>Produk</th>
                    <th>Kategori</th>
                    <th>Harga</th>
                    <th>Stok</th>
                    <th>Aksi</th>
                </tr>

            </thead>

            <tbody>

                ${db.products.map(product => {

                    const id =
                        escapeHTML(product.id);

                    const image =
                        escapeHTML(product.image);

                    const name =
                        escapeHTML(product.name);

                    const category =
                        escapeHTML(product.category);

                    const stock =
                        Number(product.stock) || 0;

                    return `
                        <tr>

                            <td>
                                ${
                                    image
                                        ? `
                                            <img
                                                class="thumbsm"
                                                src="${image}"
                                                alt="${name}"
                                            >
                                        `
                                        : "—"
                                }
                            </td>

                            <td>
                                ${name}
                            </td>

                            <td>
                                ${category}
                            </td>

                            <td>
                                ${money(product.price)}
                            </td>

                            <td>
                                ${stock}
                            </td>

                            <td>

                                <button
                                    class="btn"
                                    type="button"
                                    onclick="editProduct(${JSON.stringify(product.id)})"
                                >
                                    Edit
                                </button>

                                <button
                                    class="btn danger"
                                    type="button"
                                    onclick="deleteProduct(${JSON.stringify(product.id)})"
                                >
                                    Hapus
                                </button>

                            </td>

                        </tr>
                    `;

                }).join("")}

            </tbody>

        </table>
    `;
}


/* =========================================
   EDIT PRODUCT
   ========================================= */

window.editProduct = function(id) {

    const product =
        db.products.find(
            item => item.id === id
        );

    if (!product) return;


    editId = id;

    imageUrl =
        product.image || "";


    if ($("#name")) {
        $("#name").value =
            product.name || "";
    }

    if ($("#category")) {
        $("#category").value =
            product.category || "";
    }

    if ($("#price")) {
        $("#price").value =
            product.price || 0;
    }

    if ($("#stock")) {
        $("#stock").value =
            product.stock || 0;
    }

    if ($("#description")) {
        $("#description").value =
            product.description || "";
    }

    if ($("#uploadStatus")) {

        $("#uploadStatus").textContent =
            product.image
                ? "Gambar tersimpan."
                : "Belum ada gambar.";
    }


    /* Scroll ke form */
    $("#name")?.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
};


/* =========================================
   DELETE PRODUCT
   ========================================= */

window.deleteProduct = async function(id) {

    const product =
        db.products.find(
            item => item.id === id
        );

    if (!product) return;


    if (
        !confirm(
            `Hapus produk "${product.name || "Produk"}"?`
        )
    ) {
        return;
    }


    /* Simpan backup */
    const oldDB =
        JSON.parse(JSON.stringify(db));


    /* Hapus dari state */
    db.products =
        db.products.filter(
            item => item.id !== id
        );


    try {

        await saveDB(db);

        alert(
            "Produk berhasil dihapus."
        );

        await load();

    } catch (error) {

        /* Kembalikan data kalau save gagal */
        db = oldDB;

        render();

        alert(
            "Gagal menghapus produk:\n\n" +
            (error.message || "Unknown error")
        );
    }
};


/* =========================================
   IMAGE UPLOAD
   ========================================= */

const imageInput = $("#image");

if (imageInput) {

    imageInput.onchange = async function(e) {

        const file =
            e.target.files?.[0];

        if (!file) return;


        if (
            file.size >
            8 * 1024 * 1024
        ) {

            alert(
                "Ukuran gambar maksimal 8MB."
            );

            e.target.value = "";
            return;
        }


        try {

            $("#uploadStatus").textContent =
                "Mengupload ke Cloudinary...";

            $("#bar").style.width =
                "0%";


            const url =
                await uploadImage(
                    file,
                    progress => {

                        if ($("#bar")) {

                            $("#bar").style.width =
                                progress + "%";
                        }
                    }
                );


            imageUrl = url;


            $("#uploadStatus").textContent =
                "Upload berhasil. URL Cloudinary siap disimpan.";

            $("#bar").style.width =
                "100%";


        } catch (error) {

            console.error(
                "Cloudinary:",
                error
            );

            $("#uploadStatus").textContent =
                error.message ||
                "Upload gambar gagal.";

            $("#bar").style.width =
                "0%";
        }
    };
}


/* =========================================
   SAVE PRODUCT
   ========================================= */

const saveButton = $("#save");

if (saveButton) {

    saveButton.onclick = async function() {

        const name =
            $("#name")?.value.trim();


        if (!name) {

            alert(
                "Nama produk wajib diisi."
            );

            return;
        }


        const category =
            $("#category")?.value || "Lainnya";

        const price =
            Number(
                $("#price")?.value
            ) || 0;

        const stock =
            Number(
                $("#stock")?.value
            ) || 0;

        const description =
            $("#description")?.value.trim() || "";


        /* =================================
           BUAT PRODUCT OBJECT
           ================================= */

        const item = {

            id:
                editId ||
                `DEP-${Date.now()}`,

            name,

            category,

            price,

            stock,

            description,

            image:
                imageUrl || ""
        };


        /* =================================
           BACKUP DATABASE
           ================================= */

        const oldDB =
            JSON.parse(
                JSON.stringify(db)
            );


        /* =================================
           UPDATE LOCAL STATE
           ================================= */

        if (editId) {

            const index =
                db.products.findIndex(
                    product =>
                        product.id === editId
                );


            if (index === -1) {

                alert(
                    "Produk yang ingin diedit tidak ditemukan."
                );

                return;
            }


            db.products[index] =
                item;

        } else {

            db.products.unshift(
                item
            );
        }


        /* =================================
           SAVE TO JSONBIN
           ================================= */

        saveButton.disabled = true;

        const oldText =
            saveButton.innerHTML;

        saveButton.innerHTML =
            "Menyimpan...";


        try {

            console.log(
                "Menyimpan database:",
                db
            );


            await saveDB(db);


            alert(
                editId
                    ? "Produk berhasil diperbarui dan disimpan ke JSONBin."
                    : "Produk berhasil ditambahkan dan disimpan ke JSONBin."
            );


            reset();


            /*
             * Ambil ulang dari server.
             *
             * Ini penting:
             * kita memastikan data benar-benar
             * tersimpan di JSONBin/API.
             */
            await load();


        } catch (error) {

            console.error(
                "SAVE PRODUCT ERROR:",
                error
            );


            /* Restore jika gagal */
            db = oldDB;

            render();


            alert(
                "Gagal menyimpan produk:\n\n" +
                (
                    error.message ||
                    "Tidak dapat menyimpan database."
                )
            );

        } finally {

            saveButton.disabled =
                false;

            saveButton.innerHTML =
                oldText;
        }
    };
}


/* =========================================
   RESET FORM
   ========================================= */

function reset() {

    editId = null;

    imageUrl = "";


    if ($("#name")) {
        $("#name").value = "";
    }

    if ($("#price")) {
        $("#price").value = "";
    }

    if ($("#stock")) {
        $("#stock").value = "";
    }

    if ($("#description")) {
        $("#description").value = "";
    }

    if ($("#image")) {
        $("#image").value = "";
    }

    if ($("#bar")) {
        $("#bar").style.width = "0";
    }

    if ($("#uploadStatus")) {

        $("#uploadStatus").textContent =
            "Belum ada upload.";
    }
}


/* =========================================
   CANCEL
   ========================================= */

const cancelButton = $("#cancel");

if (cancelButton) {

    cancelButton.onclick =
        reset;
}


/* =========================================
   LOGOUT
   ========================================= */

const logoutButton = $("#logout");

if (logoutButton) {

    logoutButton.onclick = async function() {

        await destroyAdminSession();

        location.replace(
            "login.html"
        );
    };
}


/* =========================================
   ADD CATEGORY
   ========================================= */

const addCategoryButton =
    $("#addCategory");

if (addCategoryButton) {

    addCategoryButton.onclick =
        async function() {

            const input =
                $("#newCategory");

            const category =
                input?.value.trim();


            if (!category) {

                alert(
                    "Nama kategori wajib diisi."
                );

                return;
            }


            if (
                db.categories.includes(
                    category
                )
            ) {

                alert(
                    "Kategori tersebut sudah ada."
                );

                return;
            }


            const oldDB =
                JSON.parse(
                    JSON.stringify(db)
                );


            db.categories.push(
                category
            );


            try {

                await saveDB(db);

                if (input) {
                    input.value = "";
                }

                fillCats();

                render();


                alert(
                    "Kategori berhasil ditambahkan."
                );

            } catch (error) {

                db = oldDB;

                fillCats();
                render();


                alert(
                    "Gagal menyimpan kategori:\n\n" +
                    (
                        error.message ||
                        "Unknown error"
                    )
                );
            }
        };
}


/* =========================================
   TAB CATEGORIES
   ========================================= */

const tabCategories =
    $("#tabCategories");

if (tabCategories) {

    tabCategories.onclick =
        function() {

            $("#productsSection").hidden =
                true;

            $("#categoriesSection").hidden =
                false;

            $("#settingsSection").hidden =
                true;


            tabCategories.classList.add(
                "active"
            );

            $("#tabProducts")?.classList.remove(
                "active"
            );

            $("#tabSettings")?.classList.remove(
                "active"
            );
        };
}


/* =========================================
   TAB SETTINGS
   ========================================= */

const tabSettings =
    $("#tabSettings");

if (tabSettings) {

    tabSettings.onclick =
        function() {

            $("#productsSection").hidden =
                true;

            $("#categoriesSection").hidden =
                true;

            $("#settingsSection").hidden =
                false;


            tabSettings.classList.add(
                "active"
            );

            $("#tabProducts")?.classList.remove(
                "active"
            );

            $("#tabCategories")?.classList.remove(
                "active"
            );
        };
}


/* =========================================
   TAB PRODUCTS
   ========================================= */

const tabProducts =
    $("#tabProducts");

if (tabProducts) {

    tabProducts.onclick =
        function() {

            $("#productsSection").hidden =
                false;

            $("#categoriesSection").hidden =
                true;

            $("#settingsSection").hidden =
                true;


            tabProducts.classList.add(
                "active"
            );

            $("#tabCategories")?.classList.remove(
                "active"
            );

            $("#tabSettings")?.classList.remove(
                "active"
            );
        };
}


/* =========================================
   SAVE SETTINGS
   ========================================= */

const saveSettingsButton =
    $("#saveSettings");

if (saveSettingsButton) {

    saveSettingsButton.onclick =
        async function() {

            const oldDB =
                JSON.parse(
                    JSON.stringify(db)
                );


            db.settings = {

                storeDescription:
                    $("#storeDescription")?.value.trim() || "",

                aboutUs:
                    $("#aboutUs")?.value.trim() || "",

                whatsapp:
                    (
                        $("#whatsapp")?.value || ""
                    )
                        .trim()
                        .replace(/\D/g, ""),

                whatsappLabel:
                    $("#whatsappLabel")?.value.trim() || "",

                instagram:
                    $("#instagram")?.value.trim() || "",

                telegram:
                    $("#telegram")?.value.trim() || "",

                tiktok:
                    $("#tiktok")?.value.trim() || "",

                youtube:
                    $("#youtube")?.value.trim() || ""
            };


            saveSettingsButton.disabled =
                true;


            const oldText =
                saveSettingsButton.innerHTML;

            saveSettingsButton.innerHTML =
                "Menyimpan...";


            try {

                await saveDB(db);


                alert(
                    "Pengaturan footer berhasil disimpan ke JSONBin."
                );


                await load();


            } catch (error) {

                db = oldDB;

                fillSettings();
                render();


                alert(
                    "Gagal menyimpan pengaturan:\n\n" +
                    (
                        error.message ||
                        "Unknown error"
                    )
                );

            } finally {

                saveSettingsButton.disabled =
                    false;

                saveSettingsButton.innerHTML =
                    oldText;
            }
        };
}


/* =========================================
   INITIAL LOAD
   ========================================= */

load();
