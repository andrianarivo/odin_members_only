const express = require('express');

const userController = require('../controllers/userController');

const router = express.Router();

router.get('/sign_up', userController.sign_up_get);
router.post('/sign_up', userController.sign_up_post);
router.get('/join_club/:id', userController.join_club_get);
router.post('/join_club/:id', userController.join_club_post);
router.get('/sign_in', userController.sign_in_get);
router.post('/sign_in', userController.sign_in_post);
router.get('/log_out', userController.log_out);

module.exports = router;
