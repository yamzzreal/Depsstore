module.exports=async(req,res)=>{
 if(req.method!=='POST'){res.status(405).json({error:'Method not allowed'});return;}
 res.setHeader('Set-Cookie','deps_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
 res.status(200).json({ok:true});
};