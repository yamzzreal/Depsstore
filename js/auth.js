export async function isAdminSessionValid(){
 try{
  const r=await fetch('/api/auth/status',{cache:'no-store',credentials:'same-origin'});
  const j=await r.json().catch(()=>({}));
  return r.ok&&j.authenticated===true;
 }catch{return false;}
}
export async function loginAdmin(username,password){
 const r=await fetch('/api/auth/login',{
  method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',
  body:JSON.stringify({username,password})
 });
 const j=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(j.error||'Login gagal');
 return true;
}
export async function destroyAdminSession(){
 await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'}).catch(()=>{});
}
export async function requireAdminSession(){
 if(!(await isAdminSessionValid())){
  location.replace('/admin/login.html?expired=1');
  return false;
 }
 return true;
}
