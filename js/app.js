const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const money=n=>'$'+Number(n).toFixed(2);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get:(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v===null?d:v}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};

/* ---- XML products ---- */
async function loadProducts(){
  const res=await fetch('data/products.xml');
  if(!res.ok)throw new Error('Could not load products.xml');
  const xml=new DOMParser().parseFromString(await res.text(),'application/xml');
  const t=(e,n)=>e.querySelector(n).textContent.trim();
  return $$('product',xml).map(p=>({id:+p.getAttribute('id'),name:t(p,'name'),category:t(p,'category'),
    price:parseFloat(t(p,'price')),icon:t(p,'icon'),rating:parseFloat(t(p,'rating')),description:t(p,'description')}));
}
const fail=sel=>()=>{$(sel).innerHTML='<p class="empty">Could not load products. Open the site through a web server (GitHub Pages, VS Code Live Server or <code>python -m http.server</code>).</p>'};

/* ---- cart ---- */
const getCart=()=>store.get('cart',{});
const cartCount=()=>Object.values(getCart()).reduce((a,b)=>a+b,0);
function updateBadge(){const b=$('#cart-count');if(b)b.textContent=cartCount()}
function addToCart(id,qty=1){const c=getCart();c[id]=(c[id]||0)+qty;store.set('cart',c);updateBadge();toast('Added to cart ✔')}
function totals(items){const subtotal=items.reduce((s,i)=>s+i.price*i.qty,0),shipping=subtotal===0||subtotal>=100?0:5.99,tax=subtotal*.08;
  return{subtotal,shipping,tax,total:subtotal+shipping+tax}}
const summaryHTML=t=>`<div class="line"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
<div class="line"><span>Shipping</span><span>${t.shipping?money(t.shipping):'Free'}</span></div>
<div class="line"><span>Tax (8%)</span><span>${money(t.tax)}</span></div>
<div class="line total"><span>Total</span><span>${money(t.total)}</span></div>`;
function toast(m){const d=document.createElement('div');d.className='toast';d.textContent=m;document.body.append(d);setTimeout(()=>d.remove(),1800)}

/* ---- product card ---- */
const stars=r=>'★'.repeat(Math.round(r))+'☆'.repeat(5-Math.round(r));
const card=p=>`<article class="card product"><a class="thumb" href="product.html?id=${p.id}">${p.icon}</a><div class="body"><small>${esc(p.category)}</small>
<h3><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3><div class="stars">${stars(p.rating)} <span>${p.rating}</span></div>
<div class="row"><strong>${money(p.price)}</strong><button class="btn sm" data-add="${p.id}">Add to cart</button></div></div></article>`;
document.addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(b)addToCart(+b.dataset.add)});

/* ---- auth ---- */
async function hash(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}

/* ---- shared header / footer ---- */
function renderLayout(active){
  const user=store.get('session',null),link=(h,l)=>`<a href="${h}" class="${active===h?'active':''}">${l}</a>`;
  $('#site-header').innerHTML=`<div class="container nav"><a class="logo" href="index.html">Shop<span>Easy</span></a>
  <nav>${link('index.html','Home')}${link('products.html','Products')}${link('contact.html','Contact')}</nav>
  <div class="nav-right">${user?`<span class="hello">Hi, ${esc(user.name)}</span><a href="#" id="logout">Logout</a>`:link('login.html','Login / Register')}
  <a class="cart-link" href="cart.html">🛒 Cart <b id="cart-count">0</b></a></div></div>`;
  $('#site-footer').innerHTML=`<div class="container foot"><span>© 2026 ShopEasy. All rights reserved.</span>
  <div><a href="index.html">Home</a><a href="products.html">Products</a><a href="cart.html">Cart</a><a href="contact.html">Contact</a></div></div>`;
  const lo=$('#logout');if(lo)lo.onclick=e=>{e.preventDefault();localStorage.removeItem('session');location.href='index.html'};
  updateBadge();
}
