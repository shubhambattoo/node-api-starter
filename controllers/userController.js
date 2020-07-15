const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  // const ext = req.file.mimetype.split("/")[1];
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // or else resize the image
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = function (obj, ...allowed) {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowed.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // if the user tries to update password : ERROR
  if (req.body.password || req.body.passwordConfirm || req.body.email) {
    return next(
      new AppError('Cannot update password or email with this one', 400)
    );
  }
  // update the user document
  const user = filterObj(req.body, 'username');
  if (req.file) user.photo = req.file.filename;

  const upUser = await User.findByIdAndUpdate(req.user.id, user, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: upUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not defined, use /signup instead',
  });
};

exports.getUsers = factory.getAll(User, 'users');
exports.getUser = factory.getOne(User, '', 'user');
// Do NOT Update passwords with this
exports.updateUser = factory.updateOne(User, 'user');
exports.deleteUser = factory.deleteOne(User);
