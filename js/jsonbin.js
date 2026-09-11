const fallback={products:[],categories:['Website','Design','Source Code','Tools'],transactions:[],settings:{}};

function normalize(body){
 const b=body&&typeof body==='object'?body:{};
 return {
  ...fallback,...b,
  products:Array.isArray(b.products)?b.products:[],
  categories:Array.isArray(b.categories)?b.categories:fallback.categories,
  transactions:Array.isArray(b.transactions)?b.transactions:[],
  settings:b.settings&&typeof b.settings==='object'?b.settings:{}
 };
}

export async function getDB(){
 const r=await fetch('/api/store',{cache:'no-store',credentials:'same-origin'});
 const body=await r.json().catch(()=>({}));
 if(!r.ok) throw new Error(body.error||`Gagal membaca database (${r.status})`);
 return normalize(body);
}

export async function saveDB(db){
 const payload=normalize(db);
 const r=await fetch('/api/store',{
  method:'PUT',
  headers:{'Content-Type':'application/json'},
  credentials:'same-origin',
  body:JSON.stringify(payload)
 });
 const body=await r.json().catch(()=>({}));
 if(!r.ok) throw new Error(body.error||`Gagal menyimpan database (${r.status})`);
 return body;
}
