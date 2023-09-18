const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('whatsapp-web.js');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

const client = new Client();
const users = {}; // Objek untuk menyimpan data pengguna

client.on('qr', (qrCode) => {
  // Handle QR Code for authentication
  console.log('QR Code received. Scan it with WhatsApp app.');
});

client.on('authenticated', (session) => {
  console.log('Authenticated as ' + session.user.name);
});

client.on('message', async (message) => {
  try {
    const userNumber = message.from;
    let user = users[userNumber];

    if (!user) {
      // Jika pengguna belum terdaftar, inisialisasi data pengguna
      user = { state: 'waiting_name' }; // State awal, menunggu nama
      users[userNumber] = user;

      // Mengecek apakah pesan yang diterima adalah permintaan "biodata"
      if (message.body.toLowerCase() === 'biodata') {
        await message.reply('Selamat datang! Silakan masukkan nama Anda:');
      } else {
        await message.reply('Silakan ketik "biodata" untuk memulai proses pengisian biodata.');
      }
    } else {
      const userState = user.state;

      switch (userState) {
        case 'waiting_name':
          // Pengguna sedang menunggu nama, tangani input nama di sini
          const nama = message.body;
          user.data = { nama }; // Simpan nama

          // Kirim pesan untuk mengumpulkan tanggal lahir
          user.state = 'waiting_birthdate';
          await message.reply('Terima kasih. Sekarang masukkan tanggal lahir Anda (contoh: 01/01/1990):');
          break;
        case 'waiting_birthdate':
          // Pengguna sedang menunggu tanggal lahir, tangani input tanggal lahir di sini
          const tanggalLahir = message.body;
          user.data.tanggalLahir = tanggalLahir; // Simpan tanggal lahir

          // Kirim pesan untuk mengumpulkan alamat
          user.state = 'waiting_address';
          await message.reply('Terima kasih. Sekarang masukkan alamat Anda:');
          break;
        case 'waiting_address':
          // Pengguna sedang menunggu alamat, tangani input alamat di sini
          const alamat = message.body;
          user.data.alamat = alamat; // Simpan alamat

          // Kirim pesan untuk mengumpulkan hobi
          user.state = 'waiting_hobby';
          await message.reply('Terima kasih. Sekarang masukkan hobi Anda:');
          break;
        case 'waiting_hobby':
          // Pengguna sedang menunggu hobi, tangani input hobi di sini
          const hobi = message.body;
          user.data.hobi = hobi; // Simpan hobi

          // Kirim pesan untuk mengumpulkan makanan favorit
          user.state = 'waiting_favorite_food';
          await message.reply('Terima kasih. Sekarang masukkan makanan favorit Anda:');
          break;
        case 'waiting_favorite_food':
          // Pengguna sedang menunggu makanan favorit, tangani input makanan favorit di sini
          const makananFavorit = message.body;
          user.data.makananFavorit = makananFavorit; // Simpan makanan favorit

          // Di sini Anda dapat melakukan apa pun dengan data yang telah dikumpulkan
          // (misalnya, menyimpannya ke basis data atau melakukan tindakan lainnya)

          // Memberikan konfirmasi akhir
          await message.reply('Terima kasih! Biodata Anda telah tercatat.');

          // Hapus data pengguna setelah selesai
          delete users[userNumber];
          break;
        default:
          // State tidak valid, beri pesan kesalahan
          await message.reply('Terjadi kesalahan. Silakan mulai kembali.');
          delete users[userNumber]; // Hapus data pengguna
          break;
      }
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

app.post('/webhook', (req, res) => {
  const { body } = req;
  client.webhookCallback(body);
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Bot WhatsApp berjalan di port ${
