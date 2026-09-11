# DEPS STORE — Vercel Ready

Static frontend + Vercel Functions dengan JSONBin sebagai database dan Cloudinary untuk gambar produk.

## Deploy ke Vercel

1. Upload repository/project ke GitHub atau import ZIP ke Vercel.
2. Set Environment Variables di Vercel:
   - `JSONBIN_BIN_ID`
   - `JSONBIN_ACCESS_KEY` (untuk read; optional jika memakai Master Key)
   - `JSONBIN_MASTER_KEY` (untuk write)
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET` (string acak panjang, minimal 32 karakter)
3. Isi `js/config.js` hanya untuk Cloudinary:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_UPLOAD_PRESET`
4. Deploy.
5. Login admin melalui `/admin/login.html`.

## Perubahan keamanan
- JSONBin Master Key tidak lagi disimpan di frontend.
- Semua operasi tulis JSONBin melewati `/api/store`.
- Login diverifikasi server-side lewat `/api/auth/login`.
- Session admin memakai cookie `HttpOnly + Secure + SameSite=Lax` dan berlaku 8 jam.
- Dashboard memeriksa session server-side sebelum dibuka.

## Catatan
Cloudinary unsigned upload preset dan Cloud Name memang dapat berada di frontend. Jangan pernah menaruh Cloudinary API Secret atau JSONBin Master Key di file frontend.
