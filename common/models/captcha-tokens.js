'use strict';

module.exports = function (captchaTokens) {

  captchaTokens.observe('before save', function GetHash(ctx, next) {
    if (ctx.instance) {
      ctx.instance.timestamp = new Date().getTime()
      next();
    } else {
      next();
    }
  });

};
