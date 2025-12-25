const express = require("express");
const router = express.Router();
const { getUploadSignature } = require("../controllers/upload.controller");
const authMiddleware = require("../middleware/auth");

router.get("/cloudinary-signature", authMiddleware, getUploadSignature);

module.exports = router;
