// shopping-cart-server.js - My Shopping Cart Backend

// First, I need to bring in express to make my server work
const express = require('express');
const jwt = require('jsonwebtoken');

// Make a new server
const app = express();

// This line lets me read JSON data from requests
app.use(express.json());

// My secret password for tokens (should change this in a real app!)
const mySecretKey = 'my-super-secret-key-12345';

// ===================================================================
// My fake database - just storing stuff in memory for now
// ===================================================================

// All my users
let allUsers = [
  {
    id: 1,
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  }
];

// Animal inventory
let allProducts = [
   { id: 1, name: 'Blue-Tongued Skink', price: 349.99, image: 'Blue-Tongued Skink.jpg', weight: 2.0 },
  { id: 2, name: 'Panther Chameleon', price: 499.99, image: 'Panther Chameleon.jpg', weight: 1.5 },
  { id: 3, name: 'Green Tree Python', price: 599.99, image: 'Green Tree Python.jpg', weight: 3.0 },
  { id: 4, name: 'Fennec Fox', price: 129.99, image: 'Fennec Fox.jpg', weight: 8.0 },
  { id: 5, name: 'African Spurred Tortoise', price: 249.99, image: 'African Spurred Tortoise.jpg', weight: 15.0 },
  { id: 6, name: 'Scarlet Macaw', price: 189.99, image: 'Scarlet Macaw.jpg', weight: 2.5 },
  { id: 7, name: 'Ring-Tailed Cat', price: 799.99, image: 'Ring-Tailed Cat.jpg', weight: 5.0 },
  { id: 8, name: 'Tanuki (Japanese Raccoon Dog)', price: 129.99, image: 'Tanuki.jpg', weight: 10.0 },
  { id: 9, name: 'Sugar Glider', price: 299.99, image: 'Sugar Glider.jpg', weight: 0.3 },
  { id: 10, name: 'Monkey', price: 150.00, image: 'Monkey.jpg', weight: 12.0 },
  { id: 11, name: 'Sphynx Cat', price: 999.99, image: 'Sphynx Cat.jpg', weight: 7.0 },
  { id: 12, name: 'Kinkajou (Honey Bear)', price: 1799.99, image: 'Kinkajou.jpg', weight: 6.0 }

];

// Everyone's shopping carts
// I'll use the user's ID as the key
let everybodysCarts = {};

// ===================================================================
// Function to check if someone is logged in
// ===================================================================
function makeSureUserIsLoggedIn(request, response, next) {
  // Try to get the authorization header
  let authorizationHeader = request.headers['authorization'];
  
  // If there's no header, they're not logged in
  if (!authorizationHeader) {
    return response.status(401).json({ error: 'You need to login first!' });
  }
  
  // The header looks like "Bearer abc123", I just want the "abc123" part
  let token = authorizationHeader.split(' ')[1];
  
  // Try to verify the token
  try {
    let decodedToken = jwt.verify(token, mySecretKey);
    
    // Save the user ID so I can use it later
    request.userId = decodedToken.userId;
    
    // Let them continue
    next();
    
  } catch (err) {
    return response.status(401).json({ error: 'Your token is invalid or expired' });
  }
}

// ===================================================================
// LOGIN - so people can have their own cart
// ===================================================================
app.post('/login', function(request, response) {
  console.log('Someone is trying to login');
  
  // Get the email and password they sent me
  let userEmail = request.body.email;
  let userPassword = request.body.password;
  
  // Look through all my users to find a match
  let matchingUser = null;
  
  for (let i = 0; i < allUsers.length; i++) {
    if (allUsers[i].email === userEmail) {
      if (allUsers[i].password === userPassword) {
        matchingUser = allUsers[i];
        break;
      }
    }
  }
  
  // If I didn't find them, send an error
  if (matchingUser === null) {
    return response.status(401).json({ error: 'Wrong email or password' });
  }
  
  // Make a token for them
  let newToken = jwt.sign(
    { userId: matchingUser.id },
    mySecretKey,
    { expiresIn: '24h' }
  );
  
  console.log('Login successful!');
  
  // Send back the token and their info
  response.json({
    message: 'You are logged in!',
    token: newToken,
    user: {
      id: matchingUser.id,
      email: matchingUser.email,
      name: matchingUser.name
    }
  });
});

// ===================================================================
// SHOW ALL PRODUCTS - anyone can see these
// ===================================================================
app.get('/products', function(request, response) {
  console.log('Showing all products');
  
  response.json({
    products: allProducts
  });
});

// ===================================================================
// ADD SOMETHING TO CART
// ===================================================================
app.post('/cart/add', makeSureUserIsLoggedIn, function(request, response) {
  console.log('Someone wants to add something to their cart');
  
  // Get the user's ID
  let currentUserId = request.userId;
  
  // Get what they want to add
  let productTheyWant = request.body.productId;
  let howMany = request.body.quantity;
  
  // If they didn't say how many, just add 1
  if (!howMany) {
    howMany = 1;
  }
  
  // First, check if that product actually exists
  let foundProduct = null;
  
  for (let i = 0; i < allProducts.length; i++) {
    if (allProducts[i].id === productTheyWant) {
      foundProduct = allProducts[i];
      break;
    }
  }
  
  // If the product doesn't exist, tell them
  if (foundProduct === null) {
    return response.status(404).json({ error: 'That product does not exist' });
  }
  
  // Check if this user has a cart yet
  if (!everybodysCarts[currentUserId]) {
    // They don't have a cart, so make one for them
    everybodysCarts[currentUserId] = [];
    console.log('Created a new cart for user', currentUserId);
  }
  
  // Get their cart
  let thisUsersCart = everybodysCarts[currentUserId];
  
  // Check if they already have this product in their cart
  let alreadyInCart = null;
  
  for (let i = 0; i < thisUsersCart.length; i++) {
    if (thisUsersCart[i].productId === productTheyWant) {
      alreadyInCart = thisUsersCart[i];
      break;
    }
  }
  
  // If it's already in their cart, just add to the quantity
  if (alreadyInCart !== null) {
    alreadyInCart.quantity = alreadyInCart.quantity + howMany;
    console.log('Updated quantity for product', productTheyWant);
  } else {
    // It's not in their cart yet, so add it
    let newCartItem = {
      productId: productTheyWant,
      quantity: howMany,
      addedAt: new Date().toISOString()
    };
    
    thisUsersCart.push(newCartItem);
    console.log('Added new product to cart');
  }
  
  // Tell them it worked
  response.json({
    message: 'Added to cart!',
    totalItemsInCart: thisUsersCart.length
  });
});

// ===================================================================
// SHOW ME MY CART
// ===================================================================
app.get('/cart', makeSureUserIsLoggedIn, function(request, response) {
  console.log('Someone wants to see their cart');
  
  // Get the user's ID
  let currentUserId = request.userId;
  
  // Get their cart (or empty if they don't have one)
  let thisUsersCart = everybodysCarts[currentUserId];
  
  if (!thisUsersCart) {
    thisUsersCart = [];
  }
  
  // Now I need to build a better version with all the product details
  let niceCartToShow = [];
  let totalCost = 0;
  
  // Go through each item in their cart
  for (let i = 0; i < thisUsersCart.length; i++) {
    let cartItem = thisUsersCart[i];
    
    // Find the full product info
    let productInfo = null;
    
    for (let j = 0; j < allProducts.length; j++) {
      if (allProducts[j].id === cartItem.productId) {
        productInfo = allProducts[j];
        break;
      }
    }
    
    // If I found the product, add it to the nice cart
    if (productInfo !== null) {
      let costForThisItem = productInfo.price * cartItem.quantity;
      totalCost = totalCost + costForThisItem;
      
      let niceCartItem = {
        productId: productInfo.id,
        name: productInfo.name,
        price: productInfo.price,
        image: productInfo.image,
        quantity: cartItem.quantity,
        totalForThisItem: costForThisItem,
        whenAdded: cartItem.addedAt
      };
      
      niceCartToShow.push(niceCartItem);
    }
  }
  
  // Send back the cart
  console.log('Cart has', niceCartToShow.length, 'different items');
  
  response.json({
    yourCart: niceCartToShow,
    numberOfItems: niceCartToShow.length,
    totalPrice: totalCost.toFixed(2)
  });
});

// ===================================================================
// CHANGE HOW MANY OF SOMETHING I WANT
// ===================================================================
app.put('/cart/update', makeSureUserIsLoggedIn, function(request, response) {
  console.log('Someone wants to change quantity');
  
  // Get the info
  let currentUserId = request.userId;
  let whichProduct = request.body.productId;
  let newQuantity = request.body.quantity;
  
  // Make sure the quantity makes sense
  if (newQuantity < 1) {
    return response.status(400).json({ error: 'Quantity must be at least 1' });
  }
  
  // Check if they have a cart
  if (!everybodysCarts[currentUserId]) {
    return response.status(404).json({ error: 'Your cart is empty' });
  }
  
  // Get their cart
  let thisUsersCart = everybodysCarts[currentUserId];
  
  // Find the item in their cart
  let foundIt = null;
  
  for (let i = 0; i < thisUsersCart.length; i++) {
    if (thisUsersCart[i].productId === whichProduct) {
      foundIt = thisUsersCart[i];
      break;
    }
  }
  
  // If it's not in their cart, tell them
  if (foundIt === null) {
    return response.status(404).json({ error: 'That product is not in your cart' });
  }
  
  // Update the quantity
  foundIt.quantity = newQuantity;
  console.log('Changed quantity to', newQuantity);
  
  response.json({
    message: 'Updated!',
    newQuantity: newQuantity
  });
});

// ===================================================================
// REMOVE SOMETHING FROM MY CART
// ===================================================================
app.delete('/cart/remove/:productId', makeSureUserIsLoggedIn, function(request, response) {
  console.log('Someone wants to remove something from cart');
  
  // Get the info
  let currentUserId = request.userId;
  let whichProduct = parseInt(request.params.productId);
  
  // Check if they have a cart
  if (!everybodysCarts[currentUserId]) {
    return response.status(404).json({ error: 'Your cart is empty' });
  }
  
  // Get their cart
  let thisUsersCart = everybodysCarts[currentUserId];
  
  // Look for the product and remove it
  let didIRemoveIt = false;
  
  for (let i = 0; i < thisUsersCart.length; i++) {
    if (thisUsersCart[i].productId === whichProduct) {
      // Remove this item (splice removes items from an array)
      thisUsersCart.splice(i, 1);
      didIRemoveIt = true;
      break;
    }
  }
  
  // Tell them if it worked
  if (didIRemoveIt) {
    console.log('Removed product from cart');
    response.json({
      message: 'Removed from cart',
      itemsLeft: thisUsersCart.length
    });
  } else {
    response.status(404).json({ error: 'That product was not in your cart' });
  }
});

// ===================================================================
// EMPTY MY WHOLE CART
// ===================================================================
app.delete('/cart/clear', makeSureUserIsLoggedIn, function(request, response) {
  console.log('Someone wants to empty their cart');
  
  let currentUserId = request.userId;
  
  // Just set their cart to empty
  everybodysCarts[currentUserId] = [];
  
  response.json({
    message: 'Your cart is now empty'
  });
});

// ===================================================================
// START MY SERVER
// ===================================================================
const PORT = 3000;

app.listen(PORT, function() {
  console.log('========================================');
  console.log('My shopping cart server is running!');
  console.log('You can use it at: http://localhost:' + PORT);
  console.log('========================================');
});


in stock

// inventory-server.js - Keeping Track of Product Stock

// I need express to make my server
const express = require('express');
const jwt = require('jsonwebtoken');

// Start my server
const app = express();

// This lets me read JSON
app.use(express.json());

// My secret key for login tokens
const mySecretKey = 'change-this-secret-key-later';

// ===================================================================
// My pretend database
// ===================================================================

// Users who can login
let myUsers = [
  {
    id: 1,
    email: 'admin@store.com',
    password: 'admin123',
    name: 'Store Admin',
    isAdmin: true
  },
  {
    id: 2,
    email: 'customer@example.com',
    password: 'customer123',
    name: 'Regular Customer',
    isAdmin: false
  }
];

// All my products with how many I have in stock
let myProducts = [

];

// Keep track of everyone's carts
let allCarts = {};

// ===================================================================
// Function to make sure someone is logged in
// ===================================================================
function checkIfLoggedIn(request, response, next) {
  let authHeader = request.headers['authorization'];
    { id: 1, name: 'Blue-Tongued Skink', price: 349.99, image: 'Blue-Tongued Skink.jpg', weight: 2.0 },
  { id: 2, name: 'Panther Chameleon', price: 499.99, image: 'Panther Chameleon.jpg', weight: 1.5 },
  { id: 3, name: 'Green Tree Python', price: 599.99, image: 'Green Tree Python.jpg', weight: 3.0 },
  { id: 4, name: 'Fennec Fox', price: 129.99, image: 'Fennec Fox.jpg', weight: 8.0 },
  { id: 5, name: 'African Spurred Tortoise', price: 249.99, image: 'African Spurred Tortoise.jpg', weight: 15.0 },
  { id: 6, name: 'Scarlet Macaw', price: 189.99, image: 'Scarlet Macaw.jpg', weight: 2.5 },
  { id: 7, name: 'Ring-Tailed Cat', price: 799.99, image: 'Ring-Tailed Cat.jpg', weight: 5.0 },
  { id: 8, name: 'Tanuki (Japanese Raccoon Dog)', price: 129.99, image: 'Tanuki.jpg', weight: 10.0 },
  { id: 9, name: 'Sugar Glider', price: 299.99, image: 'Sugar Glider.jpg', weight: 0.3 },
  { id: 10, name: 'Monkey', price: 150.00, image: 'Monkey.jpg', weight: 12.0 },
  { id: 11, name: 'Sphynx Cat', price: 999.99, image: 'Sphynx Cat.jpg', weight: 7.0 },
  { id: 12, name: 'Kinkajou (Honey Bear)', price: 1799.99, image: 'Kinkajou.jpg', weight: 6.0 }
  if (!authHeader) {
    return response.status(401).json({ error: 'Please login first' });
  }
  
  let token = authHeader.split(' ')[1];
  
  try {
    let decoded = jwt.verify(token, mySecretKey);
    request.userId = decoded.userId;
    request.isAdmin = decoded.isAdmin;
    next();
  } catch (error) {
    return response.status(401).json({ error: 'Invalid token' });
  }
}

// ===================================================================
// LOGIN
// ===================================================================
app.post('/login', function(request, response) {
  console.log('Someone trying to login');
  
  let emailTheyGaveMe = request.body.email;
  let passwordTheyGaveMe = request.body.password;
  
  // Look for matching user
  let foundUser = null;
  
  for (let i = 0; i < myUsers.length; i++) {
    if (myUsers[i].email === emailTheyGaveMe && myUsers[i].password === passwordTheyGaveMe) {
      foundUser = myUsers[i];
      break;
    }
  }
  
  if (foundUser === null) {
    return response.status(401).json({ error: 'Wrong email or password' });
  }
  
  // Make a token for them
  let loginToken = jwt.sign(
    { 
      userId: foundUser.id,
      isAdmin: foundUser.isAdmin 
    },
    mySecretKey,
    { expiresIn: '24h' }
  );
  
  console.log('Login successful!');
  
  response.json({
    message: 'Logged in!',
    token: loginToken,
    user: {
      id: foundUser.id,
      email: foundUser.email,
      name: foundUser.name,
      isAdmin: foundUser.isAdmin
    }
  });
});

// ===================================================================
// GET ALL PRODUCTS - shows stock info
// ===================================================================
app.get('/products', function(request, response) {
  console.log('Showing all products with stock info');
  
  // Build a list of products with stock status
  let productsToShow = [];
  
  for (let i = 0; i < myProducts.length; i++) {
    let product = myProducts[i];
    
    // Figure out the stock status
    let stockStatus = '';
    let isAvailable = true;
    
    if (product.stockQuantity === 0) {
      stockStatus = 'Out of Stock';
      isAvailable = false;
    } else if (product.stockQuantity <= product.lowStockThreshold) {
      stockStatus = 'Low Stock';
      isAvailable = true;
    } else {
      stockStatus = 'In Stock';
      isAvailable = true;
    }
    
    productsToShow.push({
      id: product.id,
      name: product.name,
      price: product.price,
      stockQuantity: product.stockQuantity,
      stockStatus: stockStatus,
      available: isAvailable
    });
  }
  
  response.json({
    products: productsToShow
  });
});

// ===================================================================
// CHECK IF ONE PRODUCT IS IN STOCK
// ===================================================================
app.get('/products/:productId/stock', function(request, response) {
  console.log('Checking stock for one product');
  
  let productId = parseInt(request.params.productId);
  
  // Find the product
  let foundProduct = null;
  
  for (let i = 0; i < myProducts.length; i++) {
    if (myProducts[i].id === productId) {
      foundProduct = myProducts[i];
      break;
    }
  }
  
  if (foundProduct === null) {
    return response.status(404).json({ error: 'Product not found' });
  }
  
  // Check stock status
  let inStock = foundProduct.stockQuantity > 0;
  let isLowStock = foundProduct.stockQuantity <= foundProduct.lowStockThreshold;
  
  response.json({
    productId: foundProduct.id,
    productName: foundProduct.name,
    quantityInStock: foundProduct.stockQuantity,
    inStock: inStock,
    lowStock: isLowStock,
    available: inStock
  });
});

// ===================================================================
// ADD TO CART - but check stock first!
// ===================================================================
app.post('/cart/add', checkIfLoggedIn, function(request, response) {
  console.log('Someone wants to add to cart');
  
  let currentUserId = request.userId;
  let productId = request.body.productId;
  let howManyTheyWant = request.body.quantity || 1;
  
  // Find the product
  let theProduct = null;
  
  for (let i = 0; i < myProducts.length; i++) {
    if (myProducts[i].id === productId) {
      theProduct = myProducts[i];
      break;
    }
  }
  
  if (theProduct === null) {
    return response.status(404).json({ error: 'Product not found' });
  }
  
  // CHECK IF ENOUGH IN STOCK - this is the important part!
  if (theProduct.stockQuantity === 0) {
    return response.status(400).json({ 
      error: 'Sorry, this product is out of stock',
      stockQuantity: 0
    });
  }
  
  if (howManyTheyWant > theProduct.stockQuantity) {
    return response.status(400).json({ 
      error: 'Sorry, we only have ' + theProduct.stockQuantity + ' in stock',
      availableQuantity: theProduct.stockQuantity
    });
  }
  
  // Stock is good! Add to cart
  if (!allCarts[currentUserId]) {
    allCarts[currentUserId] = [];
  }
  
  let usersCart = allCarts[currentUserId];
  
  // Check if already in cart
  let alreadyInCart = null;
  
  for (let i = 0; i < usersCart.length; i++) {
    if (usersCart[i].productId === productId) {
      alreadyInCart = usersCart[i];
      break;
    }
  }
  
  if (alreadyInCart !== null) {
    // Check if new total would exceed stock
    let newTotal = alreadyInCart.quantity + howManyTheyWant;
    
    if (newTotal > theProduct.stockQuantity) {
      return response.status(400).json({ 
        error: 'Cannot add that many. Only ' + theProduct.stockQuantity + ' in stock',
        currentInCart: alreadyInCart.quantity,
        availableToAdd: theProduct.stockQuantity - alreadyInCart.quantity
      });
    }
    
    alreadyInCart.quantity = newTotal;
    console.log('Updated cart quantity');
  } else {
    // Add new item to cart
    usersCart.push({
      productId: productId,
      quantity: howManyTheyWant,
      addedAt: new Date().toISOString()
    });
    console.log('Added to cart');
  }
  
  response.json({
    message: 'Added to cart!',
    cartItems: usersCart.length
  });
});

// ===================================================================
// CHECKOUT - reduces stock when someone buys
// ===================================================================
app.post('/checkout', checkIfLoggedIn, function(request, response) {
  console.log('Someone wants to checkout');
  
  let currentUserId = request.userId;
  
  // Get their cart
  let usersCart = allCarts[currentUserId];
  
  if (!usersCart || usersCart.length === 0) {
    return response.status(400).json({ error: 'Your cart is empty' });
  }
  
  // Check stock for everything in cart before processing
  for (let i = 0; i < usersCart.length; i++) {
    let cartItem = usersCart[i];
    
    // Find the product
    let product = null;
    for (let j = 0; j < myProducts.length; j++) {
      if (myProducts[j].id === cartItem.productId) {
        product = myProducts[j];
        break;
      }
    }
    
    if (product === null) {
      return response.status(400).json({ 
        error: 'Product ' + cartItem.productId + ' no longer exists' 
      });
    }
    
    // Check if enough stock
    if (cartItem.quantity > product.stockQuantity) {
      return response.status(400).json({ 
        error: product.name + ' does not have enough stock. Only ' + product.stockQuantity + ' available',
        productId: product.id
      });
    }
  }
  
  // Everything checks out! Now reduce the stock
  let orderSummary = [];
  
  for (let i = 0; i < usersCart.length; i++) {
    let cartItem = usersCart[i];
    
    // Find and update the product stock
    for (let j = 0; j < myProducts.length; j++) {
      if (myProducts[j].id === cartItem.productId) {
        // REDUCE THE STOCK!
        myProducts[j].stockQuantity = myProducts[j].stockQuantity - cartItem.quantity;
        
        console.log('Reduced stock for product', myProducts[j].id, 
                    'New stock:', myProducts[j].stockQuantity);
        
        orderSummary.push({
          productId: myProducts[j].id,
          productName: myProducts[j].name,
          quantityBought: cartItem.quantity,
          priceEach: myProducts[j].price,
          totalPrice: myProducts[j].price * cartItem.quantity,
          stockRemaining: myProducts[j].stockQuantity
        });
        
        break;
      }
    }
  }
  
  // Clear their cart
  allCarts[currentUserId] = [];
  
  console.log('Checkout complete!');
  
  response.json({
    message: 'Order placed successfully!',
    order: orderSummary
  });
});

// ===================================================================
// UPDATE STOCK - only admins can do this
// ===================================================================
app.put('/products/:productId/stock', checkIfLoggedIn, function(request, response) {
  console.log('Updating product stock');
  
  // Check if they're an admin
  if (!request.isAdmin) {
    return response.status(403).json({ error: 'Only admins can update stock' });
  }
  
  let productId = parseInt(request.params.productId);
  let newStockAmount = request.body.stockQuantity;
  
  // Find the product
  let foundProduct = null;
  
  for (let i = 0; i < myProducts.length; i++) {
    if (myProducts[i].id === productId) {
      foundProduct = myProducts[i];
      break;
    }
  }
  
  if (foundProduct === null) {
    return response.status(404).json({ error: 'Product not found' });
  }
  
  // Update the stock
  let oldStock = foundProduct.stockQuantity;
  foundProduct.stockQuantity = newStockAmount;
  
  console.log('Stock updated from', oldStock, 'to', newStockAmount);
  
  response.json({
    message: 'Stock updated!',
    productId: foundProduct.id,
    productName: foundProduct.name,
    oldStock: oldStock,
    newStock: newStockAmount
  });
});

// ===================================================================
// GET LOW STOCK PRODUCTS - for admin alerts
// ===================================================================
app.get('/products/low-stock', checkIfLoggedIn, function(request, response) {
  console.log('Checking for low stock products');
  
  // Only admins should see this
  if (!request.isAdmin) {
    return response.status(403).json({ error: 'Only admins can view this' });
  }
  
  let lowStockProducts = [];
  
  for (let i = 0; i < myProducts.length; i++) {
    let product = myProducts[i];
    
    if (product.stockQuantity <= product.lowStockThreshold) {
      lowStockProducts.push({
        id: product.id,
        name: product.name,
        currentStock: product.stockQuantity,
        threshold: product.lowStockThreshold,
        needToOrder: product.lowStockThreshold - product.stockQuantity + 20
      });
    }
  }
  
  response.json({
    lowStockCount: lowStockProducts.length,
    products: lowStockProducts
  });
});

// ===================================================================
// START THE SERVER
// ===================================================================
const PORT = 3000;

app.listen(PORT, function() {
  console.log('=========================================');
  console.log('Inventory server is running!');
  console.log('Go to: http://localhost:' + PORT);
  console.log('=========================================');
});

// Example from the code:
if (product.stockQuantity === 0) {
  return 'Out of Stock'
}

if (howManyTheyWant > product.stockQuantity) {
  return 'Sorry, only X in stock'
}

 if (alreadyThere !== null) {
    // Already in cart, just add more
    alreadyThere.quantity = alreadyThere.quantity + howMany;
    console.log('Added more to existing cart item');
  } else {
    // Not in cart yet, add it with the locked-in price
    theirCart.push({
      productId: whichProduct,
      productName: theProduct.name,
      quantity: howMany,
      priceWhenAdded: priceWhenAdded,  // SAVING THE PRICE!
      addedAt: new Date().toISOString()
    });
    console.log('Added new item to cart with price:', priceWhenAdded);
  }
  
  response.json({
    message: 'Added to cart!',
    productName: theProduct.name,
    priceLockedIn: priceWhenAdded,
    quantity: howMany
  });
});

// ===================================================================
// VIEW CART - Shows the prices they'll actually pay
// ===================================================================
app.get('/cart', makeSureLoggedIn, function(request, response) {
  console.log('Viewing cart with locked-in prices');
  
  let currentUserId = request.userId;
  
  // Get their cart
  let theirCart = everybodysCarts[currentUserId];
  
  if (!theirCart || theirCart.length === 0) {
    return response.json({
      cart: [],
      totalItems: 0,
      totalPrice: 0,
      message: 'Your cart is empty'
    });
  }
  
  // Build the cart to show them
  let cartToShow = [];
  let totalCost = 0;
  
  for (let i = 0; i < theirCart.length; i++) {
    let item = theirCart[i];
    
    // Find current price (to show if it changed)
    let currentPrice = null;
    
    for (let j = 0; j < allProducts.length; j++) {
      if (allProducts[j].id === item.productId) {
        currentPrice = allProducts[j].currentPrice;
        break;
      }
    }
    
    // Calculate cost using the price when they added it
    let costForThisItem = item.priceWhenAdded * item.quantity;
    totalCost = totalCost + costForThisItem;
    
    // Check if price changed
    let priceChanged = false;
    let priceDifference = 0;
    
    if (currentPrice !== null && currentPrice !== item.priceWhenAdded) {
      priceChanged = true;
      priceDifference = currentPrice - item.priceWhenAdded;
    }
    
    cartToShow.push({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      priceYouPay: item.priceWhenAdded,  // The price they locked in
      currentPrice: currentPrice,  // What it costs now
      priceChanged: priceChanged,
      savings: priceChanged && priceDifference > 0 ? priceDifference * item.quantity : 0,
      totalForItem: costForThisItem,
      addedAt: item.addedAt
    });
  }
  
  response.json({
    cart: cartToShow,
    totalItems: theirCart.length,
    totalPrice: totalCost.toFixed(2)
  });
});

// ===================================================================
// CHECKOUT - Use the locked-in prices
// ===================================================================
app.post('/checkout', makeSureLoggedIn, function(request, response) {
  console.log('Processing checkout with locked-in prices');
  
  let currentUserId = request.userId;
  
  // Get their cart
  let theirCart = everybodysCarts[currentUserId];
  
  if (!theirCart || theirCart.length === 0) {
    return response.status(400).json({ error: 'Cart is empty' });
  }
  
  // Check stock for everything
  for (let i = 0; i < theirCart.length; i++) {
    let item = theirCart[i];
    
    // Find product
    let product = null;
    
    for (let j = 0; j < allProducts.length; j++) {
      if (allProducts[j].id === item.productId) {
        product = allProducts[j];
        break;
      }
    }
    
    if (product === null) {
      return response.status(400).json({ 
        error: item.productName + ' no longer exists' 
      });
    }
    
    if (item.quantity > product.stockQuantity) {
      return response.status(400).json({ 
        error: 'Not enough stock for ' + item.productName 
      });
    }
  }
  
  // Process the order with locked-in prices
  let orderItems = [];
  let totalPaid = 0;
  
  for (let i = 0; i < theirCart.length; i++) {
    let item = theirCart[i];
    
    // Reduce stock
    for (let j = 0; j < allProducts.length; j++) {
      if (allProducts[j].id === item.productId) {
        allProducts[j].stockQuantity = allProducts[j].stockQuantity - item.quantity;
        
        let itemTotal = item.priceWhenAdded * item.quantity;
        totalPaid = totalPaid + itemTotal;
        
        orderItems.push({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          pricePerItem: item.priceWhenAdded,  // They pay the old price!
          totalForItem: itemTotal,
          currentPrice: allProducts[j].currentPrice
        });
        
        console.log('Sold', item.quantity, 'of', item.productName, 
                    'at locked price:', item.priceWhenAdded);
        break;
      }
    }
  }
  
  // Clear their cart
  everybodysCarts[currentUserId] = [];
  
  response.json({
    message: 'Order completed!',
    orderNumber: Date.now(),
    items: orderItems,
    totalPaid: totalPaid.toFixed(2),
    note: 'You paid the prices from when you added items to cart'
  });
});

// ===================================================================
// CHANGE PRODUCT PRICE (simulate price changing)
// ===================================================================
app.put('/products/:productId/price', function(request, response) {
  console.log('Changing product price');
  
  let productId = parseInt(request.params.productId);
  let newPrice = request.body.newPrice;
  
  // Find the product
  let theProduct = null;
  
  for (let i = 0; i < allProducts.length; i++) {
    if (allProducts[i].id === productId) {
      theProduct = allProducts[i];
      break;
    }
  }
  
  if (theProduct === null) {
    return response.status(404).json({ error: 'Product not found' });
  }
  
  // Save the old price
  let oldPrice = theProduct.currentPrice;
  
  // Update to new price
  theProduct.currentPrice = newPrice;
  
  // Record this change
  priceChangeHistory.push({
    productId: productId,
    productName: theProduct.name,
    oldPrice: oldPrice,
    newPrice: newPrice,
    changedAt: new Date().toISOString()
  });
  
  console.log('Price changed from', oldPrice, 'to', newPrice);
  
  response.json({
    message: 'Price updated!',
    productName: theProduct.name,
    oldPrice: oldPrice,
    newPrice: newPrice,
    note: 'Customers with this in cart will still pay the old price!'
  });
});

// ===================================================================
// SEE PRICE HISTORY
// ===================================================================
app.get('/price-history', function(request, response) {
  console.log('Showing price change history');
  
  response.json({
    priceChanges: priceChangeHistory,
    totalChanges: priceChangeHistory.length
  });
});

// ===================================================================
// START SERVER
// ===================================================================
const PORT = 3000;

app.listen(PORT, function() {
  console.log('==========================================');
  console.log('Price Protection Server is running!');
  console.log('Go to: http://localhost:' + PORT);
  console.log('==========================================');
  console.log('');
  console.log('How it works:');
  console.log('- When customers add items to cart, the current price is saved');
  console.log('- Even if you change the price later, they pay the old price');
  console.log('- This protects customers from surprise price increases');
  console.log('==========================================');
});

subtotal calculate
let myUsers = [
  {
    id: 1,
    email: 'customer@shop.com',
    password: 'pass123',
    name: 'John Doe'
  }
];

// All my products for sale
let myProducts = [
  { id: 1, name: 'Blue-Tongued Skink', price: 349.99, image: 'Blue-Tongued Skink.jpg', weight: 2.0 },
  { id: 2, name: 'Panther Chameleon', price: 499.99, image: 'Panther Chameleon.jpg', weight: 1.5 },
  { id: 3, name: 'Green Tree Python', price: 599.99, image: 'Green Tree Python.jpg', weight: 3.0 },
  { id: 4, name: 'Fennec Fox', price: 129.99, image: 'Fennec Fox.jpg', weight: 8.0 },
  { id: 5, name: 'African Spurred Tortoise', price: 249.99, image: 'African Spurred Tortoise.jpg', weight: 15.0 },
  { id: 6, name: 'Scarlet Macaw', price: 189.99, image: 'Scarlet Macaw.jpg', weight: 2.5 },
  { id: 7, name: 'Ring-Tailed Cat', price: 799.99, image: 'Ring-Tailed Cat.jpg', weight: 5.0 },
  { id: 8, name: 'Tanuki (Japanese Raccoon Dog)', price: 129.99, image: 'Tanuki.jpg', weight: 10.0 },
  { id: 9, name: 'Sugar Glider', price: 299.99, image: 'Sugar Glider.jpg', weight: 0.3 },
  { id: 10, name: 'Monkey', price: 150.00, image: 'Monkey.jpg', weight: 12.0 },
  { id: 11, name: 'Sphynx Cat', price: 999.99, image: 'Sphynx Cat.jpg', weight: 7.0 },
  { id: 12, name: 'Kinkajou (Honey Bear)', price: 1799.99, image: 'Kinkajou.jpg', weight: 6.0 }
];

// Everyone's shopping carts
let allShoppingCarts = {};

// ===================================================================
// Make sure someone is logged in
// ===================================================================
function checkLogin(request, response, next) {
  let authHeader = request.headers['authorization'];
  
  if (!authHeader) {
    return response.status(401).json({ error: 'Please login' });
  }
  
  let token = authHeader.split(' ')[1];
  
  try {
    let decoded = jwt.verify(token, mySecretKey);
    request.userId = decoded.userId;
    next();
  } catch (error) {
    return response.status(401).json({ error: 'Bad token' });
  }
}

// ===================================================================
// LOGIN
// ===================================================================
app.post('/login', function(request, response) {
  console.log('Someone trying to login');
  
  let email = request.body.email;
  let password = request.body.password;
  
  // Find user
  let user = null;
  
  for (let i = 0; i < myUsers.length; i++) {
    if (myUsers[i].email === email && myUsers[i].password === password) {
      user = myUsers[i];
      break;
    }
  }
  
  if (user === null) {
    return response.status(401).json({ error: 'Wrong login info' });
  }
  
  // Make token
  let token = jwt.sign(
    { userId: user.id },
    mySecretKey,
    { expiresIn: '24h' }
  );
  
  response.json({
    message: 'Logged in!',
    token: token
  });
});

// ===================================================================
// ADD TO CART
// ===================================================================
app.post('/cart/add', checkLogin, function(request, response) {
  console.log('Adding item to cart');
  
  let userId = request.userId;
  let productId = request.body.productId;
  let quantity = request.body.quantity || 1;
  
  // Find the product
  let product = null;
  
  for (let i = 0; i < myProducts.length; i++) {
    if (myProducts[i].id === productId) {
      product = myProducts[i];
      break;
    }
  }
  
  if (product === null) {
    return response.status(404).json({ error: 'Product not found' });
  }
  
  // Make cart if needed
  if (!allShoppingCarts[userId]) {
    allShoppingCarts[userId] = [];
  }
  
  let cart = allShoppingCarts[userId];
  
  // Check if already in cart
  let foundInCart = null;
  
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].productId === productId) {
      foundInCart = cart[i];
      break;
    }
  }
  
  if (foundInCart !== null) {
    // Already there, add more
    foundInCart.quantity = foundInCart.quantity + quantity;
  } else {
    // New item, add it
    cart.push({
      productId: productId,
      productName: product.name,
      price: product.price,
      quantity: quantity
    });
  }
  
  response.json({
    message: 'Added to cart!'
  });
});

// ===================================================================
// VIEW CART WITH SUBTOTAL
// ===================================================================
app.get('/cart', checkLogin, function(request, response) {
  console.log('Getting cart with subtotal calculation');
  
  let userId = request.userId;
  
  // Get their cart
  let cart = allShoppingCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.json({
      cart: [],
      subtotal: 0,
      message: 'Cart is empty'
    });
  }
  
  // THIS IS THE IMPORTANT PART - CALCULATE SUBTOTAL
  // I'll go through each item and add up all the costs
  
  let subtotal = 0;
  let itemsWithCosts = [];
  
  // Go through each item in cart
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    
    // Calculate cost for this item
    // Cost = price × quantity
    let costForThisItem = item.price * item.quantity;
    
    // Add this cost to the subtotal
    subtotal = subtotal + costForThisItem;
    
    console.log('Item:', item.productName);
    console.log('  Price:', item.price);
    console.log('  Quantity:', item.quantity);
    console.log('  Cost for this item:', costForThisItem);
    console.log('  Running subtotal:', subtotal);
    
    // Save item info with its cost
    itemsWithCosts.push({
      productId: item.productId,
      productName: item.productName,
      priceEach: item.price,
      quantity: item.quantity,
      costForThisItem: costForThisItem
    });
  }
  
  console.log('Final subtotal:', subtotal);
  
  // Send back the cart with subtotal
  response.json({
    cart: itemsWithCosts,
    subtotal: subtotal.toFixed(2),  // Round to 2 decimal places
    numberOfItems: cart.length
  });
});

added taxes

// Products
let myProducts = [
  { id: 1, name: 'Blue-Tongued Skink', price: 349.99, image: 'Blue-Tongued Skink.jpg', weight: 2.0 },
  { id: 2, name: 'Panther Chameleon', price: 499.99, image: 'Panther Chameleon.jpg', weight: 1.5 },
  { id: 3, name: 'Green Tree Python', price: 599.99, image: 'Green Tree Python.jpg', weight: 3.0 },
  { id: 4, name: 'Fennec Fox', price: 129.99, image: 'Fennec Fox.jpg', weight: 8.0 },
  { id: 5, name: 'African Spurred Tortoise', price: 249.99, image: 'African Spurred Tortoise.jpg', weight: 15.0 },
  { id: 6, name: 'Scarlet Macaw', price: 189.99, image: 'Scarlet Macaw.jpg', weight: 2.5 },
  { id: 7, name: 'Ring-Tailed Cat', price: 799.99, image: 'Ring-Tailed Cat.jpg', weight: 5.0 },
  { id: 8, name: 'Tanuki (Japanese Raccoon Dog)', price: 129.99, image: 'Tanuki.jpg', weight: 10.0 },
  { id: 9, name: 'Sugar Glider', price: 299.99, image: 'Sugar Glider.jpg', weight: 0.3 },
  { id: 10, name: 'Monkey', price: 150.00, image: 'Monkey.jpg', weight: 12.0 },
  { id: 11, name: 'Sphynx Cat', price: 999.99, image: 'Sphynx Cat.jpg', weight: 7.0 },
  { id: 12, name: 'Kinkajou (Honey Bear)', price: 1799.99, image: 'Kinkajou.jpg', weight: 6.0 }
];

// Tax rates by state
let taxRatesByState = {
  'CA': 0.0725,   // California 7.25%
  'NY': 0.08,     // New York 8%
  'TX': 0.0625,   // Texas 6.25%
  'FL': 0.06,     // Florida 6%
  'WA': 0.065     // Washington 6.5%
};

// Shopping carts
let allCarts = {};

// ===================================================================
// Check if logged in
// ===================================================================
function checkIfLoggedIn(request, response, next) {
  let authHeader = request.headers['authorization'];
  
  if (!authHeader) {
    return response.status(401).json({ error: 'Please login' });
  }
  
  let token = authHeader.split(' ')[1];
  
  try {
    let decoded = jwt.verify(token, mySecretKey);
    request.userId = decoded.userId;
    next();
  } catch (error) {
    return response.status(401).json({ error: 'Bad token' });
  }
}

// ===================================================================
// LOGIN
// ===================================================================
app.post('/login', function(request, response) {
  console.log('Someone logging in');
  
  let email = request.body.email;
  let password = request.body.password;
  
  // Find user
  let user = null;
  
  for (let i = 0; i < myUsers.length; i++) {
    if (myUsers[i].email === email && myUsers[i].password === password) {
      user = myUsers[i];
      break;
    }
  }
  
  if (user === null) {
    return response.status(401).json({ error: 'Wrong email or password' });
  }
  
  // Make token
  let token = jwt.sign(
    { userId: user.id },
    mySecretKey,
    { expiresIn: '24h' }
  );
  
  response.json({
    message: 'Logged in!',
    token: token,
    user: {
      id: user.id,
      name: user.name,
      state: user.state
    }
  });
});

// ===================================================================
// ADD TO CART
// ===================================================================
app.post('/cart/add', checkIfLoggedIn, function(request, response) {
  console.log('Adding to cart');
  
  let userId = request.userId;
  let productId = request.body.productId;
  let quantity = request.body.quantity || 1;
  
  // Find product
  let product = null;
  
  for (let i = 0; i < myProducts.length; i++) {
    if (myProducts[i].id === productId) {
      product = myProducts[i];
      break;
    }
  }
  
  if (product === null) {
    return response.status(404).json({ error: 'Product not found' });
  }
  
  // Make cart if needed
  if (!allCarts[userId]) {
    allCarts[userId] = [];
  }
  
  let cart = allCarts[userId];
  
  // Check if already in cart
  let found = null;
  
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].productId === productId) {
      found = cart[i];
      break;
    }
  }
  
  if (found !== null) {
    found.quantity = found.quantity + quantity;
  } else {
    cart.push({
      productId: productId,
      productName: product.name,
      price: product.price,
      quantity: quantity,
      taxable: product.taxable
    });
  }
  
  response.json({
    message: 'Added to cart!'
  });
});

// ===================================================================
// VIEW CART WITH TAX CALCULATION
// ===================================================================
app.get('/cart', checkIfLoggedIn, function(request, response) {
  console.log('Getting cart with tax calculation');
  
  let userId = request.userId;
  
  // Get user to know their state (for tax rate)
  let user = null;
  
  for (let i = 0; i < myUsers.length; i++) {
    if (myUsers[i].id === userId) {
      user = myUsers[i];
      break;
    }
  }
  
  // Get cart
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.json({
      cart: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      message: 'Cart is empty'
    });
  }
  
  // STEP 1: Calculate subtotal (sum of all items)
  console.log('=== CALCULATING SUBTOTAL ===');
  
  let subtotal = 0;
  let taxableAmount = 0;  // Only some items have tax
  let cartItems = [];
  
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    
    // Calculate cost for this item
    let itemCost = item.price * item.quantity;
    
    // Add to subtotal
    subtotal = subtotal + itemCost;
    
    // If this item is taxable, add to taxable amount
    if (item.taxable === true) {
      taxableAmount = taxableAmount + itemCost;
      console.log(item.productName, '- TAXABLE:', itemCost);
    } else {
      console.log(item.productName, '- NOT TAXABLE:', itemCost);
    }
    
    cartItems.push({
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
      itemTotal: itemCost,
      taxable: item.taxable
    });
  }
  
  console.log('Subtotal:', subtotal);
  console.log('Taxable amount:', taxableAmount);
  
  // STEP 2: Calculate tax
  console.log('=== CALCULATING TAX ===');
  
  // Get tax rate for user's state
  let taxRate = taxRatesByState[user.state] || 0;
  
  console.log('User state:', user.state);
  console.log('Tax rate:', taxRate * 100 + '%');
  
  // Calculate tax amount
  // Tax = taxable amount × tax rate
  let taxAmount = taxableAmount * taxRate;
  
  console.log('Tax calculation:', taxableAmount, '×', taxRate, '=', taxAmount);
  
  // STEP 3: Calculate total
  console.log('=== CALCULATING TOTAL ===');
  
  // Total = subtotal + tax
  let totalAmount = subtotal + taxAmount;
  
  console.log('Total calculation:', subtotal, '+', taxAmount, '=', totalAmount);
  
  // Send back everything
  response.json({
    cart: cartItems,
    subtotal: subtotal.toFixed(2),
    taxableAmount: taxableAmount.toFixed(2),
    taxRate: (taxRate * 100).toFixed(2) + '%',
    tax: taxAmount.toFixed(2),
    total: totalAmount.toFixed(2),
    userState: user.state
  });
});

// ===================================================================
// GET ORDER SUMMARY - Detailed breakdown with tax
// ===================================================================
app.get('/cart/summary', checkIfLoggedIn, function(request, response) {
  console.log('Getting detailed order summary with tax');
  
  let userId = request.userId;
  
  // Get user
  let user = null;
  
  for (let i = 0; i < myUsers.length; i++) {
    if (myUsers[i].id === userId) {
      user = myUsers[i];
      break;
    }
  }
  
  // Get cart
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.json({
      message: 'Cart is empty'
    });
  }
  
  // Calculate everything step by step
  let breakdown = [];
  let subtotal = 0;
  let taxableTotal = 0;
  let nonTaxableTotal = 0;
  
  console.log('=== ORDER BREAKDOWN ===');
  
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    let itemCost = item.price * item.quantity;
    
    subtotal = subtotal + itemCost;
    
    if (item.taxable === true) {
      taxableTotal = taxableTotal + itemCost;
    } else {
      nonTaxableTotal = nonTaxableTotal + itemCost;
    }
    
    breakdown.push({
      item: item.productName,
      price: '$' + item.price.toFixed(2),
      quantity: item.quantity,
      itemTotal: '$' + itemCost.toFixed(2),
      taxable: item.taxable ? 'Yes' : 'No'
    });
  }
  
  // Get tax rate
  let taxRate = taxRatesByState[user.state] || 0;
  
  // Calculate tax on taxable items only
  let taxAmount = taxableTotal * taxRate;
  
  // Calculate final total
  let finalTotal = subtotal + taxAmount;
  
  console.log('Subtotal:', subtotal);
  console.log('Taxable items:', taxableTotal);
  console.log('Non-taxable items:', nonTaxableTotal);
  console.log('Tax rate:', taxRate);
  console.log('Tax amount:', taxAmount);
  console.log('Final total:', finalTotal);
  
  response.json({
    orderBreakdown: breakdown,
    calculation: {
      step1_subtotal: '$' + subtotal.toFixed(2),
      step2_taxableAmount: '$' + taxableTotal.toFixed(2),
      step3_taxRate: (taxRate * 100).toFixed(2) + '%',
      step4_taxAmount: '$' + taxAmount.toFixed(2),
      step5_finalTotal: '$' + finalTotal.toFixed(2)
    },
    explanation: 'Total = Subtotal + (Taxable Amount × Tax Rate)',
    userState: user.state
  });
});

// ===================================================================
// CHECKOUT WITH TAX
// ===================================================================
app.post('/checkout', checkIfLoggedIn, function(request, response) {
  console.log('Processing checkout with tax');
  
  let userId = request.userId;
  
  // Get user
  let user = null;
  
  for (let i = 0; i < myUsers.length; i++) {
    if (myUsers[i].id === userId) {
      user = myUsers[i];
      break;
    }
  }
  
  // Get cart
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.status(400).json({ error: 'Cart is empty' });
  }
  
  // Calculate subtotal and taxable amount
  let subtotal = 0;
  let taxableAmount = 0;
  let orderItems = [];
  
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    let itemCost = item.price * item.quantity;
    
    subtotal = subtotal + itemCost;
    
    if (item.taxable === true) {
      taxableAmount = taxableAmount + itemCost;
    }
    
    orderItems.push({
      productName: item.productName,
      quantity: item.quantity,
      priceEach: item.price,
      itemTotal: itemCost,
      taxable: item.taxable
    });
  }
  
  // Calculate tax
  let taxRate = taxRatesByState[user.state] || 0;
  let taxAmount = taxableAmount * taxRate;
  
  // Calculate total
  let totalAmount = subtotal + taxAmount;
  
  // Clear cart
  allCarts[userId] = [];
  
  console.log('Order completed!');
  console.log('Subtotal:', subtotal);
  console.log('Tax:', taxAmount);
  console.log('Total charged:', totalAmount);
  
  response.json({
    message: 'Order placed successfully!',
    orderNumber: 'ORD-' + Date.now(),
    items: orderItems,
    subtotal: subtotal.toFixed(2),
    taxRate: (taxRate * 100).toFixed(2) + '%',
    tax: taxAmount.toFixed(2),
    total: totalAmount.toFixed(2),
    shippingState: user.state
  });
});

// ===================================================================
// GET TAX RATES - See all available tax rates
// ===================================================================
app.get('/tax-rates', function(request, response) {
  console.log('Showing tax rates');
  
  let rates = [];
  
  for (let state in taxRatesByState) {
    rates.push({
      state: state,
      taxRate: (taxRatesByState[state] * 100).toFixed(2) + '%',
      decimalRate: taxRatesByState[state]
    });
  }
  
  response.json({
    taxRates: rates
  });
});

// ===================================================================
// START SERVER
// ===================================================================
const PORT = 3000;


shipping added to total

// Users
let myUsers = [
  {
    id: 1,
    email: 'customer@example.com',
    password: 'password123',
    name: 'Sarah Johnson',
    state: 'CA',
    zipCode: '90210'
  }
];

// Products
let myProducts = [
   { id: 1, name: 'Blue-Tongued Skink', price: 349.99, image: 'Blue-Tongued Skink.jpg', weight: 2.0 },
  { id: 2, name: 'Panther Chameleon', price: 499.99, image: 'Panther Chameleon.jpg', weight: 1.5 },
  { id: 3, name: 'Green Tree Python', price: 599.99, image: 'Green Tree Python.jpg', weight: 3.0 },
  { id: 4, name: 'Fennec Fox', price: 129.99, image: 'Fennec Fox.jpg', weight: 8.0 },
  { id: 5, name: 'African Spurred Tortoise', price: 249.99, image: 'African Spurred Tortoise.jpg', weight: 15.0 },
  { id: 6, name: 'Scarlet Macaw', price: 189.99, image: 'Scarlet Macaw.jpg', weight: 2.5 },
  { id: 7, name: 'Ring-Tailed Cat', price: 799.99, image: 'Ring-Tailed Cat.jpg', weight: 5.0 },
  { id: 8, name: 'Tanuki (Japanese Raccoon Dog)', price: 129.99, image: 'Tanuki.jpg', weight: 10.0 },
  { id: 9, name: 'Sugar Glider', price: 299.99, image: 'Sugar Glider.jpg', weight: 0.3 },
  { id: 10, name: 'Monkey', price: 150.00, image: 'Monkey.jpg', weight: 12.0 },
  { id: 11, name: 'Sphynx Cat', price: 999.99, image: 'Sphynx Cat.jpg', weight: 7.0 },
  { id: 12, name: 'Kinkajou (Honey Bear)', price: 1799.99, image: 'Kinkajou.jpg', weight: 6.0 }
];

// Shipping methods with prices
let shippingMethods = {
  'standard': {
    name: 'Standard Shipping',
    baseCost: 5.99,
    costPerPound: 1.50,
    daysToDeliver: '5-7 business days'
  },
  'express': {
    name: 'Express Shipping',
    baseCost: 12.99,
    costPerPound: 2.50,
    daysToDeliver: '2-3 business days'
  },
  'overnight': {
    name: 'Overnight Shipping',
    baseCost: 24.99,
    costPerPound: 4.00,
    daysToDeliver: '1 business day'
  }
};

// Free shipping threshold
const FREE_SHIPPING_THRESHOLD = 100.00;

// Tax rate
const TAX_RATE = 0.0725;  // 7.25%

// Shopping carts
let allCarts = {};

// Selected shipping methods for each user
let selectedShippingMethods = {};

// ===================================================================
// Check if logged in
// ===================================================================
function checkIfLoggedIn(request, response, next) {
  let authHeader = request.headers['authorization'];
  
  if (!authHeader) {
    return response.status(401).json({ error: 'Please login' });
  }
  
  let token = authHeader.split(' ')[1];
  
  try {
    let decoded = jwt.verify(token, mySecretKey);
    request.userId = decoded.userId;
    next();
  } catch (error) {
    return response.status(401).json({ error: 'Bad token' });
  }
}

// ===================================================================
// LOGIN
// ===================================================================
app.post('/login', function(request, response) {
  console.log('Someone logging in');
  
  let email = request.body.email;
  let password = request.body.password;
  
  // Find user
  let user = null;
  
  for (let i = 0; i < myUsers.length; i++) {
    if (myUsers[i].email === email && myUsers[i].password === password) {
      user = myUsers[i];
      break;
    }
  }
  
  if (user === null) {
    return response.status(401).json({ error: 'Wrong email or password' });
  }
  
  // Make token
  let token = jwt.sign(
    { userId: user.id },
    mySecretKey,
    { expiresIn: '24h' }
  );
  
  response.json({
    message: 'Logged in!',
    token: token
  });
});

// ===================================================================
// ADD TO CART
// ===================================================================
app.post('/cart/add', checkIfLoggedIn, function(request, response) {
  console.log('Adding to cart');
  
  let userId = request.userId;
  let productId = request.body.productId;
  let quantity = request.body.quantity || 1;
  
  // Find product
  let product = null;
  
  for (let i = 0; i < myProducts.length; i++) {
    if (myProducts[i].id === productId) {
      product = myProducts[i];
      break;
    }
  }
  
  if (product === null) {
    return response.status(404).json({ error: 'Product not found' });
  }
  
  // Make cart if needed
  if (!allCarts[userId]) {
    allCarts[userId] = [];
  }
  
  let cart = allCarts[userId];
  
  // Check if already in cart
  let found = null;
  
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].productId === productId) {
      found = cart[i];
      break;
    }
  }
  
  if (found !== null) {
    found.quantity = found.quantity + quantity;
  } else {
    cart.push({
      productId: productId,
      productName: product.name,
      price: product.price,
      weight: product.weight,
      quantity: quantity
    });
  }
  
  response.json({
    message: 'Added to cart!'
  });
});

// ===================================================================
// GET AVAILABLE SHIPPING METHODS
// ===================================================================
app.get('/shipping/methods', checkIfLoggedIn, function(request, response) {
  console.log('Getting shipping methods');
  
  let userId = request.userId;
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.json({
      message: 'Cart is empty',
      shippingMethods: []
    });
  }
  
  // Calculate total weight of cart
  let totalWeight = 0;
  
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    let itemWeight = item.weight * item.quantity;
    totalWeight = totalWeight + itemWeight;
  }
  
  console.log('Total cart weight:', totalWeight, 'pounds');
  
  // Calculate shipping cost for each method
  let availableMethods = [];
  
  for (let methodKey in shippingMethods) {
    let method = shippingMethods[methodKey];
    
    // Calculate shipping cost
    // Cost = base cost + (weight × cost per pound)
    let shippingCost = method.baseCost + (totalWeight * method.costPerPound);
    
    console.log(method.name + ' cost:', shippingCost);
    
    availableMethods.push({
      id: methodKey,
      name: method.name,
      cost: shippingCost.toFixed(2),
      deliveryTime: method.daysToDeliver
    });
  }
  
  response.json({
    totalWeight: totalWeight.toFixed(2) + ' lbs',
    shippingMethods: availableMethods
  });
});

// ===================================================================
// SELECT SHIPPING METHOD
// ===================================================================
app.post('/shipping/select', checkIfLoggedIn, function(request, response) {
  console.log('Selecting shipping method');
  
  let userId = request.userId;
  let selectedMethod = request.body.shippingMethod;
  
  // Check if method exists
  if (!shippingMethods[selectedMethod]) {
    return response.status(400).json({ 
      error: 'Invalid shipping method. Choose: standard, express, or overnight' 
    });
  }
  
  // Save their choice
  selectedShippingMethods[userId] = selectedMethod;
  
  console.log('User selected:', selectedMethod);
  
  response.json({
    message: 'Shipping method selected!',
    selected: shippingMethods[selectedMethod].name
  });
});

// ===================================================================
// VIEW CART WITH SHIPPING COST
// ===================================================================
app.get('/cart', checkIfLoggedIn, function(request, response) {
  console.log('Getting cart with shipping');
  
  let userId = request.userId;
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.json({
      cart: [],
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      message: 'Cart is empty'
    });
  }
  
  // STEP 1: Calculate subtotal
  console.log('=== STEP 1: CALCULATE SUBTOTAL ===');
  
  let subtotal = 0;
  let totalWeight = 0;
  
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    let itemCost = item.price * item.quantity;
    let itemWeight = item.weight * item.quantity;
    
    subtotal = subtotal + itemCost;
    totalWeight = totalWeight + itemWeight;
    
    console.log(item.productName + ':', itemCost);
  }
  
  console.log('Subtotal:', subtotal);
  console.log('Total weight:', totalWeight);
  
  // STEP 2: Calculate shipping
  console.log('=== STEP 2: CALCULATE SHIPPING ===');
  
  let shippingCost = 0;
  let selectedMethod = selectedShippingMethods[userId] || 'standard';
  let shippingMethodInfo = shippingMethods[selectedMethod];
  
  // Check if they qualify for free shipping
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    shippingCost = 0;
    console.log('FREE SHIPPING! (order over $' + FREE_SHIPPING_THRESHOLD + ')');
  } else {
    // Calculate shipping: base cost + (weight × cost per pound)
    shippingCost = shippingMethodInfo.baseCost + (totalWeight * shippingMethodInfo.costPerPound);
    console.log('Shipping calculation:', shippingMethodInfo.baseCost, '+ (', totalWeight, '×', shippingMethodInfo.costPerPound, ') =', shippingCost);
  }
  
  // STEP 3: Calculate tax (on subtotal, not shipping)
  console.log('=== STEP 3: CALCULATE TAX ===');
  
  let taxAmount = subtotal * TAX_RATE;
  
  console.log('Tax calculation:', subtotal, '×', TAX_RATE, '=', taxAmount);
  
  // STEP 4: Calculate total
  console.log('=== STEP 4: CALCULATE TOTAL ===');
  
  // Total = subtotal + shipping + tax
  let totalAmount = subtotal + shippingCost + taxAmount;
  
  console.log('Total calculation:', subtotal, '+', shippingCost, '+', taxAmount, '=', totalAmount);
  
  response.json({
    cart: cart,
    subtotal: subtotal.toFixed(2),
    shippingMethod: shippingMethodInfo.name,
    shippingCost: shippingCost.toFixed(2),
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD.toFixed(2),
    qualifiesForFreeShipping: subtotal >= FREE_SHIPPING_THRESHOLD,
    tax: taxAmount.toFixed(2),
    total: totalAmount.toFixed(2)
  });
});

// ===================================================================
// GET ORDER SUMMARY - Detailed breakdown
// ===================================================================
app.get('/order/summary', checkIfLoggedIn, function(request, response) {
  console.log('Getting order summary with all costs');
  
  let userId = request.userId;
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.json({
      message: 'Cart is empty'
    });
  }
  
  // Calculate subtotal
  let subtotal = 0;
  let totalWeight = 0;
  let itemBreakdown = [];
  
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    let itemCost = item.price * item.quantity;
    let itemWeight = item.weight * item.quantity;
    
    subtotal = subtotal + itemCost;
    totalWeight = totalWeight + itemWeight;
    
    itemBreakdown.push({
      name: item.productName,
      price: '$' + item.price.toFixed(2),
      quantity: item.quantity,
      weight: item.weight + ' lbs each',
      totalWeight: itemWeight.toFixed(2) + ' lbs',
      itemTotal: '$' + itemCost.toFixed(2)
    });
  }
  
  // Calculate shipping
  let selectedMethod = selectedShippingMethods[userId] || 'standard';
  let shippingMethodInfo = shippingMethods[selectedMethod];
  let shippingCost = 0;
  
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    shippingCost = 0;
  } else {
    shippingCost = shippingMethodInfo.baseCost + (totalWeight * shippingMethodInfo.costPerPound);
  }
  
  // Calculate tax
  let taxAmount = subtotal * TAX_RATE;
  
  // Calculate total
  let totalAmount = subtotal + shippingCost + taxAmount;
  
  response.json({
    items: itemBreakdown,
    calculation: {
      step1_subtotal: '$' + subtotal.toFixed(2),
      step2_shipping: '$' + shippingCost.toFixed(2),
      step2_shippingMethod: shippingMethodInfo.name,
      step2_totalWeight: totalWeight.toFixed(2) + ' lbs',
      step3_tax: '$' + taxAmount.toFixed(2),
      step4_grandTotal: '$' + totalAmount.toFixed(2)
    },
    explanation: 'Total = Subtotal + Shipping + Tax',
    freeShippingNote: subtotal >= FREE_SHIPPING_THRESHOLD ? 'Free shipping applied!' : 'Spend $' + (FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2) + ' more for free shipping'
  });
});

// ===================================================================
// CHECKOUT WITH SHIPPING
// ===================================================================
app.post('/checkout', checkIfLoggedIn, function(request, response) {
  console.log('Processing checkout with shipping');
  
  let userId = request.userId;
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.status(400).json({ error: 'Cart is empty' });
  }
  
  // Calculate subtotal and weight
  let subtotal = 0;
  let totalWeight = 0;
  
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    let itemCost = item.price * item.quantity;
    let itemWeight = item.weight * item.quantity;
    
    subtotal = subtotal + itemCost;
    totalWeight = totalWeight + itemWeight;
  }
  
  // Calculate shipping
  let selectedMethod = selectedShippingMethods[userId] || 'standard';
  let shippingMethodInfo = shippingMethods[selectedMethod];
  let shippingCost = 0;
  
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    shippingCost = 0;
  } else {
    shippingCost = shippingMethodInfo.baseCost + (totalWeight * shippingMethodInfo.costPerPound);
  }
  
  // Calculate tax
  let taxAmount = subtotal * TAX_RATE;
  
  // Calculate total
  let totalAmount = subtotal + shippingCost + taxAmount;
  
  // Clear cart
  allCarts[userId] = [];
  selectedShippingMethods[userId] = null;
  
  console.log('Order complete!');
  console.log('Subtotal:', subtotal);
  console.log('Shipping:', shippingCost);
  console.log('Tax:', taxAmount);
  console.log('Total charged:', totalAmount);
  
  response.json({
    message: 'Order placed successfully!',
    orderNumber: 'ORD-' + Date.now(),
    itemCount: cart.length,
    subtotal: subtotal.toFixed(2),
    shippingMethod: shippingMethodInfo.name,
    shippingCost: shippingCost.toFixed(2),
    tax: taxAmount.toFixed(2),
    totalCharged: totalAmount.toFixed(2),
    estimatedDelivery: shippingMethodInfo.daysToDeliver
  });
});

// ===================================================================
// START SERVER
// ===================================================================
const PORT = 3000;


return a final total

// final-total-server.js - Calculating the final total for an order

// I need express to run my server
const express = require('express');
const jwt = require('jsonwebtoken');

// Start my server
const app = express();

// This lets me read JSON data
app.use(express.json());

// My secret key for tokens
const mySecretKey = 'my-secret-key-12345';

// ===================================================================
// My fake database
// ===================================================================

// Users
let myUsers = [
  {
    id: 1,
    email: 'customer@store.com',
    password: 'password123',
    name: 'Michael Smith',
    state: 'CA'
  }
];

// Products
let myProducts = [
  { id: 1, name: 'Blue-Tongued Skink', price: 349.99, image: 'Blue-Tongued Skink.jpg', weight: 2.0 },
  { id: 2, name: 'Panther Chameleon', price: 499.99, image: 'Panther Chameleon.jpg', weight: 1.5 },
  { id: 3, name: 'Green Tree Python', price: 599.99, image: 'Green Tree Python.jpg', weight: 3.0 },
  { id: 4, name: 'Fennec Fox', price: 129.99, image: 'Fennec Fox.jpg', weight: 8.0 },
  { id: 5, name: 'African Spurred Tortoise', price: 249.99, image: 'African Spurred Tortoise.jpg', weight: 15.0 },
  { id: 6, name: 'Scarlet Macaw', price: 189.99, image: 'Scarlet Macaw.jpg', weight: 2.5 },
  { id: 7, name: 'Ring-Tailed Cat', price: 799.99, image: 'Ring-Tailed Cat.jpg', weight: 5.0 },
  { id: 8, name: 'Tanuki (Japanese Raccoon Dog)', price: 129.99, image: 'Tanuki.jpg', weight: 10.0 },
  { id: 9, name: 'Sugar Glider', price: 299.99, image: 'Sugar Glider.jpg', weight: 0.3 },
  { id: 10, name: 'Monkey', price: 150.00, image: 'Monkey.jpg', weight: 12.0 },
  { id: 11, name: 'Sphynx Cat', price: 999.99, image: 'Sphynx Cat.jpg', weight: 7.0 },
  { id: 12, name: 'Kinkajou (Honey Bear)', price: 1799.99, image: 'Kinkajou.jpg', weight: 6.0 }
];

// Shopping carts
let allCarts = {};

// Selected shipping for each user
let selectedShipping = {};

// Discount codes
let discountCodes = {
  'SAVE10': {
    type: 'percentage',
    amount: 10,  // 10% off
    description: '10% off your order'
  },
  'FREESHIP': {
    type: 'free_shipping',
    amount: 0,
    description: 'Free shipping'
  },
  'SAVE20': {
    type: 'fixed',
    amount: 20.00,  // $20 off
    description: '$20 off your order'
  }
};

// Applied discounts
let appliedDiscounts = {};

// Tax rate
const TAX_RATE = 0.0725;  // 7.25%

// Shipping costs
const STANDARD_SHIPPING_BASE = 5.99;
const STANDARD_SHIPPING_PER_LB = 1.50;
const FREE_SHIPPING_THRESHOLD = 100.00;

// ===================================================================
// Check if someone is logged in
// ===================================================================
function checkIfLoggedIn(request, response, next) {
  let authHeader = request.headers['authorization'];
  
  if (!authHeader) {
    return response.status(401).json({ error: 'Please login' });
  }
  
  let token = authHeader.split(' ')[1];
  
  try {
    let decoded = jwt.verify(token, mySecretKey);
    request.userId = decoded.userId;
    next();
  } catch (error) {
    return response.status(401).json({ error: 'Invalid token' });
  }
}

// ===================================================================
// LOGIN
// ===================================================================
app.post('/login', function(request, response) {
  console.log('Someone logging in');
  
  let email = request.body.email;
  let password = request.body.password;
  
  // Find user
  let user = null;
  
  for (let i = 0; i < myUsers.length; i++) {
    if (myUsers[i].email === email && myUsers[i].password === password) {
      user = myUsers[i];
      break;
    }
  }
  
  if (user === null) {
    return response.status(401).json({ error: 'Wrong email or password' });
  }
  
  // Make token
  let token = jwt.sign(
    { userId: user.id },
    mySecretKey,
    { expiresIn: '24h' }
  );
  
  response.json({
    message: 'Logged in!',
    token: token
  });
});

// ===================================================================
// ADD TO CART
// ===================================================================
app.post('/cart/add', checkIfLoggedIn, function(request, response) {
  console.log('Adding to cart');
  
  let userId = request.userId;
  let productId = request.body.productId;
  let quantity = request.body.quantity || 1;
  
  // Find the product
  let product = null;
  
  for (let i = 0; i < myProducts.length; i++) {
    if (myProducts[i].id === productId) {
      product = myProducts[i];
      break;
    }
  }
  
  if (product === null) {
    return response.status(404).json({ error: 'Product not found' });
  }
  
  // Make cart if needed
  if (!allCarts[userId]) {
    allCarts[userId] = [];
  }
  
  let cart = allCarts[userId];
  
  // Check if already in cart
  let alreadyThere = null;
  
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].productId === productId) {
      alreadyThere = cart[i];
      break;
    }
  }
  
  if (alreadyThere !== null) {
    alreadyThere.quantity = alreadyThere.quantity + quantity;
  } else {
    cart.push({
      productId: productId,
      productName: product.name,
      price: product.price,
      weight: product.weight,
      quantity: quantity
    });
  }
  
  response.json({
    message: 'Added to cart!'
  });
});

// ===================================================================
// APPLY DISCOUNT CODE
// ===================================================================
app.post('/discount/apply', checkIfLoggedIn, function(request, response) {
  console.log('Applying discount code');
  
  let userId = request.userId;
  let code = request.body.code;
  
  // Check if code exists
  if (!discountCodes[code]) {
    return response.status(400).json({ error: 'Invalid discount code' });
  }
  
  // Save the discount for this user
  appliedDiscounts[userId] = code;
  
  let discountInfo = discountCodes[code];
  
  console.log('Applied discount:', code);
  
  response.json({
    message: 'Discount applied!',
    code: code,
    description: discountInfo.description
  });
});

// ===================================================================
// CALCULATE FINAL TOTAL - This is the main function!
// ===================================================================
app.get('/order/total', checkIfLoggedIn, function(request, response) {
  console.log('========================================');
  console.log('CALCULATING FINAL TOTAL');
  console.log('========================================');
  
  let userId = request.userId;
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.json({
      message: 'Cart is empty',
      finalTotal: 0
    });
  }
  
  // =======================================
  // STEP 1: Calculate Subtotal
  // =======================================
  console.log('');
  console.log('STEP 1: CALCULATE SUBTOTAL');
  console.log('----------------------------');
  
  let subtotal = 0;
  let totalWeight = 0;
  
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    let itemCost = item.price * item.quantity;
    let itemWeight = item.weight * item.quantity;
    
    console.log(item.productName + ': $' + item.price + ' × ' + item.quantity + ' = $' + itemCost.toFixed(2));
    
    subtotal = subtotal + itemCost;
    totalWeight = totalWeight + itemWeight;
  }
  
  console.log('SUBTOTAL = $' + subtotal.toFixed(2));
  console.log('Total Weight = ' + totalWeight.toFixed(2) + ' lbs');
  
  // =======================================
  // STEP 2: Calculate Discount
  // =======================================
  console.log('');
  console.log('STEP 2: CALCULATE DISCOUNT');
  console.log('----------------------------');
  
  let discountAmount = 0;
  let discountDescription = 'No discount applied';
  let appliedCode = appliedDiscounts[userId];
  
  if (appliedCode && discountCodes[appliedCode]) {
    let discount = discountCodes[appliedCode];
    
    if (discount.type === 'percentage') {
      // Percentage discount: 10% means 0.10
      discountAmount = subtotal * (discount.amount / 100);
      console.log('Discount: ' + discount.amount + '% off');
      console.log('Calculation: $' + subtotal.toFixed(2) + ' × ' + (discount.amount / 100) + ' = $' + discountAmount.toFixed(2));
      discountDescription = discount.amount + '% off';
    } else if (discount.type === 'fixed') {
      // Fixed discount: straight dollar amount off
      discountAmount = discount.amount;
      console.log('Discount: $' + discount.amount + ' off');
      discountDescription = '$' + discount.amount + ' off';
    }
  } else {
    console.log('No discount code applied');
  }
  
  console.log('DISCOUNT AMOUNT = $' + discountAmount.toFixed(2));
  
  // Subtract discount from subtotal
  let subtotalAfterDiscount = subtotal - discountAmount;
  console.log('SUBTOTAL AFTER DISCOUNT = $' + subtotalAfterDiscount.toFixed(2));
  
  // =======================================
  // STEP 3: Calculate Shipping
  // =======================================
  console.log('');
  console.log('STEP 3: CALCULATE SHIPPING');
  console.log('----------------------------');
  
  let shippingCost = 0;
  let freeShipping = false;
  
  // Check for free shipping discount code
  if (appliedCode && discountCodes[appliedCode].type === 'free_shipping') {
    shippingCost = 0;
    freeShipping = true;
    console.log('FREE SHIPPING from discount code!');
  }
  // Check if order qualifies for free shipping by amount
  else if (subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD) {
    shippingCost = 0;
    freeShipping = true;
    console.log('FREE SHIPPING! (order over $' + FREE_SHIPPING_THRESHOLD + ')');
  }
  // Calculate shipping cost
  else {
    shippingCost = STANDARD_SHIPPING_BASE + (totalWeight * STANDARD_SHIPPING_PER_LB);
    console.log('Shipping: $' + STANDARD_SHIPPING_BASE + ' + (' + totalWeight.toFixed(2) + ' × $' + STANDARD_SHIPPING_PER_LB + ')');
    console.log('Calculation: $' + STANDARD_SHIPPING_BASE + ' + $' + (totalWeight * STANDARD_SHIPPING_PER_LB).toFixed(2) + ' = $' + shippingCost.toFixed(2));
  }
  
  console.log('SHIPPING COST = $' + shippingCost.toFixed(2));
  
  // =======================================
  // STEP 4: Calculate Tax
  // =======================================
  console.log('');
  console.log('STEP 4: CALCULATE TAX');
  console.log('----------------------------');
  
  // Tax is calculated on subtotal (after discount), NOT on shipping
  let taxAmount = subtotalAfterDiscount * TAX_RATE;
  
  console.log('Tax: $' + subtotalAfterDiscount.toFixed(2) + ' × ' + TAX_RATE);
  console.log('Calculation: $' + subtotalAfterDiscount.toFixed(2) + ' × ' + TAX_RATE + ' = $' + taxAmount.toFixed(2));
  console.log('TAX AMOUNT = $' + taxAmount.toFixed(2));
  
  // =======================================
  // STEP 5: Calculate Final Total
  // =======================================
  console.log('');
  console.log('STEP 5: CALCULATE FINAL TOTAL');
  console.log('----------------------------');
  
  // Final Total = Subtotal - Discount + Shipping + Tax
  let finalTotal = subtotalAfterDiscount + shippingCost + taxAmount;
  
  console.log('Final Total = Subtotal After Discount + Shipping + Tax');
  console.log('Final Total = $' + subtotalAfterDiscount.toFixed(2) + ' + $' + shippingCost.toFixed(2) + ' + $' + taxAmount.toFixed(2));
  console.log('');
  console.log('*** FINAL TOTAL = $' + finalTotal.toFixed(2) + ' ***');
  console.log('========================================');
  
  // Send back the complete breakdown
  response.json({
    orderSummary: {
      step1_subtotal: '$' + subtotal.toFixed(2),
      step2_discount: discountDescription === 'No discount applied' ? '$0.00' : '-$' + discountAmount.toFixed(2),
      step2_subtotalAfterDiscount: '$' + subtotalAfterDiscount.toFixed(2),
      step3_shipping: freeShipping ? 'FREE' : '$' + shippingCost.toFixed(2),
      step4_tax: '$' + taxAmount.toFixed(2),
      step5_finalTotal: '$' + finalTotal.toFixed(2)
    },
    breakdown: {
      itemsSubtotal: subtotal.toFixed(2),
      discount: discountAmount.toFixed(2),
      discountDescription: discountDescription,
      shipping: shippingCost.toFixed(2),
      tax: taxAmount.toFixed(2),
      finalTotal: finalTotal.toFixed(2)
    },
    formula: 'Final Total = (Subtotal - Discount) + Shipping + Tax'
  });
});

// ===================================================================
// CHECKOUT - Process the order with final total
// ===================================================================
app.post('/checkout', checkIfLoggedIn, function(request, response) {
  console.log('Processing checkout');
  
  let userId = request.userId;
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.status(400).json({ error: 'Cart is empty' });
  }
  
  // Calculate everything (same as above)
  
  // Calculate subtotal
  let subtotal = 0;
  let totalWeight = 0;
  
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    let itemCost = item.price * item.quantity;
    let itemWeight = item.weight * item.quantity;
    
    subtotal = subtotal + itemCost;
    totalWeight = totalWeight + itemWeight;
  }
  
  // Calculate discount
  let discountAmount = 0;
  let appliedCode = appliedDiscounts[userId];
  
  if (appliedCode && discountCodes[appliedCode]) {
    let discount = discountCodes[appliedCode];
    
    if (discount.type === 'percentage') {
      discountAmount = subtotal * (discount.amount / 100);
    } else if (discount.type === 'fixed') {
      discountAmount = discount.amount;
    }
  }
  
  let subtotalAfterDiscount = subtotal - discountAmount;
  
  // Calculate shipping
  let shippingCost = 0;
  
  if (appliedCode && discountCodes[appliedCode].type === 'free_shipping') {
    shippingCost = 0;
  } else if (subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD) {
    shippingCost = 0;
  } else {
    shippingCost = STANDARD_SHIPPING_BASE + (totalWeight * STANDARD_SHIPPING_PER_LB);
  }
  
  // Calculate tax
  let taxAmount = subtotalAfterDiscount * TAX_RATE;
  
  // Calculate final total
  let finalTotal = subtotalAfterDiscount + shippingCost + taxAmount;
  
  // Clear cart and discounts
  allCarts[userId] = [];
  appliedDiscounts[userId] = null;
  
  console.log('Order complete! Final total charged: $' + finalTotal.toFixed(2));
  
  response.json({
    message: 'Order placed successfully!',
    orderNumber: 'ORD-' + Date.now(),
    itemCount: cart.length,
    subtotal: subtotal.toFixed(2),
    discount: discountAmount.toFixed(2),
    shipping: shippingCost.toFixed(2),
    tax: taxAmount.toFixed(2),
    totalCharged: finalTotal.toFixed(2)
  });
});

// ===================================================================
// START SERVER
// ===================================================================
const PORT = 3000;

order_id

function generateOrderId() {
  // Method 1: Use a counter
  orderCounter = orderCounter + 1;  // 1001, 1002, 1003...
  
  // Method 2: Add random number
  let randomPart = Math.floor(Math.random() * 1000);  // 0-999
  
  // Method 3: Combine them!
  let orderId = 'ORD-' + orderCounter + '-' + randomPart;
  
  return orderId;  // Example: "ORD-1001-472"
}
```

**What an Order ID Looks Like:**
```
ORD-1001-472
ORD-1002-839
ORD-1003-125

Format: ORD-[counter]-[random]

  amount of total

function calculateOrderTotal(cart) {
  console.log('=== CALCULATING ORDER TOTAL ===');
  
  // Calculate subtotal
  let subtotal = 0;
  let totalWeight = 0;
  
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    let itemCost = item.price * item.quantity;
    let itemWeight = item.weight * item.quantity;
    
    subtotal = subtotal + itemCost;
    totalWeight = totalWeight + itemWeight;
  }
  
  console.log('Subtotal:', subtotal);
  
  // Calculate shipping
  let shipping = SHIPPING_BASE + (totalWeight * SHIPPING_PER_LB);
  console.log('Shipping:', shipping);
  
  // Calculate tax
  let tax = subtotal * TAX_RATE;
  console.log('Tax:', tax);
  
  // Calculate total
  let total = subtotal + shipping + tax;
  console.log('Total:', total);
  
  return {
    subtotal: subtotal,
    shipping: shipping,
    tax: tax,
    total: total
  };
}

// ===================================================================
// GET ORDER TOTAL - Customer sees this before paying
// ===================================================================
app.get('/order/total', checkIfLoggedIn, function(request, response) {
  console.log('Getting order total');
  
  let userId = request.userId;
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.json({
      message: 'Cart is empty',
      total: 0
    });
  }
  
  // Calculate the total
  let totals = calculateOrderTotal(cart);
  
  response.json({
    subtotal: totals.subtotal.toFixed(2),
    shipping: totals.shipping.toFixed(2),
    tax: totals.tax.toFixed(2),
    total: totals.total.toFixed(2)
  });
});

currency

et myProducts = [
  { id: 1, name: 'Blue-Tongued Skink', price: 349.99, image: 'Blue-Tongued Skink.jpg', weight: 2.0 },
  { id: 2, name: 'Panther Chameleon', price: 499.99, image: 'Panther Chameleon.jpg', weight: 1.5 },
  { id: 3, name: 'Green Tree Python', price: 599.99, image: 'Green Tree Python.jpg', weight: 3.0 },
  { id: 4, name: 'Fennec Fox', price: 129.99, image: 'Fennec Fox.jpg', weight: 8.0 },
  { id: 5, name: 'African Spurred Tortoise', price: 249.99, image: 'African Spurred Tortoise.jpg', weight: 15.0 },
  { id: 6, name: 'Scarlet Macaw', price: 189.99, image: 'Scarlet Macaw.jpg', weight: 2.5 },
  { id: 7, name: 'Ring-Tailed Cat', price: 799.99, image: 'Ring-Tailed Cat.jpg', weight: 5.0 },
  { id: 8, name: 'Tanuki (Japanese Raccoon Dog)', price: 129.99, image: 'Tanuki.jpg', weight: 10.0 },
  { id: 9, name: 'Sugar Glider', price: 299.99, image: 'Sugar Glider.jpg', weight: 0.3 },
  { id: 10, name: 'Monkey', price: 150.00, image: 'Monkey.jpg', weight: 12.0 },
  { id: 11, name: 'Sphynx Cat', price: 999.99, image: 'Sphynx Cat.jpg', weight: 7.0 },
  { id: 12, name: 'Kinkajou (Honey Bear)', price: 1799.99, image: 'Kinkajou.jpg', weight: 6.0 }

// Exchange rates (how much 1 USD is worth in other currencies)
// In a real app, these would update from an API
let exchangeRates = {
  'USD': 1.00,      // US Dollar (base currency)
  'EUR': 0.92,      // Euro
  'GBP': 0.79,      // British Pound
  'CAD': 1.36,      // Canadian Dollar
  'JPY': 149.50,    // Japanese Yen
  'MXN': 17.25,     // Mexican Peso
  'AUD': 1.52,      // Australian Dollar
  'INR': 83.12      // Indian Rupee
};

// Currency symbols
let currencySymbols = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'CAD': 'CA$',
  'JPY': '¥',
  'MXN': 'MX$',
  'AUD': 'A$',
  'INR': '₹'
};

// Shopping carts
let allCarts = {};

// Orders
let allOrders = [];
let orderCounter = 1000;

// ===================================================================
// Check if logged in
// ===================================================================
function checkIfLoggedIn(request, response, next) {
  let authHeader = request.headers['authorization'];
  
  if (!authHeader) {
    return response.status(401).json({ error: 'Please login' });
  }
  
  let token = authHeader.split(' ')[1];
  
  try {
    let decoded = jwt.verify(token, mySecretKey);
    request.userId = decoded.userId;
    next();
  } catch (error) {
    return response.status(401).json({ error: 'Invalid token' });
  }
}

// ===================================================================
// FUNCTION: Convert USD to another currency
// ===================================================================
function convertCurrency(amountInUSD, targetCurrency) {
  console.log('Converting $' + amountInUSD + ' USD to ' + targetCurrency);
  
  // Get the exchange rate
  let rate = exchangeRates[targetCurrency];
  
  if (!rate) {
    console.log('ERROR: Currency not supported');
    return null;
  }
  
  // Convert the amount
  // Formula: amount in USD × exchange rate = amount in target currency
  let convertedAmount = amountInUSD * rate;
  
  console.log('Calculation: ' + amountInUSD + ' × ' + rate + ' = ' + convertedAmount);
  console.log('Result: ' + convertedAmount + ' ' + targetCurrency);
  
  return convertedAmount;
}

// ===================================================================
// FUNCTION: Convert any currency back to USD
// ===================================================================
function convertToUSD(amount, fromCurrency) {
  console.log('Converting ' + amount + ' ' + fromCurrency + ' to USD');
  
  // Get the exchange rate
  let rate = exchangeRates[fromCurrency];
  
  if (!rate) {
    console.log('ERROR: Currency not supported');
    return null;
  }
  
  // Convert to USD
  // Formula: amount in foreign currency ÷ exchange rate = amount in USD
  let amountInUSD = amount / rate;
  
  console.log('Calculation: ' + amount + ' ÷ ' + rate + ' = ' + amountInUSD);
  console.log('Result: $' + amountInUSD + ' USD');
  
  return amountInUSD;

order_id

function generateOrderId() {
  // Method 1: Use a counter
  orderCounter = orderCounter + 1;  // 1001, 1002, 1003...
  
  // Method 2: Add random number
  let randomPart = Math.floor(Math.random() * 1000);  // 0-999
  
  // Method 3: Combine them!
  let orderId = 'ORD-' + orderCounter + '-' + randomPart;
  
  return orderId;  // Example: "ORD-1001-472"
}
```

**What an Order ID Looks Like:**
```
ORD-1001-472
ORD-1002-839
ORD-1003-125

Format: ORD-[counter]-[random]

  use_id

  npm install express bcrypt jsonwebtoken cookie-parser

  JWT_SECRET=your-super-secret-key
NODE_ENV=production
PORT=3000

item if (!cart || cart.length === 0) {
    return response.json({
      message: 'Your cart is empty',
      items: [],
      itemCount: 0,
      subtotal: 0
    });
  }
  
  // Build the items list for checkout
  let checkoutItemsList = [];
  let subtotal = 0;
  
  console.log('Building items list...');
  console.log('');
  
  // Go through each item in the cart
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    
    // Calculate total for this item
    let itemTotal = item.price * item.quantity;
    
    // Add to subtotal
    subtotal = subtotal + itemTotal;
    
    console.log('Item ' + (i + 1) + ':');
    console.log('  Name: ' + item.productName);
    console.log('  Price: $' + item.price);
    console.log('  Quantity: ' + item.quantity);
    console.log('  Item Total: $' + itemTotal.toFixed(2));
    console.log('');
    
    // Create a nice item object for checkout
    let checkoutItem = {
      itemNumber: i + 1,
      productId: item.productId,
      productName: item.productName,
      productImage: item.image,
      pricePerItem: '$' + item.price.toFixed(2),
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      itemTotal: '$' + itemTotal.toFixed(2),
      itemTotalAmount: itemTotal.toFixed(2)
    };
    
    checkoutItemsList.push(checkoutItem);
  }
  
  console.log('Total items in checkout: ' + checkoutItemsList.length);
  console.log('Subtotal: $' + subtotal.toFixed(2));
  console.log('========================================');
  
  // Send back the items list
  response.json({
    checkoutItems: checkoutItemsList,
    itemCount: checkoutItemsList.length,
    subtotal: '$' + subtotal.toFixed(2),
    subtotalAmount: subtotal.toFixed(2)
  });
});

// ===================================================================
// GET FULL CHECKOUT SUMMARY - Items + totals
// ===================================================================
app.get('/checkout/summary', checkIfLoggedIn, function(request, response) {
  console.log('');
  console.log('========================================');
  console.log('GETTING FULL CHECKOUT SUMMARY');
  console.log('========================================');
  
  let userId = request.userId;
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.json({
      message: 'Cart is empty'
    });
  }
  
  // Build items list
  let itemsList = [];
  let subtotal = 0;
  
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    let itemTotal = item.price * item.quantity;
    subtotal = subtotal + itemTotal;
    
    itemsList.push({
      itemNumber: i + 1,
      name: item.productName,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      itemTotal: itemTotal
    });
  }
  
  // Calculate tax
  let tax = subtotal * TAX_RATE;
  
  // Calculate total
  let total = subtotal + tax;
  
  console.log('Items: ' + itemsList.length);
  console.log('Subtotal: $' + subtotal.toFixed(2));
  console.log('Tax: $' + tax.toFixed(2));
  console.log('Total: $' + total.toFixed(2));
  console.log('========================================');
  
  // Send back everything
  response.json({
    itemsList: itemsList,
    orderSummary: {
      numberOfItems: itemsList.length,
      subtotal: '$' + subtotal.toFixed(2),
      tax: '$' + tax.toFixed(2),
      total: '$' + total.toFixed(2)
    }
  });
});

// ===================================================================
// GET ONE ITEM FROM CHECKOUT
// ===================================================================
app.get('/checkout/items/:itemNumber', checkIfLoggedIn, function(request, response) {
  console.log('Getting one item from checkout');
  
  let userId = request.userId;
  let itemNumber = parseInt(request.params.itemNumber);
  
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.status(404).json({ error: 'Cart is empty' });
  }
  
  // Item numbers start at 1, but arrays start at 0
  let itemIndex = itemNumber - 1;
  
  // Check if item exists
  if (itemIndex < 0 || itemIndex >= cart.length) {
    return response.status(404).json({ 
      error: 'Item not found',
      validItemNumbers: '1 to ' + cart.length
    });
  }
  
  // Get the item
  let item = cart[itemIndex];
  let itemTotal = item.price * item.quantity;
  
  console.log('Found item:', item.productName);
  
  response.json({
    itemNumber: itemNumber,
    productId: item.productId,
    productName: item.productName,
    price: '$' + item.price.toFixed(2),
    quantity: item.quantity,
    size: item.size,
    color: item.color,
    image: item.image,
    itemTotal: '$' + itemTotal.toFixed(2)
  });
});

// ===================================================================
// UPDATE ITEM QUANTITY IN CHECKOUT
// ===================================================================
app.put('/checkout/items/:itemNumber', checkIfLoggedIn, function(request, response) {
  console.log('Updating item quantity');
  
  let userId = request.userId;
  let itemNumber = parseInt(request.params.itemNumber);
  let newQuantity = request.body.quantity;
  
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.status(404).json({ error: 'Cart is empty' });
  }
  
  // Check quantity is valid
  if (newQuantity < 1) {
    return response.status(400).json({ error: 'Quantity must be at least 1' });
  }
  
  let itemIndex = itemNumber - 1;
  
  if (itemIndex < 0 || itemIndex >= cart.length) {
    return response.status(404).json({ error: 'Item not found' });
  }
  
  // Update quantity
  let oldQuantity = cart[itemIndex].quantity;
  cart[itemIndex].quantity = newQuantity;
  
  console.log('Updated item', itemNumber, 'quantity from', oldQuantity, 'to', newQuantity);
  
  response.json({
    message: 'Quantity updated',
    itemNumber: itemNumber,
    productName: cart[itemIndex].productName,
    oldQuantity: oldQuantity,
    newQuantity: newQuantity
  });
});

// ===================================================================
// REMOVE ITEM FROM CHECKOUT
// ===================================================================
app.delete('/checkout/items/:itemNumber', checkIfLoggedIn, function(request, response) {
  console.log('Removing item from checkout');
  
  let userId = request.userId;
  let itemNumber = parseInt(request.params.itemNumber);
  
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.status(404).json({ error: 'Cart is empty' });
  }
  
  let itemIndex = itemNumber - 1;
  
  if (itemIndex < 0 || itemIndex >= cart.length) {
    return response.status(404).json({ error: 'Item not found' });
  }
  
  // Get item name before removing
  let itemName = cart[itemIndex].productName;
  
  // Remove the item
  cart.splice(itemIndex, 1);
  
  console.log('Removed:', itemName);
  console.log('Items remaining:', cart.length);
  
  response.json({
    message: 'Item removed from checkout',
    removedItem: itemName,
    itemsRemaining: cart.length
  });
});

// ===================================================================
// START SERVER
// ===================================================================
const PORT = 3000;

app.listen(PORT, function() {
  console.log('==============================================');
  console.log('Checkout Items List Server is running!');
  console.log('Go to: http://localhost:' + PORT);
  console.log('==============================================');
  console.log('');
  console.log('WHAT IS AN ITEMS LIST?');
  console.log('');
  console.log('The items list shows everything the customer is');
  console.log('buying at checkout. Each item includes:');
  console.log('');
  console.log('- Product name');
  console.log('- Price per item');
  console.log('- Quantity');
  console.log('- Size/Color details');
  console.log('- Item total (price × quantity)');
  console.log('- Product image');
  console.log('');
  console.log('Example items list:');
  console.log('');
  console.log('1. Blue T-Shirt');
  console.log('   Price: $19.99 × 2 = $39.98');
  console.log('   Size: Medium, Color: Blue');
  console.log('');
  console.log('2. Running Shoes');
  console.log('   Price: $89.99 × 1 = $89.99');
  console.log('   Size: 10, Color: Black');
  console.log('');
  console.log('Total: 2 items, Subtotal: $129.97');
  console.log('==============================================');
});

app.post('/payment/process', checkIfLoggedIn, function(request, response) {
  console.log('');
  console.log('========================================');
  console.log('PROCESSING PAYMENT');
  console.log('========================================');
  
  let userId = request.userId;
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.status(400).json({ error: 'Cart is empty' });
  }
  
  // Get user info
  let user = null;
  
  for (let i = 0; i < myUsers.length; i++) {
    if (myUsers[i].id === userId) {
      user = myUsers[i];
      break;
    }
  }
  
  // Calculate order total
  let subtotal = 0;
  
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    let itemCost = item.price * item.quantity;
    subtotal = subtotal + itemCost;
  }
  
  let tax = subtotal * TAX_RATE;
  let total = subtotal + tax;
  
  // Get payment info from request
  let paymentAmount = parseFloat(request.body.paymentAmount);
  let paymentMethod = request.body.paymentMethod;  // 'credit_card', 'debit_card', 'paypal'
  
  console.log('Payment amount:', paymentAmount);
  console.log('Payment method:', paymentMethod);
  console.log('Order total:', total);
  
  // Verify payment amount
  let amountRounded = Math.round(paymentAmount * 100) / 100;
  let totalRounded = Math.round(total * 100) / 100;
  
  if (amountRounded !== totalRounded) {
    console.log('ERROR: Payment amount does not match total');
    
    // Create failed payment record
    paymentCounter = paymentCounter + 1;
    let failedPaymentId = 'PAY-' + paymentCounter;
    
    let failedPayment = {
      payment_id: failedPaymentId,
      user_id: userId,
      customer_name: user.name,
      amount_attempted: paymentAmount.toFixed(2),
      amount_required: total.toFixed(2),
      payment_method: paymentMethod,
      status: 'failed',
      failure_reason: 'Amount mismatch',
      date: new Date().toISOString()
    };
    
    allPayments.push(failedPayment);
    
    return response.status(400).json({
      error: 'Payment failed',
      payment_id: failedPaymentId,
      status: 'failed',
      reason: 'Payment amount does not match order total'
    });
  }
  
  // Payment amount is correct!
  // Simulate payment processing
  console.log('Processing payment...');

deuduct stock

let myUsers = [
  {
    id: 1,
    email: 'customer@store.com',
    password: 'password123',
    name: 'Lisa Chen'
  }
];

// PRODUCT TABLE - This is where I track stock!
let productTable = [
   { id: 1, name: 'Blue-Tongued Skink', price: 349.99, image: 'Blue-Tongued Skink.jpg', weight: 2.0 },
  { id: 2, name: 'Panther Chameleon', price: 499.99, image: 'Panther Chameleon.jpg', weight: 1.5 },
  { id: 3, name: 'Green Tree Python', price: 599.99, image: 'Green Tree Python.jpg', weight: 3.0 },
  { id: 4, name: 'Fennec Fox', price: 129.99, image: 'Fennec Fox.jpg', weight: 8.0 },
  { id: 5, name: 'African Spurred Tortoise', price: 249.99, image: 'African Spurred Tortoise.jpg', weight: 15.0 },
  { id: 6, name: 'Scarlet Macaw', price: 189.99, image: 'Scarlet Macaw.jpg', weight: 2.5 },
  { id: 7, name: 'Ring-Tailed Cat', price: 799.99, image: 'Ring-Tailed Cat.jpg', weight: 5.0 },
  { id: 8, name: 'Tanuki (Japanese Raccoon Dog)', price: 129.99, image: 'Tanuki.jpg', weight: 10.0 },
  { id: 9, name: 'Sugar Glider', price: 299.99, image: 'Sugar Glider.jpg', weight: 0.3 },
  { id: 10, name: 'Monkey', price: 150.00, image: 'Monkey.jpg', weight: 12.0 },
  { id: 11, name: 'Sphynx Cat', price: 999.99, image: 'Sphynx Cat.jpg', weight: 7.0 },
  { id: 12, name: 'Kinkajou (Honey Bear)', price: 1799.99, image: 'Kinkajou.jpg', weight: 6.0 }
];

// Shopping carts
let allCarts = {};

// Orders
let allOrders = [];
let orderCounter = 1000;

// Stock change history (so I can see what happened)
let stockHistory = [];

// ===================================================================
// Check if logged in
// ===================================================================
function checkIfLoggedIn(request, response, next) {
  let authHeader = request.headers['authorization'];
  
  if (!authHeader) {
    return response.status(401).json({ error: 'Please login' });
  }
  
  let token = authHeader.split(' ')[1];
  
  try {
    let decoded = jwt.verify(token, mySecretKey);
    request.userId = decoded.userId;
    next();
  } catch (error) {
    return response.status(401).json({ error: 'Invalid token' });
  }
}

// ===================================================================
// LOGIN
// ===================================================================
app.post('/login', function(request, response) {
  console.log('Someone logging in');
  
  let email = request.body.email;
  let password = request.body.password;
  
  // Find user
  let user = null;
  
  for (let i = 0; i < myUsers.length; i++) {
    if (myUsers[i].email === email && myUsers[i].password === password) {
      user = myUsers[i];
      break;
    }
  }
  
  if (user === null) {
    return response.status(401).json({ error: 'Wrong email or password' });
  }
  
  // Make token
  let token = jwt.sign(
    { userId: user.id },
    mySecretKey,
    { expiresIn: '24h' }
  );
  
  response.json({
    message: 'Logged in!',
    token: token
  });
});

// ===================================================================
// VIEW PRODUCT TABLE - See current stock
// ===================================================================
app.get('/products', function(request, response) {
  console.log('Showing product table with stock levels');
  
  let products = [];
  
  for (let i = 0; i < productTable.length; i++) {
    let product = productTable[i];
    
    products.push({
      id: product.id,
      name: product.name,
      price: '$' + product.price.toFixed(2),
      stockQuantity: product.stockQuantity,
      soldCount: product.soldCount,
      stockStatus: product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'
    });
  }
  
  response.json({
    products: products
  });
});

// ===================================================================
// ADD TO CART
// ===================================================================
app.post('/cart/add', checkIfLoggedIn, function(request, response) {
  console.log('Adding to cart');
  
  let userId = request.userId;
  let productId = request.body.productId;
  let quantity = request.body.quantity || 1;
  
  // Find product in table
  let product = null;
  
  for (let i = 0; i < productTable.length; i++) {
    if (productTable[i].id === productId) {
      product = productTable[i];
      break;
    }
  }
  
  if (product === null) {
    return response.status(404).json({ error: 'Product not found' });
  }
  
  // Check if enough stock available
  if (quantity > product.stockQuantity) {
    return response.status(400).json({
      error: 'Not enough stock',
      requested: quantity,
      available: product.stockQuantity
    });
  }
  
  // Make cart if needed
  if (!allCarts[userId]) {
    allCarts[userId] = [];
  }
  
  let cart = allCarts[userId];
  
  // Check if already in cart
  let found = null;
  
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].productId === productId) {
      found = cart[i];
      break;
    }
  }
  
  if (found !== null) {
    // Check if new total would exceed stock
    let newTotal = found.quantity + quantity;
    
    if (newTotal > product.stockQuantity) {
      return response.status(400).json({
        error: 'Not enough stock for that quantity',
        currentInCart: found.quantity,
        availableStock: product.stockQuantity
      });
    }
    
    found.quantity = newTotal;
  } else {
    cart.push({
      productId: productId,
      productName: product.name,
      price: product.price,
      quantity: quantity
    });
  }
  
  response.json({
    message: 'Added to cart!',
    stockRemaining: product.stockQuantity
  });
});

// ===================================================================
// CHECKOUT - This is where we DEDUCT FROM STOCK!
// ===================================================================
app.post('/checkout', checkIfLoggedIn, function(request, response) {
  console.log('');
  console.log('========================================');
  console.log('CHECKOUT - DEDUCTING FROM STOCK');
  console.log('========================================');
  
  let userId = request.userId;
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.status(400).json({ error: 'Cart is empty' });
  }
  
  // STEP 1: Check if all items have enough stock
  console.log('STEP 1: Checking stock availability...');
  console.log('');
  
  for (let i = 0; i < cart.length; i++) {
    let cartItem = cart[i];
    
    // Find product in table
    let product = null;
    
    for (let j = 0; j < productTable.length; j++) {
      if (productTable[j].id === cartItem.productId) {
        product = productTable[j];
        break;
      }
    }
    
    if (product === null) {
      return response.status(400).json({
        error: 'Product no longer exists',
        productId: cartItem.productId
      });
    }
    
    console.log('Checking: ' + product.name);
    console.log('  Need: ' + cartItem.quantity);
    console.log('  Have: ' + product.stockQuantity);
    
    // Check if enough stock
    if (cartItem.quantity > product.stockQuantity) {
      console.log('  ERROR: Not enough stock!');
      
      return response.status(400).json({
        error: 'Not enough stock for ' + product.name,
        requested: cartItem.quantity,
        available: product.stockQuantity
      });
    }
    
    console.log('  OK: Stock available');
    console.log('');
  }
  
  console.log('All items have enough stock!');
  console.log('');
  
  // STEP 2: Calculate order total
  console.log('STEP 2: Calculating total...');
  
  let subtotal = 0;
  
  for (let i = 0; i < cart.length; i++) {
    let itemCost = cart[i].price * cart[i].quantity;
    subtotal = subtotal + itemCost;
  }
  
  console.log('Subtotal: $' + subtotal.toFixed(2));
  console.log('');

  {
    id: 1,
    email: 'customer@store.com',
    password: 'password123',
    name: 'Jennifer Lopez',
    phone: '555-123-4567'
  }
];

// Products
let myProducts = [
  { id: 1, name: 'Blue-Tongued Skink', price: 349.99, image: 'Blue-Tongued Skink.jpg', weight: 2.0 },
  { id: 2, name: 'Panther Chameleon', price: 499.99, image: 'Panther Chameleon.jpg', weight: 1.5 },
  { id: 3, name: 'Green Tree Python', price: 599.99, image: 'Green Tree Python.jpg', weight: 3.0 },
  { id: 4, name: 'Fennec Fox', price: 129.99, image: 'Fennec Fox.jpg', weight: 8.0 },
  { id: 5, name: 'African Spurred Tortoise', price: 249.99, image: 'African Spurred Tortoise.jpg', weight: 15.0 },
  { id: 6, name: 'Scarlet Macaw', price: 189.99, image: 'Scarlet Macaw.jpg', weight: 2.5 },
  { id: 7, name: 'Ring-Tailed Cat', price: 799.99, image: 'Ring-Tailed Cat.jpg', weight: 5.0 },
  { id: 8, name: 'Tanuki (Japanese Raccoon Dog)', price: 129.99, image: 'Tanuki.jpg', weight: 10.0 },
  { id: 9, name: 'Sugar Glider', price: 299.99, image: 'Sugar Glider.jpg', weight: 0.3 },
  { id: 10, name: 'Monkey', price: 150.00, image: 'Monkey.jpg', weight: 12.0 },
  { id: 11, name: 'Sphynx Cat', price: 999.99, image: 'Sphynx Cat.jpg', weight: 7.0 },
  { id: 12, name: 'Kinkajou (Honey Bear)', price: 1799.99, image: 'Kinkajou.jpg', weight: 6.0 }
];

// Shopping carts
let allCarts = {};

// Orders
let allOrders = [];
let orderCounter = 1000;

// Confirmations sent (to track what we sent)
let allConfirmations = [];

// ===================================================================
// Check if logged in
// ===================================================================
function checkIfLoggedIn(request, response, next) {
  let authHeader = request.headers['authorization'];
  
  if (!authHeader) {
    return response.status(401).json({ error: 'Please login' });
  }
  
  let token = authHeader.split(' ')[1];
  
  try {
    let decoded = jwt.verify(token, mySecretKey);
    request.userId = decoded.userId;
    next();
  } catch (error) {
    return response.status(401).json({ error: 'Invalid token' });
  }
}

// ===================================================================
// LOGIN
// ===================================================================
app.post('/login', function(request, response) {
  console.log('Someone logging in');
  
  let email = request.body.email;
  let password = request.body.password;
  
  // Find user
  let user = null;
  
  for (let i = 0; i < myUsers.length; i++) {
    if (myUsers[i].email === email && myUsers[i].password === password) {
      user = myUsers[i];
      break;
    }
  }
  
  if (user === null) {
    return response.status(401).json({ error: 'Wrong email or password' });
  }
  
  // Make token
  let token = jwt.sign(
    { userId: user.id },
    mySecretKey,
    { expiresIn: '24h' }
  );
  
  response.json({
    message: 'Logged in!',
    token: token
  });
});

// ===================================================================
// ADD TO CART
// ===================================================================
app.post('/cart/add', checkIfLoggedIn, function(request, response) {
  console.log('Adding to cart');
  
  let userId = request.userId;
  let productId = request.body.productId;
  let quantity = request.body.quantity || 1;
  
  // Find product
  let product = null;
  
  for (let i = 0; i < myProducts.length; i++) {
    if (myProducts[i].id === productId) {
      product = myProducts[i];
      break;
    }
  }
  
  if (product === null) {
    return response.status(404).json({ error: 'Product not found' });
  }
  
  // Make cart if needed
  if (!allCarts[userId]) {
    allCarts[userId] = [];
  }
  
  let cart = allCarts[userId];
  
  // Check if already in cart
  let found = null;
  
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].productId === productId) {
      found = cart[i];
      break;
    }
  }
  
  if (found !== null) {
    found.quantity = found.quantity + quantity;
  } else {
    cart.push({
      productId: productId,
      productName: product.name,
      price: product.price,
      quantity: quantity
    });
  }
  
  response.json({
    message: 'Added to cart!'
  });
});

// ===================================================================
// FUNCTION: Build confirmation message
// ===================================================================
function buildConfirmationMessage(order, user) {
  console.log('Building confirmation message...');
  
  // Start building the message
  let message = '';
  
  message = message + 'ORDER CONFIRMATION\n';
  message = message + '==================\n';
  message = message + '\n';
  message = message + 'Hi ' + user.name + ',\n';
  message = message + '\n';
  message = message + 'Thank you for your order!\n';
  message = message + '\n';
  message = message + 'Order Number: ' + order.order_id + '\n';
  message = message + 'Order Date: ' + order.order_date + '\n';
  message = message + '\n';
  message = message + 'ITEMS ORDERED:\n';
  message = message + '---------------\n';
  
  // Add each item
  for (let i = 0; i < order.items.length; i++) {
    let item = order.items[i];
    let itemTotal = item.price * item.quantity;
    
    message = message + (i + 1) + '. ' + item.productName + '\n';
    message = message + '   Quantity: ' + item.quantity + '\n';
    message = message + '   Price: $' + item.price.toFixed(2) + ' each\n';
    message = message + '   Total: $' + itemTotal.toFixed(2) + '\n';
    message = message + '\n';
  }
  
  message = message + '---------------\n';
  message = message + 'Subtotal: $' + order.subtotal + '\n';
  message = message + 'Tax: $' + order.tax + '\n';
  message = message + 'TOTAL: $' + order.total + '\n';
  message = message + '\n';
  message = message + 'Your order will be shipped to:\n';
  message = message + user.name + '\n';
  message = message + user.email + '\n';
  message = message + '\n';
  message = message + 'Thank you for shopping with us!\n';
  message = message + '\n';
  message = message + '- Your Store Team';
  
  console.log('Message built successfully!');
  
  return message;
}

// ===================================================================
// FUNCTION: Send confirmation (simulated)
// ===================================================================
function sendConfirmation(user, order, message) {
  console.log('');
  console.log('========================================');
  console.log('SENDING CONFIRMATION');
  console.log('========================================');
  console.log('');
  
  // In real life, this would send an actual email
  // using a service like SendGrid, Mailgun, or Nodemailer
  // For now, we'll just pretend
  
  console.log('To: ' + user.email);
  console.log('Subject: Order Confirmation - ' + order.order_id);
  console.log('');
  console.log('MESSAGE:');
  console.log('--------');
  console.log(message);
  console.log('--------');
  console.log('');
  console.log('Email sent successfully!');
  console.log('========================================');
  
  // Record that we sent this confirmation
  let confirmation = {
    confirmation_id: 'CONF-' + Date.now(),
    order_id: order.order_id,
    user_id: user.id,
    sent_to: user.email,
    sent_at: new Date().toISOString(),
    message: message,
    status: 'sent'
  };
  
  allConfirmations.push(confirmation);
  
  return confirmation;
}

// ===================================================================
// CHECKOUT - Places order and sends confirmation
// ===================================================================
app.post('/checkout', checkIfLoggedIn, function(request, response) {
  console.log('');
  console.log('========================================');
  console.log('PROCESSING CHECKOUT');
  console.log('========================================');
  
  let userId = request.userId;
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.status(400).json({ error: 'Cart is empty' });
  }
  
  // Get user info
  let user = null;
  
  for (let i = 0; i < myUsers.length; i++) {
    if (myUsers[i].id === userId) {
      user = myUsers[i];
      break;
    }
  }
  
  // Calculate total
  let subtotal = 0;
  
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    let itemCost = item.price * item.quantity;
    subtotal = subtotal + itemCost;
  }
  
  let tax = subtotal * 0.0725;
  let total = subtotal + tax;
  
  // Create order
  orderCounter = orderCounter + 1;
  let orderId = 'ORD-' + orderCounter;
  
  let order = {
    order_id: orderId,
    user_id: userId,
    items: cart,
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
    order_date: new Date().toISOString(),
    status: 'confirmed'
  };
  
  allOrders.push(order);
  
  console.log('Order created:', orderId);
  console.log('');
  
  // BUILD THE CONFIRMATION MESSAGE
  let confirmationMessage = buildConfirmationMessage(order, user);
  
  // SEND THE CONFIRMATION
  let confirmation = sendConfirmation(user, order, confirmationMessage);
  
  // Clear cart
  allCarts[userId] = [];
  
  console.log('Checkout complete!');
  console.log('========================================');
  
  response.json({
    message: 'Order placed! Confirmation sent to ' + user.email,
    order_id: orderId,
    confirmation_id: confirmation.confirmation_id,
    total: '$' + total.toFixed(2),
    confirmation_sent_to: user.email
  });
});

// ===================================================================
// RESEND CONFIRMATION - Send it again
// ===================================================================
app.post('/order/:orderId/resend-confirmation', checkIfLoggedIn, function(request, response) {
  console.log('Resending confirmation');
  
  let userId = request.userId;
  let orderId = request.params.orderId;
  
  // Find the order
  let order = null;
  
  for (let i = 0; i < allOrders.length; i++) {
    if (allOrders[i].order_id === orderId) {
      order = allOrders[i];
      break;
    }
  }
  
  if (order === null) {
    return response.status(404).json({ error: 'Order not found' });
  }
  
  // Make sure it's their order
  if (order.user_id !== userId) {
    return response.status(403).json({ error: 'Not your order' });
  }
  
  // Get user info
  let user = null;
  
  for (let i = 0; i < myUsers.length; i++) {
    if (myUsers[i].id === userId) {
      user = myUsers[i];
      break;
    }
  }
  
  // Build and send confirmation again
  let confirmationMessage = buildConfirmationMessage(order, user);
  let confirmation = sendConfirmation(user, order, confirmationMessage);
  
  response.json({
    message: 'Confirmation resent!',
    order_id: orderId,
    confirmation_id: confirmation.confirmation_id,
    sent_to: user.email
  });
});

// ===================================================================
// VIEW CONFIRMATION - See what was sent
// ===================================================================
app.get('/confirmation/:confirmationId', checkIfLoggedIn, function(request, response) {
  console.log('Getting confirmation details');
  
  let userId = request.userId;
  let confirmationId = request.params.confirmationId;
  
  // Find the confirmation
  let confirmation = null;
  
  for (let i = 0; i < allConfirmations.length; i++) {
    if (allConfirmations[i].confirmation_id === confirmationId) {
      confirmation = allConfirmations[i];
      break;
    }
  }
  
  if (confirmation === null) {
    return response.status(404).json({ error: 'Confirmation not found' });
  }
  
  // Make sure it's their confirmation
  if (confirmation.user_id !== userId) {
    return response.status(403).json({ error: 'Not your confirmation' });
  }
  
  response.json({
    confirmation: confirmation
  });
});

// ===================================================================
// GET ALL CONFIRMATIONS FOR USER
// ===================================================================
app.get('/confirmations', checkIfLoggedIn, function(request, response) {
  console.log('Getting all confirmations for user');
  
  let userId = request.userId;
  
  // Find all confirmations for this user
  let userConfirmations = [];
  
  for (let i = 0; i < allConfirmations.length; i++) {
    if (allConfirmations[i].user_id === userId) {
      userConfirmations.push(allConfirmations[i]);
    }
  }
  
  response.json({
    confirmations: userConfirmations,
    total: userConfirmations.length
  });
});

// ===================================================================
// SEND CUSTOM CONFIRMATION - For testing
// ===================================================================
app.post('/send-test-confirmation', checkIfLoggedIn, function(request, response) {
  console.log('Sending test confirmation');
  
  let userId = request.userId;
  
  // Get user
  let user = null;
  
  for (let i = 0; i < myUsers.length; i++) {
    if (myUsers[i].id === userId) {
      user = myUsers[i];
      break;
    }
  }
  
  // Create a fake order for testing
  let testOrder = {
    order_id: 'TEST-' + Date.now(),
    user_id: userId,
    items: [
      { productName: 'Test Product', price: 99.99, quantity: 1 }
    ],
    subtotal: '99.99',
    tax: '7.24',
    total: '107.23',
    order_date: new Date().toISOString(),
    status: 'test'
  };
  
  // Build and send
  let message = buildConfirmationMessage(testOrder, user);
  let confirmation = sendConfirmation(user, testOrder, message);
  
  response.json({
    message: 'Test confirmation sent!',
    confirmation_id: confirmation.confirmation_id,
    sent_to: user.email
  });
});

// ===================================================================
// START SERVER
// ===================================================================
const PORT = 3000;

app.listen(PORT, function() {
  console.log('==============================================');
  console.log('Confirmation Sender Server is running!');
  console.log('Go to: http://localhost:' + PORT);
  console.log('==============================================');
  console.log('');
  console.log('HOW CONFIRMATION WORKS:');
  console.log('');
  console.log('STEP 1: Customer places order');
  console.log('  → Order is created with ID: ORD-1001');
  console.log('');
  console.log('STEP 2: Build confirmation message');
  console.log('  → Create email with order details');
  console.log('  → Include: Order #, Items, Total, Date');
  console.log('');
  console.log('STEP 3: Send confirmation');
  console.log('  → Send email to customer');
  console.log('  → To: customer@store.com');
  console.log('  → Subject: Order Confirmation - ORD-1001');
  console.log('');
  console.log('STEP 4: Save confirmation record');
  console.log('  → Track that we sent it');
  console.log('  → Confirmation ID: CONF-123456789');
  console.log('');
  console.log('Example confirmation:');
  console.log('--------------------');
  console.log('Hi Jennifer,');
  console.log('Thank you for your order!');
  console.log('');
  console.log('Order Number: ORD-1001');
  console.log('Items: Blue T-Shirt x 2');
  console.log('Total: $45.87');
  console.log('--------------------');
  console.log('==============================================');
});

app.post('/checkout', checkIfLoggedIn, function(request, response) {
  console.log('');
  console.log('========================================');
  console.log('PROCESSING CHECKOUT');
  console.log('========================================');
  
  let userId = request.userId;
  let cart = allCarts[userId];
  
  if (!cart || cart.length === 0) {
    return response.status(400).json({ error: 'Cart is empty' });
  }
  
  // Calculate total
  let subtotal = 0;
  
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    let itemCost = item.price * item.quantity;
    subtotal = subtotal + itemCost;
  }
  
  let tax = subtotal * 0.0725;
  let total = subtotal + tax;
  
  // Create order
  orderCounter = orderCounter + 1;
  let orderId = 'ORD-' + orderCounter;
  
  let order = {
    order_id: orderId,
    user_id: userId,
    items: cart,
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
    order_date: new Date().toISOString(),
    status: 'confirmed'
  };
  
  allOrders.push(order);
  
  // Clear cart
  allCarts[userId] = [];
  
  console.log('Order completed! Redirecting to home page...');
  console.log('========================================');
  
  // THIS IS THE IMPORTANT PART!
  // Tell the user to go back to home page
  response.json({
    message: 'Order placed successfully!',
    order_id: orderId,
    total: '$' + total.toFixed(2),
    redirectTo: '/',  // Where to send them
    redirectUrl: 'http://localhost:3000/',
    redirectMessage: 'Returning to home page...'
  });
});

// ===================================================================
// LOGOUT - Send to home page
// ===================================================================
app.post('/logout', checkIfLoggedIn, function(request, response) {
  console.log('User logging out, redirecting to home');
  
  // In a real app, you'd invalidate the token here
  
  response.json({
    message: 'Logged out successfully!',
    redirectTo: '/',
    redirectUrl: 'http://localhost:3000/',
    redirectMessage: 'Taking you back to home page...'
  });
});

// ===================================================================
// CANCEL ORDER - Return to home
// ===================================================================
app.post('/order/cancel', checkIfLoggedIn, function(request, response) {
  console.log('Order cancelled, sending user home');
  
  let userId = request.userId;
  
  // Clear their cart
  allCarts[userId] = [];
  
  response.json({
    message: 'Order cancelled',
    redirectTo: '/',
    redirectUrl: 'http://localhost:3000/',
    redirectMessage: 'Returning to home page...'
  });
});

// ===================================================================
// ERROR HANDLER - Send to home on errors
// ===================================================================
app.use(function(error, request, response, next) {
  console.log('Error occurred! Redirecting to home page');
  console.log('Error:', error.message);
  
  response.status(500).json({
    error: 'Something went wrong',
    message: error.message,
    redirectTo: '/',
    redirectUrl: 'http://localhost:3000/',
    redirectMessage: 'Taking you back to safety...'
  });
});

// ===================================================================
// 404 NOT FOUND - Send to home
// ===================================================================
app.use(function(request, response) {
  console.log('Page not found! Redirecting to home');
  
  response.status(404).json({
    error: 'Page not found',
    requestedUrl: request.url,
    redirectTo: '/',
    redirectUrl: 'http://localhost:3000/',
    redirectMessage: 'Let\'s go back home...'
  });
});

// ===================================================================
// START SERVER
// ===================================================================
const PORT = 3000;

app.listen(PORT, function() {
  console.log('==============================================');
  console.log('Redirect to Home Server is running!');
  console.log('Go to: http://localhost:' + PORT);
  console.log('==============================================');
  console.log('');
  console.log('HOW REDIRECTING TO HOME WORKS:');
  console.log('');
  console.log('BACKEND SIDE:');
  console.log('1. User completes an action (login, checkout, etc)');
  console.log('2. Backend sends response with redirect info:');
  console.log('   {');
  console.log('     message: "Success!",');
  console.log('     redirectTo: "/",');
  console.log('     redirectUrl: "http://localhost:3000/"');
  console.log('   }');
  console.log('');
  console.log('FRONTEND SIDE:');
  console.log('3. Frontend receives response');
  console.log('4. Frontend sees redirectTo field');
  console.log('5. Frontend uses JavaScript to redirect:');
  console.log('   window.location.href = response.redirectUrl');
  console.log('6. User is taken to home page!');
  console.log('');
  console.log('WHEN TO REDIRECT TO HOME:');
  console.log('- After successful login');
  console.log('- After completing checkout');
  console.log('- After logout');
  console.log('- After canceling an order');
  console.log('- When page not found (404)');
  console.log('- When error occurs (500)');
  console.log('==============================================');
});
