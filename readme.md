# 📲 WhatsApp API Server (Node.js + whatsapp-web.js)

Bangun API WhatsApp otomatis menggunakan Node.js & [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) **tanpa biaya pihak ketiga**.  
Cukup scan QR dan mulai kirim pesan ke nomor atau grup lewat endpoint Express.

---

## 🚀 Fitur Utama

- ✅ Kirim pesan ke nomor WhatsApp
- 👥 Kirim pesan ke grup berdasarkan nama
- 📩 Ambil pesan terakhir dari nomor atau grup
- 📋 Ambil daftar anggota grup
- 🔎 Endpoint `health-check` untuk monitoring
- 📷 QR code otomatis muncul di terminal (via `qrcode-terminal`)

---

## 📦 Instalasi

```bash
git clone https://github.com/username/whatsapp-api-server.git
cd whatsapp-api-server

npm install
node index.js

## 🧠 Catatan
-  Jangan jalankan server ini di production tanpa autentikasi API.
- Sesi login disimpan secara lokal menggunakan LocalAuth, jadi kamu tidak perlu scan QR setiap kali server dijalankan.
- Tool ini membutuhkan browser headless (puppeteer), jadi tidak bisa di-deploy di Vercel/Railway.
- Gunakan VPS atau server lokal untuk hasil terbaik.