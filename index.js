const { Client, LocalAuth } = require('whatsapp-web.js');
//const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');  // Hanya perlu satu import qrcode
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3030;

let qrCodeImage = null;

app.use(bodyParser.json());

// Inisialisasi WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
});

client.on('qr', async (qr) => {
    console.log('QR code terdeteksi, sedang dibuat base64...');
    try {
        qrCodeImage = await QRCode.toDataURL(qr);
        console.log('QR base64 berhasil dibuat!');
        console.log(qrCodeImage);
    } catch (err) {
        console.error('Gagal generate QR base64:', err);
    }
});

client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
});


app.get('/health-check', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'API WhatsApp aktif dan berjalan dengan baik' });
});

app.get('/qr', (req, res) => {
    if (!qrCodeImage) return res.status(404).send('QR belum tersedia');
    res.send(`<img src="${qrCodeImage}" />`);
});

// API endpoint kirim pesan
app.post('/send-message', async (req, res) => {
    const { nomor, pesan } = req.body;

    if (!nomor || !pesan) {
        return res.status(400).json({ success: false, message: 'Nomor dan pesan wajib diisi' });
    }

    const chatId = nomor + '@c.us';

    try {
        await client.sendMessage(chatId, pesan);
        return res.status(200).json({ success: true, message: 'Pesan berhasil dikirim' });
    } catch (error) {
        console.error('Gagal kirim:', error);
        return res.status(500).json({ success: false, message: 'Gagal kirim pesan', error });
    }
});

// Ambil pesan terakhir dari nomor tertentu
app.get('/get-last-message', async (req, res) => {
    const { nomor } = req.query;

    if (!nomor) {
        return res.status(400).json({ success: false, message: 'Nomor wajib diisi' });
    }

    const chatId = nomor + '@c.us';

    try {
        const chat = await client.getChatById(chatId);
        const messages = await chat.fetchMessages({ limit: 5 }); // bisa diubah ke 1 kalau cuma paling terakhir

        if (messages.length === 0) {
            return res.status(404).json({ success: false, message: 'Tidak ada pesan ditemukan' });
        }

        const lastMessage = messages[messages.length - 1];

        return res.status(200).json({
            success: true,
            message: {
                fromMe: lastMessage.fromMe,
                timestamp: lastMessage.timestamp,
                body: lastMessage.body
            }
        });
    } catch (error) {
        console.error('Gagal ambil pesan:', error);
        return res.status(500).json({ success: false, message: 'Gagal ambil pesan', error });
    }
});


client.initialize();

// Jalankan server API
app.listen(port, () => {
    console.log(`API WhatsApp berjalan di http://localhost:${port}`);
});
