const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../db");
const { JWT_SECRET } = require("../middleware/authMiddleware");
const { sendVerificationEmail, sendResetPasswordEmail } = require("../utils/mailer");

const ACCESS_TOKEN_EXPIRES = "15m";
const REFRESH_TOKEN_EXPIRES = "7d";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me";

// Brute-force guard settings
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Email verification settings
const EMAIL_VERIFICATION_HOURS = 24;

// Password reset settings
const PASSWORD_RESET_HOURS = 1;

async function createAndSendVerificationToken(userId, email) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_HOURS * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );

  await sendVerificationEmail(email, token);
}

async function createAndSendResetToken(userId, email) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_HOURS * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at, is_used) VALUES ($1, $2, $3, false)`,
    [userId, token, expiresAt]
  );

  await sendResetPasswordEmail(email, token);
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role`,
      [email, passwordHash]
    );
    const user = result.rows[0];

    await pool.query(
      `INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)`,
      [user.id, email.split("@")[0]]
    );

    await createAndSendVerificationToken(user.id, user.email);

    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      message: "Registered successfully. Please check your email to verify your account.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "token is required" });
    }

    const result = await pool.query(
      `SELECT * FROM email_verification_tokens WHERE token = $1`,
      [token]
    );
    const record = result.rows[0];

    if (!record) {
      return res.status(400).json({ error: "Invalid verification token" });
    }
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: "Verification token has expired" });
    }

    await pool.query("UPDATE users SET is_email_verified = true WHERE id = $1", [
      record.user_id,
    ]);

    // Token is single-use — remove it once consumed.
    await pool.query("DELETE FROM email_verification_tokens WHERE id = $1", [record.id]);

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/auth/resend-verification
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    // Don't reveal whether the email exists — respond the same way either case.
    if (!user) {
      return res.json({ message: "If that email is registered, a verification link has been sent." });
    }
    if (user.is_email_verified) {
      return res.json({ message: "This email is already verified." });
    }

    // Invalidate any previous outstanding tokens for this user first.
    await pool.query("DELETE FROM email_verification_tokens WHERE user_id = $1", [user.id]);

    await createAndSendVerificationToken(user.id, user.email);

    res.json({ message: "If that email is registered, a verification link has been sent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    // Don't reveal whether the email exists — respond the same way either case.
    const genericMessage = { message: "If that email is registered, a password reset link has been sent." };

    if (!user) {
      return res.json(genericMessage);
    }

    // Clear any previous outstanding reset tokens for this user first.
    await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [user.id]);

    await createAndSendResetToken(user.id, user.email);

    return res.json(genericMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "token and password are required" });
    }

    const result = await pool.query(
      `SELECT * FROM password_reset_tokens WHERE token = $1`,
      [token]
    );
    const record = result.rows[0];

    if (!record) {
      return res.status(400).json({ error: "Invalid reset token" });
    }
    if (record.is_used) {
      return res.status(400).json({ error: "This reset token has already been used" });
    }
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: "Reset token has expired" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW(), failed_login_attempts = 0, locked_until = NULL WHERE id = $2",
      [passwordHash, record.user_id]
    );

    // Mark token as used instead of deleting, so it stays available for audit purposes.
    await pool.query(
      "UPDATE password_reset_tokens SET is_used = true WHERE id = $1",
      [record.id]
    );

    // Revoke the existing refresh token, forcing re-login on all devices.
    await pool.query("UPDATE users SET refresh_token = NULL WHERE id = $1", [record.user_id]);

    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Account currently locked? Reject before even checking the password.
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const unlockAt = new Date(user.locked_until);
      return res.status(423).json({
        error: `Account is temporarily locked due to too many failed login attempts. Try again after ${unlockAt.toISOString()}`,
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      const attempts = user.failed_login_attempts + 1;

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        await pool.query(
          "UPDATE users SET failed_login_attempts = $1, locked_until = $2, updated_at = NOW() WHERE id = $3",
          [attempts, lockUntil, user.id]
        );
        return res.status(423).json({
          error: `Too many failed login attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`,
        });
      }

      await pool.query(
        "UPDATE users SET failed_login_attempts = $1, updated_at = NOW() WHERE id = $2",
        [attempts, user.id]
      );
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Block login until the email has been verified.
    if (!user.is_email_verified) {
      return res.status(403).json({
        error: "Email not verified. Please check your inbox or request a new verification link.",
      });
    }

    // Successful login: reset the failed-attempt counter and any lock.
    await pool.query(
      "UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1",
      [user.id]
    );

    // NOTE: role now included in the access token payload so
    // requireRole() middleware can read it without a DB lookup.
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );
    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES,
    });

    await pool.query("UPDATE users SET refresh_token = $1, updated_at = NOW() WHERE id = $2", [
      refreshToken,
      user.id,
    ]);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/auth/refresh
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "refreshToken is required" });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (err) {
      return res.status(403).json({ error: "Invalid or expired refresh token" });
    }

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [payload.userId]);
    const user = result.rows[0];
    if (!user || user.refresh_token !== refreshToken) {
      return res.status(403).json({ error: "Refresh token does not match" });
    }

    // Re-issue access token with role included, same as login.
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "refreshToken is required" });
    }

    await pool.query("UPDATE users SET refresh_token = NULL WHERE refresh_token = $1", [
      refreshToken,
    ]);

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};