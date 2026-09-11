const crypto=require('crypto');
function send(res,status,data){res.status(status).setHeader('Content-Type','application/json');res.end(JSON.stringify(data));}
function safeEqual(a,b){
 const aa=Buffer.from(String(a)),bb=Buffer.from(String(b));
 return aa.length===bb.length && crypto.timingSafeEqual(aa,bb);
}
function sign(raw){return crypto.createHmac('sha256',process.env.SESSION_SECRET).update(raw).digest('hex');}
module.exports=async(req,res)=>{
 if(req.method!=='POST') return send(res,405,{error:'Method not allowed'});
 const u=process.env.ADMIN_USERNAME, p=process.env.ADMIN_PASSWORD, s=process.env.SESSION_SECRET;
 if(u===undefined||p===undefined||s===undefined) return send(res,500,{error:'ENV ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET belum lengkap.'});
 const body=req.body||{}, username=String(body.username??''), password=String(body.password??'');
 if(!safeEqual(username,String(u))||!safeEqual(password,String(p))) return send(res,401,{error:'Username atau password salah.'});
 const exp=Date.now()+8*60*60*1000;
 const raw=`${crypto.randomBytes(32).toString('hex')}.${exp}`;
 const token=`${raw}.${sign(raw)}`;
 res.setHeader('Set-Cookie',`deps_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`);
 return send(res,200,{ok:true});
};
