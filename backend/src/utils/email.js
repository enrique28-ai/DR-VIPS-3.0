import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "./emailTemplates.js";

import { transporter, fromAddress } from "./gmail.js";

export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: "Verify your email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
    });
  } catch (error) {
    throw new Error(`Error sending verification email: ${error?.message || error}`);
  }
};

export const sendWelcomeEmail = async (email, name = "") => {
  try {
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: "Welcome to DR-VIPS",
      html: WELCOME_EMAIL_TEMPLATE.replace("{name}", name || "doctor"),
    });
  } catch (error) {
    throw new Error(`Error sending welcome email: ${error?.message || error}`);
  }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  try {
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: "Reset your password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
    });
  } catch (error) {
    throw new Error(`Error sending password reset email: ${error?.message || error}`);
  }
};

export const sendResetSuccessEmail = async (email) => {
  try {
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: "Password Reset Successful",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
    });
  } catch (error) {
    throw new Error(`Error sending password reset success email: ${error?.message || error}`);
  }
};
