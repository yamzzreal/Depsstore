import {getDB} from "./jsonbin.js";
const money=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
function card(p){return `<article class="card"><div class="thumb">${p.image?`<img src="${p.image}" alt="${p.name||""}" loading="lazy">`:`<span class="material-symbols-outlined placeholder">inventory_2</span>`}</div><div class="info"><div class="cat">${p.category||"Lainnya"}</div><div class="name">${p.name||"Produk"}</div><div class="desc">${p.description||"Produk digital berkualitas dari DEPS STORE."}</div><div class="bottom"><div><div class="price">${money(p.price)}</div><div class="stock">● ${Number(p.stock)>0?`Stok ${p.stock}`:"Habis"}</div></div><button class="btn" onclick="location.href='transaksi.html?product=${encodeURIComponent(p.id||"")}'"><span class="material-symbols-outlined">shopping_cart</span></button></div></div></article>`}
function renderFooter(db){const x=db.settings||{};const d=x.storeDescription||"Store digital dengan produk berkualitas dan pengalaman belanja yang sederhana.";const a=x.aboutUs||"DEPS STORE menyediakan berbagai produk digital untuk kebutuhan kamu.";const about=$("#aboutText"),fa=$("#footerAbout");if(about)about.textContent=d;if(fa)fa.textContent=a;const w=$("#waLink"),wt=$("#waText");if(w&&x.whatsapp){w.href=`https://wa.me/${x.whatsapp}`;wt.textContent=x.whatsappLabel||"Chat WhatsApp";}else if(w){w.removeAttribute("href");wt.textContent="WhatsApp CS belum diatur"}const socials=$("#socials");if(socials){const arr=[["instagram","Instagram","photo_camera"],["telegram","Telegram","send"],["tiktok","TikTok","music_note"],["youtube","YouTube","play_circle"]];const active=arr.filter(([k])=>x[k]);socials.innerHTML=active.length?active.map(([k,n,ic])=>`<a class="social" href="${x[k]}" target="_blank" rel="noopener"><span class="material-symbols-outlined">${ic}</span><small>${n}</small></a>`).join(""):'<span class="footer-muted">Belum diatur</span>'}}
async function render(){
 const grid=document.querySelector("#productGrid"); if(!grid)return;
 try{
 const db=await getDB();
 renderFooter(db);
 let ps=db.products||[]; const q=(document.querySelector("#search")?.value||"").toLowerCase(), c=document.querySelector("#category")?.value||"";
 ps=ps.filter(p=>(!q||`${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q))&&(!c||p.category===c));
 grid.innerHTML=ps.length?ps.map(card).join(""):`<div class="empty">Belum ada produk. Tambahkan produk dari dashboard admin.</div>`;
 const sel=document.querySelector("#category"); if(sel && !sel.dataset.loaded){(db.categories||[]).forEach(x=>sel.insertAdjacentHTML("beforeend",`<option>${x}</option>`));sel.dataset.loaded="1"}
 }catch(e){
 console.error("DEPS STORE JSONBin:",e);
 grid.innerHTML=`<div class="empty">${e.message}</div>`;
}
}
document.querySelector("#search")?.addEventListener("input",render);document.querySelector("#category")?.addEventListener("change",render);render();