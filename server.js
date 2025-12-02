// server.js - Backend for Exotic Pets E-Commerce
// IT 202 Final Project

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors()); // Allow frontend to communicate with backend
app.use(express.json()); // Parse JSON request bodies

// ============================================
// IN-MEMORY DATA STORAGE
// ============================================

// Product catalog - 12 exotic pets
let products = [
  {
    B_id: 1,
    B_name: 'Blue-Tongued Skink',
    B_description: 'A friendly, hardy lizard known for its bright blue tongue and calm personality. Great for beginners.',
    B_price: 349.99,
    B_img: 'images/Skink.jpg',
    B_stock: 8
  },
  {
    B_id: 2,
    B_name: 'Panther Chameleon',
    B_description: 'A colorful, highly sought-after chameleon species that displays bright reds, blues, and greens.',
    B_price: 499.99,
    B_img: 'images/Chameleon.jpg',
    B_stock: 5
  },
  {
    B_id: 3,
    B_name: 'Green Tree Python',
    B_description: 'A beautiful arboreal snake known for its vivid green coloration and unique resting posture.',
    B_price: 599.99,
    B_img: 'images/Python.jpg',
    B_stock: 4
  },
  {
    B_id: 4,
    B_name: 'Fennec Fox',
    B_description: 'A small desert fox with oversized ears. Intelligent, playful, and requires specialized care.',
    B_price: 1299.99,
    B_img: 'images/Fox.jpg',
    B_stock: 2
  },
  {
    B_id: 5,
    B_name: 'African Spurred Tortoise',
    B_description: 'A large tortoise species that is hardy, long-lived, and friendly. Requires outdoor space.',
    B_price: 249.99,
    B_img: 'images/Tortoise.jpg',
    B_stock: 10
  },
  {
    B_id: 6,
    B_name: 'Scarlet Macaw',
    B_description: 'A highly intelligent and vibrant parrot with bright red, blue, and yellow feathers.',
    B_price: 1899.99,
    B_img: 'images/Macaw.jpg',
    B_stock: 3
  },
  {
    B_id: 7,
    B_name: 'Ring-Tailed Cat',
    B_description: 'A nocturnal mammal with catlike agility and raccoon-like markings. Curious and energetic.',
    B_price: 799.99,
    B_img: 'images/RingTailedCat.jpg',
    B_stock: 6
  },
  {
    B_id: 8,
    B_name: 'Tanuki (Japanese Raccoon Dog)',
    B_description: 'A rare and adorable canine species native to Japan. Intelligent, playful, and mischievous.',
    B_price: 1299.99,
    B_img: 'images/Tanuki.jpg',
    B_stock: 3
  },
  {
    B_id: 9,
    B_name: 'Sugar Glider',
    B_description: 'A tiny gliding marsupial that bonds closely with owners. Social, fast, and fun to watch.',
    B_price: 299.99,
    B_img: 'images/Glider.jpg',
    B_stock: 12
  },
  {
    B_id: 10,
    B_name: 'Bengal Cat',
    B_description: 'A sleek, muscular domestic cat with leopard-like spots and high energy.',
    B_price: 1499.99,
    B_img: 'images/BengalCat.jpg',
    B_stock: 4
  },
  {
    B_id: 11,
    B_name: 'Sphynx Cat',
    B_description: 'A hairless cat breed known for its affectionate personality and unique appearance.',
    B_price: 999.99,
    B_img: 'images/SphynxCat.jpg',
    B_stock: 5
  },
  {
    B_id: 12,
    B_name: 'Capuchin Monkey',
    B_description: 'An intelligent and social exotic monkey known for its expressive face and high energy. Requires expert-level care.',
    B_price: 4999.99,
    B_img: 'images/Monkey.jpg',
    B_stock: 1
  }
];

// Shopping cart - stores items user adds
let cart = [];

// Orders - stores completed orders
let orders = [];
let orderIdCounter = 1;

// Tax rate - 8% flat rate
const TAX_RATE = 0.08;

// ============================================
// API ENDPOINTS
// ============================================

// GET: Retrieve all products
app.get('/B_getproducts', (req, res) => {
  console.log('📦 Getting all products');
  
  try {
    res.json({
      B_success: true,
      B_products: products
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      B_success: false,
      B_message: 'Error retrieving products'
    });
  }
});

// POST: Add product to cart
app.post('/B_addtocart', (req, res) => {
  console.log('🛒 Adding to cart');
  
  try {
    const { productId, quantity } = req.body;

    // Validate input
    if (!productId || !quantity) {
      return res.status(400).json({
        B_success: false,
        B_message: 'Product ID and quantity required'
      });
    }

    // Find product
    const product = products.find(p => p.B_id === productId);
    if (!product) {
      return res.status(404).json({
        B_success: false,
        B_message: 'Product not found'
      });
    }

    // Check if already in cart
    const existingItem = cart.find(item => item.B_id === productId);

    if (existingItem) {
      // Update quantity
      existingItem.B_quantity += quantity;
      console.log(`  Updated quantity for ${product.B_name}`);
    } else {
      // Add new item
      cart.push({
        B_id: product.B_id,
        B_name: product.B_name,
        B_description: product.B_description,
        B_price: product.B_price,
        B_img: product.B_img,
        B_quantity: quantity
      });
      console.log(`  Added ${product.B_name} to cart`);
    }

    res.json({
      B_success: true,
      B_message: 'Product added to cart'
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      B_success: false,
      B_message: 'Error adding to cart'
    });
  }
});

// GET: Get cart item count
app.get('/B_getcartcount', (req, res) => {
  console.log('🔢 Getting cart count');
  
  try {
    const count = cart.reduce((total, item) => total + item.B_quantity, 0);
    
    res.json({
      B_success: true,
      B_count: count
    });
  } catch (error) {
    console.error('Error getting cart count:', error);
    res.json({
      B_success: false,
      B_count: 0
    });
  }
});

// GET: Get all cart items with totals
app.get('/B_getcartitems', (req, res) => {
  console.log('📋 Getting cart items');
  
  try {
    // Calculate subtotal
    const subtotal = cart.reduce((sum, item) => {
      return sum + (item.B_price * item.B_quantity);
    }, 0);

    // Calculate tax
    const tax = subtotal * TAX_RATE;

    // Calculate total
    const total = subtotal + tax;

    console.log(`  Items: ${cart.length}`);
    console.log(`  Subtotal: $${subtotal.toFixed(2)}`);
    console.log(`  Tax (8%): $${tax.toFixed(2)}`);
    console.log(`  Total: $${total.toFixed(2)}`);

    res.json({
      B_success: true,
      B_items: cart,
      B_subtotal: subtotal,
      B_tax: tax,
      B_total: total
    });
  } catch (error) {
    console.error('Error getting cart items:', error);
    res.status(500).json({
      B_success: false,
      B_message: 'Error retrieving cart'
    });
  }
});

// PUT: Update item quantity in cart
app.put('/B_updateQuantity', (req, res) => {
  console.log('🔄 Updating quantity');
  
  try {
    const { productId, newQuantity } = req.body;

    // Validate
    if (!productId || newQuantity === undefined) {
      return res.status(400).json({
        B_success: false,
        B_message: 'Product ID and quantity required'
      });
    }

    if (newQuantity < 1) {
      return res.status(400).json({
        B_success: false,
        B_message: 'Quantity must be at least 1'
      });
    }

    // Find item in cart
    const cartItem = cart.find(item => item.B_id === productId);

    if (!cartItem) {
      return res.status(404).json({
        B_success: false,
        B_message: 'Item not found in cart'
      });
    }

    // Update quantity
    cartItem.B_quantity = newQuantity;
    console.log(`  Updated ${cartItem.B_name} to quantity ${newQuantity}`);

    res.json({
      B_success: true,
      B_message: 'Quantity updated'
    });
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({
      B_success: false,
      B_message: 'Error updating quantity'
    });
  }
});

// DELETE: Remove item from cart (using URL parameter)
app.delete('/B_removefromcart/:productId', (req, res) => {
  console.log('🗑️  Removing from cart');
  
  try {
    const productId = parseInt(req.params.productId);

    if (!productId) {
      return res.status(400).json({
        B_success: false,
        B_message: 'Product ID required'
      });
    }

    // Find item index
    const itemIndex = cart.findIndex(item => item.B_id === productId);

    if (itemIndex === -1) {
      return res.status(404).json({
        B_success: false,
        B_message: 'Item not found in cart'
      });
    }

    // Remove item
    const removedItem = cart.splice(itemIndex, 1)[0];
    console.log(`  Removed ${removedItem.B_name}`);

    res.json({
      B_success: true,
      B_message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Error removing item:', error);
    res.status(500).json({
      B_success: false,
      B_message: 'Error removing item'
    });
  }
});

// POST: Process checkout
app.post('/B_checkout', (req, res) => {
  console.log('💳 Processing checkout');
  
  try {
    // Check if cart is empty
    if (cart.length === 0) {
      return res.status(400).json({
        B_success: false,
        B_message: 'Cart is empty'
      });
    }

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => {
      return sum + (item.B_price * item.B_quantity);
    }, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    // Create order
    const order = {
      B_id: orderIdCounter++,
      B_items: [...cart], // Copy cart items
      B_subtotal: subtotal,
      B_tax: tax,
      B_total: total,
      B_date: new Date().toISOString()
    };

    // Save order
    orders.push(order);

    console.log(`  ✅ Order #${order.B_id} created`);
    console.log(`  Total: $${total.toFixed(2)}`);

    // Clear cart
    cart = [];

    res.json({
      B_success: true,
      B_message: 'Order placed successfully',
      B_order: order
    });
  } catch (error) {
    console.error('Error processing checkout:', error);
    res.status(500).json({
      B_success: false,
      B_message: 'Error processing checkout'
    });
  }
});

// GET: Get all orders (optional - for viewing history)
app.get('/B_getorders', (req, res) => {
  console.log('📜 Getting all orders');
  
  try {
    res.json({
      B_success: true,
      B_orders: orders
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      B_success: false,
      B_message: 'Error retrieving orders'
    });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('========================================');
  console.log('🦎 Exotic Pets E-Commerce Backend');
  console.log('========================================');
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Products: ${products.length} exotic pets`);
  console.log(`Tax Rate: ${(TAX_RATE * 100).toFixed(0)}%`);
  console.log('========================================');
  console.log('Endpoints:');
  console.log('  GET    /B_getproducts');
  console.log('  POST   /B_addtocart');
  console.log('  GET    /B_getcartcount');
  console.log('  GET    /B_getcartitems');
  console.log('  PUT    /B_updateQuantity');
  console.log('  DELETE /B_removefromcart');
  console.log('  POST   /B_checkout');
  console.log('  GET    /B_getorders');
  console.log('========================================');
  console.log('✅ Ready for connections!');
  console.log('');
});
