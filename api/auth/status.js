const crypto=require('crypto');
function send(res,status,data){res.status(status).setHeader('Content-Type','application/json');res.end(JSON.stringify(data));}
function getCookie(req,name){
 const h=req.headers?.cookie||'';
 const pre=`${name}=`;
 for(const p of h.split(';')){const s=p.trim();if(s.startsWith(pre))return decodeURIComponent(s.slice(pre.length));}
 return '';
}
function valid(v){
 try{
  if(!process.env.SESSION_SECRET||!v)return false;
  const x=v.split('.'); if(x.length!==3)return false;
  const raw=`${x[0]}.${x[1]}`, exp=Number(x[1]);
  if(!Number.isFinite(exp)||exp<=Date.now())return false;
  const expected=crypto.createHmac('sha256',process.env.SESSION_SECRET).update(raw).digest('hex');
  const a=Buffer.from(expected),b=Buffer.from(x[2]);
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
 }catch{return false}
}
module.exports=async(req,res)=>{
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 return send(res,200,{authenticated:valid(getCookie(req,'deps_admin'))});
};
