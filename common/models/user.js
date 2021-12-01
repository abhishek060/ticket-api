'use strict';
const Utils = require("../../utils/common");

const app = require('../../server/server');
const Request = require('request');

module.exports = function (user) {

  user.loginUserExternal = function (loginObject, cb) {
    if (loginObject.key === undefined || loginObject.key === "")
      return cb(null, {success: false, error: true, msg: "License Key is required"});
    if (loginObject.app_id === undefined || loginObject.app_id === "")
      return cb(null, {success: false, error: true, msg: "Application ID is required"});
    if (loginObject.mac_id === undefined || loginObject.mac_id === "")
      return cb(null, {success: false, error: true, msg: "Mac ID is required"});

    let dataObj = {
      "licenseKey": loginObject.key,
      // "licenseKey": "A3DNL7-AYJUAG-AH963L-CLPGBB-462XB7",
      "macAddress": loginObject.mac_id
      // "macAddress": "1233"
    };

    return new Promise(function (resolve, reject) {
      try {
        Request.post({
            "headers": {"content-type": "application/json"},
            "url": 'https://mokhabot.io/rest/api/user/checkMacAddress',
            "body": JSON.stringify(dataObj)
          },
          async (error, response, body) => {
            if (error) {
              resolve({success: false, error: true, msg: "Some error has occured, contact your admin"})
            } else {
              let response = JSON.parse(body)

              if (response.statusCode === 'OK') {
                let licenseData = response.data;

                if (!licenseData.isValid) {
                  resolve({success: false, error: true, msg: "License key expired"})

                } else {

                  let data = {
                    "username": licenseData.user,
                    "password": await Utils.generateRandomPassword(15),
                    "added_on": Date.now(),
                    email: licenseData.email,
                    "error_delay": 100,
                    "monitor_delay": 100,
                    "credits": 5000,
                    "discord_webhook": "http://google.com"
                  };

                  user.find({
                    where: {
                      username: licenseData.user,
                      is_deleted: false
                    },
                  }).then((userRes) => {
                    if (userRes.length === 0) {
                      user.create(data).then((createRes) => {
                        if (createRes.id !== undefined) {
                          let validUpto = new Date(licenseData.validTo);
                          let expiryDate = validUpto.setHours(23, 59, 59, 59);
                          let licenseDataObj = {
                            "user_id": createRes.id,
                            "license_key": licenseData.licenseKey,
                            "mac_address": licenseData.macAddress,
                            "expiry_date": expiryDate,
                            "added_on": Date.now()
                          };
                          let licenses = app.models.license;
                          licenses.create(licenseDataObj).then(async licRes => {
                            if (licRes.id !== undefined)
                              await getUserDetailsExteral(createRes.id, loginObject.app_id, resolve)
                            else
                              resolve({success: false, error: true, msg: "Some error has occured6"})
                          }).catch(licErr => {
                            resolve({success: false, error: true, msg: "Some error has occured5"})
                          })
                        }
                      }).catch(createErr => {
                        resolve({success: false, error: true, msg: "Some error has occured4 " + createErr.message})
                      })
                    } else {
                      let validUpto = new Date(licenseData.validTo);
                      let expiryDate = validUpto.setHours(23, 59, 59, 59);
                      let licenseDataObj = {
                        "expiry_date": expiryDate
                      };
                      let licenses = app.models.license;

                      licenses.updateAll({
                        user_id: userRes.id,
                        is_deleted: false
                      }, licenseDataObj).then(async (res) => {
                        if (res.count > 0) {
                          await getUserDetailsExteral(userRes[0].id, loginObject.app_id, resolve)
                        } else {
                          resolve({success: false, error: true, msg: "Some error has occured 1"})
                        }
                      }).catch((e) => {
                        resolve({success: false, error: true, msg: "Some error has occured 2"})
                      })
                    }
                  }).catch((userErr) => {
                    resolve({success: false, error: true, msg: "Some error has occured3"})
                  })
                }
              } else if (response.statusCode === 'FORBIDDEN') {
                resolve({success: false, error: true, msg: response.message})
              }
              else if (response.statusCode === 'NOT_FOUND') {
                resolve({success: false, error: true, msg: response.message})
              } else {
                resolve({success: false, error: true, msg: "Some error has occured, contact your admin"})
              }

            }
          }
        );
      } catch (e) {
        resolve({success: false, msg: "Some error has oaccured"})

      }
    })
  }

  user.loginUser = function (loginObject, cb) {
    if (loginObject.key === undefined || loginObject.key === "")
      return cb(null, {success: false, error: true, msg: "License Key is required"});
    if (loginObject.app_id === undefined || loginObject.app_id === "")
      return cb(null, {success: false, error: true, msg: "Application ID is required"});

    let licenses = app.models.license;
    licenses.find({
      where: {
        license_key: loginObject.key,
        is_deleted: false
      }
    }).then(async function (res) {
      if (res.length > 0) {
        let currentTimestamp = Date.now();
        let expiryDate = parseFloat(res[0].expiry_date);

        if (currentTimestamp > expiryDate) {
          return cb(null, {success: true, error: false, is_expired: true, msg: "License Key expired"})
        } else {
          await getUserDetails(res[0].user_id, loginObject.app_id, cb)
        }
      } else {
        return cb(null, {success: false, error: true, msg: "Invalid License Key"})
      }
    }).catch((e) => {
      return cb(null, {success: false, error: true, msg: "Some error has occurred"})
    })
  }

  async function getUserDetails(userId, app_id, cb) {
    return user.findOne({where: {_id: userId}}, async function (err, user) {
      if (err) {
        return cb(null, {success: false, error: true, msg: "Some error has occurred"});
      } else if (user) {
        let appRes = await getApplicationDetails(user.app_id)

        if (!appRes.success)
          return cb(null, appRes)

        let original_id = appRes.appData.app_id

        if (original_id !== app_id)
          return cb(null, {success: false, error: true, msg: "Invalid License Key"});

        user.createAccessToken(86400, async function (err, token) {
          if (err)
            return cb(null, {success: false, error: true, msg: "Some error has occurred"});
          token.__data.user = user;
          cb(null, {
            error: false,
            success: true,
            is_expired: false,
            response: {
              accessToken: token.id,
              user: [user]
            }
          });
        });
      } else {
        cb(null, {success: false, error: true, msg: "User not found"});
      }
    });
  }

  async function getUserDetailsExteral(userId, app_id, resolve) {
    return user.findOne({where: {_id: userId}}, async function (err, user) {
      if (err) {
        resolve({success: false, error: true, msg: "Some error has occurred"});
      } else if (user) {
        let appRes = await getApplicationDetails(user.app_id);

        if (!appRes.success)
          return appRes

        let original_id = appRes.appData.app_id

        if (original_id !== app_id)
          resolve({success: false, error: true, msg: "Invalid License Key"});

        return user.createAccessToken(86400).then(token => {
          token.__data.user = user;
          resolve({
            error: false,
            success: true,
            is_expired: false,
            response: {
              accessToken: token.id,
              user: [user]
            }
          });
        }).catch(err => {
          resolve({success: false, error: true, msg: "Some error has occurred"});
        })
      } else {
        resolve({success: false, error: true, msg: "User not found"});
      }
    });
  }

  user.updateSettings = async function (settingsObject, options) {
    if (settingsObject.monitor_delay === undefined && settingsObject.error_delay === undefined && settingsObject.discord_webhook === undefined)
      return {success: false, error: true, msg: "At least one setting is required to update"}

    let token = options && options.accessToken;
    let userId = token && token.userId;

    let updateObject = {
      monitor_delay: settingsObject.monitor_delay,
      error_delay: settingsObject.error_delay,
      discord_webhook: settingsObject.discord_webhook,
    };

    return user.updateAll({
      _id: userId,
      is_deleted: false
    }, updateObject).then((res) => {
      if (res.count === 1) {
        return {success: true, error: false, msg: "Settings updated"}
      } else {
        return {success: false, error: true, msg: "Failed to update settings"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to update settings"}
    })
  };

  async function checkLicenseKey(userID) {

    let licenses = app.models.license;
    return licenses.find({
      where: {
        user_id: userID,
        is_deleted: false
      }
    }).then(async function (res) {
      if (res.length > 0) {

        let dataObj = {
          "licenseKey": res[0].license_key,
          // "licenseKey": "A3DNL7-AYJUAG-AH963L-CLPGBB-462XB7",
          "macAddress": res[0].mac_address
          // "macAddress": "12334"
        };

        return new Promise(function (resolve, reject) {
          try {
            Request.post({
                "headers": {"content-type": "application/json"},
                "url": 'https://mokhabot.io/rest/api/user/checkMacAddress',
                "body": JSON.stringify(dataObj)
              },
              async (error, response, body) => {
                if (error) {
                  resolve({success: false})
                } else {
                  let response = JSON.parse(body)
                  if (response.statusCode === 'OK') {
                    resolve({success: true})
                  }
                  else {
                    resolve({success: false})
                  }
                }
              }
            );
          } catch (e) {
            resolve({success: false})
          }
        })
      } else {
        return {success: false,}
      }
    }).catch((e) => {
      return {success: false}
    });
  }

  user.getDashboardData = async function (options) {
    let token = options && options.accessToken;
    let userId = token && token.userId;

    let dataObject = {}

    let userDetails = await getUserData(userId)

    if (userDetails.success)
      dataObject.userData = userDetails.userData
    else
      return userDetails

    let completedOrders = await getCompletedOrders(userId)
    if (completedOrders.success)
      dataObject.completedOrders = completedOrders.completedOrders
    else
      return completedOrders

    let allOrders = await getAllPastCheckouts("ALL", userId)
    if (allOrders.success)
      dataObject.allOrders = allOrders.orders
    else
      return allOrders

    let recentOrders = await getAllPastCheckouts(5, userId)
    if (recentOrders.success)
      dataObject.recentOrders = recentOrders.orders
    else
      return recentOrders

    let licenseDetails = await getLicenseDetails(userId)
    if (licenseDetails.success)
      dataObject.licenseDetails = licenseDetails.licenseData
    else
      return licenseDetails

    return {success: true, error: false, data: dataObject}
  }

  user.dashboardData = async function (options) {
    let token = options && options.accessToken;
    let userId = token && token.userId;
    let licenseKeyResponse = (await checkLicenseKey(userId));
    if (!licenseKeyResponse.success) {
      return {success: false, error: true, fail: true, msg: "Some error occured", data: []}
    }

    let dataObject = {}

    let userDetails = await getUserData(userId)

    if (userDetails.success)
      dataObject.userData = userDetails.userData
    else
      return userDetails

    let completedOrders = await getCompletedOrders(userId)
    if (completedOrders.success)
      dataObject.completedOrders = completedOrders.completedOrders
    else
      return completedOrders

    let allOrders = await getAllPastCheckouts("ALL", userId)
    if (allOrders.success)
      dataObject.allOrders = allOrders.orders
    else
      return allOrders

    let recentOrders = await getAllPastCheckouts(5, userId)
    if (recentOrders.success)
      dataObject.recentOrders = recentOrders.orders
    else
      return recentOrders

    let licenseDetails = await getLicenseDetails(userId)
    if (licenseDetails.success)
      dataObject.licenseDetails = licenseDetails.licenseData
    else
      return licenseDetails

    return {success: true, error: false, data: dataObject}
  }

  user.getUserAllData = async function (options) {
    let token = options && options.accessToken;
    let userId = token && token.userId;
    return await getUserData(userId);
  };

  async function getUserData(userId) {
    return user.find({
      where: {
        _id: userId,
        is_deleted: false
      }
    }).then((res) => {
      if (res.length > 0)
        return {success: true, error: false, userData: res[0]}
      else
        return {success: false, error: true, msg: "User not found"}
    }).catch((e) => {
      return {success: false, error: true, msg: "Some error has occurred"}
    })
  }

  async function getCompletedOrders(userId) {
    let orders = app.models.orders

    return orders.find({
      where: {
        user_id: userId,
        status: "Purchased"
      }
    }).then((res) => {
      let totalAmount = 0;
      let totalOrders = res.length;

      for (let i = 0; i < res.length; i++) {
        totalAmount = totalAmount + res[i].amount;
      }

      let dataObject = {
        totalOrders: totalOrders,
        totalAmount: totalAmount,
      }

      return {success: true, error: false, completedOrders: dataObject}
    }).catch((e) => {
      return {success: false, error: true, msg: "Some error has occurred"}
    })

  }

  async function getAllPastCheckouts(limit, userId) {
    let orders = app.models.orders
    let findQuery = {
      where: {
        user_id: userId,
        status: "Purchased"
      },
      order: 'added_on ASC',
    }

    if (limit !== "ALL") {
      findQuery.limit = limit
      findQuery.order = 'added_on DESC'
    }

    return orders.find(findQuery).then((res) => {
      return {success: true, error: false, orders: res}
    }).catch((e) => {
      return {success: false, error: true, msg: "Some error has occurred"}
    })
  }

  async function getLicenseDetails(userId) {
    let licenses = app.models.license;

    return licenses.find({
      where: {
        user_id: userId,
        is_active: true,
        is_deleted: false
      }
    }).then((res) => {
      return {success: true, error: false, licenseData: res[0]}
    }).catch((e) => {
      return {success: false, error: true, msg: "Some error has occurred"}
    })
  }

  user.testDiscord = async function (options) {
    let token = options && options.accessToken;
    let userId = token && token.userId;

    let userData = await getUserData(userId);

    if (!userData.success)
      return userData;

    let app_id = userData.userData.app_id;
    let appRes = await getApplicationDetails(app_id);

    if (!appRes.success)
      return appRes;

    let appData = appRes.appData;

    let discordWebhook = userData.userData.discord_webhook;
    let messageObject = {
      username: appData.name,
      avatar_url: appData.image_url,
      content: "Hello! Welcome to " + appData.name
    };

    return await sendDiscordMessage(discordWebhook, messageObject)
  };

  user.discordMessage = async function (dataObject, options) {
    if (dataObject.message === undefined || dataObject.message === "")
      return {success: false, msg: "Message is required"}

    let token = options && options.accessToken;
    let userId = token && token.userId;

    let userData = await getUserData(userId)

    if (!userData.success)
      return userData

    let app_id = userData.userData.app_id
    let appRes = await getApplicationDetails(app_id)

    if (!appRes.success)
      return appRes

    let appData = appRes.appData

    let discordWebhook = userData.userData.discord_webhook
    let messageObject = {
      username: appData.name,
      avatar_url: appData.image_url,
      content: dataObject.message
    }

    return await sendDiscordMessage(discordWebhook, messageObject)
  };

  async function sendDiscordMessage(url, messageObject) {
    if (url === "")
      return ({success: false, msg: "No discord url found"})

    return new Promise(function (resolve, reject) {
      try {
        Request.post({
            "headers": {"content-type": "application/json"},
            "url": url,
            "body": JSON.stringify(messageObject)
          },
          (error, response, body) => {
            if (error) {
              resolve({success: false, msg: "Failed to send test message"})
            } else {
              if (body === "") {
                resolve({success: true, msg: "Check your discord"})
              } else {
                resolve({success: false, msg: "Failed to send test message"})
              }
            }
          }
        );
      } catch (e) {
        resolve({success: false, msg: "Some error has oaccured"})

      }
    })
  }

  async function getApplicationDetails(appId) {
    let applications = app.models.applications;
    return applications.find({
      where: {
        _id: appId,
        is_deleted: false
      }
    }).then(async function (res) {
      if (res.length > 0)
        return {success: true, appData: res[0], msg: "Application Found"}
      else
        return {success: false, msg: "App Not found"}
    }).catch((e) => {
      return {success: false, msg: "Some Error has occurred"}
    })
  }

  user.loginAdmin = function (loginObject, cb) {
    if (loginObject.key === undefined || loginObject.key === "")
      return cb(null, {success: false, error: true, msg: "License Key is required"});

    let licenses = app.models.license;
    licenses.find({
      where: {
        license_key: loginObject.key,
        is_deleted: false
      }
    }).then(async function (res) {
      if (res.length > 0) {
        let currentTimestamp = Date.now();
        let expiryDate = parseFloat(res[0].expiry_date);

        if (currentTimestamp > expiryDate) {
          return cb(null, {success: true, error: false, is_expired: true, msg: "License Key expired"})
        } else {
          await getAdminDetails(res[0].user_id, cb)
        }
      } else {
        return cb(null, {success: false, error: true, msg: "Invalid License Key"})
      }
    }).catch((e) => {
      return cb(null, {success: false, error: true, msg: "Some error has occurred"})
    })
  }

  async function getAdminDetails(userId, cb) {
    return user.findOne({where: {_id: userId}}, async function (err, user) {
      if (err) {
        return cb(null, {success: false, error: true, msg: "Some error has occurred"});
      } else if (user) {
        user.createAccessToken(86400, async function (err, token) {
          if (err)
            return cb(null, {success: false, error: true, msg: "Some error has occurred"});
          token.__data.user = user;
          cb(null, {
            error: false,
            success: true,
            is_expired: false,
            response: {
              accessToken: token.id,
              user: [user]
            }
          });
        });
      } else {
        cb(null, {success: false, error: true, msg: "User not found"});
      }
    });
  }

  user.updateUserFields = async function(dataObject, options) {
    if(dataObject.id === undefined)
      return {success: false, error: true, msg: "ID is required"}

    let token = options && options.accessToken;
    let userId = token && token.userId;

    let isAdmin = await Utils.checkIfUserIsAdminOrNot(userId);

    let updateObject = {}

    if (dataObject.email !== undefined)
      updateObject.email = dataObject.email

    let isUpdateObjectEmpty = Object.keys(updateObject).length === 0 && updateObject.constructor === Object

    if (isUpdateObjectEmpty)
      return {success: false, error: true, msg: "No fields to update"}

    if (isAdmin) {
      return user.updateAll({
        _id: dataObject.id,
        is_deleted: false,
      }, updateObject).then(async(res) => {
        if (res.count === 1) {
          return {success: true, error: false, msg: 'User Updated'};
        } else {
          return {success: false, error: true, msg: 'Failed to update User'};
        }
      }).catch((e) => {
        return {success: false, error: true, msg: 'Failed to update User'};
      });
    } else {
      return {success: false, error: true, msg: 'Not authorised'};
    }
  };

  user.remoteMethod(
    'loginUser', {
      http: {
        path: '/login-user',
        verb: 'post',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'loginObject', type: 'object', http: {source: 'body'}}
      ]
    }
  );

  user.remoteMethod(
    'loginAdmin', {
      http: {
        path: '/login-admin',
        verb: 'post',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'loginObject', type: 'object', http: {source: 'body'}}
      ]
    }
  );

  user.remoteMethod(
    'loginUserExternal', {
      http: {
        path: '/license-login',
        verb: 'post',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'loginObject', type: 'object', http: {source: 'body'}}
      ]
    }
  );

  user.remoteMethod(
    'updateSettings', {
      http: {
        path: '/update-settings',
        verb: 'post',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'settingsObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  user.remoteMethod(
    'getDashboardData', {
      http: {
        path: '/dashboard-data',
        verb: 'get',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  user.remoteMethod(
    'dashboardData', {
      http: {
        path: '/get-dashboard-data',
        verb: 'get',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  user.remoteMethod(
    'getUserAllData', {
      http: {
        path: '/user-data',
        verb: 'get',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  user.remoteMethod(
    'testDiscord', {
      http: {
        path: '/test-discord',
        verb: 'post',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  user.remoteMethod(
    'discordMessage', {
      http: {
        path: '/discord-message',
        verb: 'post',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'dataObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  user.remoteMethod(
    'updateUserFields', {
      http: {
        path: '/update-user-fields',
        verb: 'post',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'dataObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

};
