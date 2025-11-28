// Backend URL
const API_URL = 'http://localhost:3000';

// ============================================
// PRODUCTS PAGE FUNCTIONS
// ============================================

// Get all products from backend and display them
async function getProducts() {
    const loader = document.getElementById('f_loader');
    const productsBox = document.getElementById('f_productsBox');
    const errorMessage = document.getElementById('f_errorMessage');

    try {
        // Fetch products from backend
        const response = await fetch(`${API_URL}/B_getproducts`, {
            method: 'GET'
        });

        const data = await response.json();
        loader.style.display = 'none';
        productsBox.style.display = 'block';

        // Display products
        productsBox.innerHTML = '';
        data.B_products.forEach(product => {
            productsBox.innerHTML += `
                <div class="product-box">
                    <img src="${product.B_image}" alt="${product.B_name}"/>
                    <h3>${product.B_name}</h3>
                    <p class="description">${product.B_description}</p>
                    <p class="price">$${product.B_price.toFixed(2)}</p>
                    <button onclick="addToCart(${product.B_id})">Add to Cart</button>
                </div>
            `;
        });

    } catch (error) {
        console.error('Error in getProducts:', error);
        loader.style.display = 'none';
        errorMessage.innerHTML = 'Something went wrong while loading products. Please try again later.';
        errorMessage.style.display = 'block';
    }
}

// ============================================
// ADD TO CART
// ============================================

async function addToCart(productId) {
    try {
        const response = await fetch(`${API_URL}/B_addtocart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: productId,
                quantity: 1
            })
        });

        const data = await response.json();
        
        if (data.B_success) {
            alert('Product added to cart successfully!');
            updateCartBadge();
        } else {
            alert('Failed to add product to cart');
        }

    } catch (error) {
        console.error('Error in addToCart:', error);
        alert('An error occurred while adding the product to the cart. Please try again later.');
    }
}

// ============================================
// UPDATE CART BADGE
// ============================================

async function updateCartBadge() {
    const cartBadge = document.getElementById('f_cartBadge');

    try {
        const response = await fetch(`${API_URL}/B_getcartcount`, {
            method: 'GET'
        });

        const data = await response.json();
        const count = data.B_count;
        cartBadge.innerText = count;

    } catch (error) {
        console.error('Error in updateCartBadge:', error);
        cartBadge.innerText = '0';
    }
}

// ============================================
// SHOPPING CART PAGE
// ============================================

async function getCart() {
    const loader = document.getElementById('f_loader');
    const emptyMessage = document.getElementById('f_emptyMessage');
    const ordercontent = document.getElementById('f_ordercontent');
    const cartItemsBox = document.getElementById('f_cartItemsBox');
    const subtotal = document.getElementById('f_subtotal');
    const tax = document.getElementById('f_tax');
    const total = document.getElementById('f_total');

    try {
        const response = await fetch(`${API_URL}/B_getcartitems`, {
            method: 'GET'
        });

        const data = await response.json();
        loader.style.display = 'none';

        // Check if cart is empty
        if (data.B_items.length === 0) {
            emptyMessage.style.display = 'block';
            cartItemsBox.style.display = 'none';
            return;
        }

        // Display cart items
        emptyMessage.style.display = 'none';
        cartItemsBox.style.display = 'block';
        cartItemsBox.innerHTML = '';
        
        data.B_items.forEach(item => {
            cartItemsBox.innerHTML += `
                <div class="cart-item">
                    <img src="${item.B_image}" alt="${item.B_name}">
                    <div class="item-details">
                        <h4>${item.B_name}</h4>
                        <p class="item-price">$${item.B_price.toFixed(2)}</p>
                    </div>
                    <div class="quantity-controls">
                        <button onclick="changeQuantity(${item.B_id}, ${item.B_quantity - 1})">-</button>
                        <span>${item.B_quantity}</span>
                        <button onclick="changeQuantity(${item.B_id}, ${item.B_quantity + 1})">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeItem(${item.B_id})">Remove</button>
                </div>
            `;
        });

        // Display totals
        subtotal.innerHTML = `$${data.B_subtotal.toFixed(2)}`;
        tax.innerHTML = `$${data.B_tax.toFixed(2)}`;
        total.innerHTML = `$${data.B_total.toFixed(2)}`;

    } catch (error) {
        console.error('Error in getCart:', error);
        loader.style.display = 'none';
        alert('Failed to load cart');
    }
}

// ============================================
// CHANGE QUANTITY
// ============================================

async function changeQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        return alert('Quantity cannot be less than 1');
    }

    try {
        const response = await fetch(`${API_URL}/B_updateQuantity`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, newQuantity })
        });

        const data = await response.json();

        if (data.B_success) {
            getCart(); // Reload cart
        } else {
            alert('Failed to update quantity');
        }

    } catch (error) {
        console.error('Error in changeQuantity:', error);
        alert('An error occurred while updating the quantity. Please try again later.');
    }
}

// ============================================
// REMOVE ITEM FROM CART
// ============================================

async function removeItem(productId) {
    if (!confirm('Are you sure you want to remove this item?')) {
        return; // Exit if user cancels
    }

    try {
        const response = await fetch(`${API_URL}/B_removefromcart`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId })
        });

        const data = await response.json();
        
        if (data.B_success) {
            getCart(); // Reload cart
        } else {
            alert('Failed to remove item from cart');
        }
        
    } catch (error) {
        console.error('Error in removeItem:', error);
        alert('An error occurred while removing the item from the cart. Please try again later.');
    }
}

// ============================================
// GO TO CHECKOUT PAGE
// ============================================

function goToCheckout() {
    window.location.href = 'checkout.html';
}

// ============================================
// CHECKOUT PROCESS
// ============================================

async function checkout() {
    const loader = document.getElementById('f_loader');
    const checkoutMessage = document.getElementById('f_checkoutMessage');
    const errorMessage = document.getElementById('f_errorMessage');

    loader.style.display = 'block';

    try {
        const response = await fetch(`${API_URL}/B_checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const data = await response.json();

        if (data.B_success) {
            loader.style.display = 'none';
            checkoutMessage.style.display = 'block';
            displayOrder(data.B_order);
        } else {
            loader.style.display = 'none';
            errorMessage.style.display = 'block';
            alert('Checkout failed. Please try again.');
        }
        
    } catch (error) {
        console.error('Error in checkout:', error);
        loader.style.display = 'none';
        errorMessage.style.display = 'block';
        alert('An error occurred during checkout. Please try again later.');
    }
}

// ============================================
// DISPLAY ORDER SUMMARY
// ============================================

function displayOrder(order) {
    const orderId = document.getElementById('f_orderProductId');
    const productBox = document.getElementById('f_orderProductbox');
    const orderSubtotal = document.getElementById('f_orderSubtotal');
    const orderTax = document.getElementById('f_orderTax');
    const orderTotal = document.getElementById('f_orderTotal');

    // Display order ID
    orderId.innerHTML = `#${order.B_id}`;

    // Display ordered items
    productBox.innerHTML = '';
    order.B_items.forEach(item => {
        productBox.innerHTML += `
            <div class="order-item">
                <h4>${item.B_name} x ${item.B_quantity}</h4>
                <p>$${(item.B_price * item.B_quantity).toFixed(2)}</p>
            </div>
        `;
    });

    // Display totals
    orderSubtotal.innerHTML = `$${order.B_subtotal.toFixed(2)}`;
    orderTax.innerHTML = `$${order.B_tax.toFixed(2)}`;
    orderTotal.innerHTML = `$${order.B_total.toFixed(2)}`;
}

// ============================================
// CHECK CART BEFORE CHECKOUT
// ============================================

async function checkCart() {
    try {
        const response = await fetch(`${API_URL}/B_getcartitems`, {
            method: 'GET'
        });

        const data = await response.json();

        if (data.B_items.length === 0) {
            alert('Your cart is empty. Please add items to your cart before proceeding to checkout.');
            window.location.href = 'cart.html';
            return;
        }

        checkout(); // Proceed to checkout if cart has items

    } catch (error) {
        console.error('Error in checkCart:', error);
        alert('An error occurred while checking the cart. Please try again later.');
    }
}

// ============================================
// PAGE INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;

    // Products page (index.html)
    if (currentPage.includes('index') || currentPage.includes('products') || currentPage.endsWith('/')) {
        getProducts();
        updateCartBadge();
    }
    // Cart page
    else if (currentPage.includes('cart')) {
        getCart();

        // Add event listener to checkout button
        const checkoutButton = document.getElementById('f_checkoutButton');
        if (checkoutButton) {
            checkoutButton.addEventListener('click', checkCart);
        }
    }
    // Checkout page
    else if (currentPage.includes('checkout')) {
        checkCart();
    }
});