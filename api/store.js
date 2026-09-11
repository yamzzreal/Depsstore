const JSONBIN_BASE = 'https://api.jsonbin.io/v3/b';

function send(res, status, data) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function cookie(req, name) {
  const h = req.headers?.cookie || '';
  const prefix = `${name}=`;
  for (const p of h.split(';')) {
    const s = p.trim();
    if (s.startsWith(prefix)) return decodeURIComponent(s.slice(prefix.length));
  }
  return '';
}

function validSession(value) {
  const crypto = require('crypto');
  try {
    if (!process.env.SESSION_SECRET || !value) return false;
    const parts=value.split('.');
    if(parts.length!==3) return false;
    const raw=`${parts[0]}.${parts[1]}`;
    const exp=Number(parts[1]);
    if(!Number.isFinite(exp)||exp<=Date.now()) return false;
    const expected=crypto.createHmac('sha256',process.env.SESSION_SECRET).update(raw).digest('hex');
    const a=Buffer.from(expected), b=Buffer.from(parts[2]);
    return a.length===b.length && crypto.timingSafeEqual(a,b);
  } catch { return false; }
}

async function jsonbin(method, body) {
  if (!process.env.JSONBIN_BIN_ID) throw new Error('JSONBIN_BIN_ID belum diatur di Vercel.');
  const key = process.env.JSONBIN_MASTER_KEY || process.env.JSONBIN_ACCESS_KEY;
  if (!key) throw new Error('JSONBIN_MASTER_KEY atau JSONBIN_ACCESS_KEY belum diatur di Vercel.');

  const headers = {
    'Content-Type':'application/json',
    'X-Bin-Meta':'false'
  };
  if (process.env.JSONBIN_MASTER_KEY) headers['X-Master-Key']=process.env.JSONBIN_MASTER_KEY;
  else headers['X-Access-Key']=process.env.JSONBIN_ACCESS_KEY;

  const r = await fetch(`${JSONBIN_BASE}/${process.env.JSONBIN_BIN_ID}${method==='GET' ? '/latest' : ''}`, {
    method, headers, ...(body === undefined ? {} : {body:JSON.stringify(body)})
  });
  const text=await r.text();
  let data={};
  try { data=JSON.parse(text); } catch {}
  if(!r.ok) throw new Error(data?.message || data?.error || `JSONBin HTTP ${r.status}`);
  return data?.record ?? data;
}

module.exports=async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.method==='GET'){
    try {
      const record=await jsonbin('GET');
      return send(res,200,record);
    } catch(e) {
      return send(res,502,{error:`Gagal membaca JSONBin: ${e.message}`});
    }
  }
  if(req.method==='PUT'){
    if(!validSession(cookie(req,'deps_admin'))) return send(res,401,{error:'Session admin tidak valid.'});
    try {
      const body=req.body;
      if(!body || typeof body!=='object') return send(res,400,{error:'Data database tidak valid.'});
      const record=await jsonbin('PUT',body);
      return send(res,200,{ok:true,record});
    } catch(e) {
      return send(res,502,{error:`Gagal menyimpan JSONBin: ${e.message}`});
    }
  }
  return send(res,405,{error:'Method not allowed'});
};
