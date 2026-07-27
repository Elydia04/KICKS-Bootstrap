document.addEventListener('DOMContentLoaded', function () {

  // Cart data store
  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  // Scroll to top button
  const scrollTopBtn = document.querySelector('.scroll-top');
  if (scrollTopBtn) {
    window.addEventListener('scroll', function () {
      if (window.pageYOffset > 300) {
        scrollTopBtn.style.display = 'flex';
      } else {
        scrollTopBtn.style.display = 'none';
      }
    });
    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Add to cart
  document.querySelectorAll('.btn-add-cart').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const productName = this.getAttribute('data-name');
      const productPrice = parseFloat(this.getAttribute('data-price'));

      const existingItem = cart.find(item => item.name === productName);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({ name: productName, price: productPrice, quantity: 1 });
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartBadge();
      showToast('Item successfully added to cart.');
    });
  });

  // Toast notification
  function showToast(message) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center text-bg-success border-0 show';
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi bi-check-circle-fill me-2"></i>${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;
    toastContainer.appendChild(toastEl);

    setTimeout(function () {
      toastEl.classList.remove('show');
      setTimeout(function () { toastEl.remove(); }, 300);
    }, 3000);
  }

  // Update cart badge
  function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    badges.forEach(badge => {
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });
  }

  updateCartBadge();

  // Cart page rendering
  const cartTableBody = document.getElementById('cart-table-body');
  if (cartTableBody) {
    renderCart();

    function renderCart() {
      cartTableBody.innerHTML = '';
      if (cart.length === 0) {
        cartTableBody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center py-4">
              <i class="bi bi-cart-x" style="font-size: 3rem; color: #ccc;"></i>
              <p class="mt-2 text-muted">Your cart is empty.</p>
              <a href="products.html" class="btn btn-primary-custom mt-2">Shop Now</a>
            </td>
          </tr>
        `;
        updateCartSummary();
        return;
      }

      cart.forEach(function (item, index) {
        const subtotal = item.price * item.quantity;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            <div class="d-flex align-items-center">
              <i class="bi bi-box-seam me-2" style="font-size: 1.5rem; color: var(--primary-color);"></i>
              <span>${item.name}</span>
            </div>
          </td>
          <td>&#8369;${item.price.toFixed(2)}</td>
          <td>
            <div class="quantity-control">
              <button class="qty-minus" data-index="${index}">-</button>
              <input type="text" value="${item.quantity}" readonly>
              <button class="qty-plus" data-index="${index}">+</button>
            </div>
          </td>
          <td>&#8369;${subtotal.toFixed(2)}</td>
          <td>
            <button class="btn btn-sm btn-outline-danger remove-item" data-index="${index}">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        `;
        cartTableBody.appendChild(row);
      });

      // Quantity minus
      document.querySelectorAll('.qty-minus').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const idx = parseInt(this.getAttribute('data-index'));
          if (cart[idx].quantity > 1) {
            cart[idx].quantity -= 1;
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCart();
            updateCartBadge();
          }
        });
      });

      // Quantity plus
      document.querySelectorAll('.qty-plus').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const idx = parseInt(this.getAttribute('data-index'));
          cart[idx].quantity += 1;
          localStorage.setItem('cart', JSON.stringify(cart));
          renderCart();
          updateCartBadge();
        });
      });

      // Remove item
      document.querySelectorAll('.remove-item').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const idx = parseInt(this.getAttribute('data-index'));
          cart.splice(idx, 1);
          localStorage.setItem('cart', JSON.stringify(cart));
          renderCart();
          updateCartBadge();
          showToast('Item removed from cart.');
        });
      });

      updateCartSummary();
    }

    function updateCartSummary() {
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shipping = cart.length > 0 ? 99 : 0;
      const total = subtotal + shipping;

      const subtotalEl = document.getElementById('cart-subtotal');
      const shippingEl = document.getElementById('cart-shipping');
      const totalEl = document.getElementById('cart-total');

      if (subtotalEl) subtotalEl.textContent = '₱' + subtotal.toFixed(2);
      if (shippingEl) shippingEl.textContent = '₱' + shipping.toFixed(2);
      if (totalEl) totalEl.textContent = '₱' + total.toFixed(2);
    }
  }

  // Clear cart
  const clearCartBtn = document.getElementById('clear-cart');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', function () {
      cart = [];
      localStorage.setItem('cart', JSON.stringify(cart));
      if (cartTableBody) {
        renderCart();
      }
      updateCartBadge();
      showToast('Cart cleared.');
    });
  }

  // Checkout button
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function () {
      if (cart.length === 0) {
        showToast('Your cart is empty.');
        return;
      }
      cart = [];
      localStorage.setItem('cart', JSON.stringify(cart));
      showToast('Order placed successfully! Thank you for your purchase.');
      if (cartTableBody) {
        renderCart();
      }
      updateCartBadge();
    });
  }

  // Contact form submission
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const alertEl = document.getElementById('contact-alert');
      if (alertEl) {
        alertEl.classList.remove('d-none');
        setTimeout(function () {
          alertEl.classList.add('d-none');
        }, 5000);
      }
      this.reset();
    });
  }

  // Active nav link highlight
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-nav .nav-link').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });

});
