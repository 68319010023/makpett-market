const express = require("express");
const router = express.Router();
const profileController = require("../controllers/ProfileController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/", authenticateToken, profileController.getProfile);
router.patch("/", authenticateToken, profileController.updateProfile);
router.get("/activity", authenticateToken, profileController.getActivity);

module.exports = router;