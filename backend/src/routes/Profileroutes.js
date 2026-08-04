const express = require("express");
const router = express.Router();
const profileController = require("../controllers/ProfileController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { uploadAvatar } = require("../middleware/uploadMiddleware");

router.get("/", authenticateToken, profileController.getProfile);
router.patch("/", authenticateToken, profileController.updateProfile);
router.get("/activity", authenticateToken, profileController.getActivity);
router.post(
  "/avatar",
  authenticateToken,
  uploadAvatar.single("avatar"),
  profileController.uploadAvatar
);

module.exports = router;