// backend/src/utils/mailer.js
//
// Mock mailer: logs the "email" to the console instead of actually sending it.
// Swap the implementation inside sendMail() later with Nodemailer/SendGrid/etc.
// The function signature stays the same, so nothing else in the codebase
// needs to change when you plug in a real provider.

async function sendMail({ to, subject, text }) {
  console.log("========== MOCK EMAIL ==========");
  console.log("To:      ", to);
  console.log("Subject: ", subject);
  console.log("Body:    ", text);
  console.log("=================================");
  return true;
}

async function sendVerificationEmail(email, token) {
  const verifyUrl = `http://localhost:8080/verify-email?token=${token}`;
  return sendMail({
    to: email,
    subject: "Verify your email",
    text: `Click the link to verify your account: ${verifyUrl}\n(token: ${token}, expires in 24 hours)`,
  });
}

module.exports = { sendMail, sendVerificationEmail };