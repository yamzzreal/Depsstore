import {CONFIG} from "./config.js";
export async function uploadImage(file,onProgress=()=>{}){
  if(!CONFIG.CLOUDINARY_CLOUD_NAME || !CONFIG.CLOUDINARY_UPLOAD_PRESET) throw new Error("Isi Cloudinary Cloud Name dan Unsigned Upload Preset.");
  const fd=new FormData(); fd.append("file",file); fd.append("upload_preset",CONFIG.CLOUDINARY_UPLOAD_PRESET);
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    xhr.open("POST",`https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY_CLOUD_NAME}/image/upload`);
    xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress(Math.round(e.loaded/e.total*100))};
    xhr.onload=()=>{try{const j=JSON.parse(xhr.responseText); if(xhr.status>=200&&xhr.status<300) resolve(j.secure_url); else reject(new Error(j.error?.message||"Upload gagal"))}catch(e){reject(e)}};
    xhr.onerror=()=>reject(new Error("Network error"));
    xhr.send(fd);
  });
}