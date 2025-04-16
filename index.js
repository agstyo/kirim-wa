const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode-terminal'); 
const express = require('express');
const bodyParser = require('body-parser');
const { formatUnixTimestampToDatetime, getGroupByName } = require('./utils');

const app = express();
const port = process.env.PORT || 3030;

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
        // Menampilkan QR code di terminal
        QRCode.generate(qr, { small: true });
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

// API endpoint kirim pesan
app.post('/send-message', async (req, res) => {
    const { phone_number, content } = req.body;

    if (!phone_number || !content) {
        return res.status(400).json({ success: false, message: 'phone_number dan content wajib diisi' });
    }

    const chatId = phone_number + '@c.us';

    try {
        await client.sendMessage(chatId, content);
        return res.status(200).json({ success: true, message: 'Pesan berhasil dikirim' });
    } catch (error) {
        console.error('Gagal kirim:', error);
        return res.status(500).json({ success: false, message: 'Gagal kirim pesan', error });
    }
});

// Kirim pesan ke grup berdasarkan nama
app.post('/send-message-group', async (req, res) => {
    const { group_name, content } = req.body;

    if (!group_name || !content) {
        return res.status(400).json({ success: false, message: 'group_name dan content wajib diisi' });
    }

    try {
        const chats = await client.getChats();
        const grup = chats.find(chat => chat.isGroup && chat.name === group_name);

        if (!grup) {
            return res.status(404).json({ success: false, message: `Grup dengan nama "${group_name}" tidak ditemukan` });
        }

        await client.sendMessage(grup.id._serialized, content);

        return res.status(200).json({ success: true, message: `Pesan berhasil dikirim ke grup "${group_name}"` });
    } catch (error) {
        console.error('Gagal kirim pesan ke grup:', error);
        return res.status(500).json({ success: false, message: 'Gagal kirim pesan ke grup', error });
    }
});


// Ambil pesan terakhir dari nomor tertentu
app.get('/get-last-message', async (req, res) => {
    const { phone_number, limit } = req.query;

    if (!phone_number) {
        return res.status(400).json({ success: false, message: 'Nomor wajib diisi' });
    }

    const chatId = phone_number + '@c.us';

    const pesanLimit = parseInt(limit) || 5;

    try {
        const chat = await client.getChatById(chatId);
        const messages = await chat.fetchMessages({ limit: pesanLimit }); // bisa diubah ke 1 kalau cuma paling terakhir

        if (messages.length === 0) {
            return res.status(404).json({ success: false, message: 'Tidak ada pesan ditemukan' });
        }

        const lastMessage = messages[messages.length - 1];

        return res.status(200).json({
            success: true,
            message: {
                fromMe: lastMessage.fromMe,
                timestamp: formatUnixTimestampToDatetime(lastMessage.timestamp),
                body: lastMessage.body
            }
        });
    } catch (error) {
        console.error('Gagal ambil pesan:', error);
        return res.status(500).json({ success: false, message: 'Gagal ambil pesan', error });
    }
});

// Ambil pesan terakhir dari grup berdasarkan nama dan limit
app.get('/get-last-message-group', async (req, res) => {
    const { group_name, limit } = req.query;

    if (!group_name) {
        return res.status(400).json({ success: false, message: 'group_name wajib diisi' });
    }

    const pesanLimit = parseInt(limit) || 5;

    try {
        const chats = await client.getChats();
        const grup = chats.find(chat => chat.isGroup && chat.name === group_name);

        if (!grup) {
            return res.status(404).json({ success: false, message: `Grup dengan nama "${group_name}" tidak ditemukan` });
        }

        const messages = await grup.fetchMessages({ limit: pesanLimit });

        const formattedMessages = messages.map(msg => ({
            fromMe: msg.fromMe,
            author: msg.author || msg.from,
            timestamp: msg.timestamp,
            body: msg.body,
            createdAt : formatUnixTimestampToDatetime(msg.timestamp)
        }));

        return res.status(200).json({
            success: true,
            group: group_name,
            messages: formattedMessages
        });
    } catch (error) {
        console.error('Gagal ambil pesan grup:', error);
        return res.status(500).json({ success: false, message: 'Gagal ambil pesan grup', error });
    }
});

app.get('/group-members', async (req, res) => {
    const { group_id, group_name } = req.query;

    try {
        let group;

        if (group_id) {
            group = await client.getChatById(group_id);
        } else if (group_name) {
            group = await getGroupByName(client, group_name);
        } else {
            return res.status(400).json({ success: false, message: 'Harus isi group_id atau group_name' });
        }

        if (!group || !group.isGroup) {
            return res.status(404).json({ success: false, message: 'Grup tidak ditemukan' });
        }

        const participants = group.participants.map(p => ({
            id: p.id._serialized,
            isAdmin: p.isAdmin,
            isSuperAdmin: p.isSuperAdmin
        }));

        return res.json({ success: true, group_name: group.name, participants });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Gagal ambil anggota grup', error: err.message });
    }
});



client.initialize();

// Jalankan server API
app.listen(port, () => {
    console.log(`API WhatsApp berjalan di http://localhost:${port}`);
});
