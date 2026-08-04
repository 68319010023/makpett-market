 const pool = require("../db");

const VALID_ROLES = ["user", "admin"];

// GET /api/admin/users?page=1&limit=20
exports.getAllUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const countResult = await pool.query("SELECT COUNT(*) FROM users");
    const totalUsers = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
      `SELECT id, email, role, is_active, is_email_verified, failed_login_attempts,
              locked_until, created_at, updated_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PATCH /api/admin/users/:id/status
// body: { isActive: true|false }
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive (boolean) is required" });
    }

    // Prevent an admin from locking themselves out by accident.
    if (req.user.userId === id && isActive === false) {
      return res.status(400).json({ error: "You cannot deactivate your own account" });
    }

    const result = await pool.query(
      `UPDATE users SET is_active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, role, is_active`,
      [isActive, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Force logout everywhere if the account is being suspended.
    if (isActive === false) {
      await pool.query("UPDATE users SET refresh_token = NULL WHERE id = $1", [id]);
    }

    res.json({
      message: `User ${isActive ? "activated" : "suspended"} successfully`,
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PATCH /api/admin/users/:id/role
// body: { role: "user" | "admin" }
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(", ")}` });
    }

    // Prevent an admin from demoting themselves and losing access.
    if (req.user.userId === id && role !== "admin") {
      return res.status(400).json({ error: "You cannot change your own role" });
    }

    const result = await pool.query(
      `UPDATE users SET role = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, role, is_active`,
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "User role updated successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};