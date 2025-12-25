const express = require('express');
const router = express.Router();

/**
 * GET current user from session
 */
router.get('/me', (req, res) => {
  console.log('SESSION IN /me:', req.session);

  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  res.json({
    id: req.session.user.id,
    username: req.session.user.username,
    profileImage: req.session.user.profileImage || null,
  });
});

/**
 * PUT profile image
 */
router.put('/profile-image', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { publicId, version } = req.body;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const url = `https://res.cloudinary.com/${cloudName}/image/upload/v${version}/${publicId}.jpg`;

  req.session.profileImage = { publicId, version, url };
  req.session.user.profileImage = req.session.profileImage;

  res.json({ success: true });
});

module.exports = router;
