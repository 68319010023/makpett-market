const pool = require("../db");

// ตรวจสอบข้อมูลก่อนบันทึก
function validateMenuPayload(body, { partial = false } = {}) {
  const errors = [];
  const { name, price } = body;

  if (!partial || name !== undefined) {
    if (!name || typeof name !== "string" || !name.trim()) {
      errors.push("name is required and must be a non-empty string");
    }
  }

  if (!partial || price !== undefined) {
    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      errors.push("price is required and must be a non-negative number");
    }
  }

  return errors;
}

// GET /api/menu - รายการเมนูทั้งหมด (รองรับ query filter: search)
async function getAllMenuItems(req, res) {
  try {
    const { search } = req.query;
    const conditions = [];
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `SELECT * FROM menu_items ${whereClause} ORDER BY id ASC`;
    const result = await pool.query(query, values);

    res.json({ data: result.rows, count: result.rowCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
}

// GET /api/menu/:id - ดึงเมนูตาม id
async function getMenuItemById(req, res) {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const result = await pool.query("SELECT * FROM menu_items WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch menu item" });
  }
}

// POST /api/menu - สร้างเมนูใหม่
async function createMenuItem(req, res) {
  try {
    const errors = validateMenuPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ errors });
    }

    const { name, price } = req.body;

    const result = await pool.query(
      `INSERT INTO menu_items (name, price)
       VALUES ($1, $2)
       RETURNING *`,
      [name.trim(), price]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create menu item" });
  }
}

// PUT /api/menu/:id - อัปเดตเมนู (partial update ได้)
async function updateMenuItem(req, res) {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const errors = validateMenuPayload(req.body, { partial: true });
    if (errors.length) {
      return res.status(400).json({ errors });
    }

    const existing = await pool.query("SELECT * FROM menu_items WHERE id = $1", [id]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const current = existing.rows[0];
    const { name = current.name, price = current.price } = req.body;

    const result = await pool.query(
      `UPDATE menu_items
       SET name = $1, price = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [name, price, id]
    );

    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update menu item" });
  }
}

// DELETE /api/menu/:id - ลบเมนู
async function deleteMenuItem(req, res) {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const result = await pool.query("DELETE FROM menu_items WHERE id = $1 RETURNING *", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json({ data: result.rows[0], message: "Menu item deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete menu item" });
  }
}

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};