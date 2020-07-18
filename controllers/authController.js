const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const Email = require('../utils/email');

const signToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, res, sendUser = false) => {
  const token = signToken(user._id, user.email);

  user.password = null;

  let response = {
    status: 'ok',
    token,
  };
  response = sendUser ? { ...response, data: { user } } : response;
  res.status(statusCode).json(response);
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
  });
  // TODO:
  // 1) send welcome email
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createAndSendToken(newUser, 201, res, true);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError(`please provide email and password`, 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password, user.password))) {
    return next(new AppError(`Incorrect email or password`, 401));
  }
  createAndSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting Token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('you are not logged in', 401));
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('This user belonging to the token doesnt exits', 401)
    );
  }

  // 4) Check if user changed password after the JWT was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again', 401)
    );
  }

  // Grant access to the protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.restricTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  // get user from collection
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new AppError('user not found', 404));
  }
  // check if posted current password is correct
  const isCorrect = await user.comparePassword(
    req.body.passwordCurrent,
    user.password
  );

  if (!isCorrect) {
    return next(new AppError('passwords do not match with the current', 401));
  }
  // if so update password
  user.password = req.body.password;
  await user.save();
  // log user in send JWT
  createAndSendToken(user, 201, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('no user with the email id found', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: true });

  try {
    await new Email(user, resetToken).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'OTP sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('there was an error sending the email, try again', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // get user based on token
  const user = await User.findOne({
    email: req.body.email,
    passwordResetExpires: { $gt: Date.now() },
  });
  // set new password if token not expired and there is a user
  if (!user) {
    return next(
      new AppError(
        'There exists no User with that Email or the token has expired',
        500
      )
    );
  }
  const secret = user.passwordResetToken;

  const tokenValidates = speakeasy.totp.verify({
    secret: secret.base32,
    encoding: 'base32',
    token: req.body.token,
    window: 6,
  });

  if (!tokenValidates) {
    return next(new AppError('Token is Invalid', 400));
  }

  user.password = req.body.newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // update the password and changedPasswordAt
  // log the user in, send JWT
  createAndSendToken(user, 200, res);
});
