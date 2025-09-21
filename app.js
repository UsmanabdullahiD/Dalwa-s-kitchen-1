
/* Dalwa's Kitchen — client-side marketplace simulation using localStorage.
   Features:
   - Admin approves vendors/products and sets commission
   - Vendors register and post items (pending approval)
   - Buyers can search, add to cart, checkout (COD or simulated online)
   - Favorites, orders, simple ratings, and basic delivery status updates
*/

const STORAGE_KEY = 'dalwas_kitchen_v1';

// initialize default state if not present
function loadState(){
  let s = localStorage.getItem(STORAGE_KEY);
  if(!s){
    const initial = {
      settings: {commission: 5},
      vendors: [
        {id: 'vendor-1', name: "Khadija's Kitchen", location: "Local", approved: true},
        {id: 'vendor-2', name: "Naana's Cam", location: "City", approved: true}
      ],
      pendingVendors: [],
      products: [
        {id: 'p1', title: 'Loaded Awara', price: 800, category:'Food', location:'Local', vendorId:'vendor-1', approved:true, image:'https://picsum.photos/seed/awara/400/300', desc:'Loaded with sauce and pepper', featured:true, ratings:[]},
        {id: 'p2', title: 'Shawarma', price: 1200, category:'Food', location:'City', vendorId:'vendor-2', approved:true, image:'https://picsum.photos/seed/shawarma/400/300', desc:'Juicy shawarma wrap', featured:false, ratings:[]},
        {id: 'p3', title: 'Zobo Drink', price: 200, category:'Drinks', location:'Local', vendorId:'vendor-1', approved:true, image:'https://picsum.photos/seed/zobo/400/300', desc:'Refreshing zobo', featured:false, ratings:[]}
      ],
      pendingProducts: [],
      orders: [],
      transactions: [],
      nextIds: {vendor:3, product:4, order:1}
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(s);
}
function saveState(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

// utilities
function uid(prefix='id'){ return prefix + '-' + Math.random().toString(36).slice(2,9); }
function formatPrice(v){ return Number(v).toLocaleString(); }

// Render functions for pages
function renderFeatured(){
  const s = loadState();
  const container = document.getElementById('featured');
  if(!container) return;
  container.innerHTML = '';
  s.products.filter(p => p.featured && p.approved).forEach(p => {
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<img src="${p.image}" alt="${p.title}"><h3>${p.title}</h3><div>₦${formatPrice(p.price)}</div><button onclick="addToCart('${p.id}')">Add to cart</button>`;
    container.appendChild(el);
  });
}

// PRODUCTS / SHOP
function getQueryParam(name){
  const url = new URL(location.href);
  return url.searchParams.get(name);
}

function renderProducts(){
  const s = loadState();
  const q = document.getElementById('q') ? document.getElementById('q').value.toLowerCase() : '';
  const priceFilter = document.getElementById('price-filter') ? document.getElementById('price-filter').value : 'any';
  const loc = document.getElementById('location-filter') ? document.getElementById('location-filter').value : 'any';
  const catParam = getQueryParam('cat');

  let products = s.products.filter(p => p.approved);
  if(catParam) products = products.filter(p => p.category.toLowerCase() === catParam.toLowerCase());
  if(q) products = products.filter(p => p.title.toLowerCase().includes(q) || (p.desc && p.desc.toLowerCase().includes(q)));
  if(priceFilter !== 'any'){
    const [min,max] = priceFilter.split('-').map(Number);
    products = products.filter(p => p.price >= min && p.price <= max);
  }
  if(loc !== 'any') products = products.filter(p => p.location === loc);

  const container = document.getElementById('products');
  if(!container) return;
  container.innerHTML = '';
  products.forEach(p => {
    const vendor = s.vendors.find(v=>v.id===p.vendorId) || {name:'Unknown'};
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<img src="${p.image}" alt="${p.title}"><h3>${p.title}</h3>
      <div>₦${formatPrice(p.price)} • ${p.category} • ${p.location}</div>
      <div>${p.desc || ''}</div>
      <div style="margin-top:8px">
        <button onclick="addToCart('${p.id}')">Add to cart</button>
        <button onclick="favVendor('${p.vendorId}')">Fav seller</button>
        <button onclick="viewProduct('${p.id}')">View</button>
      </div>
      <div style="font-size:12px;margin-top:8px;color:#666">Seller: ${vendor.name}</div>`;
    container.appendChild(card);
  });
}

// CART
function _getCart(){ return JSON.parse(localStorage.getItem('dk_cart')||'[]'); }
function _setCart(c){ localStorage.setItem('dk_cart', JSON.stringify(c)); updateCartCount(); renderCart(); }

function addToCart(pid){
  const s = loadState();
  const p = s.products.find(x=>x.id===pid);
  if(!p){ alert('Product not found'); return; }
  const cart = _getCart();
  const existing = cart.find(x=>x.id===pid);
  if(existing) existing.qty++;
  else cart.push({id:pid, qty:1, title:p.title, price:p.price, vendorId:p.vendorId});
  _setCart(cart);
  alert('Added to cart');
}

function updateCartCount(){
  const el = document.getElementById('cart-count');
  if(el) el.textContent = _getCart().reduce((a,b)=>a+b.qty,0);
}

function renderCart(){
  const el = document.getElementById('cart-items');
  if(!el) return;
  const cart = _getCart();
  if(cart.length===0){ el.innerHTML = '<div>No items</div>'; document.getElementById('cart-total').innerText=0; return; }
  el.innerHTML = '';
  let total=0;
  cart.forEach(item=>{
    total += item.price * item.qty;
    const row = document.createElement('div');
    row.style.marginBottom='8px';
    row.innerHTML = `<div>${item.title} x ${item.qty} — ₦${formatPrice(item.price*item.qty)}
      <button style="margin-left:8px" onclick="changeQty('${item.id}', -1)">-</button>
      <button onclick="changeQty('${item.id}', 1)">+</button>
      <button onclick="removeFromCart('${item.id}')">Remove</button>
    </div>`;
    el.appendChild(row);
  });
  document.getElementById('cart-total').innerText = total;
}

function changeQty(pid, delta){
  const cart = _getCart();
  const item = cart.find(i=>i.id===pid);
  if(!item) return;
  item.qty += delta;
  if(item.qty<=0) _setCart(cart.filter(i=>i.id!==pid));
  else _setCart(cart);
  renderCart();
}

function removeFromCart(pid){
  const cart = _getCart().filter(i=>i.id!==pid);
  _setCart(cart);
  renderCart();
}

// Checkout
function checkout(){
  const cart = _getCart();
  if(cart.length===0){ alert('Cart empty'); return; }
  const buyer = JSON.parse(localStorage.getItem('dk_buyer') || 'null');
  if(!buyer){ alert('Please login as a buyer on Buyer Account page'); return; }
  const payMethod = document.querySelector('input[name="pay"]:checked').value;
  const s = loadState();
  const orderId = 'O' + s.nextIds.order++;
  const total = cart.reduce((a,b)=>a + b.price*b.qty,0);
  const commission = s.settings.commission || 0;
  const tx = {id: 'T' + Date.now(), orderId, buyer: buyer.name, total, method: payMethod, date: new Date().toISOString()};
  s.transactions.push(tx);
  const order = {id: orderId, items: cart, buyer: buyer.name, status: payMethod==='cod' ? 'Pending (COD)' : 'Paid', total, date: new Date().toISOString()};
  s.orders.push(order);
  // assign to vendor orders (client-side)
  saveState(s);
  _setCart([]);
  document.getElementById('checkout-msg').innerText = 'Order placed: ' + orderId + ' — ' + order.status;
  renderAdmin();
  renderVendor();
  renderBuyer();
}

// ADMIN
function renderAdmin(){
  const s = loadState();
  const pv = document.getElementById('pending-vendors');
  if(pv){
    pv.innerHTML = '';
    s.pendingVendors.forEach(v=>{
      const d = document.createElement('div'); d.className='card';
      d.innerHTML = `<strong>${v.name}</strong> • ${v.location}
        <div><button onclick="approveVendor('${v.id}')">Approve</button> <button onclick="rejectVendor('${v.id}')">Reject</button></div>`;
      pv.appendChild(d);
    });
  }
  const pp = document.getElementById('pending-products');
  if(pp){
    pp.innerHTML = '';
    s.pendingProducts.forEach(p=>{
      const d = document.createElement('div'); d.className='card';
      const vendor = s.pendingVendors.concat(s.vendors).find(v=>v.id===p.vendorId) || {name:'Unknown'};
      d.innerHTML = `<strong>${p.title}</strong> by ${vendor.name} • ₦${formatPrice(p.price)} <div>${p.desc || ''}</div>
        <div><button onclick="approveProduct('${p.id}')">Approve</button> <button onclick="rejectProduct('${p.id}')">Reject</button></div>`;
      pp.appendChild(d);
    });
  }
  const comm = document.getElementById('commission');
  if(comm) comm.value = s.settings.commission || 0;
  const txEl = document.getElementById('transactions');
  if(txEl){
    txEl.innerHTML = s.transactions.map(t=>`<div class="card">#${t.id} ${t.method} ₦${formatPrice(t.total)} by ${t.buyer} on ${new Date(t.date).toLocaleString()}</div>`).join('');
  }
}

function approveVendor(id){
  const s = loadState();
  const idx = s.pendingVendors.findIndex(v=>v.id===id);
  if(idx===-1) return;
  const v = s.pendingVendors.splice(idx,1)[0];
  v.approved = true; s.vendors.push(v);
  saveState(s); renderAdmin(); alert('Vendor approved');
}
function rejectVendor(id){
  const s = loadState();
  s.pendingVendors = s.pendingVendors.filter(v=>v.id!==id);
  saveState(s); renderAdmin();
}

function approveProduct(id){
  const s = loadState();
  const idx = s.pendingProducts.findIndex(p=>p.id===id);
  if(idx===-1) return;
  const p = s.pendingProducts.splice(idx,1)[0];
  p.approved = true; s.products.push(p);
  saveState(s); renderAdmin(); alert('Product approved');
}
function rejectProduct(id){
  const s = loadState();
  s.pendingProducts = s.pendingProducts.filter(p=>p.id!==id);
  saveState(s); renderAdmin();
}

function saveSettings(){
  const s = loadState();
  const val = Number(document.getElementById('commission').value) || 0;
  s.settings.commission = val;
  saveState(s);
  document.getElementById('settings-msg').innerText = 'Saved';
}

// VENDOR
function registerVendor(){
  const name = document.getElementById('vendor-name').value.trim();
  const location = document.getElementById('vendor-location').value.trim() || 'Local';
  if(!name){ document.getElementById('vendor-register-msg').innerText='Enter name'; return; }
  const s = loadState();
  const v = {id: 'vendor-' + s.nextIds.vendor++, name, location, approved:false};
  s.pendingVendors.push(v); saveState(s);
  document.getElementById('vendor-register-msg').innerText = 'Registered (pending admin approval)';
  renderVendor();
}

function postItem(){
  const s = loadState();
  const title = document.getElementById('item-title').value.trim();
  const price = Number(document.getElementById('item-price').value) || 0;
  const category = document.getElementById('item-category').value.trim() || 'Food';
  const location = document.getElementById('item-location').value.trim() || 'Local';
  const img = document.getElementById('item-image').value.trim() || 'https://picsum.photos/seed/' + Math.floor(Math.random()*1000) + '/400/300';
  const desc = document.getElementById('item-desc').value.trim();
  if(!title || price<=0){ document.getElementById('post-msg').innerText='Title and price required'; return; }
  // vendor must be logged (in this demo we assume vendor selects their name from pending or approved)
  const vendorName = prompt('Enter your vendor ID (from registration confirmation). Example: vendor-3') || '';
  if(!vendorName){ document.getElementById('post-msg').innerText='Vendor ID required'; return; }
  const product = {id: 'p' + s.nextIds.product++, title, price, category, location, image:img, desc, vendorId:vendorName, approved:false, featured:false, ratings:[]};
  s.pendingProducts.push(product); saveState(s);
  document.getElementById('post-msg').innerText = 'Posted (pending admin approval)';
  renderVendor();
}

function renderVendor(){
  const s = loadState();
  const vp = document.getElementById('vendor-products');
  if(vp){
    // show approved products grouped by vendor
    const vendorId = prompt('Enter your vendor id to manage (or leave blank to view all)') || '';
    let products = s.products.filter(p=> p.vendorId===vendorId || vendorId==='');
    if(products.length===0) vp.innerHTML = '<div>No products (or none for this vendor id)</div>';
    else vp.innerHTML = products.map(p=>`<div class="card"><strong>${p.title}</strong> ₦${formatPrice(p.price)} • ${p.approved ? 'Approved' : 'Pending'} <div><button onclick="changePrice('${p.id}')">Change price</button> <button onclick="toggleFeatured('${p.id}')">Toggle Featured</button></div></div>`).join('');
  }
  const ordersEl = document.getElementById('vendor-orders');
  if(ordersEl){
    ordersEl.innerHTML = s.orders.map(o=>`<div class="card">Order ${o.id} • ${o.status} • ₦${formatPrice(o.total)} <div>Items: ${o.items.map(i=>i.title+' x'+i.qty).join(', ')}</div></div>`).join('');
  }
}

// Vendor helpers
function changePrice(pid){
  const s = loadState();
  const p = s.products.find(x=>x.id===pid);
  if(!p){ alert('Not found'); return; }
  const v = Number(prompt('New price', p.price));
  if(isNaN(v) || v<=0) return;
  p.price = v; saveState(s); renderVendor(); renderProducts();
}
function toggleFeatured(pid){
  const s = loadState();
  const p = s.products.find(x=>x.id===pid);
  if(!p) return;
  p.featured = !p.featured; saveState(s); renderFeatured();
}

// BUYER
function loginBuyer(){
  const name = document.getElementById('buyer-name').value.trim();
  if(!name){ document.getElementById('buyer-msg').innerText='Enter name'; return; }
  localStorage.setItem('dk_buyer', JSON.stringify({name}));
  document.getElementById('buyer-msg').innerText = 'Logged in as ' + name;
  renderBuyer();
}

function renderBuyer(){
  const favEl = document.getElementById('favorites');
  const pastEl = document.getElementById('past-orders');
  const buyer = JSON.parse(localStorage.getItem('dk_buyer') || 'null');
  const s = loadState();
  if(favEl){
    const favIds = JSON.parse(localStorage.getItem('dk_favs') || '[]');
    favEl.innerHTML = favIds.map(id=>{
      const v = s.vendors.find(x=>x.id===id) || {name:'Unknown'};
      return `<div class="card">${v.name} • ${v.location}</div>`;
    }).join('') || '<div>No favorites</div>';
  }
  if(pastEl){
    pastEl.innerHTML = s.orders.filter(o=> !buyer || o.buyer===buyer.name).map(o=>`<div class="card">${o.id} • ${o.status} • ₦${formatPrice(o.total)}<div>Items: ${o.items.map(i=>i.title+' x'+i.qty).join(', ')}</div></div>`).join('') || '<div>No past orders</div>';
  }
}

// Favorites
function favVendor(vid){
  const favs = JSON.parse(localStorage.getItem('dk_favs') || '[]');
  if(!favs.includes(vid)) favs.push(vid);
  localStorage.setItem('dk_favs', JSON.stringify(favs));
  alert('Seller saved to favorites');
  renderBuyer();
}

// View product placeholder
function viewProduct(id){
  const s = loadState();
  const p = s.products.find(x=>x.id===id);
  if(!p){ alert('Not found'); return; }
  alert(p.title + '\nPrice: ₦' + formatPrice(p.price) + '\n' + p.desc);
}

// Simple delivery tracking placeholder
function updateDelivery(orderId, status){
  const s = loadState();
  const o = s.orders.find(x=>x.id===orderId);
  if(!o) return;
  o.status = status; saveState(s); renderAdmin(); renderVendor(); renderBuyer();
}

// small helpers to expose in browser console
window.renderProducts = renderProducts;
window.addToCart = addToCart;
window.updateCartCount = updateCartCount;
window.renderCart = renderCart;
window.checkout = checkout;
window.renderAdmin = renderAdmin;
window.registerVendor = registerVendor;
window.postItem = postItem;
window.renderVendor = renderVendor;
window.renderBuyer = renderBuyer;
window.favVendor = favVendor;
window.viewProduct = viewProduct;
window.changeQty = changeQty;
window.removeFromCart = removeFromCart;
window.toggleFeatured = toggleFeatured;
window.approveVendor = approveVendor;
window.approveProduct = approveProduct;
window.updateDelivery = updateDelivery;

// Initialize
loadState();
renderFeatured();
renderCart();
renderProducts();
renderAdmin();
renderVendor();
renderBuyer();


// --- ADMIN AUTH (added) ---
function getAdminCreds(){
  // default admin creds (set by user request)
  const stored = JSON.parse(localStorage.getItem('dk_admin') || 'null');
  if(stored) return stored;
  const defaultAdmin = {email: 'admin@gmail.com', password: '12345678'};
  localStorage.setItem('dk_admin', JSON.stringify(defaultAdmin));
  return defaultAdmin;
}

function adminLogin(){
  const email = document.getElementById('admin-email').value.trim();
  const pwd = document.getElementById('admin-password').value;
  const creds = getAdminCreds();
  if(email === creds.email && pwd === creds.password){
    sessionStorage.setItem('dk_admin_logged_in', '1');
    document.getElementById('admin-login-msg').innerText = 'Logged in';
    renderAdmin(); // show dashboard
  } else {
    document.getElementById('admin-login-msg').innerText = 'Invalid email or password';
  }
}

function adminLogout(){
  sessionStorage.removeItem('dk_admin_logged_in');
  // reload admin page to show login form
  location.reload();
}

function isAdminLoggedIn(){
  return sessionStorage.getItem('dk_admin_logged_in') === '1';
}

// Ensure renderAdmin only shows content when logged in
const __orig_renderAdmin = typeof renderAdmin === 'function' ? renderAdmin : null;
function renderAdmin(){
  // If original renderAdmin logic exists (it was defined earlier), call it but only if logged in
  const root = document.getElementById('admin-root');
  if(!isAdminLoggedIn()){
    if(root) root.innerHTML = `
      <div style="max-width:420px;margin:12px auto;">
        <h3>Admin Login</h3>
        <input id="admin-email" placeholder="Email" />
        <input id="admin-password" placeholder="Password" type="password" />
        <button onclick="adminLogin()">Login</button>
        <div id="admin-login-msg" style="color:red;margin-top:8px"></div>
        <div style="margin-top:12px"><small>Default admin: admin@gmail.com / 12345678</small></div>
      </div>
    `;
    return;
  }
  // when logged in, show full admin UI (call previously defined logic if present)
  if(__orig_renderAdmin){
    __orig_renderAdmin();
    // add logout button
    if(root){
      const logoutBtn = document.createElement('div');
      logoutBtn.style.marginTop = '12px';
      logoutBtn.innerHTML = '<button onclick="adminLogout()">Logout</button>';
      root.parentNode.insertBefore(logoutBtn, root.nextSibling);
    }
  } else {
    // fallback: simple message
    if(root) root.innerHTML = '<div>Admin area (logged in)</div>';
  }
}
// --- end admin auth ---
