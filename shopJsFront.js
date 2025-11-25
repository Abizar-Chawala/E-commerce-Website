
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
        productsBox.style.display='block'; //show products box in block: default full width


        //displays products 
        productsBox.innerHTML=''; //clear products box before adding products
        get.B_products.forEach(product=>{
            productsBox.innerHTML+=
            `
                <div class = "product-box">
                    <image scr="${product.B_image}" alt =${product.B_name}/> 
                    <h3>${product.B_name}</h3>
                    <p class="price">$${product.B_price.toFixed(2)}</p> 
                    <button onclick="addToCart(${product.B_id})">Add to Cart</button>
                </div>
            `;//${}=js variable -> $${product.price.toFixed(2)}= 2 decimal places
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








//Shoping cart
async function getCart(){
    const loader=document.getElementById('f_loader');
    const emptyMessage=document.getElementById('f_emptyMessage');
    const ordercontent=document.getElementById('f_ordercontent'); //oerder summary ex total price
    const cartItemsBox=document.getElementById('f_cartItemsBox');//Items added to cart 
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
        cartItemsBox.style.display='block'; 
        cartItemsBox.innerHTML=''; //clear cart items box before adding items
        get.B_items.forEach(item =>{ //B_items= items from backend.loop through each item
            cartItemsBox.innerHTML+= //crerating an html to add to cart items box from backend data (user chooses)

            //make css 
            `
                <div class="cart-items">
                    <image scr="${item.B_image}" alt="${item.B_name}">
                    <div>
                        <h4>${item.B_name}</h4>
                        <p>$${item.B_price.toFixed(2)}</p>
                    </div>
                    <div>
                        <button onclick="changeQuantity(${item.B__id},${item.B_quantity - 1})">-</button>
                        <span>${item.B_quantity}</span>
                        <button onclick="changeQuantity(${item.B__id},${item.B_quantity + 1})">+</button>
                    </div>
                </div>
            `;
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
            method:'put', //send data to backend
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
    if(!confirm('you sure you want to remove item??'))//confirm= popup to confirm-> built in function

    try{
        const wait= await fetch('http://localhost:3000/B_removefromcart',{
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





//checkout page
async function checkout(){
    const loadermessage=document.getElementById('f_loadermessage');
    const checkoutMessage=document.getElementById('f_checkoutMessage');
    const errorMessage= document.getElementById('f_errorMessage');

    loader.style.display='block';//show loader 

    try{
        const wait=await fetch('http://localhost:3000/B_checkout',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
                //??
                //name: checkoutform.f_name.value,
                //address: checkoutform.f_address.value,
                //paymentMethod: checkoutform.f_paymentMethod.value
                //??
            })


        });

        const get=await wait.json();

        if(get.B_success){
            loadermessage.style.display='none';
            checkoutMessage.style.display='block';

            //display order 
            displayOrder(get.B_order);

        }else{
            loadermessage.style.display='none';
            errorMessage.style.display='block';
            alert('Checkout failed. Please try again.');
        }
    }catch(error){
        console.error('Error: In checkout', error);
        loadermeassage.style.display='none';
        errorMessage.style.display='block';
        alert('An error occurred during checkout. Please try again later.');
    }



}

//display order summary
function displayOrder(B_order){
    const productId=document.getElementById('f_orderProductId');
    const productbox=document.getElementById('f_orderProductbox');
    const orderSubtotal=document.getElementById('f_orderSubtotal');
    const orderTax=document.getElementById('f_orderTax');
    const orderTotal=document.getElementById('f_orderTotal');

    //display order info
    //dont need
    productId.innerHTML=`#${B_order.B_id}`;//order id from backend

    //display ordered Items 
    productbox.innerHTML='';//clear before adding items
    B_order.B_items.ForEach(itme=>{ //loop through each item of ordered items
        productbox.innerHTML+=
        `
            <div class="order-item">
                <h4>${item.B_name} x ${item.B_quantity}</h4>
                <p>$${(item.B_price * item.B_quantity).toFixed(2)}</p>
            </div>
        `

    });

    //display totals
    orderSubtotal.innerHTML=`$${B_order.B_subtotal.toFixed(2)}`;//B_order.B_subtotal-> data from inside of object
    orderTax.innerHTML=`$${B_order.B_tax.toFixed(2)}`;
    orderTotal.innerHTML=`$${B_order.B_total.toFixed(2)}`;



}



//Check cart has items before checkout
async function checkCart(){
    try{
        const wait = await fetch('http://localhost:3000/B_getcartcount',{
            method:'GET'//get data from backend

        });

        const get=await wait.json();

        if(get.B_items.length===0){
            alert('Your cart is empty. Please add items to your cart before proceeding to checkout.');
            window.location.href='cart.html'; //redirect to cart page
            return;
        }

        checkout(); //proceed to checkout if cart has items

    }catch(error){
        console.error('Error: In checkCart', error);
        alert('An error occurred while checking the cart. Please try again later.');
    }
}

//Initial function calls
document.addEventListener('DOMContentLoaded',()=>{ //addEventtListener-> wait for page to load before running code
    const currentPage=window.location.pathname;//checks which page were on and runs relevant functions

    if(currentPage.includes('index')|| currentPage.includes('products')){//index default page
        getProducts();
        updateCartBadge();
    }else if(currentPage.includes('cart')){
        getCart();

        //checkout button
        const checkoutButton=document.getElementById('f_checkoutButton');
        if(checkoutButton){
            checkoutButton.addEventListener('click',checkCart);
        }

        
    }else if(currentPage.includes('checkout')){
        checkCart();
    }
});