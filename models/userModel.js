const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "a username is required"]
  },
  email: {
    type: String,
    required: [true, "an email is required"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"]
  },
  photo: {
    type: String,
    default: "default.jpg"
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  password: {
    type: String,
    required: [true, "a password is required"],
    minlength: 8,
    select: false
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre("save", async function(next) {
  try {
    const user = this;
    if (!user.isModified("password")) return next();

    user.password = await bcrypt.hash(user.password, 10);

    user.passwordConfirm = undefined;
    next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
  }
});

userSchema.pre("save", function(next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.comparePassword = async function(password, hashPassword) {
  return await bcrypt.compare(password, hashPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    // console.log(this.passwordChangedAt, JWTTimestamp);
    const d = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < d;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.pre(/^find/, function(next) {
  // this = current query
  this.find({ active: { $ne: false } });
  next();
});

module.exports = mongoose.model("User", userSchema);
