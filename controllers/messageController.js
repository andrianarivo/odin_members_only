const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const Message = require('../models/message');

exports.message_list = asyncHandler(async (req, res) => {
  const allMessages = await Message.find().populate('author').exec();
  res.render('index', {
    title: 'Members Only',
    message_list: allMessages,
  });
});

exports.message_create_get = asyncHandler((req, res, next) => {
  if (req.isAuthenticated()) {
    res.render('message_form', {
      title: 'Create a new Message',
    });
  } else {
    const err = new Error('Only users with account can create a new message');
    err.status = 401;
    next(err);
  }
});

exports.message_create_post = [
  body('title', 'A title is required').trim().isLength({ min: 1 }).escape(),
  body('message', 'A message body is required').trim().isLength({ min: 1 }).escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    const message = new Message({
      title: req.body.title,
      text: req.body.message,
      created_at: new Date(),
      author: req.user,
    });

    if (errors.isEmpty()) {
      await message.save();
      res.redirect('/');
    } else {
      res.render('message_form', {
        title: 'Create a new Message',
        message,
        errors: errors.array(),
      });
    }
  }),
];

exports.message_delete_post = asyncHandler(async (req, res) => {
  await Message.findByIdAndRemove(req.params.id);
  res.redirect('/');
});
