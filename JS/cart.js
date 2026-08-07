/* ==========================================================================
   Nihon-Desu — Shared Cart & UX System
   Satu file ini dipakai di SEMUA halaman supaya keranjang belanja
   konsisten, gampang diakses (badge jumlah di navbar dari halaman mana
   pun), dan tidak lagi pakai alert() bawaan browser yang mengganggu.
   Data tetap disimpan di localStorage (key: "nd_cart") supaya kompatibel
   dengan halaman lama.
   ========================================================================== */

(function () {
  "use strict";

  var CART_KEY = "nd_cart";

  /* ---------------------------------------------------------------- */
  /* Util path: banyak halaman berada di subfolder (HTML/, HTML/pay/, */
  /* HTML/muat lain/) jadi link ke index/keranjang perlu prefix yang  */
  /* tepat. Kita deteksi otomatis dari kedalaman folder saat ini.     */
  /* ---------------------------------------------------------------- */
  function getBasePrefix() {
    var path = window.location.pathname;
    // Hitung kedalaman relatif terhadap root proyek dengan menandai file kunci
    var marker = "/HTML/";
    var idx = path.indexOf(marker);
    if (idx === -1) return ""; // halaman di root (index.html, Nendoroid.html, dst)
    var rest = path.substring(idx + marker.length);
    var depth = rest.split("/").length - 1; // subfolder di dalam HTML/
    var prefix = "../";
    for (var i = 0; i < depth; i++) prefix += "../";
    return prefix;
  }

  var BASE = getBasePrefix();

  /* ---------------------------------------------------------------- */
  /* Cart storage helpers                                             */
  /* ---------------------------------------------------------------- */
  function readCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  function parsePrice(price) {
    if (typeof price === "number") return price;
    if (!price) return 0;
    var digits = String(price).replace(/[^0-9]/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }

  /* Normalisasi path gambar menjadi relatif terhadap ROOT project,
     supaya bisa dipakai ulang dengan benar dari halaman mana pun
     (root, HTML/, HTML/pay/, HTML/muat lain/). */
  function toRootRelative(imgPath) {
    if (!imgPath) return imgPath;
    return imgPath.replace(/^(\.\.\/)+/, "");
  }

  /* Tambah produk ke keranjang. Jika produk yang sama sudah ada, jumlah
     (qty) ditambah, bukan duplikat baris baru. */
  window.addToCart = function (name, price, image, opts) {
    opts = opts || {};
    var cart = readCart();
    price = parsePrice(price);

    var existing = cart.find(function (item) {
      return item.name === name;
    });

    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
      existing.checked = existing.checked !== false;
    } else {
      cart.push({
        name: name,
        price: price,
        image: toRootRelative(image),
        qty: 1,
        checked: true
      });
    }

    writeCart(cart);
    showToast('"' + name + '" ditambahkan ke keranjang', "success");
    if (typeof window.updateCart === "function") {
      window.updateCart();
    }
    return false; // aman dipakai langsung sebagai onclick="return addToCart(...)"
  };

  window.removeFromCart = function (index) {
    var cart = readCart();
    var removed = cart[index];
    cart.splice(index, 1);
    writeCart(cart);
    if (removed) showToast('"' + removed.name + '" dihapus dari keranjang', "info");
    if (typeof window.updateCart === "function") window.updateCart();
  };

  window.toggleItemChecked = function (index, isChecked) {
    var cart = readCart();
    if (cart[index]) cart[index].checked = isChecked;
    writeCart(cart);
    if (typeof window.updateCart === "function") window.updateCart();
  };

  window.changeQty = function (index, delta) {
    var cart = readCart();
    if (!cart[index]) return;
    cart[index].qty = Math.max(1, (cart[index].qty || 1) + delta);
    writeCart(cart);
    if (typeof window.updateCart === "function") window.updateCart();
  };

  function cartCount() {
    return readCart().reduce(function (sum, item) {
      return sum + (item.qty || 1);
    }, 0);
  }

  /* ---------------------------------------------------------------- */
  /* Render halaman Keranjang.html                                    */
  /* ---------------------------------------------------------------- */
  window.updateCart = function () {
    var cartContainer = document.getElementById("cart-items");
    var totalPriceElement = document.getElementById("total-price");
    if (!cartContainer || !totalPriceElement) return; // bukan halaman keranjang

    var cart = readCart();
    cartContainer.innerHTML = "";

    if (cart.length === 0) {
      cartContainer.innerHTML =
        '<div class="nd-cart-empty">' +
        "<p>Keranjang kamu masih kosong.</p>" +
        '<a href="' + BASE + 'index.html">Mulai belanja →</a>' +
        "</div>";
      totalPriceElement.textContent = "0";
      return;
    }

    var totalPrice = 0;

    cart.forEach(function (item, index) {
      var qty = item.qty || 1;
      var el = document.createElement("div");
      el.className = "cart-item";
      el.innerHTML =
        '<input type="checkbox" class="cart-item-check" data-index="' + index + '" ' +
        (item.checked !== false ? "checked" : "") + " />" +
        '<img src="' + BASE + item.image + '" alt="' + item.name + '" class="cart-item-image" />' +
        '<p class="cart-item-name">' + item.name + "</p>" +
        '<div class="nd-qty">' +
        '<button type="button" onclick="changeQty(' + index + ', -1)">−</button>' +
        '<span>' + qty + '</span>' +
        '<button type="button" onclick="changeQty(' + index + ', 1)">+</button>' +
        "</div>" +
        '<p class="cart-item-price">Rp ' + (item.price * qty).toLocaleString("id-ID") + "</p>" +
        '<button class="cart-item-remove" onclick="removeFromCart(' + index + ')">Hapus</button>';

      el.querySelector(".cart-item-check").addEventListener("change", function () {
        toggleItemChecked(index, this.checked);
      });

      cartContainer.appendChild(el);

      if (item.checked !== false) {
        totalPrice += item.price * qty;
      }
    });

    totalPriceElement.textContent = totalPrice.toLocaleString("id-ID");
  };

  /* ---------------------------------------------------------------- */
  /* Badge jumlah item di ikon keranjang — muncul di semua halaman    */
  /* ---------------------------------------------------------------- */
  function updateCartBadge() {
    var baskets = document.querySelectorAll(".basket");
    var count = cartCount();

    baskets.forEach(function (basket) {
      var wrapper = basket.parentElement;
      if (!wrapper) return;

      var badge = wrapper.querySelector(".nd-cart-badge");
      if (count > 0) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "nd-cart-badge";
          wrapper.style.position = wrapper.style.position || "relative";
          wrapper.appendChild(badge);
        }
        badge.textContent = count > 99 ? "99+" : count;
      } else if (badge) {
        badge.remove();
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* Toast notification — pengganti alert()                           */
  /* ---------------------------------------------------------------- */
  function showToast(message, type) {
    var container = document.getElementById("nd-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "nd-toast-container";
      document.body.appendChild(container);
    }

    var icons = { success: "✅", info: "ℹ️", error: "⚠️" };
    var toast = document.createElement("div");
    toast.className = "nd-toast";
    toast.innerHTML =
      '<span class="nd-toast-icon">' + (icons[type] || "🛒") + "</span><span>" + message + "</span>";
    container.appendChild(toast);

    setTimeout(function () {
      toast.classList.add("nd-toast-out");
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, 2600);
  }
  window.ndShowToast = showToast;

  /* ---------------------------------------------------------------- */
  /* Mobile hamburger menu                                            */
  /* ---------------------------------------------------------------- */
  function setupMobileMenu() {
    var menu = document.querySelector("nav .menu");
    if (!menu) return;
    var list = menu.querySelector(".logo > ul");
    if (!list) return;

    // Pindahkan link "Sign in / Login" ke dalam drawer supaya tetap bisa
    // diakses di layar kecil tanpa membuat top bar sesak.
    var rightMenuLi = menu.querySelector(".right-menu > li");
    if (rightMenuLi) {
      var divider = document.createElement("li");
      divider.innerHTML = '<hr style="border:none;border-top:1px solid #eee;margin:10px 0;">';
      list.appendChild(divider);
      list.appendChild(rightMenuLi.cloneNode(true));
    }

    var burger = document.createElement("button");
    burger.className = "nd-hamburger";
    burger.setAttribute("aria-label", "Buka menu");
    burger.innerHTML = "<span></span><span></span><span></span>";
    menu.appendChild(burger);

    burger.addEventListener("click", function () {
      list.classList.toggle("nd-menu-open");
    });

    // Di layar kecil, tap kategori membuka dropdown (bukan hover)
    var categoryLink = list.querySelector("li > a");
    if (categoryLink) {
      categoryLink.addEventListener("click", function (e) {
        if (window.innerWidth <= 900) {
          e.preventDefault();
          categoryLink.parentElement.classList.toggle("nd-dropdown-open");
        }
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /* Sticky navbar shadow on scroll + back-to-top button              */
  /* ---------------------------------------------------------------- */
  function setupScrollEffects() {
    var nav = document.querySelector("nav");
    var backToTop = document.createElement("button");
    backToTop.id = "nd-back-to-top";
    backToTop.innerHTML = "↑";
    backToTop.setAttribute("aria-label", "Kembali ke atas");
    document.body.appendChild(backToTop);

    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", function () {
      var scrolled = window.scrollY > 40;
      if (nav) nav.classList.toggle("nd-scrolled", scrolled);
      backToTop.classList.toggle("nd-show", window.scrollY > 400);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Reveal-on-scroll animation untuk kartu produk                    */
  /* ---------------------------------------------------------------- */
  function setupRevealAnimation() {
    var targets = document.querySelectorAll(
      ".item, .trending-item, .Category-container .item"
    );
    if (!targets.length) return;

    targets.forEach(function (el) {
      el.classList.add("nd-reveal");
    });

    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) {
        el.classList.add("nd-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("nd-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Checkout — dipanggil dari tombol "Checkout" di Keranjang.html    */
  /* ---------------------------------------------------------------- */
  function setupCheckout() {
    var btn = document.querySelector(".checkout-btn");
    if (!btn) return;

    btn.addEventListener("click", function () {
      var cart = readCart().filter(function (item) {
        return item.checked !== false;
      });

      if (cart.length === 0) {
        showToast("Pilih minimal satu produk untuk checkout", "error");
        return;
      }

      var total = cart.reduce(function (sum, item) {
        return sum + item.price * (item.qty || 1);
      }, 0);

      var names = cart
        .map(function (item) {
          return item.name + (item.qty > 1 ? " x" + item.qty : "");
        })
        .join(", ");

      sessionStorage.setItem("productName", names);
      sessionStorage.setItem("productPrice", "Rp " + total.toLocaleString("id-ID"));
      sessionStorage.setItem("productImage", cart[0].image); // path relatif dari root project

      window.location.href = BASE + "HTML/pay/pembayaran.html";
    });
  }

  /* ---------------------------------------------------------------- */
  /* Ensure basket icon always links to Keranjang.html                */
  /* ---------------------------------------------------------------- */
  function ensureBasketLink() {
    var baskets = document.querySelectorAll(".basket");
    baskets.forEach(function (basket) {
      if (basket.closest("a")) return; // sudah ada link
      var link = document.createElement("a");
      link.href = BASE + "Keranjang.html";
      basket.parentNode.insertBefore(link, basket);
      link.appendChild(basket);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Init                                                              */
  /* ---------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    ensureBasketLink();
    updateCartBadge();
    setupMobileMenu();
    setupScrollEffects();
    setupRevealAnimation();
    setupCheckout();
    if (typeof window.updateCart === "function") window.updateCart();
  });
})();
