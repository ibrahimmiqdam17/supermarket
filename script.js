// script.js (lengkap) - MiShop (mode terang, modern)
// Jika ingin checkout langsung ke nomor WA, isi di bawah (contoh: "6281234567890")
const WHATSAPP_NUMBER = ""; // isi jika mau direct ke nomor tertentu

document.addEventListener("DOMContentLoaded", () => {
    // --- DOM ELEMENTS ---
    const productGrid = document.getElementById("catalog");
    const loader = document.getElementById("loader");
    const emptyState = document.getElementById("empty-state");
    const searchInput = document.getElementById("search-input");
    const searchInputMobile = document.getElementById("search-input-mobile");
    const categoryBar = document.getElementById("category-bar");
    const viewSelect = document.getElementById("view-select");
    const cartBtn = document.getElementById("cart-btn");
    const cartCount = document.getElementById("cart-count");
    const cartModal = document.getElementById("cartModal");
    const cartList = document.getElementById("cart-list");
    const cartSubtotalEl = document.getElementById("cart-subtotal");
    const clearCartBtn = document.getElementById("clear-cart");
    const checkoutBtn = document.getElementById("checkout-btn");
    const closeCartBtn = document.getElementById("close-cart");

    const productModal = document.getElementById("productModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const modalImage = document.getElementById("modal-image");
    const modalCategory = document.getElementById("modal-category");
    const modalProductName = document.getElementById("modal-product-name");
    const modalPrice = document.getElementById("modal-price");
    const modalDescription = document.getElementById("modal-description");
    const modalQty = document.getElementById("modal-qty");
    const modalAddToCartBtn = document.getElementById("modal-add-to-cart");
    const modalFavBtn = document.getElementById("modal-fav");

    const summaryModal = document.getElementById("summaryModal");
    const summaryContent = document.getElementById("summary-content");
    const summaryTotalEl = document.getElementById("summary-total");
    const closeSummaryBtn = document.getElementById("close-summary");
    const editCartBtn = document.getElementById("edit-cart");
    const sendWAButton = document.getElementById("send-wa");
    const buyerNameInput = document.getElementById("buyer-name");
    const buyerPhoneInput = document.getElementById("buyer-phone");
    const buyerNoteInput = document.getElementById("buyer-note");

    const favBtnHeader = document.getElementById("show-favorites");
    const toastContainer = document.getElementById("toast-container");

    // --- STATE ---
    const API_URL = "https://fakestoreapi.com/products";
    let products = [];
    let filtered = [];
    let favorites = loadFavorites();
    let cart = loadCart();
    let categories = [];

    // --- UTIL ---
    const formatIDR = (n) => "Rp " + Math.round(Number(n) || 0).toLocaleString("id-ID");
    const escapeHtml = (s) =>
        String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const truncate = (str, n) => (str.length > n ? str.slice(0, n - 1) + "…" : str);
    const showToast = (msg) => {
        const t = document.createElement("div");
        t.className = "toast bg-gray-800 text-white px-4 py-2 rounded-lg shadow-md mb-2";
        t.textContent = msg;
        toastContainer.appendChild(t);
        setTimeout(() => t.remove(), 3200);
    };

    // --- STORAGE ---
    function saveFavorites() {
        localStorage.setItem("tk_favs_v1", JSON.stringify(favorites));
    }
    function loadFavorites() {
        try {
            const r = localStorage.getItem("tk_favs_v1");
            return r ? JSON.parse(r) : [];
        } catch {
            return [];
        }
    }
    function saveCart() {
        localStorage.setItem("tk_cart_v1", JSON.stringify(cart));
    }
    function loadCart() {
        try {
            const r = localStorage.getItem("tk_cart_v1");
            const cartData = r ? JSON.parse(r) : [];

            // Pastikan semua item cart memiliki properti yang diperlukan
            return cartData.map(item => {
                if (item.isNewArrival) {
                    return {
                        ...item,
                        product: {
                            title: item.title,
                            price: item.price / 15000, // Convert back to USD for API consistency
                            category: item.category,
                            image: item.image
                        }
                    };
                }
                return item;
            });
        } catch {
            return [];
        }
    }

    // --- FETCH PRODUCTS ---
    async function fetchProducts() {
        loader.style.display = "block";
        emptyState.classList.add("hidden");
        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error("HTTP " + res.status);
            products = await res.json();
            categories = Array.from(new Set(products.map((p) => p.category))).sort();
            filtered = products.slice();
            renderCategories();
            renderProducts(filtered);
        } catch (err) {
            console.error(err);
            productGrid.innerHTML = `<div class="col-span-full text-center text-red-600">Gagal memuat produk.</div>`;
        } finally {
            loader.style.display = "none";
            updateCartCounter();
            updateFavoriteIcons();
        }
    }

    // --- CATEGORIES ---
    function renderCategories() {
        categoryBar.innerHTML = "";
        const allBtn = makeCategoryButton("Semua", "all");
        categoryBar.appendChild(allBtn);
        categories.forEach((cat) => {
            const btn = makeCategoryButton(cat, cat);
            categoryBar.appendChild(btn);
        });
    }
    function makeCategoryButton(label, value) {
        const btn = document.createElement("button");
        btn.className = "px-3 py-1 rounded-full border text-sm text-slate-600 hover:bg-rose-50 transition";
        btn.textContent = label;
        btn.addEventListener("click", () => {
            filtered = value === "all" ? products.slice() : products.filter((p) => p.category === value);
            viewSelect.value = "all";
            renderProducts(filtered);
        });
        return btn;
    }

    // --- RENDER PRODUCTS ---
    function renderProducts(list) {
        productGrid.innerHTML = "";
        if (!list || list.length === 0) {
            emptyState.classList.remove("hidden");
            return;
        } else {
            emptyState.classList.add("hidden");
        }

        list.forEach((p) => {
            const isFav = favorites.includes(String(p.id));
            const card = document.createElement("div");
            card.className = "product-card relative bg-white rounded-xl p-4 shadow-sm flex flex-col";
            card.innerHTML = `
        <button data-fav="${p.id}" class="absolute top-3 right-3 fav-toggle ${isFav ? "fav-active" : ""} p-2 rounded-full border transition">
          <i class="${isFav ? "fas" : "far"} fa-heart"></i>
        </button>
        <div class="h-44 flex items-center justify-center cursor-pointer" data-detail="${p.id}">
          <img src="${p.image}" alt="${escapeHtml(p.title)}" class="max-h-full object-contain">
        </div>
        <div class="mt-3 flex-1">
          <div class="text-xs text-slate-500 capitalize">${escapeHtml(p.category)}</div>
          <h4 class="mt-1 text-md font-semibold text-slate-800">${escapeHtml(truncate(p.title, 60))}</h4>
        </div>
        <div class="mt-4 flex items-center justify-between">
          <div class="text-lg font-bold text-rose-600">${formatIDR(p.price * 15000)}</div>
          <div class="flex gap-2">
            <button data-add="${p.id}" class="px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm"><i class="fas fa-cart-plus"></i></button>
            <button data-detail="${p.id}" class="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">Detail</button>
          </div>
        </div>`;
            productGrid.appendChild(card);
        });
        updateFavoriteIcons();
    }

    // --- FAVORITES ---
    function toggleFavorite(productId) {
        productId = String(productId);
        const idx = favorites.indexOf(productId);
        if (idx >= 0) {
            favorites.splice(idx, 1);
            showToast("Dihapus dari Favorit");
        } else {
            favorites.push(productId);
            showToast("Ditambahkan ke Favorit");
        }
        saveFavorites();
        updateFavoriteIcons();
        applyCurrentView();
    }

    function updateFavoriteIcons() {
        document.querySelectorAll("[data-fav]").forEach((btn) => {
            const id = String(btn.dataset.fav);
            const icon = btn.querySelector("i");
            if (favorites.includes(id)) {
                btn.classList.add("fav-active");
                icon.classList.remove("far");
                icon.classList.add("fas");
            } else {
                btn.classList.remove("fav-active");
                icon.classList.remove("fas");
                icon.classList.add("far");
            }
        });
    }

    function renderFavoritesPage() {
        const favProducts = favorites.map((id) => products.find((p) => String(p.id) === id)).filter(Boolean);
        productGrid.innerHTML = "";
        if (!favProducts.length) {
            productGrid.innerHTML = `<div class="col-span-full text-center text-slate-500 py-10">Belum ada produk favorit.</div>`;
            return;
        }
        favProducts.forEach((p) => {
            const priceIdr = Math.round(p.price * 15000);
            const card = document.createElement("div");
            card.className = "product-card relative bg-white rounded-xl p-4 shadow-sm flex flex-col";
            card.innerHTML = `
        <button data-fav="${p.id}" class="absolute top-3 right-3 fav-toggle text-red-500 bg-rose-100 p-2 rounded-full border">
          <i class="fas fa-heart"></i>
        </button>
        <div class="h-44 flex items-center justify-center cursor-pointer" data-detail="${p.id}">
          <img src="${p.image}" alt="${escapeHtml(p.title)}" class="max-h-full object-contain">
        </div>
        <div class="mt-3 flex-1">
          <div class="text-xs text-slate-500 capitalize">${escapeHtml(p.category)}</div>
          <h4 class="mt-1 text-md font-semibold text-slate-800">${escapeHtml(truncate(p.title, 60))}</h4>
        </div>
        <div class="mt-4 flex items-center justify-between">
          <div class="text-lg font-bold text-rose-600">${formatIDR(priceIdr)}</div>
          <button data-add="${p.id}" class="px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm flex items-center gap-1">
            <i class="fas fa-cart-plus"></i> Tambah
          </button>
        </div>`;
            productGrid.appendChild(card);
        });
        updateFavoriteIcons();
    }

    // --- CART ---
    function addToCart(productId, qty = 1) {
        productId = String(productId);
        const idx = cart.findIndex((i) => i.id === productId);
        if (idx >= 0) cart[idx].qty += qty;
        else cart.push({ id: productId, qty });
        saveCart();
        updateCartCounter();
        showToast("Produk ditambahkan ke keranjang");
    }

    function updateCartCounter() {
        cartCount.textContent = cart.reduce((s, i) => s + i.qty, 0);
    }

    function getCartDetails() {
        return cart.map((i) => {
            if (i.isNewArrival) {
                // Handle new arrival products
                return {
                    ...i,
                    product: {
                        title: i.title,
                        price: i.price / 15000, // Convert to USD for consistency
                        category: i.category,
                        image: i.image,
                        isNewArrival: true
                    },
                    lineTotal: i.price * i.qty
                };
            } else {
                // Handle API products
                const p = products.find((pr) => String(pr.id) === i.id);
                const price = p ? p.price * 15000 : 0;
                return { ...i, product: p, lineTotal: price * i.qty };
            }
        });
    }

    function getCartSubtotal() {
        return getCartDetails().reduce((s, i) => s + i.lineTotal, 0);
    }

    function renderCart() {
        const details = getCartDetails();
        cartList.innerHTML = "";

        if (!details.length) {
            cartList.innerHTML = `<div class="text-center text-slate-500 py-6">Keranjang masih kosong 🛒</div>`;
            cartSubtotalEl.textContent = formatIDR(0);
            return;
        }

        details.forEach((i) => {
            const el = document.createElement("div");
            el.className = "flex items-center gap-4 bg-white shadow-sm border rounded-xl p-3";

            if (i.product.isNewArrival) {
                // Render new arrival product
                el.innerHTML = `
                <div class="w-16 h-16 bg-rose-100 rounded-lg flex items-center justify-center">
                    <i class="${i.product.image} text-rose-600 text-xl"></i>
                </div>
                <div class="flex-1">
                    <div class="font-semibold text-slate-800">${escapeHtml(i.product.title)}</div>
                    <div class="text-sm text-slate-500">New Arrival</div>
                    <div class="flex items-center gap-2 mt-2">
                        <button data-dec="${i.id}" class="text-slate-500 hover:text-rose-600 transition" aria-label="Kurangi">
                            <i class="fas fa-minus-circle"></i>
                        </button>
                        <span class="text-sm font-medium text-slate-700 w-6 text-center">${i.qty}</span>
                        <button data-inc="${i.id}" class="text-slate-500 hover:text-rose-600 transition" aria-label="Tambah">
                            <i class="fas fa-plus-circle"></i>
                        </button>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-rose-600">${formatIDR(i.lineTotal)}</div>
                    <button data-remove="${i.id}" class="text-slate-400 hover:text-rose-600 mt-2" aria-label="Hapus item">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>`;
            } else {
                // Render API product
                el.innerHTML = `
                <img src="${i.product.image}" class="w-16 h-16 object-contain rounded-md bg-gray-50">
                <div class="flex-1">
                    <div class="font-semibold text-slate-800">${escapeHtml(i.product.title)}</div>
                    <div class="text-sm text-slate-500">${escapeHtml(i.product.category)}</div>
                    <div class="flex items-center gap-2 mt-2">
                        <button data-dec="${i.id}" class="text-slate-500 hover:text-rose-600 transition" aria-label="Kurangi">
                            <i class="fas fa-minus-circle"></i>
                        </button>
                        <span class="text-sm font-medium text-slate-700 w-6 text-center">${i.qty}</span>
                        <button data-inc="${i.id}" class="text-slate-500 hover:text-rose-600 transition" aria-label="Tambah">
                            <i class="fas fa-plus-circle"></i>
                        </button>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-rose-600">${formatIDR(i.lineTotal)}</div>
                    <button data-remove="${i.id}" class="text-slate-400 hover:text-rose-600 mt-2" aria-label="Hapus item">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>`;
            }
            cartList.appendChild(el);
        });

        cartSubtotalEl.textContent = formatIDR(getCartSubtotal());
    }

    // --- SUMMARY / CHECKOUT ---
    function openSummaryModal() {
        summaryContent.innerHTML = "";
        const details = getCartDetails();
        details.forEach((i) => {
            const line = document.createElement("div");
            line.className = "flex items-center justify-between p-2 border-b";
            if (i.product.isNewArrival) {
                line.innerHTML = `<div><div class="font-medium">${escapeHtml(i.product.title)}</div><div class="text-xs text-slate-500">${formatIDR(i.product.price * 15000)} x ${i.qty}</div></div><div class="font-semibold">${formatIDR(i.lineTotal)}</div>`;
            } else {
                line.innerHTML = `<div><div class="font-medium">${escapeHtml(i.product.title)}</div><div class="text-xs text-slate-500">${formatIDR(i.product.price * 15000)} x ${i.qty}</div></div><div class="font-semibold">${formatIDR(i.lineTotal)}</div>`;
            }
            summaryContent.appendChild(line);
        });
        summaryTotalEl.textContent = formatIDR(getCartSubtotal());
        summaryModal.classList.remove("hidden");
    }
    function closeSummaryModal() {
        summaryModal.classList.add("hidden");
    }

    function buildWhatsAppMessage(name, phone, note) {
        const details = getCartDetails();
        const lines = ["Halo, saya ingin memesan:"];
        details.forEach((i) => lines.push(`- ${i.product.title} (x${i.qty}) — ${formatIDR(i.lineTotal)}`));
        lines.push("");
        lines.push(`Subtotal: ${formatIDR(getCartSubtotal())}`);
        if (name) lines.push(`Nama: ${name}`);
        if (phone) lines.push(`HP: ${phone}`);
        if (note) lines.push(`Catatan: ${note}`);
        return encodeURIComponent(lines.join("\n"));
    }

    // --- EVENTS ---
    productGrid.addEventListener("click", (e) => {
        const add = e.target.closest("[data-add]");
        const detail = e.target.closest("[data-detail]");
        const fav = e.target.closest("[data-fav]");
        if (add) return addToCart(add.dataset.add, 1);
        if (detail) return openProductModal(detail.dataset.detail);
        if (fav) return toggleFavorite(fav.dataset.fav);
    });

    modalAddToCartBtn.onclick = () => {
        addToCart(modalAddToCartBtn.dataset.id, Number(modalQty.value) || 1);
        closeProductModal();
    };
    modalFavBtn.onclick = () => toggleFavorite(modalFavBtn.dataset.id);
    closeModalBtn.onclick = closeProductModal;

    cartBtn.onclick = () => {
        renderCart();
        cartModal.classList.remove("hidden");
    };
    closeCartBtn.onclick = () => cartModal.classList.add("hidden");

    clearCartBtn.onclick = () => {
        if (confirm("Kosongkan keranjang?")) {
            cart = [];
            saveCart();
            renderCart();
            updateCartCounter();
        }
    };

    checkoutBtn.onclick = () => {
        if (!cart.length) return showToast("Keranjang kosong");
        cartModal.classList.add("hidden");
        openSummaryModal();
    };

    closeSummaryBtn.onclick = closeSummaryModal;
    editCartBtn.onclick = () => {
        closeSummaryModal();
        cartModal.classList.remove("hidden");
    };

    sendWAButton.onclick = () => {
        const msg = buildWhatsAppMessage(buyerNameInput.value, buyerPhoneInput.value, buyerNoteInput.value);
        const url = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}` : `https://wa.me/?text=${msg}`;
        window.open(url, "_blank");
        cart = [];
        saveCart();
        closeSummaryModal();
        showToast("Dialihkan ke WhatsApp, pastikan untuk mengirim pesan.");
        updateCartCounter();
    };

    searchInput?.addEventListener("input", applySearch);
    searchInputMobile?.addEventListener("input", applySearch);
    viewSelect.addEventListener("change", applyCurrentView);

    // Header favorite button
    favBtnHeader?.addEventListener("click", () => {
        viewSelect.value = "favorites";
        renderFavoritesPage();
    });

    // Cart list delegated clicks (inc/dec/remove)
    cartList.addEventListener("click", (e) => {
        const inc = e.target.closest("[data-inc]");
        const dec = e.target.closest("[data-dec]");
        const del = e.target.closest("[data-remove]");

        if (inc) {
            const id = inc.dataset.inc;
            const item = cart.find((c) => c.id === id);
            if (item) item.qty++;
        }

        if (dec) {
            const id = dec.dataset.dec;
            const item = cart.find((c) => c.id === id);
            if (item && item.qty > 1) item.qty--;
            else if (item && item.qty === 1) cart = cart.filter((c) => c.id !== id);
        }

        if (del) {
            const id = del.dataset.remove;
            cart = cart.filter((c) => c.id !== id);
            showToast("Item dihapus dari keranjang");
        }

        saveCart();
        renderCart();
        updateCartCounter();
    });

    // --- SEARCH / FILTER ---
    function applySearch() {
        const q = (searchInput?.value || searchInputMobile?.value || "").toLowerCase();
        filtered = products.filter(
            (p) =>
                p.title.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                (p.description || "").toLowerCase().includes(q)
        );
        applyCurrentView();
    }
    function applyCurrentView() {
        if (viewSelect.value === "favorites") renderFavoritesPage();
        else renderProducts(filtered);
    }

    // --- PRODUCT MODAL ---
    function openProductModal(id) {
        const p = products.find((x) => String(x.id) === String(id));
        if (!p) return;
        modalImage.src = p.image;
        modalCategory.textContent = p.category;
        modalProductName.textContent = p.title;
        modalPrice.textContent = formatIDR(p.price * 15000);
        modalDescription.textContent = p.description;
        modalQty.value = 1;
        modalAddToCartBtn.dataset.id = p.id;
        modalFavBtn.dataset.id = p.id;
        productModal.classList.remove("hidden");
    }
    function closeProductModal() {
        productModal.classList.add("hidden");
    }

    // --- INIT ---
    fetchProducts();
});
