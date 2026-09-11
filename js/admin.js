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


/* =====================================================
   AUTH
===================================================== */

if (!(await requireAdminSession())) {
    throw new Error("Admin session required");
}


/* =====================================================
   STATE
===================================================== */

let db = {
    products: [],
    categories: [],
    settings: {}
};

let editId = null;
let imageUrl = "";


/* =====================================================
   HELPERS
===================================================== */

const $ = selector =>
    document.querySelector(selector);


const money = number =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(number) || 0);


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================================
   LOADING BUTTON
===================================================== */

function setLoading(button, loading, text = "Memproses...") {

    if (!button) return;


    if (loading) {

        button.dataset.originalText =
            button.innerHTML;

        button.disabled = true;

        button.innerHTML = `
            <span
                class="material-symbols-outlined spin"
                style="
                    font-size:18px;
                    vertical-align:middle;
                "
            >
                progress_activity
            </span>

            ${text}
        `;

    } else {

        button.disabled = false;

        button.innerHTML =
            button.dataset.originalText ||
            "Simpan";
    }
}


/* =====================================================
   GLOBAL LOADING STYLE
===================================================== */

if (!document.getElementById("depsLoadingStyle")) {

    const style =
        document.createElement("style");

    style.id =
        "depsLoadingStyle";

    style.textContent = `

        @keyframes depsSpin {

            from {
                transform: rotate(0deg);
            }

            to {
                transform: rotate(360deg);
            }

        }

        .spin {
            display:inline-block;
            animation:
                depsSpin .8s linear infinite;
        }

        button:disabled {
            opacity:.6;
            cursor:not-allowed;
        }

        .actions {
            display:flex;
            gap:6px;
            flex-wrap:wrap;
        }

    `;

    document.head.appendChild(style);
}


/* =====================================================
   LOAD DATABASE
===================================================== */

async function load() {

    try {

        db = await getDB();


        /* Normalisasi */

        if (!db || typeof db !== "object") {

            db = {};
        }


        if (!Array.isArray(db.products)) {

            db.products = [];
        }


        if (!Array.isArray(db.categories)) {

            db.categories = [
                "Website",
                "Design",
                "Source Code",
                "Tools"
            ];
        }


        if (
            !db.settings ||
            typeof db.settings !== "object"
        ) {

            db.settings = {};
        }


        fillCats();

        fillSettings();

        render();


    } catch (error) {

        console.error(
            "LOAD DATABASE ERROR:",
            error
        );

        alert(
            "Gagal memuat database.\n\n" +
            (error?.message ||
                "Terjadi kesalahan.")
        );
    }
}


/* =====================================================
   SETTINGS FORM
===================================================== */

function fillSettings() {

    const settings =
        db.settings || {};


    const fields = {

        storeDescription:
            settings.storeDescription,

        aboutUs:
            settings.aboutUs,

        whatsapp:
            settings.whatsapp,

        whatsappLabel:
            settings.whatsappLabel,

        instagram:
            settings.instagram,

        telegram:
            settings.telegram,

        tiktok:
            settings.tiktok,

        youtube:
            settings.youtube
    };


    Object.entries(fields).forEach(
        ([id, value]) => {

            const element =
                $("#" + id);

            if (element) {

                element.value =
                    value || "";
            }
        }
    );
}


/* =====================================================
   CATEGORY
===================================================== */

function fillCats() {

    const category =
        $("#category");

    const categoryList =
        $("#categoryList");


    if (category) {

        category.innerHTML =
            db.categories
                .map(item => `
                    <option value="${escapeHTML(item)}">
                        ${escapeHTML(item)}
                    </option>
                `)
                .join("");
    }


    if (categoryList) {

        categoryList.innerHTML =
            db.categories
                .map(item => `
                    <div
                        style="
                            padding:8px 0;
                            border-bottom:
                                1px solid #222;
                        "
                    >
                        ${escapeHTML(item)}
                    </div>
                `)
                .join("");
    }
}


/* =====================================================
   RENDER PRODUCT TABLE
===================================================== */

function render() {

    const table =
        $("#table");

    if (!table) return;


    /* Statistik */

    window.dispatchEvent(
        new CustomEvent(
            "deps:stats",
            {
                detail: {

                    products:
                        db.products.length,

                    categories:
                        db.categories.length,

                    stock:
                        db.products.reduce(
                            (total, product) =>
                                total +
                                (
                                    Number(
                                        product.stock
                                    ) || 0
                                ),
                            0
                        )
                }
            }
        )
    );


    /* Table */

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

                ${
                    db.products.length

                        ?

                    db.products
                        .map(product => {

                            const id =
                                escapeHTML(
                                    product.id
                                );

                            return `

                                <tr>

                                    <td>

                                        ${
                                            product.image

                                                ?

                                            `
                                                <img
                                                    class="thumbsm"
                                                    src="${escapeHTML(product.image)}"
                                                    alt="${escapeHTML(product.name)}"
                                                    loading="lazy"
                                                >
                                            `

                                                :

                                            "—"
                                        }

                                    </td>


                                    <td>
                                        ${escapeHTML(
                                            product.name
                                        )}
                                    </td>


                                    <td>
                                        ${escapeHTML(
                                            product.category
                                        )}
                                    </td>


                                    <td>
                                        ${money(
                                            product.price
                                        )}
                                    </td>


                                    <td>
                                        ${Number(
                                            product.stock
                                        ) || 0}
                                    </td>


                                    <td>

                                        <div class="actions">

                                            <button
                                                type="button"
                                                class="btn edit-product"
                                                data-id="${id}"
                                            >

                                                <span
                                                    class="
                                                        material-symbols-outlined
                                                    "
                                                >
                                                    edit
                                                </span>

                                                Edit

                                            </button>


                                            <button
                                                type="button"
                                                class="
                                                    btn
                                                    danger
                                                    delete-product
                                                "
                                                data-id="${id}"
                                            >

                                                <span
                                                    class="
                                                        material-symbols-outlined
                                                    "
                                                >
                                                    delete
                                                </span>

                                                Hapus

                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            `;
                        })
                        .join("")

                        :

                    `
                        <tr>

                            <td colspan="6">

                                Belum ada produk.

                            </td>

                        </tr>
                    `
                }

            </tbody>

        </table>
    `;
}


/* =====================================================
   EDIT PRODUCT
===================================================== */

async function editProduct(id) {

    const product =
        db.products.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!product) {

        alert(
            "Produk tidak ditemukan."
        );

        return;
    }


    editId =
        product.id;

    imageUrl =
        product.image || "";


    $("#name").value =
        product.name || "";


    $("#category").value =
        product.category || "";


    $("#price").value =
        product.price || 0;


    $("#stock").value =
        product.stock || 0;


    $("#description").value =
        product.description || "";


    const uploadStatus =
        $("#uploadStatus");


    if (uploadStatus) {

        uploadStatus.textContent =
            product.image

                ? "Gambar tersimpan."

                : "Belum ada gambar.";
    }


    const saveButton =
        $("#save");


    if (saveButton) {

        saveButton.innerHTML = `

            <span
                class="material-symbols-outlined"
            >
                save
            </span>

            Update Produk

        `;
    }


    const cancelButton =
        $("#cancel");


    if (cancelButton) {

        cancelButton.style.display =
            "";
    }


    const form =
        $("#name");


    if (form) {

        form.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


        setTimeout(() => {

            form.focus();

        }, 300);
    }
}


/* =====================================================
   DELETE PRODUCT
===================================================== */

async function deleteProduct(id) {

    const product =
        db.products.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!product) {

        alert(
            "Produk tidak ditemukan."
        );

        return;
    }


    const confirmed =
        confirm(
            `Hapus produk "${product.name}"?\n\n` +
            "Produk akan dihapus dari database."
        );


    if (!confirmed) return;


    const button =
        document.querySelector(
            `.delete-product[data-id="${CSS.escape(String(id))}"]`
        );


    try {

        setLoading(
            button,
            true,
            "Menghapus..."
        );


        /*
         * Hapus dari database lokal
         */

        db.products =
            db.products.filter(
                item =>
                    String(item.id) !==
                    String(id)
            );


        /*
         * Simpan ke JSONBin
         */

        await saveDB(db);


        /*
         * Reload database
         */

        await load();


        alert(
            "Produk berhasil dihapus."
        );


    } catch (error) {

        console.error(
            "DELETE PRODUCT ERROR:",
            error
        );


        alert(
            "Gagal menghapus produk.\n\n" +
            (
                error?.message ||
                "Terjadi kesalahan."
            )
        );


        /*
         * Reload untuk mengembalikan
         * data jika save gagal
         */

        await load();


    } finally {

        setLoading(
            button,
            false
        );
    }
}


/* =====================================================
   PRODUCT TABLE CLICK
   EVENT DELEGATION
===================================================== */

const table =
    $("#table");


if (table) {

    table.addEventListener(
        "click",
        async event => {

            const editButton =
                event.target.closest(
                    ".edit-product"
                );


            const deleteButton =
                event.target.closest(
                    ".delete-product"
                );


            /*
             * EDIT
             */

            if (editButton) {

                const id =
                    editButton.dataset.id;

                await editProduct(id);

                return;
            }


            /*
             * DELETE
             */

            if (deleteButton) {

                const id =
                    deleteButton.dataset.id;

                await deleteProduct(id);

                return;
            }
        }
    );
}


/* =====================================================
   IMAGE UPLOAD
===================================================== */

const imageInput =
    $("#image");


if (imageInput) {

    imageInput.addEventListener(
        "change",
        async event => {

            const file =
                event.target.files?.[0];


            if (!file) return;


            if (
                file.size >
                8 * 1024 * 1024
            ) {

                alert(
                    "Maksimal ukuran gambar 8MB."
                );

                imageInput.value =
                    "";

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


                imageUrl =
                    url;


                $("#uploadStatus").textContent =
                    "Upload berhasil. URL Cloudinary siap disimpan.";


                $("#bar").style.width =
                    "100%";


            } catch (error) {

                console.error(
                    "UPLOAD ERROR:",
                    error
                );


                $("#uploadStatus").textContent =
                    error?.message ||
                    "Upload gagal.";


                $("#bar").style.width =
                    "0%";
            }
        }
    );
}


/* =====================================================
   SAVE / ADD PRODUCT
===================================================== */

const saveButton =
    $("#save");


if (saveButton) {

    saveButton.addEventListener(
        "click",
        async () => {

            const name =
                $("#name")
                    .value
                    .trim();


            if (!name) {

                alert(
                    "Nama produk wajib diisi."
                );

                $("#name").focus();

                return;
            }


            const category =
                $("#category").value;


            const price =
                Number(
                    $("#price").value
                ) || 0;


            const stock =
                Number(
                    $("#stock").value
                ) || 0;


            const description =
                $("#description")
                    .value
                    .trim();


            /*
             * Buat object produk
             */

            const item = {

                id:
                    editId ||
                    "DEP-" +
                    Date.now(),

                name,

                category,

                price,

                stock,

                description,

                image:
                    imageUrl || ""
            };


            try {

                setLoading(
                    saveButton,
                    true,
                    editId
                        ? "Mengupdate..."
                        : "Menyimpan..."
                );


                /*
                 * UPDATE
                 */

                if (editId) {

                    const index =
                        db.products.findIndex(
                            product =>
                                String(
                                    product.id
                                ) ===
                                String(
                                    editId
                                )
                        );


                    if (index === -1) {

                        throw new Error(
                            "Produk yang ingin diupdate tidak ditemukan."
                        );
                    }


                    db.products[index] =
                        item;


                }

                /*
                 * ADD
                 */

                else {

                    db.products.unshift(
                        item
                    );
                }


                /*
                 * Simpan JSONBin
                 */

                await saveDB(db);


                alert(
                    editId
                        ? "Produk berhasil diperbarui."
                        : "Produk berhasil ditambahkan."
                );


                /*
                 * Reset form
                 */

                reset();


                /*
                 * Reload data
                 */

                await load();


            } catch (error) {

                console.error(
                    "SAVE PRODUCT ERROR:",
                    error
                );


                alert(
                    "Gagal menyimpan produk.\n\n" +
                    (
                        error?.message ||
                        "Terjadi kesalahan."
                    )
                );


                await load();


            } finally {

                setLoading(
                    saveButton,
                    false
                );


                /*
                 * Kembalikan tulisan tombol
                 */

                if (!editId) {

                    saveButton.innerHTML = `

                        <span
                            class="
                                material-symbols-outlined
                            "
                        >
                            add
                        </span>

                        Tambah Produk

                    `;
                }
            }
        }
    );
}


/* =====================================================
   RESET FORM
===================================================== */

function reset() {

    editId =
        null;

    imageUrl =
        "";


    if ($("#name")) {

        $("#name").value =
            "";
    }


    if ($("#price")) {

        $("#price").value =
            "";
    }


    if ($("#stock")) {

        $("#stock").value =
            "";
    }


    if ($("#description")) {

        $("#description").value =
            "";
    }


    if ($("#image")) {

        $("#image").value =
            "";
    }


    if ($("#bar")) {

        $("#bar").style.width =
            "0%";
    }


    if ($("#uploadStatus")) {

        $("#uploadStatus").textContent =
            "Belum ada upload.";
    }


    if ($("#save")) {

        $("#save").innerHTML = `

            <span
                class="
                    material-symbols-outlined
                "
            >
                add
            </span>

            Tambah Produk

        `;
    }
}


/* =====================================================
   CANCEL EDIT
===================================================== */

const cancelButton =
    $("#cancel");


if (cancelButton) {

    cancelButton.addEventListener(
        "click",
        reset
    );
}


/* =====================================================
   ADD CATEGORY
===================================================== */

const addCategoryButton =
    $("#addCategory");


if (addCategoryButton) {

    addCategoryButton.addEventListener(
        "click",
        async () => {

            const input =
                $("#newCategory");


            const category =
                input
                    .value
                    .trim();


            if (!category) {

                alert(
                    "Nama kategori wajib diisi."
                );

                input.focus();

                return;
            }


            /*
             * Cek duplikat
             */

            const exists =
                db.categories.some(
                    item =>
                        item.toLowerCase() ===
                        category.toLowerCase()
                );


            if (exists) {

                alert(
                    "Kategori tersebut sudah ada."
                );

                input.focus();

                return;
            }


            try {

                setLoading(
                    addCategoryButton,
                    true,
                    "Menambahkan..."
                );


                db.categories.push(
                    category
                );


                await saveDB(db);


                input.value =
                    "";


                fillCats();


                alert(
                    "Kategori berhasil ditambahkan."
                );


            } catch (error) {

                console.error(
                    "ADD CATEGORY ERROR:",
                    error
                );


                alert(
                    "Gagal menambahkan kategori.\n\n" +
                    (
                        error?.message ||
                        "Terjadi kesalahan."
                    )
                );


                await load();


            } finally {

                setLoading(
                    addCategoryButton,
                    false
                );
            }
        }
    );
}


/* =====================================================
   LOGOUT
===================================================== */

const logoutButton =
    $("#logout");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                setLoading(
                    logoutButton,
                    true,
                    "Keluar..."
                );


                await destroyAdminSession();


                location.replace(
                    "login.html"
                );


            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );


                location.replace(
                    "login.html"
                );
            }
        }
    );
}


/* =====================================================
   TABS
===================================================== */

const tabProducts =
    $("#tabProducts");

const tabCategories =
    $("#tabCategories");

const tabSettings =
    $("#tabSettings");


function showTab(tab) {

    const productsSection =
        $("#productsSection");

    const categoriesSection =
        $("#categoriesSection");

    const settingsSection =
        $("#settingsSection");


    if (productsSection) {

        productsSection.hidden =
            tab !== "products";
    }


    if (categoriesSection) {

        categoriesSection.hidden =
            tab !== "categories";
    }


    if (settingsSection) {

        settingsSection.hidden =
            tab !== "settings";
    }


    tabProducts?.classList.toggle(
        "active",
        tab === "products"
    );


    tabCategories?.classList.toggle(
        "active",
        tab === "categories"
    );


    tabSettings?.classList.toggle(
        "active",
        tab === "settings"
    );
}


tabProducts?.addEventListener(
    "click",
    () => showTab("products")
);


tabCategories?.addEventListener(
    "click",
    () => showTab("categories")
);


tabSettings?.addEventListener(
    "click",
    () => showTab("settings")
);


/* =====================================================
   SAVE WEBSITE SETTINGS
===================================================== */

const saveSettingsButton =
    $("#saveSettings");


if (saveSettingsButton) {

    saveSettingsButton.addEventListener(
        "click",
        async () => {

            try {

                setLoading(
                    saveSettingsButton,
                    true,
                    "Menyimpan..."
                );


                db.settings = {

                    storeDescription:
                        $("#storeDescription")
                            .value
                            .trim(),

                    aboutUs:
                        $("#aboutUs")
                            .value
                            .trim(),

                    whatsapp:
                        $("#whatsapp")
                            .value
                            .trim()
                            .replace(
                                /\D/g,
                                ""
                            ),

                    whatsappLabel:
                        $("#whatsappLabel")
                            .value
                            .trim(),

                    instagram:
                        $("#instagram")
                            .value
                            .trim(),

                    telegram:
                        $("#telegram")
                            .value
                            .trim(),

                    tiktok:
                        $("#tiktok")
                            .value
                            .trim(),

                    youtube:
                        $("#youtube")
                            .value
                            .trim()
                };


                /*
                 * Simpan ke JSONBin
                 */

                await saveDB(db);


                alert(
                    "Pengaturan website berhasil disimpan."
                );


            } catch (error) {

                console.error(
                    "SAVE SETTINGS ERROR:",
                    error
                );


                alert(
                    "Gagal menyimpan pengaturan.\n\n" +
                    (
                        error?.message ||
                        "Terjadi kesalahan."
                    )
                );


                await load();


            } finally {

                setLoading(
                    saveSettingsButton,
                    false
                );
            }
        }
    );
}


/* =====================================================
   START
===================================================== */

load().catch(error => {

    console.error(
        "ADMIN INIT ERROR:",
        error
    );

});
