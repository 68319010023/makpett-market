const express = require("express");
const cors = require("cors");
require("dotenv").config();

const menuRoutes = require("./routes/Menuroutes");
const authRoutes = require("./routes/Authroutes");      
const profileRoutes = require("./routes/Profileroutes");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

app.use("/api/menu", menuRoutes);
app.use("/api/auth", authRoutes);     
app.use("/api/profile", profileRoutes); 
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Menu CRUD API is running at http://localhost:${PORT}`);
});