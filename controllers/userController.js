const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

exports.sign_up_get = asyncHandler((req, res) => {
  res.render('sign_up', {
    title: 'Sign Up',
  });
});

exports.sign_up_post = [
  body('first_name', 'Firstname must not be empty').trim().isLength({ min: 1 }).escape(),
  body('last_name', 'Lastname must not be empty').trim().isLength({ min: 1 }).escape(),
  body('membership_status', 'Membership should be one of the following: member, outsider, admin')
    .trim()
    .matches('member|outsider|admin')
    .escape(),
  body('email', 'A valid email address is required')
    .trim()
    .isLength({ min: 1 })
    .isEmail()
    .escape()
    .custom((value) => {
      const existing = User.findOne({ email: value });
      if (existing) {
        throw new Error('Email already in use.');
      }
    }),
  body('password', 'Password must be of length 6 at least').isLength({ min: 6 }),
  body('confirm_password', 'Passwords do not match').custom((value, { req }) => value === req.body.password),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const user = new User({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      membership_status: req.body.membership_status,
    });

    if (errors.isEmpty()) {
      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        if (err) {
          next(err);
        } else {
          user.password_hash = hashedPassword;
          await user.save();
          // eslint-disable-next-line no-underscore-dangle
          res.redirect(user.join_club_url);
        }
      });
    } else {
      res.render('sign_up', {
        title: 'Sign Up',
        errors: errors.array(),
      });
    }
  }),
];

exports.join_club_get = asyncHandler((req, res) => {
  res.render('join_club', {
    title: 'Join The Club',
  });
});

exports.join_club_post = [
  body('passcode')
    .isLength({ min: 1 })
    .withMessage('A passcode is required to join the club!')
    .matches('i am a member')
    .withMessage('The secret passcode you provided is not working :\\')
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const user = await User.findById(req.params.id);

    if (errors.isEmpty()) {
      if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        next(err);
      }
      user.membership_status = 'member';
      await user.save();
      res.redirect('/');
    } else {
      res.render('join_club', {
        title: 'Join The Club',
        errors: errors.array(),
      });
    }
  }),
];
