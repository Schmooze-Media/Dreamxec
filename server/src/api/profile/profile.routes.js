const express = require('express');
const router = express.Router();
const profileController = require('./profile.controller');
const { protect } = require('../../middleware/auth.middleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.use(protect);

router.get('/me', profileController.getMyProfile);
router.put('/me', profileController.updateMyProfile);
router.post('/picture', upload.single('profileImage'), profileController.updateProfilePicture);

module.exports = router;
