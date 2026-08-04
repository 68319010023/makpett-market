const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { JWT_SECRET } = require("../middleware/authMiddleware");

const ACCESS_TOKEN_EXPIRES = "15m";
const REFRESH_TOKEN_EXPIRES = "7d";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me";

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

    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Brute-force guard settings
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

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