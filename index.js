import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

import pino from "pino";

const PREFIX = ".";

// Goody Tech WhatsApp number
// International format — NO +
const PHONE_NUMBER = "2348136045102";

let pairingRequested = false;

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Goody Tech Bot", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const {
      connection,
      lastDisconnect,
      qr
    } = update;

    if (connection === "connecting") {
      console.log("🔄 Connecting Goody Tech Bot...");
    }

    /*
     * IMPORTANT:
     * Baileys generates the pairing code after the
     * connection emits the QR/initial connection event.
     */
    if (
      qr &&
      !state.creds.registered &&
      !pairingRequested
    ) {
      pairingRequested = true;

      try {
        console.log("🔐 Requesting WhatsApp pairing code...");

        const code = await sock.requestPairingCode(
          PHONE_NUMBER
        );

        console.log("");
        console.log("╔══════════════════════════════════╗");
        console.log("║     GOODY TECH BOT PAIRING       ║");
        console.log("╠══════════════════════════════════╣");
        console.log(`║  PAIRING CODE: ${code}           ║`);
        console.log("╚══════════════════════════════════╝");
        console.log("");
        console.log("Open WhatsApp → Linked Devices →");
        console.log("Link a device → Link with phone number");
        console.log("Then enter the pairing code above.");
        console.log("");
      } catch (error) {
        console.error(
          "❌ Could not generate pairing code:",
          error
        );

        pairingRequested = false;
      }
    }

    if (connection === "open") {
      console.log("");
      console.log("=================================");
      console.log("✅ GOODY TECH BOT IS ONLINE!");
      console.log("=================================");
      console.log("");
    }

    if (connection === "close") {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode;

      console.log("❌ Bot disconnected.");
      console.log("Status code:", statusCode);

      if (statusCode === DisconnectReason.loggedOut) {
        console.log(
          "⚠️ WhatsApp logged out. Manual relinking is required."
        );
        return;
      }

      console.log("🔄 Reconnecting Goody Tech Bot...");

      pairingRequested = false;

      setTimeout(() => {
        startBot();
      }, 5000);
    }
  });

  // ==============================
  // MESSAGE HANDLER
  // ==============================

  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {
      try {
        const msg = messages[0];

        if (!msg?.message || msg.key.fromMe) {
          return;
        }

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        if (!text.startsWith(PREFIX)) {
          return;
        }

        const command = text
          .slice(PREFIX.length)
          .trim()
          .toLowerCase();

        const jid = msg.key.remoteJid;

        // ==============================
        // MENU
        // ==============================

        if (
          command === "menu" ||
          command === "help"
        ) {
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

          await sock.sendMessage(jid, {
            text: menu
          });
        }

        // ==============================
        // PING
        // ==============================

        else if (command === "ping") {
          await sock.sendMessage(jid, {
            text:
              "🏓 Pong!\n\n" +
              "✅ Goody Tech Bot is online."
          });
        }

        // ==============================
        // OWNER
        // ==============================

        else if (command === "owner") {
          await sock.sendMessage(jid, {
            text:
              "👑 Owner: Goody Tech\n" +
              "🎨 Goody Tech Editz"
          });
        }

        // ==============================
        // INFO
        // ==============================

        else if (command === "info") {
          await sock.sendMessage(jid, {
            text:
              "🤖 Goody Tech Bot\n\n" +
              "Version: 1.0.0\n" +
              "Prefix: .\n" +
              "Status: Online"
          });
        }

      } catch (error) {
        console.error(
          "❌ Message handler error:",
          error
        );
      }
    }
  );
}

console.log("🚀 Starting Goody Tech WhatsApp Bot...");

startBot().catch((error) => {
  console.error(
    "❌ Fatal bot error:",
    error
  );
});
