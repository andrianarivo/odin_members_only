const express = require('express');

const userController = require('../controllers/userController');

const router = express.Router();

router.get('/sign_up', userController.sign_up_get);
router.post('/sign_up', userController.sign_up_post);

module.exports = router;
