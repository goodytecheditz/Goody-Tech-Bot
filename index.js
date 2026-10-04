import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

import qrcode from "qrcode-terminal";
import pino from "pino";

const PREFIX = ".";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("SCAN THIS QR CODE WITH WHATSAPP:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("✅ GOODY TECH BOT IS ONLINE!");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      console.log("Bot disconnected.");

      if (shouldReconnect) {
        console.log("Reconnecting...");
        startBot();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (!text.startsWith(PREFIX)) return;

    const command = text.slice(PREFIX.length).trim().toLowerCase();

    if (command === "menu" || command === "help") {
      const menu = `
╭━━━〔 GOODY TECH BOT 〕━━━╮
┃
┃ 👋 Hello! Welcome to Goody Tech Bot.
┃
┃ 👤 Owner: Goody Tech
┃ ⚡ Prefix: .
┃
┣━━〔 GENERAL 〕━━
┃ .menu
┃ .ping
┃ .owner
┃ .info
┃
┣━━〔 AI 〕━━
┃ .ai
┃
┣━━〔 DOWNLOAD 〕━━
┃ .yt
┃ .tiktok
┃ .facebook
┃ .instagram
┃
┣━━〔 STICKER 〕━━
┃ .sticker
┃
┣━━〔 GROUP 〕━━
┃ .tagall
┃ .admins
┃ .groupinfo
┃
┣━━〔 FUN 〕━━
┃ .joke
┃ .quote
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 Powered by Goody Tech Editz
`;

      await sock.sendMessage(msg.key.remoteJid, {
        text: menu
      });
    }

    else if (command === "ping") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "🏓 Pong!\n\n✅ Goody Tech Bot is online."
      });
    }

    else if (command === "owner") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "👑 Owner: Goody Tech\n🎨 Goody Tech Editz"
      });
    }

    else if (command === "info") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "🤖 Goody Tech Bot\n\nVersion: 1.0.0\nPrefix: .\nStatus: Online"
      });
    }
  });
}

startBot();
