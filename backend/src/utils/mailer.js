// backend/src/utils/mailer.js
//
// Sends real emails via Gmail SMTP using Nodemailer.
// Requires EMAIL_USER and EMAIL_PASS (a 16-char Gmail App Password,
// NOT your normal Gmail password) to be set as environment variables
// (put them in backend/.env).
//
// If those env vars are missing, falls back to logging the email to the
// console instead of crashing — useful for local dev without SMTP set up.

const nodemailer = require("nodemailer");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

let transporter = null;

if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
} else {
  console.warn(
    "[mailer] EMAIL_USER / EMAIL_PASS not set — falling back to console-log mode. " +
      "Emails will NOT actually be sent."
  );
}

async function sendMail({ to, subject, text }) {
  if (!transporter) {
    console.log("========== MOCK EMAIL (SMTP not configured) ==========");
    console.log("To:      ", to);
    console.log("Subject: ", subject);
    console.log("Body:    ", text);
    console.log("========================================================");
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"Makpett Market" <${EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`[mailer] Email sent to ${to} — subject: "${subject}"`);
    return true;
  } catch (err) {
    console.error("[mailer] Failed to send email:", err.message);
    // Don't crash the request just because email delivery failed.
    return false;
  }
}

async function sendVerificationEmail(email, token) {
  const verifyUrl = `http://localhost:8080/verify-email?token=${token}`;
  return sendMail({
    to: email,
    subject: "Verify your email",
    text: `Click the link to verify your account: ${verifyUrl}\n(token: ${token}, expires in 24 hours)`,
  });
}

async function sendResetPasswordEmail(email, token) {
  const resetUrl = `http://localhost:8080/reset-password?token=${token}`;
  return sendMail({
    to: email,
    subject: "Reset your password",
    text: `Click the link to reset your password: ${resetUrl}\n(token: ${token}, expires in 1 hour)`,
  });
}

module.exports = { sendMail, sendVerificationEmail, sendResetPasswordEmail };