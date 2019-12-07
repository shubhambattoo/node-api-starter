const AppError = require("./../utils/appError");

/**
 * Sends error response in the development env
 * @param {any} err error object
 * @param {any} res response object of Expess
 */
const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    // console.log(err.isOperational);
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack
    });
  }
  // eslint-disable-next-line no-console
  console.error(`ERROR`, err);
};

const handleCaseErrorDB = err => {
  const message = `Invalid ${err.path} : ${err.value}`;

  return new AppError(message, 400);
};

const handleDuplicateFields = err => {
  const val = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];

  const message = `Duplicate field value: ${val}. Please use another value`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join(". ")}`;

  return new AppError(message, 400);
};

const handleTokenError = () =>
  new AppError("User is not authorised. Log in again", 401);

const handleTokenExpiredError = () =>
  new AppError("User is not authorised. Token Expired. Log in again", 401);

/**
 * Send Error response while in prod env
 * @description Contains to blocks of code, first block
 * represents the operational errors, the second blocks deals
 * with the programming error
 * @param {any} err the complete error object
 * @param {any} res the response object of Express
 * @returns void
 * @example
 * sendErrorProd(err, req, res);
 */
const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    // Operational, Trusted error : send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
      // Programming error, where we dont want to leak info
    }
    // 1) log to console
    // eslint-disable-next-line no-console
    console.error(`ERROR`, err);
    // 2) send generic message
    return res.status(500).json({
      status: "error",
      message: "something went wrong"
    });
  }

  if (err.isOperational) {
    // Programming error, where we dont want to leak info
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    if (error.name === "CastError") error = handleCaseErrorDB(error);

    if (error.code === 11000) error = handleDuplicateFields(error);

    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);

    if (error.name === "JsonWebTokenError") error = handleTokenError(error);

    if (error.name === "TokenExpiredError")
      error = handleTokenExpiredError(error);

    sendErrorProd(error, req, res);
  }
};
