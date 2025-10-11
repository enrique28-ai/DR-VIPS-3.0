// server/emailTemplates.js

// DR-VIPS palette
const brand = {
  name: "DR-VIPS",
  bgTop: "linear-gradient(135deg,#1e40af,#3b82f6)", // blue-800 → blue-500
  cardBg: "#0b1220", // deep navy
  text: "#e5e7eb",   // zinc-200
  subtext: "#9aa4b2",// zinc-400
  accent: "#3b82f6", // blue-500
  btnBg: "#0f172a",
  btnText: "#ffffff",
  codeBg: "#0f172a",
  border: "rgba(255,255,255,0.08)",
};

const baseHead = `
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${brand.name}</title>
`;

const header = (title) => `
  <div style="background:${brand.bgTop};padding:28px 24px;text-align:center;border-radius:16px 16px 0 0">
    <div style="font-size:24px;line-height:1.2;color:#fff;font-weight:800;letter-spacing:.2px">
      <span style="display:inline-block;margin-right:8px">🩺</span>${brand.name}
    </div>
    <div style="margin-top:8px;font-size:14px;color:#e5efff;opacity:.9">${title}</div>
  </div>
`;

const footer = `
  <div style="text-align:center;margin-top:16px;color:${brand.subtext};font-size:12px">
    This is an automated message. Please don’t reply to this email.
  </div>
`;

const shell = (title, inner) => `
<!doctype html>
<html lang="en">
<head>${baseHead}</head>
<body style="margin:0;background:#0a0f1c;font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,.35);background:${brand.cardBg};border:1px solid ${brand.border}">
          <tr><td>${header(title)}</td></tr>
          <tr>
            <td style="padding:24px 24px 28px;color:${brand.text};font-size:15px;line-height:1.6">
              ${inner}
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/** 1) Verify email */
export const VERIFICATION_EMAIL_TEMPLATE = shell(
  "Verify your email",
  `
  <p style="margin:0 0 8px">Hi,</p>
  <p style="margin:0 0 16px">
    Thanks for signing up for <strong>${brand.name}</strong>. Your verification code is:
  </p>
  <div style="text-align:center;margin:24px 0">
    <span style="
      display:inline-block;
      background:${brand.codeBg};
      border:1px solid ${brand.border};
      color:#fff;
      letter-spacing:6px;
      font-weight:800;
      font-size:28px;
      padding:16px 24px;
      border-radius:12px;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.04);
    ">{verificationCode}</span>
  </div>
  <p style="margin:0 0 8px">Enter this code to complete your registration. The code expires in 15 minutes.</p>
  <p style="margin:0;color:${brand.subtext}">If you didn’t create this account, you can safely ignore this message.</p>
  `
);

/** 2) Password reset (request) */
export const PASSWORD_RESET_REQUEST_TEMPLATE = shell(
  "Reset your password",
  `
  <p style="margin:0 0 8px">Hi,</p>
  <p style="margin:0 0 16px">
    We received a request to reset your password. If you didn’t request this, you can ignore this email.
  </p>
  <div style="text-align:center;margin:24px 0">
    <a href="{resetURL}" style="
      background:${brand.btnBg};
      color:${brand.btnText};
      text-decoration:none;
      padding:12px 20px;
      font-weight:700;
      border-radius:10px;
      display:inline-block;
      border:1px solid ${brand.border};
      box-shadow:0 4px 14px rgba(0,0,0,.35)
    ">Reset password</a>
  </div>
  <p style="margin:0;color:${brand.subtext}">For your security, this link will expire in 1 hour.</p>
  `
);

/** 3) Password reset (success) */
export const PASSWORD_RESET_SUCCESS_TEMPLATE = shell(
  "Password updated",
  `
  <p style="margin:0 0 8px">Hi,</p>
  <p style="margin:0 0 16px">
    Your password was updated successfully.
  </p>
  <div style="text-align:center;margin:18px 0 24px">
    <div style="
      width:56px;height:56px;line-height:56px;border-radius:50%;
      background:${brand.accent};color:#fff;margin:0 auto;font-size:28px;font-weight:800
    ">✓</div>
  </div>
  <p style="margin:0 0 6px">Security tips:</p>
  <ul style="margin:0 0 8px 18px;color:${brand.subtext}">
    <li>Use a unique, strong password</li>
    <li>Enable 2-step verification if available</li>
    <li>Avoid reusing passwords across different sites</li>
  </ul>
  `
);

/** 4) Welcome email (no URL/CTA) */
export const WELCOME_EMAIL_TEMPLATE = shell(
  "Welcome to DR-VIPS!",
  `
  <p style="margin:0 0 8px">Hi <strong>{name}</strong>,</p>
  <p style="margin:0 0 12px">
    We’re excited to have you on <strong>${brand.name}</strong>! You now have access to a fast, modern workspace to manage patients and diagnoses.
  </p>
  <div style="
    margin:18px 0 22px;padding:14px 16px;border:1px solid ${brand.border};
    border-radius:12px;background:rgba(255,255,255,.02);color:${brand.subtext}
  ">
    Tip: complete your profile and start adding your first patients when you sign in.
  </div>
  <p style="margin:0;color:${brand.subtext}">
    Need help? We’re here for you.
  </p>
  `
);
