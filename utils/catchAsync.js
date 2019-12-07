/**
 * Taking the function and returning another function
 * making the full use of closures
 */
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
