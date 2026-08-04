const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

// Every route below requires a valid access token AND role === 'admin'.
router.use(authenticateToken, requireRole("admin"));

router.get("/users", adminController.getAllUsers);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.patch("/users/:id/role", adminController.updateUserRole);

module.exports = router;