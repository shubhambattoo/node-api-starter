const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const ApiFeatures = require("./../utils/apiFeatures");

exports.createOne = (Model, name = "data") =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: "ok",
      data: {
        [name]: doc
      }
    });
  });

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const doc = await Model.findByIdAndDelete(id);

    if (!doc) {
      return next(new AppError(`No doc found with that ID`, 404));
    }

    res.status(204).json({
      status: "ok",
      data: null
    });
  });

exports.updateOne = (Model, name = "data") =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const doc = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError(`No document found with that ID`, 404));
    }

    res.json({
      status: "ok",
      data: {
        [name]: doc
      }
    });
  });

exports.getOne = (Model, popOptions = "", name = "data") =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = Model.findById(req.params.id).populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(new AppError(`No document found with that ID`, 404));
    }

    res.json({
      status: "ok",
      data: { [name]: doc }
    });
  });

exports.getAll = (Model, name = "data") => 
  catchAsync(async(req, res, next) => {
    const features = new ApiFeatures(Model.find(), req.query)
      .sort()
      .paginate();

    const docs = await features.query;

    res.json({
      status: "ok",
      results: docs.length,
      data: { [name]: docs }
    });
  });
