module.exports = function (app) {
  var remotes = app.remotes();
// modify all returned values
  remotes.after('**', function (ctx, next) {
    if (ctx) {
      ctx.result = {
        status: 200,
        data: ctx.result,
        message: "Success"
      };
    } else {
      var err = new Error();
      next({
        status: 400,
        data: err,
        message: "Something went wrong"
      });
    }
    next();
  });
}
