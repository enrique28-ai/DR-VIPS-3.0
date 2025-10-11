// utils/gmail.js  (reemplazo completo)
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const oauth2 = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:5173/oauth/google/callback",
);

// Usamos refresh_token para obtener access_token automáticamente
oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const gmail = google.gmail({ version: "v1", auth: oauth2 });

// Mantén el mismo "From" que ya usas en email.js
export const fromAddress = `"${process.env.GMAIL_FROM_NAME || "DR-VIPS"}" <${process.env.GMAIL_USER}>`;

// "transporter" compatible con transporter.sendMail({...})
export const transporter = {
  async sendMail({ from = fromAddress, to, subject, html, text }) {
    const body = html ?? (text ? `<pre>${text}</pre>` : "");
    const lines = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "",
      body,
    ];

    // base64url (sin =, + → -, / → _)
    const raw = Buffer.from(lines.join("\r\n"))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });
  },
};
