//backend URL
const file='http://localhost:3000'; 

//Products 
async function getProducts(){ //async= wait for backend to respond
    const loader=document.getElementById('f_loader'); 
    const productsBox=document.getElementById('f_productsBox');
    const errorMessage=document.getElementById('f_errorMessage');

    try{ //wait for backend to send products

        const wait = await fetch('http://localhost:3000/B_getproducts',{//waits for backend to fetch(biult in function-> talk to backend)
        method: 'GET' //tells fetch what kind of request (get= get data)
        });

        const get = await wait.json(); //waits for response from backend + convert to js object
        loader.style.display='none'; //hide loader when data is back -> 'display'= add/removes element from page
        productsBox.style.display='flex'; //show products box in flex layout


        //displays products 
        productsBox.innerHTML=''; //clear products box before adding products
        get.B_products.forEach(product=>{
            const productCard = document.createElement('div');
            productCard.className = 'col-md-6 col-lg-4 col-xl-3';
            productCard.innerHTML = 
            `
                <div class = "product-box">
                    <img src="${product.B_img}" alt="${product.B_name}"/> 
                    <h3>${product.B_name}</h3>
                    <p class="description">${product.B_description}</p>
                    <p class="price">$${product.B_price.toFixed(2)}</p> 
                    <button onclick="addToCart(${product.B_id})">Add to Cart</button>
                </div>
            `;//${}=js variable -> $${product.price.toFixed(2)}= 2 decimal places
            productsBox.appendChild(productCard);
        });



    }catch(error){
        console.error('Error:In getProducts', error); //console-> prints in console not for user
        loader.style.display='none';//if error hide loader
        errorMessage.innerHTML='Something went wrong while loading products. Please try again later.'; //write error message
        errorMessage.style.display='block'; //show error message to user
    }

    
}


//Add to cart
async function addToCart(productId){//productId? -> know which product to add
    try{
        const wait = await fetch('http://localhost:3000/B_addtocart',{
            method:'POST', //send data to backend
            headers:{'Content-Type':'application/json'}, //tells backend what type of data (JSON)
            body:JSON.stringify({ //from javascript to JSON
                productId: productId, //id of product to add
                quantity:1 //default quantity 1
            })
            

        });

        //get response from backend
        const get = await wait.json();
        if(get.B_success){ //
            alert('Product added to cart successfully!');
            updateCartBadge(); 
        }else{//backend sent success: false
            alert('Failed to add product to cart');
        }

    }catch(error){//backend error
        console.error('Error: In addToCart', error);
        alert('An error occurred while adding the product to the cart. Please try again later.');
    }

}




//Update cart badge
async function updateCartBadge(){
    const F_cartBadge=document.getElementById('f_cartBadge');

    try{
        const wait = await fetch('http://localhost:3000/B_getcartcount',{
            method:'GET' //get data from backend


        });

        const get=await wait.json(); //waits for response from backend + convert to js object
        const count=get.B_count; //get count from response
        F_cartBadge.innerText=count; //update cart badge with count

    }catch(error){
        console.error('Error: In updateCartBadge', error);
        F_cartBadge.innerText='0'; //set count to 0
    }
}


//Shopping cart
async function getCart(){
    const loader=document.getElementById('f_loader');
    const emptyMessage=document.getElementById('f_emptyMessage');
    const cartItemsBox=document.getElementById('f_cartItemsBox');//Items added to cart 
    const cartItems=document.getElementById('f_cartItems');
    const subtotal=document.getElementById('f_subtotal');
    const tax=document.getElementById('f_tax');
    const total=document.getElementById('f_total');

    try{
        const wait= await fetch('http://localhost:3000/B_getcartitems',{
            method:'GET'

        });

        const get= await wait.json();
        loader.style.display='none'; //hide loader

        //check if cart is empty
        if(get.B_items.length===0){
            emptyMessage.style.display='block'; //block= show element
            return;
        }
        
        //display cart items
        cartItemsBox.style.display='flex'; 
        cartItems.innerHTML=''; //clear cart items box before adding items
        get.B_items.forEach(item =>{ //B_items= items from backend.loop through each item
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = 
            `
                <img src="${item.B_img}" alt="${item.B_name}">
                <div class="item-details">
                    <h4>${item.B_name}</h4>
                    <p class="item-price">$${item.B_price.toFixed(2)}</p>
                </div>
                <div class="quantity-controls">
                    <button onclick="changeQuantity(${item.B_id},${item.B_quantity - 1})">-</button>
                    <span>${item.B_quantity}</span>
                    <button onclick="changeQuantity(${item.B_id},${item.B_quantity + 1})">+</button>
                </div>
                <div>
                    <p class="fw-bold mb-2">$${(item.B_price * item.B_quantity).toFixed(2)}</p>
                    <button class="remove-btn" onclick="removeItem(${item.B_id})">Remove</button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });

        //display totals 
        subtotal.innerHTML = `$${get.B_subtotal.toFixed(2)}`; //innerHTML= replace with
        tax.innerHTML = `$${get.B_tax.toFixed(2)}`;
        total.innerHTML = `$${get.B_total.toFixed(2)}`;

    }catch(error){
        console.error('Error:In getCart', error);
        loader.style.display='none';
        alert('fail to load cart')
    }

}

//change quantity
async function changeQuantity(productId, newQuantity){
    if(newQuantity <1){
        return alert('Quantity cannot be less than 1');
    }

    try{
        const wait = await fetch('http://localhost:3000/B_updateQuantity',{
            method:'PUT', //send data to backend
            headers:{'Content-Type':'application/json'},//application/json-->tells backend what type of data (JSON)
            body: JSON.stringify({ productId, newQuantity })//from javascript to JSON
        });

        const get= await wait.json();

        if(get.B_success){
            getCart(); //reload cart
        }else{
            alert('Failed to update quantity');
        }

    }catch(error){
        console.error('Error: In changeQuantity', error);
        alert('An error occurred while updating the quantity. Please try again later.');
    }
}

//remove from cart 
async function removeItem(productId){
    if(!confirm('Are you sure you want to remove this item?')){//confirm= popup to confirm-> built in function
        return;
    }
    try{
        const wait= await fetch(`http://localhost:3000/B_removefromcart/${productId}`,{
            method:'DELETE'

        });

        const get = await wait.json();
        if(get.B_success){ //backend sent success: true or false
            getCart(); //runs if true-> load cart 


        }else{
            alert('Failed to remove item from cart');
        }
    }catch(error){
        console.error('Error: In removeItem', error);
        alert('An error occurred while removing the item from the cart. Please try again later.');
    }

    
}


//go to checkout page
function goToCheckout(){
    window.location.href='checkout.html'; //window.location.href -> navigate to new page
}

//Load checkout page
async function loadCheckoutPage(){
    const loader = document.getElementById('f_loader');
    const emptyCart = document.getElementById('f_emptyCart');
    const checkoutContent = document.getElementById('f_checkoutContent');
    const orderItems = document.getElementById('f_orderItems');
    const subtotal = document.getElementById('f_subtotal');
    const tax = document.getElementById('f_tax');
    const total = document.getElementById('f_total');

    try{
        const wait = await fetch('http://localhost:3000/B_getcartitems',{
            method:'GET'
        });

        const get = await wait.json();
        loader.style.display = 'none';

        //check if cart is empty
        if(get.B_items.length === 0){
            emptyCart.style.display = 'block';
            return;
        }

        //display checkout form and order summary
        checkoutContent.style.display = 'flex';

        //display order items
        orderItems.innerHTML = '';
        get.B_items.forEach(item => {
            orderItems.innerHTML += `
                <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <div>
                        <strong>${item.B_name}</strong>
                        <br>
                        <small class="text-muted">Qty: ${item.B_quantity} × $${item.B_price.toFixed(2)}</small>
                    </div>
                    <span class="fw-bold">$${(item.B_price * item.B_quantity).toFixed(2)}</span>
                </div>
            `;
        });

        //display totals
        subtotal.innerHTML = `$${get.B_subtotal.toFixed(2)}`;
        tax.innerHTML = `$${get.B_tax.toFixed(2)}`;
        total.innerHTML = `$${get.B_total.toFixed(2)}`;

        //setup form submission
        setupCheckoutForm();

    }catch(error){
        console.error('Error: In loadCheckoutPage', error);
        loader.style.display = 'none';
        alert('Failed to load checkout page');
    }
}

//Setup checkout form
function setupCheckoutForm(){
    const form = document.getElementById('f_checkoutForm');
    const cardDetails = document.getElementById('f_cardDetails');
    const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');

    //Toggle card details based on payment method
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', function(){
            if(this.value === 'PayPal'){
                cardDetails.style.display = 'none';
            }else{
                cardDetails.style.display = 'block';
            }
        });
    });

    //Handle form submission
    form.addEventListener('submit', async function(e){
        e.preventDefault();

        //Get form data
        const formData = {
            fullName: document.getElementById('f_fullName').value,
            email: document.getElementById('f_email').value,
            phone: document.getElementById('f_phone').value,
            address: document.getElementById('f_address').value,
            city: document.getElementById('f_city').value,
            state: document.getElementById('f_state').value,
            zip: document.getElementById('f_zip').value,
            paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value
        };

        //Store customer info in sessionStorage for thank you page
        sessionStorage.setItem('customerInfo', JSON.stringify(formData));

        //Process checkout
        processCheckout();
    });
}

//Process checkout
async function processCheckout(){
    const placeOrderBtn = document.getElementById('f_placeOrderBtn');
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    try{
        const wait = await fetch('http://localhost:3000/B_checkout',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({})
        });

        const get = await wait.json();

        if(get.B_success){
            //Store order info for thank you page
            sessionStorage.setItem('orderInfo', JSON.stringify(get.B_order));
            //Redirect to thank you page
            window.location.href = 'thankyou.html';
        }else{
            alert('Checkout failed. Please try again.');
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerHTML = 'Place Order';
        }

    }catch(error){
        console.error('Error: In processCheckout', error);
        alert('An error occurred during checkout. Please try again later.');
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = 'Place Order';
    }
}


//Load thank you page
function loadThankYouPage(){
    const loader = document.getElementById('f_loader');
    const errorMessage = document.getElementById('f_errorMessage');
    const successMessage = document.getElementById('f_successMessage');

    //Get order and customer info from sessionStorage
    const orderInfo = JSON.parse(sessionStorage.getItem('orderInfo'));
    const customerInfo = JSON.parse(sessionStorage.getItem('customerInfo'));

    loader.style.display = 'none';

    //Check if order info exists
    if(!orderInfo || !customerInfo){
        errorMessage.style.display = 'block';
        return;
    }

    //Display success message
    successMessage.style.display = 'block';

    //Display order ID
    document.getElementById('f_orderId').innerText = `#${orderInfo.B_id}`;

    //Display customer info
    document.getElementById('f_customerEmail').innerText = customerInfo.email;
    document.getElementById('f_customerName').innerText = customerInfo.fullName;
    document.getElementById('f_customerPhone').innerText = customerInfo.phone;
    document.getElementById('f_customerAddress').innerText = 
        `${customerInfo.address}, ${customerInfo.city}, ${customerInfo.state} ${customerInfo.zip}`;
    document.getElementById('f_paymentMethod').innerText = customerInfo.paymentMethod;

    //Display order items
    const orderItemsBox = document.getElementById('f_orderItems');
    orderItemsBox.innerHTML = '';
    orderInfo.B_items.forEach(item => {
        orderItemsBox.innerHTML += `
            <div class="order-item">
                <div>
                    <h4>${item.B_name} × ${item.B_quantity}</h4>
                    <small class="text-muted">$${item.B_price.toFixed(2)} each</small>
                </div>
                <p>$${(item.B_price * item.B_quantity).toFixed(2)}</p>
            </div>
        `;
    });

    //Display totals
    document.getElementById('f_orderSubtotal').innerText = `$${orderInfo.B_subtotal.toFixed(2)}`;
    document.getElementById('f_orderTax').innerText = `$${orderInfo.B_tax.toFixed(2)}`;
    document.getElementById('f_orderTotal').innerText = `$${orderInfo.B_total.toFixed(2)}`;

    //Clear sessionStorage
    sessionStorage.removeItem('orderInfo');
    sessionStorage.removeItem('customerInfo');
}


//Initial function calls
document.addEventListener('DOMContentLoaded',()=>{ //addEventtListener-> wait for page to load before running code
    const currentPage=window.location.pathname;//checks which page were on and runs relevant functions

    if(currentPage.includes('index') || currentPage.includes('products') || currentPage === '/'){//index default page
        getProducts();
        updateCartBadge();
    }else if(currentPage.includes('cart')){
        getCart();

        //checkout button
        const checkoutButton=document.getElementById('f_checkoutButton');
        if(checkoutButton){
            checkoutButton.addEventListener('click', goToCheckout);
        }

        
    }else if(currentPage.includes('checkout')){
        loadCheckoutPage();
    }else if(currentPage.includes('thankyou')){
        loadThankYouPage();
    }
});
