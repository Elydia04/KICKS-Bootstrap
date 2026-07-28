/* ============================================================
  KICKS E-Commerce – Main JavaScript
  Handles: Cart, Navbar scroll, Scroll-to-top, Toast,
  Product details, Cart page, Form validation
   ============================================================ */


/* 1. CART MANAGEMENT */

function getCart() {
  try { return JSON.parse(localStorage.getItem('kicks_cart')) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem('kicks_cart', JSON.stringify(cart));
}

function addToCart(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find(
    item => item.id === product.id && item.color === product.color && item.size === product.size
  );

  if (existing) { existing.quantity += qty; }
  else {
    cart.push({
      ...product,
      quantity: qty,
      color: product.color || 'White',
      size: product.size || 'M'
    });
  }

  saveCart(cart);
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}

function removeFromCart(id, color, size) {
  let cart = getCart();
  cart = cart.filter(
    item => !(item.id === id && item.color === color && item.size === size)
  );
  saveCart(cart);
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}

function updateCartItemQty(id, color, size, newQty) {
  let cart = getCart();
  if (newQty < 1) {
    cart = cart.filter(
      item => !(item.id === id && item.color === color && item.size === size)
    );
  } else {
    const item = cart.find(
      item => item.id === id && item.color === color && item.size === size
    );
    if (item) item.quantity = newQty;
  }
  saveCart(cart);
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}

function clearCartEmpties() {
  saveCart([]);
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}


/* 2. NAVBAR SCROLL EFFECT */
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    navbar.style.boxShadow = window.scrollY > 50
      ? '0 2px 20px rgba(0,0,0,0.1)'
      : '0 1px 0 rgba(0,0,0,0.06)';
  }
});


/* 3. SCROLL-TO-TOP BUTTON */
document.addEventListener('DOMContentLoaded', () => {
  const scrollBtn = document.querySelector('.scroll-top');

  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
    });

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});


/* 4. TOAST NOTIFICATIONS */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icon = type === 'success'
    ? 'bi-check-circle-fill'
    : 'bi-exclamation-circle-fill';

  const toastEl = document.createElement('div');
  toastEl.className = 'toast align-items-center text-bg-success border-0 show';
  toastEl.setAttribute('role', 'alert');
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi ${icon} me-2"></i>${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto"
        data-bs-dismiss="toast"></button>
    </div>`;

  container.appendChild(toastEl);

  setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.remove(), 300);
  }, 2000);
}


/* 5. PRODUCT DETAILS PAGE */

function findProduct(id) {
  return products.find(p => p.id === id);
}

function renderProductDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  const product = findProduct(id);

  if (!product) {
    document.getElementById('productContent').innerHTML =
      '<div class="col-12 text-center py-5"><h2>Product not found</h2><a href="products.html" class="btn btn-primary-custom mt-3">Back to Products</a></div>';
    return;
  }

  const thumbContainer = document.querySelector('.thumbnail-images');
  if (thumbContainer) {
    thumbContainer.innerHTML = product.images.map((img, i) =>
      `<div class="thumb-item p-2 ${i === 0 ? 'active' : ''}" data-index="${i}">
        <img src="${img}" alt="Thumbnail ${i + 1}" class="img-fluid rounded"
          style="width:70px;height:70px;object-fit:cover;cursor:pointer;">
      </div>`
    ).join('');
  }

  const mainCarousel = document.getElementById('productCarousel');
  if (mainCarousel) {
    mainCarousel.innerHTML = product.images.map((img, i) =>
      `<div class="carousel-item ${i === 0 ? 'active' : ''}">
        <img src="${img}" class="d-block w-100 rounded" alt="${product.name}">
      </div>`
    ).join('');
  }

  const content = document.getElementById('productContent');
  if (content) {
    content.innerHTML = `
      <div class="col-lg-6 mb-4" id="productImageSection">
        <div id="productInfoFetched">
          <div class="product-detail-img position-relative">
            <div id="productCarousel" class="carousel slide" data-bs-ride="carousel">
              <div class="carousel-inner rounded">
                ${product.images.map((img, i) =>
                  `<div class="carousel-item ${i === 0 ? 'active' : ''}">
                    <img src="${img}" class="d-block w-100" alt="${product.name}">
                  </div>`
                ).join('')}
              </div>
            </div>
            <div class="thumb d-flex mt-2">${product.images.map((img, i) =>
              `<div class="thumb-item me-2 p-1 ${i === 0 ? 'border border-2 border-dark' : ''}" data-index="${i}">
                <img src="${img}" alt="Thumbnail ${i + 1}" class="rounded" style="width:70px;height:70px;object-fit:cover;">
              </div>`
            ).join('')}</div>
          </div>
        </div>
      </div>

      <div class="col-lg-6 product-info">
        <h1 class="mb-2">${product.name}</h1>
        <div class="d-flex align-items-center mb-3">
          <div class="rating me-2">
            ${'<i class="bi bi-star-fill"></i>'.repeat(product.rating)}
            ${'<i class="bi bi-star"></i>'.repeat(5 - product.rating)}
          </div>
          <span class="text-muted small">(${product.rating}/5)</span>
        </div>

        <p class="mb-0">Starting from</p>
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="price">${product.oldPrice
            ? `<span class="text-decoration-line-through text-muted h4 me-2" style="font-weight:400">₱${product.oldPrice.toLocaleString()}</span> ₱${product.price.toLocaleString()}`
            : `₱${product.price.toLocaleString()}`
          }</div>
        </div>

        <p class="mb-4">${product.description || ''}</p>

        <div class="mb-3">
          <label class="form-label fw-bold">Color</label>
          <select class="form-select w-50" id="colorSelect">
            ${(product.colors || ['White']).map(color =>
              `<option value="${color}">${color}</option>`
            ).join('')}
          </select>
        </div>

        <div class="mb-4">
          <label class="form-label fw-bold">Size (UK)</label>
          <select class="form-select w-50" id="sizeSelect">
            ${(product.sizes || ['M']).map(size =>
              `<option value="${size}">${size}</option>`
            ).join('')}
          </select>
        </div>

        <button class="btn btn-primary-custom btn-lg px-5 py-3 mb-3"
          onclick="handleAddToCart(${product.id})">
          Add to Cart
        </button>

        <div class="accordion mt-3" id="detailsAccordion">
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button" data-bs-toggle="collapse"
                data-bs-target="#detailOne">Product Details</button>
            </h2>
            <div id="detailOne" class="accordion-collapse collapse show"
              data-bs-parent="#detailsAccordion">
              <div class="accordion-body">${product.details || ''}</div>
            </div>
          </div>
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" data-bs-toggle="collapse"
                data-bs-target="#detailTwo">Material & Care</button>
            </h2>
            <div id="detailTwo" class="accordion-collapse collapse"
              data-bs-parent="#detailsAccordion">
              <div class="accordion-body">${product.material || ''}</div>
            </div>
          </div>
        </div>
      </div>`;
  }

  document.querySelectorAll('.thumb-item').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  document.getElementById('colorSelect')?.addEventListener('change', updateSizeInfo);
  document.getElementById('sizeSelect')?.addEventListener('change', updateSizeInfo);
}

function updateSizeInfo() {
  const color = document.getElementById('colorSelect')?.value;
  const size = document.getElementById('sizeSelect')?.value;
  if (color && size) { }
}

function handleAddToCart(productId) {
  const product = findProduct(productId);
  if (!product) return;

  const color = document.getElementById('colorSelect')?.value || 'White';
  const size = document.getElementById('sizeSelect')?.value || 'M';

  addToCart(product, 1);
  showToast(`${product.name} (${color}, ${size}) added to cart!`);
}

function toggleDetailQuick(id) {
  const el = document.getElementById(`detailQuick${id}`);
  if (el) el.classList.toggle('d-none');
}


/* 6. CART PAGE RENDERING */

function renderCartPage() {
  const cart = getCart();
  const container = document.getElementById('cartItems');
  const summary = document.getElementById('orderSummary');

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-5">
          <i class="bi bi-bag fs-1 text-muted mb-3 d-block"></i>
          <h3>Your cart is empty</h3>
          <p class="text-muted mb-4">Looks like you haven't added any items yet.</p>
          <a href="products.html" class="btn btn-primary-custom">Continue Shopping</a>
        </td>
      </tr>`;
    if (summary) summary.innerHTML = '';
    return;
  }

  container.innerHTML = cart.map(item => `
    <tr>
      <td>
        <div class="d-flex align-items-center">
          <img src="${item.images ? item.images[0] : 'images/product-images/placeholder.jpg'}"
            alt="${item.name}" class="rounded me-3"
            style="width:60px;height:60px;object-fit:cover;">
          <div>
            <h6 class="mb-0">${item.name}</h6>
            <small class="text-muted">${item.color || 'White'} / ${item.size || 'M'}</small>
          </div>
        </div>
      </td>
      <td>&#8369;${item.price.toLocaleString()}</td>
      <td>
        <div class="quantity-control">
          <button onclick="changeQty(${item.id}, '${item.color}', '${item.size}', ${item.quantity - 1})">-</button>
          <input type="text" value="${item.quantity}" readonly>
          <button onclick="changeQty(${item.id}, '${item.color}', '${item.size}', ${item.quantity + 1})">+</button>
        </div>
      </td>
      <td class="fw-bold">&#8369;${(item.price * item.quantity).toLocaleString()}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${item.id}, '${item.color}', '${item.size}')" title="Remove">
          <i class="bi bi-trash-fill"></i>
        </button>
      </td>
    </tr>
  `).join('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 5000 ? 0 : 99;
  const total = subtotal + shipping;

  if (summary) {
    summary.innerHTML = `
      <h4 class="mb-4">Order Summary</h4>
      <div class="d-flex justify-content-between mb-2">
        <span>Subtotal (${cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
        <span>₱${subtotal.toLocaleString()}</span>
      </div>
      <div class="d-flex justify-content-between mb-3">
        <span>Shipping</span>
        <span class="${shipping === 0 ? 'text-success fw-bold' : ''}">
          ${shipping === 0 ? 'FREE' : '₱' + shipping}
        </span>
      </div>
      ${shipping > 0 ? `
        <div class="alert alert-light text-center py-2 mb-3" style="font-size:0.85rem">
          Add ₱${(5000 - subtotal).toLocaleString()} more for FREE shipping!
        </div>` : ''}
      <hr>
      <div class="d-flex justify-content-between mb-4">
        <strong class="fs-5">Total</strong>
        <strong class="fs-5">₱${total.toLocaleString()}</strong>
      </div>
      <div class="d-grid gap-2">
        <button class="btn btn-accent-custom btn-lg" onclick="checkout()">Proceed to Checkout</button>
        <a href="products.html" class="btn btn-outline-custom">Continue Shopping</a>
      </div>`;
  }
}

function changeQty(id, color, size, newQty) {
  updateCartItemQty(id, color, size, newQty);
  renderCartPage();
}

function clearCartAndReload() {
  clearCartEmpties();
  renderCartPage();
}

function checkout() {
  const cart = getCart();
  if (cart.length === 0) return;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 5000 ? 0 : 99;
  const total = subtotal + shipping;

  const confirmEl = document.getElementById('checkoutConfirm');
  const successEl = document.getElementById('checkoutSuccess');
  if (confirmEl) confirmEl.style.display = 'block';
  if (successEl) successEl.style.display = 'none';

  const totalEl = document.getElementById('confirmTotal');
  if (totalEl) totalEl.textContent = '\u20B1' + total.toLocaleString();

  const modal = new bootstrap.Modal(document.getElementById('checkoutModal'));
  modal.show();
}

function confirmCheckout() {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 5000 ? 0 : 99;
  const total = subtotal + shipping;

  const confirmEl = document.getElementById('checkoutConfirm');
  const successEl = document.getElementById('checkoutSuccess');
  if (confirmEl) confirmEl.style.display = 'none';
  if (successEl) successEl.style.display = 'block';

  const itemsEl = document.getElementById('checkoutItems');
  if (itemsEl) {
    itemsEl.innerHTML = cart.map(item =>
      `<div class="d-flex justify-content-between align-items-center mb-2">
        <div>
          <span class="fw-semibold">${item.name}</span>
          <small class="text-muted"> x${item.quantity}</small>
        </div>
        <span class="fw-bold">\u20B1${(item.price * item.quantity).toLocaleString()}</span>
      </div>`
    ).join('');
  }

  const subEl = document.getElementById('modalSubtotal');
  const shipEl = document.getElementById('modalShipping');
  const totalEl = document.getElementById('modalTotal');
  if (subEl) subEl.textContent = '\u20B1' + subtotal.toLocaleString();
  if (shipEl) shipEl.textContent = shipping === 0 ? 'FREE' : '\u20B1' + shipping;
  if (totalEl) totalEl.textContent = '\u20B1' + total.toLocaleString();

  clearCartEmpties();
  renderCartPage();

  setTimeout(() => {
    const modal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
    if (modal) modal.hide();
  }, 4000);
}


/* 7. CONTACT FORM VALIDATION */

function validatePhone(input) {
  input.value = input.value.replace(/[^0-9\s\-+]/g, '');
}

function validateForm() {
  const name = document.getElementById('name');
  const phone = document.getElementById('phone');
  const email = document.getElementById('email');
  const message = document.getElementById('message');

  if (!name.value.trim()) {
    alert('Please enter your name.');
    name.focus();
    return false;
  }

  const phoneClean = phone.value.replace(/[\s\-+]/g, '');
  if (!/^[0-9]{10,11}$/.test(phoneClean)) {
    alert('Please enter a valid 10-11 digit phone number.');
    phone.focus();
    return false;
  }

  if (!email.value.includes('@') || !email.value.includes('.')) {
    alert('Please enter a valid email address.');
    email.focus();
    return false;
  }

  if (!message.value.trim()) {
    alert('Please enter your message.');
    message.focus();
    return false;
  }

  alert('Thank you! Your message has been sent. We will contact you soon.');
  return true;
}


/* 8. PAGE INITIALIZATION */
document.addEventListener('DOMContentLoaded', () => {

  function updateNavbarBadge() {
    const cart = getCart();
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.textContent = totalQty;
      badge.style.display = totalQty > 0 ? 'flex' : 'none';
    }
  }

  updateNavbarBadge();
  window.addEventListener('cartUpdated', updateNavbarBadge);

  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      const price = parseInt(btn.getAttribute('data-price'));
      const image = btn.getAttribute('data-image');
      if (!name || !price) return;
      addToCart({ id: price, name, price, color: 'White', size: 'M', images: image ? [image] : [] }, 1);
      showToast(`${name} added to cart!`);
    });
  });

  if (document.getElementById('productContent')) {
    renderProductDetails();
  }

  const clearCartBtn = document.getElementById('clear-cart');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', clearCartAndReload);
  }

  if (document.getElementById('cartItems')) {
    renderCartPage();
    window.addEventListener('cartUpdated', renderCartPage);
  }
});
