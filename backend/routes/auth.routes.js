const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  req.session.user = {
    id: 1,
    username: 'johndoe',
    profileImage: req.session.profileImage || null
  };

  console.log('SESSION SET:', req.session);

  res.json({ success: true });
});

module.exports = router;