'use strict';
const common = require('../../utils/common')
const request = require('request');
const app = require('../../server/server');

module.exports = function (proxy) {

  proxy.addBulkProxy = async function (proxyObject, options) {
    if (proxyObject.proxyArray === undefined || proxyObject.proxyArray.length === 0) {
      return {success: false, error: true, msg: "Proxy array is required"}
    }
    let token = options && options.accessToken;
    let userId = token && token.userId;
    let proxies = [];
    let proxyArray = proxyObject.proxyArray
    for (let i = 0; i < proxyArray.length; i++) {
      let currentProxy = proxyArray[i].split(':')
      let dataObject = {
        user_id: userId,
        group_id:proxyObject.group_id,
        time: "",
        status: "Added",
        status_color: "#ffffff",
        added_on: Date.now(),
        available: true,
        is_deleted: false
      }
      if (currentProxy.length === 1 || currentProxy.length > 5) {
        continue
      } else if (currentProxy.length === 2) {
        let identifier = await common.generateIdentifier(10)
        dataObject.ip = currentProxy[0]
        dataObject.port = currentProxy[1]
        dataObject.identifier = dataObject.ip + ":" + dataObject.port
      } else if (currentProxy.length === 3) {
        dataObject.ip = currentProxy[0]
        dataObject.port = currentProxy[1]
        dataObject.identifier = currentProxy[2]
      } else if (currentProxy.length === 4) {
        let identifier = await common.generateIdentifier(10)
        dataObject.ip = currentProxy[0]
        dataObject.port = currentProxy[1]
        dataObject.user = currentProxy[2]
        dataObject.pass = currentProxy[3]
        dataObject.identifier = dataObject.ip + ":" + dataObject.port
      } else if (currentProxy.length === 5) {
        dataObject.ip = currentProxy[0]
        dataObject.port = currentProxy[1]
        dataObject.user = currentProxy[2]
        dataObject.pass = currentProxy[3]
        dataObject.identifier = currentProxy[4]
      }
      proxies.push(dataObject)
    }

    let message = "";
    if (proxies.length === proxyArray.length) {
      message = proxies.length + " " + (proxies.length === 1 ? "proxy" : "proxies") + " added successfully"
    } else {
      let errorProxies = proxyArray.length - proxies.length;
      message = proxies.length + " " + (proxies.length === 1 ? "proxy" : "proxies") + " added successfully and failed to add " + errorProxies + (errorProxies === 1 ? " proxy" : " proxies")
    }

    if (proxies.length > 0) {
      return proxy.create(proxies).then((res) => {
        return {success: true, error: false, msg: message, data: res}
      }).catch((e) => {
        return {success: false, error: true, msg: "Failed to add proxies"}
      })
    } else {
      return {success: false, error: true, msg: "Failed to add proxies, Please check."}
    }

  };

  proxy.updateProxy = async function (proxyObject, options) {

    if (proxyObject.id === undefined || proxyObject.id === "") {
      return {success: false, error: true, msg: "Proxy Id is required"}
    }

    let token = options && options.accessToken;
    let userId = token && token.userId;
    let proxyId = proxyObject.id

    delete proxyObject["id"];

    if (proxyObject.user_id)
      delete proxyObject["user_id"];

    if (proxyObject.is_deleted)
      delete proxyObject["is_deleted"];

    if (proxyObject.available)
      delete proxyObject["available"];

    return proxy.updateAll({
      _id: proxyId,
      user_id: userId,
      is_deleted: false
    }, proxyObject).then((res) => {
      if (res.count === 1) {
        return {success: true, error: false, msg: "Proxy updated"}
      } else {
        return {success: false, error: true, msg: "Failed to update proxy"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to update proxy"}
    })

  }

  proxy.deleteProxy = async function (proxyId, options) {

    if (proxyId === undefined || proxyId === "") {
      return {success: false, error: true, msg: "Proxy Id is required"}
    }

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return proxy.updateAll({
      _id: proxyId,
      user_id: userId,
    }, {is_deleted: true}).then((res) => {
      if (res.count === 1) {
        return {success: true, error: false, msg: "Proxy Deleted"}
      } else {
        return {success: false, error: true, msg: "Failed to delete proxy"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to delete proxy"}
    })

  }

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
            request.post({
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

  proxy.getUserProxiesByGroup = async function (options,group_id) {

    let token = options && options.accessToken;
    let userId = token && token.userId;
    return proxy.find({
      where: {
        group_id:group_id,
        user_id: userId,
        is_deleted: false
      }
    }).then((res) => {
      return {success: true, error: false, msg: "Proxies fetched successfully", proxies: res}
    }).catch((e) => {
      return {success: false,proxies:[], error: true, msg: "Failed to fetch proxies"}
    })

  }
  proxy.getUserProxies = async function (options) {

    let token = options && options.accessToken;
    let userId = token && token.userId;
    return proxy.find({
      where: {
        user_id: userId,
        is_deleted: false
      },
      include: [
        {
          relation: "group_details",
        }
      ]
    }).then((res) => {
      return {success: true, error: false, msg: "Proxies fetched successfully", proxies: res}
    }).catch((e) => {
      return {success: false,proxies:[], error: true, msg: "Failed to fetch proxies"}
    })

  }
  proxy.userProxies = async function (options,group_id) {

    let token = options && options.accessToken;
    let userId = token && token.userId;

    let licenseKeyResponse = (await checkLicenseKey(userId));
    if (!licenseKeyResponse.success) {
      return {success: false, error: true,fail : true, msg: "Some error occured", data: []}
    }

    return proxy.find({
      where: {
        group_id:group_id,
        user_id: userId,
        is_deleted: false
      },
      include: [
        {
          relation: "group_details",
        }
      ]
    }).then((res) => {
      return {success: true, error: false, msg: "Proxies fetched successfully", proxies: res}
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to fetch proxies"}
    })

  }

  proxy.deleteMultiProxies = async function (proxyObject, options) {
    if (proxyObject.proxies === undefined || proxyObject.proxies.length === 0) {
      return {success: false, error: true, msg: "Proxy IDs are required"}
    }

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return proxy.updateAll({
      _id: {inq: proxyObject.proxies},
      user_id: userId
    }, {is_deleted: true}).then((res) => {
      if (res.count > 0) {
        return {success: true, error: false, msg: res.count + (res.count === 1 ? " proxy" : " proxies") + " deleted"}
      } else {
        return {success: false, error: true, msg: "Failed to delete proxies"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to delete proxies"}
    })

  }

  proxy.deleteUserProxies = async function (options) {

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return proxy.updateAll({
      user_id: userId,
      is_deleted: false
    }, {is_deleted: true}).then((res) => {
      if (res.count > 0) {
        return {success: true, error: false, msg: res.count + (res.count === 1 ? " proxy" : " proxies") + " deleted"}
      } else {
        return {success: false, error: true, msg: "No proxies found to delete"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to delete proxies"}
    })

  }

  proxy.updateProxyStatus = async function (proxyObject, options) {

    if (proxyObject.proxies === undefined || proxyObject.proxies.length === 0) {
      return {success: false, error: true, msg: "Proxy IDs are required"}
    }

    let token = options && options.accessToken;
    let userId = token && token.userId;

    let allProxies = proxyObject.proxies;
    let updateCount = 0

    for (let i = 0; i < allProxies.length; i++) {

      if (allProxies[i].id === undefined || allProxies[i].id === "")
        continue
      if (allProxies[i].time === undefined || allProxies[i].time === "")
        continue
      if (allProxies[i].status === undefined || allProxies[i].status === "")
        continue
      if (allProxies[i].status_color === undefined || allProxies[i].status_color === "")
        continue

      let updateObject = {
        time: allProxies[i].time,
        status: allProxies[i].status,
        status_color: allProxies[i].status_color
      }

      let updateRes = await updateProxyStatus(allProxies[i].id, userId, updateObject)

      if (updateRes)
        updateCount++
    }

    let message = "";
    if (allProxies.length === updateCount) {
      message = allProxies.length + " " + (allProxies.length === 1 ? "proxy" : "proxies") + " updated successfully"
    } else {
      let errorProxies = allProxies.length - updateCount
      message = updateCount + " " + (updateCount === 1 ? "proxy" : "proxies") + " updated successfully and failed to update " + errorProxies + (errorProxies === 1 ? " proxy" : " proxies")
    }

    if (updateCount > 0)
      return {success: true, error: false, msg: message}
    else
      return {success: false, error: true, msg: "Failed to update " + allProxies.length + " proxies"}

  }

  async function updateProxyStatus(proxyId, userId, updateObject) {
    return proxy.updateAll({
      _id: proxyId,
      user_id: userId,
      is_deleted: false
    }, updateObject).then((res) => {
      return res.count === 1;
    }).catch((e) => {
      return false
    })
  }

  async function updateProxyTestStatus(proxies, userId) {
    let whereQuery
    if (proxies[0] === "ALL") {
      whereQuery = {
        user_id: userId,
        is_deleted: false
      }
    } else {
      whereQuery = {
        _id: {inq: proxies},
        user_id: userId,
        is_deleted: false
      }
    }
    return proxy.updateAll(whereQuery, {
      status: "Testing..",
      status_color: '#ffff00',
      time: ""
    }).then((res) => {
      if (res.count === 0)
        return {success: false, msg: "No Proxies found"}
      else
        return {success: true, msg: "Proxy testing in progress"}
    }).catch((e) => {
      return {success: false, msg: "Some error has occurred"}
    })
  }

  proxy.testProxy = async function (proxyObject, options) {
    try {
      if (proxyObject.proxies === undefined || proxyObject.proxies.length === 0) {
        return {success: false, error: true, msg: "Proxies are required"}
      }

      let token = options && options.accessToken;
      let userId = token && token.userId;
      let proxies = proxyObject.proxies

      let proxyDetails = await getProxyDetails(proxies, userId)
      if (!proxyDetails.success)
        return proxyDetails

      let updateTestProxyStatus = await updateProxyTestStatus(proxies, userId)
      if (!updateTestProxyStatus.success)
        return updateTestProxyStatus

      for (let i = 0; i < proxyDetails.data.length; i++) {
        checkProxy(proxyDetails.data[i])
      }
      return {success: true, msg: "Started"}
    } catch (e) {
      return {success: false, msg: "Some Error has occurred"}
    }
  }

  async function getProxyDetails(proxies, userId) {
    let whereQuery
    if (proxies[0] === "ALL") {
      whereQuery = {
        user_id: userId,
        is_deleted: false
      }
    } else {
      whereQuery = {
        _id: {inq: proxies},
        user_id: userId,
        is_deleted: false
      }
    }

    return proxy.find({
      where: whereQuery
    }).then((res) => {
      if (res.length > 0)
        return {success: true, msg: "Proxy Fetched", data: res}
      else
        return {success: false, msg: "No proxies found"}
    }).catch((e) => {
      return {success: false, msg: "Unable to fetch proxy"}
    })
  }

  function checkProxy(proxyData) {
    try {
      if (proxyData.ip === undefined || proxyData.ip === "")
        return {success: false, error: true, msg: "Proxy IP not provided"}

      if (proxyData.port === undefined || proxyData.port === "")
        return {success: false, error: true, msg: "Proxy port not provided"}

      let proxyUrl = "";
      if (proxyData.user && proxyData.pass) {
        proxyUrl = "http://" + proxyData.user + ":" + proxyData.pass + "@" + proxyData.ip + ":" + proxyData.port;
      } else {
        proxyUrl = "http://" + proxyData.ip + ":" + proxyData.port;
      }

      let proxiedRequest = request.defaults({'proxy': proxyUrl});
      let startTime = Date.now()
      return new Promise((resolve, reject) => {
        proxiedRequest.get("https://google.com", async function (err, resp, body) {
          if (err) {
            let updateObject = {
              time: Date.now() - startTime,
              status: "Not Working",
              status_color: '#ff0000'
            }
            await updateProxyStatus(proxyData.id, proxyData.user_id, updateObject)
            // console.log("Not Working")
            resolve("Not Working")
          } else {
            if (resp.statusCode === 200) {
              let updateObject = {
                time: Date.now() - startTime,
                status: "Working",
                status_color: '#08ff00'
              }
              await updateProxyStatus(proxyData.id, proxyData.user_id, updateObject)
              // console.log("Working")
              resolve("Working")
            } else {
              let updateObject = {
                time: Date.now() - startTime,
                status: "Not Working",
                status_color: '#ff0000'
              }
              await updateProxyStatus(proxyData.id, proxyData.user_id, updateObject)
              // console.log("Not Working")
              resolve("Not Working")
            }

          }
        });
      })
    } catch (e) {
      return {success: false, error: true, msg: "Some error has occurred"}
    }
  }

  proxy.remoteMethod(
    'addBulkProxy', {
      http: {
        path: '/add-bulk-proxy',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'proxyObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  proxy.remoteMethod(
    'updateProxy', {
      http: {
        path: '/update-proxy',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'proxyObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  proxy.remoteMethod(
    'updateProxyStatus', {
      http: {
        path: '/update-proxy-status',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'proxyObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  proxy.remoteMethod(
    'deleteProxy', {
      http: {
        path: '/delete-proxy/:proxyId',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'proxyId', type: 'string', required: true},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  proxy.remoteMethod(
    'getUserProxies', {
      http: {
        path: '/user-proxies',
        verb: 'get',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [{arg: 'options', type: 'object', http: 'optionsFromRequest'}
    ]
    }
  );

  proxy.remoteMethod(
    'getUserProxiesByGroup', {
      http: {
        path: '/user-proxies-group/:group_id',
        verb: 'get',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [{arg: 'options', type: 'object', http: 'optionsFromRequest'},
      {arg: 'group_id', type: 'string', required: true}
    ]
    }
  );

  proxy.remoteMethod(
    'userProxies', {
      http: {
        path: '/get-user-proxies/:group_id',
        verb: 'get',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [{arg: 'options', type: 'object', http: 'optionsFromRequest'},
      {arg: 'group_id', type: 'string', required: true}
    ]
    }
  );

  proxy.remoteMethod(
    'deleteMultiProxies', {
      http: {
        path: '/delete-multi-proxies',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'proxyObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  proxy.remoteMethod(
    'deleteUserProxies', {
      http: {
        path: '/delete-user-proxies',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  proxy.remoteMethod(
    'testProxy', {
      http: {
        path: '/test-proxy',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'proxyObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );
};

//Sample Proxy Object

// let proxyObjext = {
// "proxyArray":["192.168.0.1:8080:abc:xyz"]
// }
