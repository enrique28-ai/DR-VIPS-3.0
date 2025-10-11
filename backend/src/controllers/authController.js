// controllers/auth.controller.js
import User from "../models/User.js";
import { google } from "googleapis";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail
} from "../utils/email.js";
import Patient from "../models/Patient.js";
import Diagnosis from "../models/Diagnosis.js";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid"; // <-- sin crypto

// Helpers para limpiar avatars locales
const isLocalAvatarUrl = (url = "") => {
  try { return new URL(url).pathname.startsWith("/uploads/avatars/"); }
  catch { return typeof url === "string" && url.startsWith("/uploads/avatars/"); }
};
const avatarPathOnDisk = (url = "") => {
  const pathname = (() => {
    try { return new URL(url).pathname; } catch { return url; }
  })();
  // Evita paths absolutos fuera del proyecto en Windows/Linux
  return path.join(process.cwd(), pathname.replace(/^\//, ""));
};
const removeLocalAvatarIfAny = (url = "") => {
  try {
    if (!isLocalAvatarUrl(url)) return;
    fs.unlink(avatarPathOnDisk(url), () => {});
  } catch {}
};

const isProd = process.env.NODE_ENV === "production";
// === Allowlist helpers (PRO_DOMAINS / PRO_EMAILS) ===
const parseCSV = (s = "") =>
  (s || "")
    .split(",")
    .map(x => x.trim().toLowerCase())
    .filter(Boolean);
const allowedDomains = () => parseCSV(process.env.PRO_DOMAINS);
const allowedEmails  = () => parseCSV(process.env.PRO_EMAILS);
const emailDomain = (email = "") => (email.toLowerCase().split("@")[1] || "");
const isAllowedDomain = (email = "") => allowedDomains().includes(emailDomain(email));
const isAllowedEmail  = (email = "") => allowedEmails().includes(email.toLowerCase());
// Verificación general: dominio permitido, email permitido, o Workspace 'hd'
const isAllowedProfessional = (email = "", hdClaim = "") => {
  const hd = (hdClaim || "").toLowerCase();
  return isAllowedDomain(email) || isAllowedEmail(email) || (hd && allowedDomains().includes(hd));
};
// Helpers para códigos/tokens
const gen6Code = () => (Math.floor(100000 + Math.random() * 900000)).toString(); // 6 dígitos


// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    if (!isAllowedProfessional(email)) {
    return res.status(403).json({ error: "Use your work email (allowed domain) or an approved email." });
}

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "User already exists" });

    const verificationToken = gen6Code();
    const verificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const user = await User.create({
      name, email, password,
      verificationToken,
      verificationTokenExpiresAt,
      isVerified: false,
      isProfessionalVerified: true, // pasó allowlist
      role: "doctor",
    });

    // Set cookie (autologin). Si prefieres exigir verificación antes, quítalo.
    generateTokenAndSetCookie(res, user._id);

    // RESPONDE primero (no bloquees por SMTP)
    res.status(201).json({
      user,
      message: "Registered. Verification code sent to your email."
    });

    // Enviar verificación en background
    await sendVerificationEmail(user.email, user.verificationToken);
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.isProfessionalVerified) {
      return res.status(403).json({ error: "Professional verification required" });
    }

    generateTokenAndSetCookie(res, user._id);

    const safeUser = await User.findById(user._id);
    return res.json({ user: safeUser });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// POST /api/auth/logout
export const logout = async (_req, res) => {
  
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/"
  });
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
 res.set("Pragma", "no-cache");
  return res.json({ success: true, message: "Logged out" });
};

// GET /api/auth/me
export const me = async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
 res.set("Pragma", "no-cache");
  return res.json({ user: req.user });
};

// POST /api/auth/verify-email
export const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: "Code is required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const now = new Date();
    if (!user.verificationToken || !user.verificationTokenExpiresAt || now > user.verificationTokenExpiresAt) {
      return res.status(400).json({ error: "Verification code expired" });
    }
    if (user.verificationToken !== code) {
      return res.status(400).json({ error: "Invalid code" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    // Responde ya (no bloquees por SMTP)
    res.json({ success: true, message: "Email verified" });

    // Welcome en background
    await sendWelcomeEmail(user.email, user.name);
  } catch (err) {
    console.error("verifyEmail error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// POST /api/auth/resend-code
export const resendVerificationCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isVerified) return res.status(400).json({ error: "Already verified" });

    user.verificationToken = gen6Code();
    user.verificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // Responde primero
    res.json({ success: true, message: "Verification code resent" });

    // Envío en background
    await sendVerificationEmail(user.email, user.verificationToken);
  } catch (err) {
    console.error("resendVerificationCode error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// POST /api/auth/forgot-password   { email }
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    const user = await User.findOne({ email });
    // Respuesta genérica para no filtrar si existe o no
    if (!user) return res.json({ success: true, message: "If the email exists, we sent a link" });

    // Token largo y aleatorio sin crypto
    const rawToken = nanoid(64); // ~64 chars url-safe
    user.resetPasswordToken = rawToken; // almacenado en claro (válido en apps pequeñas)
    user.resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    const resetURL = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${rawToken}`;

    // Responde primero
    res.json({ success: true, message: "If the email exists, we sent a link" });

    // Envío en background
    await sendPasswordResetEmail(user.email, resetURL);
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// POST /api/auth/reset-password/:token   { password }
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params || {};
    const { password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: "Invalid payload" });

    // Como guardamos el token en claro, lo buscamos directo
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: new Date() }
    }).select("+password");

    if (!user) return res.status(400).json({ error: "Invalid or expired reset link" });

    user.password = password;               // se hashea en pre('save') del modelo
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    // Responde primero
    res.json({ success: true, message: "Password updated" });

    // Notificación en background
    await sendResetSuccessEmail(user.email);
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

const SERVER_REDIRECT =
  process.env.API_GOOGLE_REDIRECT_URI || "http://localhost:5001/api/auth/google/callback";

const oauth2 = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  SERVER_REDIRECT
);

// GET /api/auth/google/init
export const googleInit = (req, res) => {

    // Exige haber pasado por /google/recaptcha recientemente
  if (req.cookies?.g_captcha !== "ok") {
    return res.status(400).send("Captcha required");
  }
  // Consúmela para que no se re-use
  res.clearCookie("g_captcha");

  const state = nanoid(24);
  res.cookie("g_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 10 * 60 * 1000, // 10 min
  });

  const url = oauth2.generateAuthUrl({
    access_type: "online",            // no necesitas refresh token para login
    prompt: "select_account",
    scope: ["openid", "email", "profile"],
    state,
  });

  return res.redirect(url);
};

// GET /api/auth/google/callback
export const googleCallback = async (req, res) => {
  const backTo = process.env.CLIENT_URL || "http://localhost:5173";
  try {
    const { code, state, error } = req.query;

    if (error) {
     res.clearCookie("g_state");
     // evita que el navegador cachee este paso en el historial
     res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
     res.set("Pragma", "no-cache");
     return res.redirect(backTo);     // o `${backTo}/login` si prefieres
  }
  
    if (!code || !state) return res.status(400).send("Missing code/state");

    // valida CSRF con cookie
    if (state !== req.cookies.g_state) {
      res.clearCookie("g_state");
      return res.status(400).send("Bad state");
    }

    // tampoco caches el callback exitoso (para que el “atrás” no re-eje cute el login)
   res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
   res.set("Pragma", "no-cache");

    const { tokens } = await oauth2.getToken({ code, redirect_uri: SERVER_REDIRECT });
    const ticket = await oauth2.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const p = ticket.getPayload(); // { sub, email, name, picture, email_verified }

    if (!p?.email || !p.email_verified) {
      res.clearCookie("g_state");
      return res.status(401).send("Google email not verified");
    }

    const googleId = p.sub;
    const email = p.email.toLowerCase();
    const name = p.name || "User";
    const avatar = p.picture || null;
    const hd = (p.hd || "").toLowerCase();

    // Nuevo: determinar autorización ANTES de tocar la base
    const allowed = isAllowedProfessional(email, hd);

    let user = await User.findOne({ email });
    if (!user) {
      // Si NO está permitido, no persistimos nada
      if (!allowed) {
        res.clearCookie("g_state");
        return res.redirect(`${backTo}/eligibility?need=domain`);
      }
      // Crear sólo si está permitido
      user = await User.create({
        email, name, googleId, avatar,
        isVerified: true,
        isProfessionalVerified: true, // porque allowed === true
        role: "doctor",
      });
    } else {
      // Si existe pero no es pro y sigue NO permitido → no tocar DB
      if (!user.isProfessionalVerified && !allowed) {
        res.clearCookie("g_state");
        return res.redirect(`${backTo}/eligibility?need=domain`);
      }
      // Si ahora sí está permitido, elevar flag
      if (allowed && !user.isProfessionalVerified) {
        user.isProfessionalVerified = true;
        user.role = user.role || "doctor";
      }
      if (!user.googleId) user.googleId = googleId;
      if (avatar && (!user.avatar || user.avatar.includes("googleusercontent"))) {
        user.avatar = avatar;
      }
      user.isVerified = true;
      await user.save();
    }
 
    // setea tu JWT httpOnly
    generateTokenAndSetCookie(res, user._id);

    // limpia el state cookie antes de redirigir
    res.clearCookie("g_state");
    return res.redirect(backTo);
  } catch (err) {
    console.error("Google callback error:", err);
    res.clearCookie("g_state");
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    return res.status(500).send("OAuth error");
  }
};

// PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body || {};
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // No permitas cambiar email aquí
    if (typeof name === "string") {
      const n = name.trim();
      if (!n) return res.status(400).json({ error: "Name is required" });
      user.name = n;
    }
    if (typeof avatar === "string") {
      if (avatar.trim() === "") {
        removeLocalAvatarIfAny(user.avatar); // ← borra archivo anterior si era local
        user.avatar = "";
      } else {
      let val = avatar.trim();
  if (val.startsWith("/uploads/")) {
    const base = `${req.protocol}://${req.get("host")}`;
    val = `${base}${val}`;
    }
    user.avatar = val;
    }
  }

    await user.save();
    // Responde un objeto seguro (sin password)
    return res.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified,
        isProfessionalVerified: user.isProfessionalVerified,
      }
    });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// DELETE /api/auth/me  (borrado en cascada)
export const deleteMe = async (req, res) => {
  try {
    const uid = req.user._id;
    const u = await User.findById(uid);
    // limpia el avatar si era local (antes de borrar al usuario)
    if (u) removeLocalAvatarIfAny(u.avatar);

    // 1) Borra todos los diagnósticos creados por el usuario
    await Diagnosis.deleteMany({ createdBy: uid });

    // 2) Borra todos los pacientes creados por el usuario
    //    (si tu modelo Diagnosis también referencia patient, con el paso 1 ya limpiaste diagnósticos)
    await Patient.deleteMany({ createdBy: uid });

    // 3) Borra al usuario
    await User.deleteOne({ _id: uid });

    // 4) Limpia cookie de sesión
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
    });

    return res.status(204).end();
  } catch (err) {
    console.error("deleteMe error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


// PUT /api/auth/profile/avatar (multipart/form-data, field: "avatar")
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // limpia el avatar anterior si era local
    removeLocalAvatarIfAny(user.avatar);


    // ruta pública para servir el archivo
    const publicPath = `/uploads/avatars/${req.file.filename}`;
    const base = `${req.protocol}://${req.get("host")}`;
    user.avatar = `${base}${publicPath}`;
    await user.save();

    return res.json({ user });
  } catch (err) {
    console.error("updateAvatar error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const importAvatarFromUrl = async (req, res) => {
  try {
    let { url } = req.body || {};
    if (typeof url !== "string" || !/^https?:\/\//i.test(url.trim())) {
      return res.status(400).json({ error: "Invalid URL" });
    }
    url = url.trim();

    const resp = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!resp.ok) return res.status(400).json({ error: "Could not fetch the image URL" });

    const ct = resp.headers.get("content-type") || "";
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(ct)) {
      return res.status(400).json({ error: "URL is not an image" });
    }

    const ab = await resp.arrayBuffer();
    const buf = Buffer.from(ab);
    const MAX = 2 * 1024 * 1024; // 2MB
    if (buf.length > MAX) return res.status(400).json({ error: "Image too large (max 2MB)" });

    const ext = ct.includes("jpeg") ? "jpg" : ct.split("/")[1].toLowerCase();
    const uploadDir = path.join(process.cwd(), "uploads", "avatars");
    fs.mkdirSync(uploadDir, { recursive: true });
    const filename = `${req.user._id}-${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), buf);

    const publicPath = `/uploads/avatars/${filename}`;
    const base = `${req.protocol}://${req.get("host")}`;
    const absolute = `${base}${publicPath}`;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });
    // limpia el avatar anterior si era local
    removeLocalAvatarIfAny(user.avatar);
    user.avatar = absolute;
    await user.save();

    return res.json({ user });
  } catch (err) {
    console.error("importAvatarFromUrl error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
