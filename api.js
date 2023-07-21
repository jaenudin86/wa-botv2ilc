const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const axios = require("axios");
const shelljs = require("shelljs");
const qrcodes = require("qrcode");
const config = require("./config.json");
const { Client, LocalAuth } = require("whatsapp-web.js");

process.title = "whatsapp-node-api";
global.client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true },
});

global.authed = false;

const app = express();

const port = process.env.PORT || config.port;
//Set Request Size Limit 50 MB
app.use(bodyParser.json({ limit: "50mb" }));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

client.on("qr", (qr) => {
  console.log("qr", qr);
  
  fs.writeFileSync("./components/last.text", qr);
});
client.on('message', msg => {
  let textt = msg.body
  console.log(msg.from)
  let phoneNumber = msg.from;
  texte = textt.toLowerCase()
  const removeEmojis = (text) => {
    if (!text) {
        return ''
    }

    return text.replace(
        /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
        ''
    )
}
if (texte == '!ping') {
  msg.reply('pong');
} else if (texte == 'good morning') {
  msg.reply('selamat pagi');
} else if (msg.body == '!groups') {
  client.getChats().then(chats => {
    const groups = chats.filter(chat => chat.isGroup);

    if (groups.length == 0) {
      msg.reply('You have no group yet.');
    } else {
      let replyMsg = '*YOUR GROUPS*\n\n';
      groups.forEach((group, i) => {
        replyMsg += `ID: ${group.id._serialized}\nName: ${group.name}\n\n`;
      });
      replyMsg += '_You can use the group id to send a message to the group._'
      msg.reply(replyMsg);
    }
  });
}


});
client.on("authenticated", () => {
  console.log("AUTH!");
  authed = true;

  try {
    fs.unlinkSync("./components/last.qr");
  } catch (err) {}
});

client.on("auth_failure", () => {
  console.log("AUTH Failed !");
  process.exit();
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("message", async (msg) => {
  if (config.webhook.enabled) {
    if (msg.hasMedia) {
      const attachmentData = await msg.downloadMedia();
      msg.attachmentData = attachmentData;
    }
    axios.post(config.webhook.path, { msg });
  }
});
client.on("disconnected", () => {
  console.log("disconnected");
});
client.initialize();

const chatRoute = require("./components/chatting");
const groupRoute = require("./components/group");
const authRoute = require("./components/auth");
const contactRoute = require("./components/contact");

app.use(function (req, res, next) {
  console.log(req.method + " : " + req.path);
  next();
});
app.use("/chat", chatRoute);
app.use("/group", groupRoute);
app.use("/auth", authRoute);
app.use("/contact", contactRoute);

app.listen(port, () => {
  console.log("Server Running Live on Port : " + port);
});
