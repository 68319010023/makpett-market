const multer = require("multer");
const path = require("path");

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/avatars"));
  },
  filename: (req, file, cb) => {
    // ตั้งชื่อไฟล์ใหม่ไม่ให้ชนกัน: userId-timestamp.นามสกุลเดิม
    const ext = path.extname(file.originalname);
    const uniqueName = `${req.user.userId}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error("รองรับเฉพาะไฟล์ jpg, png, webp เท่านั้น"));
  }
  cb(null, true);
}

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = { uploadAvatar };