const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const LocalStrategy = require('passport-local');
const passport = require('passport');
const User = require('../models/user');

exports.sign_up_get = asyncHandler((req, res) => {
  res.render('sign_up', {
    title: 'Sign Up',
  });
});

exports.sign_up_post = [
  body('first_name', 'Firstname must not be empty').trim().isLength({ min: 1 }).escape(),
  body('last_name', 'Lastname must not be empty').trim().isLength({ min: 1 }).escape(),
  body('is_admin').optional({ values: 'null' }),
  body('email', 'A valid email address is required')
    .trim()
    .isLength({ min: 1 })
    .isEmail()
    .escape()
    .custom(async (value) => {
      const existing = await User.findOne({ email: value });
      if (existing) {
        throw new Error('Email already in use.');
      }
    }),
  body('password', 'Password must be of length 6 at least').isLength({ min: 6 }),
  body('confirm_password', 'Passwords do not match').custom((value, { req }) => value === req.body.password),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const membershipStatus = (req.body.is_admin) ? 'admin' : 'outsider';

    const user = new User({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      membership_status: membershipStatus,
    });

    if (errors.isEmpty()) {
      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        if (err) {
          next(err);
        } else {
          user.password_hash = hashedPassword;
          await user.save();
          if (membershipStatus === 'admin') {
            res.redirect('/users/sign_in');
          } else {
            res.redirect(user.join_club_url);
          }
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
      res.redirect('/users/sign_in');
    } else {
      res.render('join_club', {
        title: 'Join The Club',
        errors: errors.array(),
      });
    }
  }),
];

exports.sign_in_get = asyncHandler((req, res) => {
  res.render('sign_in', {
    title: 'Log In',
  });
});

const strategyOptions = {
  passReqToCallback: true,
  usernameField: 'email',
  passwordField: 'password',
};

const verify = async (req, username, password, done) => {
  const user = await User.findOne({ email: username });
  req.session.messages = [];
  if (user) {
    const matches = await bcrypt.compare(password, user.password_hash);
    if (matches) {
      done(null, user);
    } else {
      done(null, false, { message: 'Incorrect password' });
    }
  } else {
    done(null, false, { message: 'Incorrect email' });
  }
};

const localStrategy = new LocalStrategy(strategyOptions, verify);

passport.use(localStrategy);
passport.serializeUser((user, done) => {
  // eslint-disable-next-line no-underscore-dangle
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

exports.sign_in_post = [
  body('email', 'A valid email address is required')
    .trim()
    .isLength({ min: 1 })
    .isEmail()
    .escape(),
  body('password', 'Password is required to log in').isLength({ min: 1 }),
  passport.authenticate('local', { successRedirect: '/', failureRedirect: '/users/sign_in', failureMessage: true }),
];

exports.log_out = asyncHandler((req, res, next) => {
  req.logout((err) => {
    if (err) {
      next(err);
    } else {
      res.redirect('/');
    }
  });
});
