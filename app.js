const path = require('path');
const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const nconf = require('nconf');
const debug = require('debug')('app');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const passport = require('passport');
const compression = require('compression');
const helmet = require('helmet');
const RateLimit = require('express-rate-limit');
const MongoStore = require('connect-mongo');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

nconf.argv()
  .env();

const env = nconf.get('NODE_ENV') || 'development';

if (env === 'production') {
  nconf.file({ file: path.join(__dirname, 'config.prod.json') });
} else {
  nconf.file({ file: path.join(__dirname, 'config.json') });
}

const mongoDB = nconf.get('mongoDB');

async function main() {
  await mongoose.connect(mongoDB);
}

main().catch((err) => debug(err));

const app = express();

// Set up rate limiter: maximum of twenty requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
});
// Apply rate limiter to all requests
app.use(limiter);

// Add helmet to the middleware chain.
// Set CSP headers to allow our Bootstrap and Jquery to be served
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      'script-src': ['\'self\'', 'cdn.jsdelivr.net'],
    },
  }),
);

app.use(compression()); // Compress all routes

// view engine setup
app.use(expressLayouts);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
const secret = nconf.get('session_secret');

app.use(session({
  secret,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: mongoDB,
    autoRemove: 'native',
  }),
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.errors = req.session.messages;
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', { title: `${err.status}-${err.message}` });
});

module.exports = app;
