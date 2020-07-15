class ApiFeatures {
  constructor(query, queryParams) {
    this.query = query;
    this.queryParams = queryParams;
  }

  filter() {
    const queryString = { ...this.queryParams };
    const excludedFields = ['page', 'sort', 'fields', 'limit'];
    excludedFields.forEach(el => {
      delete queryString[el];
    });

    // replace the operators
    let queryStr = JSON.stringify(queryString);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, str => {
      return `$${str}`;
    });

    // console.log(queryStr);

    // make query
    this.query = this.query.find(JSON.parse(queryStr));
    // let query = Tour.find(JSON.parse(queryStr));
    return this;
  }

  limitFields() {
    if (this.queryParams.fields) {
      const fields = this.queryParams.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  sort() {
    if (this.queryParams.sort) {
      const sortBy = this.queryParams.sort.split(',').join(' ');
      // console.log(sortBy);
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('created');
    }
    return this;
  }

  paginate() {
    const page = this.queryParams.page * 1 || 1;
    const limit = this.queryParams.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = ApiFeatures;
