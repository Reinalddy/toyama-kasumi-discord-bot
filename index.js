
require('dotenv/config');
const { Client, IntentsBitField, EmbedBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');
const axios = require('axios');

// Membaca isi file "lore.txt" secara sinkron
const data = fs.readFileSync('lore.txt', 'utf8');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on('ready', () => {
  console.log('The bot is online!');
});

const configuration = new Configuration({
  apiKey: process.env.API_KEY,
});

const openai = new OpenAIApi(configuration);

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== process.env.CHANNEL_ID) return;
  if (!message.content.toLowerCase().includes('kasumi')) return; // Hanya lanjutkan jika ada kata 'kasumi' dalam pesan

  // Array untuk menyimpan log percakapan
  let conversationLog = [];
  let raw_message = message.replace('kasumi', '');

  console.log(raw_message);

  // Memisahkan konten file menjadi baris-baris
  const lines = data.split('\n');

  // Menambahkan setiap baris sebagai objek dalam conversationLog
  lines.forEach(line => {
    conversationLog.push({ role: 'system', content: line });
  });

  // Menampilkan isi conversationLog
  console.log(conversationLog);

  try {
    await message.channel.sendTyping();
    let prevMessages = await message.channel.messages.fetch({ limit: 15 });
    prevMessages.reverse();

    prevMessages.forEach((msg) => {
      if (msg.content.startsWith('!')) return;
      if (msg.author.id !== client.user.id && message.author.bot) return;
      if (msg.author.id == client.user.id) {
        conversationLog.push({
          role: 'assistant',
          content: msg.content,
          name: msg.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
        });
      }

      if (msg.author.id == message.author.id) {
        conversationLog.push({
          role: 'user',
          content: msg.content,
          name: message.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
        });
      }
    });

    const result = await openai
      .createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: conversationLog,
        max_tokens: 80, // limit token usage
      })
      .catch((error) => {
        console.log(`OPENAI ERR: ${error}`);
      });
    message.reply(result.data.choices[0].message);
  } catch (error) {
    console.log(`ERR: ${error}`);
  }
});




// client.on('messageCreate', async message => {
//   if (message.author.bot) return;

//   const content = message.content;

//   // Memeriksa jika pesan dimulai dengan prefix
//   if (content.startsWith('!chat')) {
//     const question = content.slice('!chat'.length).trim(); // Definisikan variabel question

//     // Mendapatkan jawaban dari ChatGPT
//     let response = await gpt.send(question);

//     // Jika respons mengandung permintaan untuk gambar Toyama Kasumi
//     if (question.includes('gambar Toyama Kasumi')) {
//       try {
//         // Melakukan pencarian gambar melalui mesin pencari
//         const imageUrl = await searchImage('Toyama Kasumi');

//         // Mengirimkan gambar ke Discord
//         const attachment = new MessageAttachment(imageUrl);
//         message.channel.send({ files: [attachment] });
//       } catch (error) {
//         console.error('Gagal melakukan pencarian gambar:', error);
//         // Jika gagal mencari gambar, mengirimkan pesan ke pengguna
//         message.channel.send('Maaf, tidak dapat menemukan gambar untuk Toyama Kasumi.');
//       }
//     } else {
//       // Jika tidak ada permintaan gambar Toyama Kasumi, kirim respons teks biasa
//       message.channel.send(response);
//     }
//   }
// });


client.login(process.env.TOKEN);
