/* ============================================================
   KICKS E-Commerce – Main JavaScript
   ============================================================
   This file handles all interactive features:
   1. Cart management (add, remove, update, clear)
   2. Navbar scroll behavior (adds shadow on scroll)
   3. Scroll-to-top button (show/hide + smooth scroll)
   4. Toast notifications (add/remove feedback)
   5. Product details page (load product, carousel, modal)
   6. Cart page rendering (table, summary, free shipping)
   7. Contact form validation (phone, name, email)
   ============================================================ */


/* ============================================================
   1. CART MANAGEMENT
   ============================================================ */

/**
 * getCart() – Retrieves the current cart from localStorage.
 * @returns {Array} Array of cart items, or empty array if none.
 * JSON.parse converts the stored string back into a JS array.
 */
function getCart() {
  try { return JSON.parse(localStorage.getItem('kicks_cart')) || []; }
  catch { return []; }
}

/**
 * saveCart(cart) – Saves the cart array to localStorage.
 * JSON.stringify converts the array into a string for storage.
 */
function saveCart(cart) {
  localStorage.setItem('kicks_cart', JSON.stringify(cart));
}

/**
 * addToCart(product, qty) – Adds a product to the cart or
 * increments its quantity if it already exists.
 *   - Checks if item with same id + color + size exists
 *   - If yes: adds qty to existing quantity
 *   - If no: pushes new item with color/size properties
 * Then saves and dispatches a custom event for the navbar badge.
 */
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
  // Custom event listened to by navbar badge & cart page badge
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}

/**
 * removeFromCart(id, color, size) – Removes an item from
 * the cart by matching its id, color, and size.
 */
function removeFromCart(id, color, size) {
  let cart = getCart();
  cart = cart.filter(
    item => !(item.id === id && item.color === color && item.size === size)
  );
  saveCart(cart);
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}

/**
 * updateCartItemQty(id, color, size, newQty) – Updates the
 * quantity of a specific cart item. Removes if qty < 1.
 */
function updateCartItemQty(id, color, size, newQty) {
  let cart = getCart();
  if (newQty < 1) {
    // Quantity 0 or less = remove the item entirely
    cart = cart.filter(
      item => !(item.id === id && item.color === color && item.size === size)
    );
  } else {
    // Find the item and update its quantity
    const item = cart.find(
      item => item.id === id && item.color === color && item.size === size
    );
    if (item) item.quantity = newQty;
  }
  saveCart(cart);
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}

/**
 * clearCartEmpties – Removes all items from the cart.
 * Used by the "Clear Cart" button.
 */
function clearCartEmpties() {
  saveCart([]);
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}


/* ============================================================
   2. NAVBAR SCROLL EFFECT
   Adds a box-shadow to the navbar when the user scrolls
   down, making it look "floating" above the page content.
   ============================================================ */
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    // If scrolled more than 50px down, add the shadow
    navbar.style.boxShadow = window.scrollY > 50
      ? '0 2px 20px rgba(0,0,0,0.1)'   /* Visible shadow */
      : '0 1px 0 rgba(0,0,0,0.06)';    /* Default subtle border */
  }
});


/* ============================================================
   3. SCROLL-TO-TOP BUTTON
   Shows a circular arrow button after scrolling 300px.
   Clicking it smoothly scrolls back to the top.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const scrollBtn = document.querySelector('.scroll-top');

  if (scrollBtn) {
    // Show/hide the button based on scroll position
    window.addEventListener('scroll', () => {
      scrollBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
    });

    // Smooth-scroll to top when clicked
    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});


/* ============================================================
   4. TOAST NOTIFICATIONS
   Small popup messages that appear at the top-right corner
   when items are added to or removed from the cart.
   ============================================================ */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  // Bootstrap icons: checkmark for success, exclamation for warning
  const icon = type === 'success'
    ? 'bi-check-circle-fill'
    : 'bi-exclamation-circle-fill';

  // Build the toast HTML with Bootstrap classes
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

  // Automatically remove after 2 seconds
  setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.remove(), 300);  // Wait for fade-out animation
  }, 2000);
}


/* ============================================================
   5. PRODUCT DETAILS PAGE
   ============================================================ */

/**
 * findProduct(id) – Searches the products array for a
 * product matching the given ID. Returns the product or null.
 */
function findProduct(id) {
  return products.find(p => p.id === id);
}

/**
 * renderProductDetails() – Called on product-details.html.
 * Reads the ?id= query parameter, finds the product, and
 * populates the page with:
 *   - Images (thumbnail carousel + main image)
 *   - Name, price, description
 *   - Color and size selector dropdowns
 *   - "Add to Cart" button with onclick handler
 * Also sets up the size-color change listeners.
 */
function renderProductDetails() {
  // Parse the product ID from the URL (e.g., ?id=1)
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  const product = findProduct(id);

  // If product not found, show error and stop
  if (!product) {
    document.getElementById('productContent').innerHTML =
      '<div class="col-12 text-center py-5"><h2>Product not found</h2><a href="products.html" class="btn btn-primary-custom mt-3">Back to Products</a></div>';
    return;
  }

  // --- Populate thumbnails ---
  const thumbContainer = document.querySelector('.thumbnail-images');
  if (thumbContainer) {
    thumbContainer.innerHTML = product.images.map((img, i) =>
      `<div class="thumb-item p-2 ${i === 0 ? 'active' : ''}" data-index="${i}">
        <img src="${img}" alt="Thumbnail ${i + 1}" class="img-fluid rounded"
          style="width:70px;height:70px;object-fit:cover;cursor:pointer;">
      </div>`
    ).join('');
  }

  // --- Populate main carousel images ---
  const mainCarousel = document.getElementById('productCarousel');
  if (mainCarousel) {
    mainCarousel.innerHTML = product.images.map((img, i) =>
      `<div class="carousel-item ${i === 0 ? 'active' : ''}">
        <img src="${img}" class="d-block w-100 rounded" alt="${product.name}">
      </div>`
    ).join('');
  }

  // --- Populate product info ---
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

        <!-- Color selector dropdown -->
        <div class="mb-3">
          <label class="form-label fw-bold">Color</label>
          <select class="form-select w-50" id="colorSelect">
            ${(product.colors || ['White']).map(color =>
              `<option value="${color}">${color}</option>`
            ).join('')}
          </select>
        </div>

        <!-- Size selector dropdown -->
        <div class="mb-4">
          <label class="form-label fw-bold">Size (UK)</label>
          <select class="form-select w-50" id="sizeSelect">
            ${(product.sizes || ['M']).map(size =>
              `<option value="${size}">${size}</option>`
            ).join('')}
          </select>
        </div>

        <!-- Add to Cart button with inline onclick -->
        <button class="btn btn-primary-custom btn-lg px-5 py-3 mb-3"
          onclick="handleAddToCart(${product.id})">
          Add to Cart
        </button>

        <!-- Accordion with extra product info -->
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

  // --- Thumbnail click → change active thumbnail ---
  document.querySelectorAll('.thumb-item').forEach(thumb => {
    thumb.addEventListener('click', () => {
      // Remove active from all, add to clicked
      document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // --- Listen for color/size changes to update displayed info ---
  document.getElementById('colorSelect')?.addEventListener('change', updateSizeInfo);
  document.getElementById('sizeSelect')?.addEventListener('change', updateSizeInfo);
}

/**
 * updateSizeInfo() – Reads the currently selected color and
 * size from the dropdowns and (optionally) updates the page.
 * Currently a placeholder for future stock/price logic.
 */
function updateSizeInfo() {
  const color = document.getElementById('colorSelect')?.value;
  const size = document.getElementById('sizeSelect')?.value;
  if (color && size) {
    // Future: update price or stock based on color+size combo
  }
}

/**
 * handleAddToCart(productId) – Called by the "Add to Cart"
 * button on the product details page. Reads the selected
 * color and size from the dropdowns and adds the item to cart.
 */
function handleAddToCart(productId) {
  const product = findProduct(productId);
  if (!product) return;

  const color = document.getElementById('colorSelect')?.value || 'White';
  const size = document.getElementById('sizeSelect')?.value || 'M';

  addToCart(product, 1);
  showToast(`${product.name} (${color}, ${size}) added to cart!`);
}

/**
 * toggleDetailQuick(id) – Toggle a hidden "quick info" div
 * on product cards. Used for the hover expand effect.
 */
function toggleDetailQuick(id) {
  const el = document.getElementById(`detailQuick${id}`);
  if (el) el.classList.toggle('d-none');
}


/* ============================================================
   6. CART PAGE RENDERING
   ============================================================ */

/**
 * renderCartPage() – Called on cart.html. Reads the cart
 * from localStorage and renders:
 *   - Cart items table (image, name, price, qty controls, total)
 *   - Order summary sidebar (subtotal, shipping, total)
 *   - "Clear Cart" and "Proceed to Checkout" buttons
 * Listens for cartUpdated events to re-render on changes.
 */
function renderCartPage() {
  const cart = getCart();
  const container = document.getElementById('cartItems');
  const summary = document.getElementById('orderSummary');

  if (!container) return;

  // --- Empty cart state ---
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-bag fs-1 text-muted mb-3 d-block"></i>
        <h3>Your cart is empty</h3>
        <p class="text-muted mb-4">Looks like you haven't added any items yet.</p>
        <a href="products.html" class="btn btn-primary-custom">Continue Shopping</a>
      </div>`;
    if (summary) summary.innerHTML = '';  // Hide summary if cart is empty
    return;
  }

  // --- Render cart items table ---
  container.innerHTML = `
    <table class="table mb-0 cart-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Price</th>
          <th>Quantity</th>
          <th class="text-end">Total</th>
        </tr>
      </thead>
      <tbody>
        ${cart.map(item => `
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
            <td>₱${item.price.toLocaleString()}</td>
            <td>
              <div class="quantity-control">
                <button onclick="changeQty('${item.id}', '${item.color}', '${item.size}', ${item.quantity - 1})">-</button>
                <input type="text" value="${item.quantity}" readonly>
                <button onclick="changeQty('${item.id}', '${item.color}', '${item.size}', ${item.quantity + 1})">+</button>
              </div>
            </td>
            <td class="text-end fw-bold">₱${(item.price * item.quantity).toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;

  // --- Render order summary sidebar ---
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Free shipping if subtotal >= ₱5,000, otherwise ₱99
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
        <button class="btn btn-outline-secondary" onclick="clearCartAndReload()">Clear Cart</button>
        <a href="products.html" class="btn btn-outline-custom">Continue Shopping</a>
      </div>`;
  }
}

/**
 * changeQty(id, color, size, newQty) – Button onclick handler
 * for the +/- buttons. Updates the cart item quantity and
 * re-renders the cart page.
 */
function changeQty(id, color, size, newQty) {
  updateCartItemQty(id, color, size, newQty);
  renderCartPage();
}

/**
 * clearCartAndReload() – Clears the cart and re-renders.
 */
function clearCartAndReload() {
  clearCartEmpties();
  renderCartPage();
}

/**
 * checkout() – Placeholder checkout function.
 * Shows an alert confirming the order (real checkout not implemented).
 */
function checkout() {
  const cart = getCart();
  if (cart.length === 0) return;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = total >= 5000 ? 0 : 99;

  alert(`Order Total: ₱${(total + shipping).toLocaleString()}\n\nThank you for shopping with KICKS!`);
  clearCartEmpties();
  renderCartPage();
}


/* ============================================================
   7. CONTACT FORM VALIDATION
   ============================================================ */

/**
 * validatePhone(input) – Restricts phone input to numbers,
 * spaces, hyphens, and plus signs only. Blocks other characters.
 */
function validatePhone(input) {
  input.value = input.value.replace(/[^0-9\s\-+]/g, '');
}

/**
 * validateForm() – Validates the contact form before submission.
 * Checks:
 *   - Name is not empty
 *   - Phone matches Philippine format (10-11 digits)
 *   - Email contains @ and .
 *   - Message is not empty
 * Returns true if valid, false otherwise (prevents submission).
 */
function validateForm() {
  const name = document.getElementById('name');
  const phone = document.getElementById('phone');
  const email = document.getElementById('email');
  const message = document.getElementById('message');

  // Name validation
  if (!name.value.trim()) {
    alert('Please enter your name.');
    name.focus();
    return false;
  }

  // Phone validation – must be 10-11 digits
  const phoneClean = phone.value.replace(/[\s\-+]/g, '');
  if (!/^[0-9]{10,11}$/.test(phoneClean)) {
    alert('Please enter a valid 10-11 digit phone number.');
    phone.focus();
    return false;
  }

  // Email validation – basic check for @ and .
  if (!email.value.includes('@') || !email.value.includes('.')) {
    alert('Please enter a valid email address.');
    email.focus();
    return false;
  }

  // Message validation
  if (!message.value.trim()) {
    alert('Please enter your message.');
    message.focus();
    return false;
  }

  // All valid – show success alert
  alert('Thank you! Your message has been sent. We will contact you soon.');
  return true;
}


/* ============================================================
   8. PAGE INITIALIZATION
   Runs on every page load to update the navbar cart badge
   and handle page-specific rendering.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /**
   * updateNavbarBadge() – Counts total items in cart and
   * updates the badge number in the navbar. Hides the badge
   * if cart is empty.
   */
  function updateNavbarBadge() {
    const cart = getCart();
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.textContent = totalQty;
      badge.style.display = totalQty > 0 ? 'flex' : 'none';
    }
  }

  // Update badge on initial page load
  updateNavbarBadge();

  // Update badge whenever cart changes (custom event from addToCart, etc.)
  window.addEventListener('cartUpdated', updateNavbarBadge);

  // --- Page-specific initialization ---
  // If we're on the product details page, render product info
  if (document.getElementById('productContent')) {
    renderProductDetails();
  }

  // If we're on the cart page, render the cart
  if (document.getElementById('cartItems')) {
    renderCartPage();
    // Re-render cart if it changes while on the cart page
    window.addEventListener('cartUpdated', renderCartPage);
  }
});
