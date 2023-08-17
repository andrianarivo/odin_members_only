const express = require('express');

const messageController = require('../controllers/messageController');

const router = express.Router();

router.get('/', messageController.message_list);
router.get('/messages/create', messageController.message_create_get);
router.post('/messages/create', messageController.message_create_post);
router.post('/messages/delete/:id', messageController.message_delete_post);

module.exports = router;
