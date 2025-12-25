const express = require('express');
const router = express.Router();

router.get('/me', (req, res) => {
  console.log('HIT /api/users/me');
  console.log('SESSION:', req.session);

  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  res.json({
    id: req.session.user.id,
    username: req.session.user.username,
    profileImage: req.session.user.profileImage || null,
  });
});

router.put('/profile-image', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { publicId, version } = req.body;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  const url = `https://res.cloudinary.com/${cloudName}/image/upload/v${version}/${publicId}.jpg`;

  req.session.user.profileImage = { publicId, version, url };

  res.json({ success: true });
});

module.exports = router;
