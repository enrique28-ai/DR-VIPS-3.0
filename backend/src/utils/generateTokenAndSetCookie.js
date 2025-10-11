import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

  const isProd = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,                 // Render usa HTTPS → true en prod
    sameSite: "lax", // Necesario para cookies cross-site
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return token;
};