const pool = require("../db");

// GET /api/profile
exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM profiles WHERE user_id = $1", [
      req.user.userId,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PATCH /api/profile
exports.updateProfile = async (req, res) => {
  try {
    const { display_name, avatar_url, bio, phone } = req.body;

    const result = await pool.query(
      `UPDATE profiles
       SET display_name = COALESCE($1, display_name),
           avatar_url = COALESCE($2, avatar_url),
           bio = COALESCE($3, bio),
           phone = COALESCE($4, phone),
           updated_at = NOW()
       WHERE user_id = $5
       RETURNING *`,
      [display_name, avatar_url, bio, phone, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};