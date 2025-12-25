const cloudinary = require("../config/cloudinary");

exports.getUploadSignature = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const timestamp = Math.round(Date.now() / 1000);

    const publicId = `user_${userId}`;

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        public_id: publicId,
        overwrite: true,
      },
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      timestamp,
      signature,
      publicId,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (err) {
    res.status(500).json({ error: "Signature generation failed" });
  }
};
