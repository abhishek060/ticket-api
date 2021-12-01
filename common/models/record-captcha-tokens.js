'use strict';

module.exports = function (recordCaptchaTokens) {

  recordCaptchaTokens.observe('before save', function GetHash(ctx, next) {
    if (ctx.instance) {
      ctx.instance.timestamp = new Date().getTime()
      next();
    } else {
      next();
    }
  });

  recordCaptchaTokens.remoteMethod(
    'getUserCaptcha', {
      http: {
        path: '/user-captcha',
        verb: 'get',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [{arg: 'options', type: 'object', http: 'optionsFromRequest'}]
    }
  );

  recordCaptchaTokens.getUserCaptcha = async function (options) {

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return recordCaptchaTokens.find({
      where: {
        user_id: userId,
        is_recorded: false
      }
    }).then((res) => {
      return {success: true, error: false, data: res}
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to fetch"}
    })

  }

};
