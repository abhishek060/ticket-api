'use strict';

const app = require('../../server/server');

module.exports = function (orders) {

  orders.addOrder = async function (orderObject, options) {

    let token = options && options.accessToken;
    let userId = token && token.userId;

    let allUserOrdersRes = await getAllUserOrders(userId)

    if(!allUserOrdersRes.success)
      return allUserOrdersRes

    let totalOrders = allUserOrdersRes.count

    let userCreditsRes = await getUserCredits(userId)

    if(!userCreditsRes.success)
      return userCreditsRes

    let totalCredits = userCreditsRes.credits

    if(totalCredits < 1)
      return {success: false, error: true, msg: "You do not have enough credits to create an order"}

    let availableCredits = totalCredits - totalOrders

    if(availableCredits < 1)
      return {success: false, error: true, msg: "You do not have enough credits to create an order"}

    if (orderObject.keywords === "" || orderObject.keywords === undefined)
      return {success: false, error: true, msg: "Keywords is required"}

    if (orderObject.task_name === "" || orderObject.task_name === undefined)
      return {success: false, error: true, msg: "Task name is required"}

    if (orderObject.size === undefined || orderObject.size.length === 0)
      return {success: false, error: true, msg: "Size is required"}

    if (orderObject.profile_id === "" || orderObject.profile_id === undefined)
      return {success: false, error: true, msg: "Profile ID is required"}

    if (orderObject.site_name === "" || orderObject.site_name === undefined)
      return {success: false, error: true, msg: "Store name is required"}

    if (orderObject.cardIdentifier === "" || orderObject.cardIdentifier === undefined)
      return {success: false, error: true, msg: "Card identifier is required"}

    if (orderObject.profileIdentifier === "" || orderObject.profileIdentifier === undefined)
      return {success: false, error: true, msg: "Profile Identifier is required"}

    if (orderObject.proxyIdentifier === "" || orderObject.proxyIdentifier === undefined)
      return {success: false, error: true, msg: "Proxy Identifier is required"}

    // if (orderObject.card_id === "" || orderObject.card_id === undefined)
    //   return {success: false, error: true, msg: "Card ID is required"}

    let dataObject = {
      user_id: userId,
      // keywords: orderObject.keywords,
      size: orderObject.size,
      site_name: orderObject.site_name,
      status: "created",
      task_name: orderObject.task_name,
      status_color: "#ffffff",
      proxy_id: orderObject.proxy_id,
      profile_id: orderObject.profile_id,
      card_id: orderObject.card_id,
      log: {},
      cardIdentifier: orderObject.cardIdentifier,
      profileIdentifier: orderObject.profileIdentifier,
      proxyIdentifier: orderObject.proxyIdentifier,
      added_on: Date.now(),
      is_active: true,
      is_deleted: false
    };

    let isURLValid = await validURL(orderObject.keywords)

    if (isURLValid) {
      dataObject.url = orderObject.keywords
    } else {
      dataObject.keywords = orderObject.keywords
    }

    return orders.create(dataObject).then((res) => {
      return {success: true, error: false, msg: "Order Added", data: res}
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to add order"}
    })

  }

  orders.addBulkOrders = async function (orderObject, options) {

    let token = options && options.accessToken;
    let userId = token && token.userId;

    let allUserOrdersRes = await getAllUserOrders(userId)

    if(!allUserOrdersRes.success)
      return allUserOrdersRes

    let totalOrders = allUserOrdersRes.count

    let userCreditsRes = await getUserCredits(userId)

    if(!userCreditsRes.success)
      return userCreditsRes

    let totalCredits = userCreditsRes.credits

    if(totalCredits < 1)
      return {success: false, error: true, msg: "You do not have enough credits to create an order"}

    let availableCredits = totalCredits - totalOrders

    if(availableCredits < 1)
      return {success: false, error: true, msg: "You do not have enough credits to create an order"}

    if (orderObject.orders.length === 0)
      return {success: false, error: true, msg: "Orders are required"}

    let allOrders = orderObject.orders;
    let newOrders = []

    for (let i = 0; i < allOrders.length; i++) {
      let addedOrders = newOrders.length;

      if(addedOrders >= availableCredits)
        break;

      if (allOrders[i].keywords === "" || allOrders[i].keywords === undefined)
        continue

      if (allOrders[i].size === undefined || allOrders[i].size.length === 0)
        continue

      if (allOrders[i].profile_id === "" || allOrders[i].profile_id === undefined)
        continue

      if (allOrders[i].task_name === "" || allOrders[i].task_name === undefined)
        continue

      if (allOrders[i].site_name === "" || allOrders[i].site_name === undefined)
        continue

      if (allOrders[i].cardIdentifier === "" || allOrders[i].cardIdentifier === undefined)
        continue

      if (allOrders[i].profileIdentifier === "" || allOrders[i].profileIdentifier === undefined)
        continue

      if (allOrders[i].proxyIdentifier === "" || allOrders[i].proxyIdentifier === undefined)
        continue

      let dataObject = {
        user_id: userId,
        // keywords: allOrders[i].keywords,
        size: allOrders[i].size,
        status: "created",
        status_color: "#ffffff",
        task_name: allOrders[i].task_name,
        site_name: allOrders[i].site_name,
        profile_id: allOrders[i].profile_id,
        proxy_id: allOrders[i].proxy_id,
        card_id: allOrders[i].card_id,
        log: {},
        cardIdentifier: allOrders[i].cardIdentifier,
        profileIdentifier: allOrders[i].profileIdentifier,
        proxyIdentifier: allOrders[i].proxyIdentifier,
        added_on: Date.now(),
        is_active: true,
        is_deleted: false
      }

      let isURLValid = await validURL(allOrders[i].keywords)

      if (isURLValid) {
        dataObject.url = allOrders[i].keywords
      } else {
        dataObject.keywords = allOrders[i].keywords
      }

      newOrders.push(dataObject)
    }

    let message = "";
    if (newOrders.length === allOrders.length) {
      message = allOrders.length + " " + (allOrders.length === 1 ? "order" : "orders") + " added successfully"
    } else {
      let errorOrders = allOrders.length - newOrders.length;
      message = newOrders.length + " " + (newOrders.length === 1 ? "order" : "orders") + " added successfully and failed to add " + errorOrders + (errorOrders === 1 ? " order" : " orders")
    }

    if (newOrders.length > 0) {
      return orders.create(newOrders).then((res) => {
        return {success: true, error: false, msg: message, data: res}
      }).catch((e) => {
        return {success: false, error: true, msg: "Failed to add orders"}
      })
    } else {
      return {success: false, error: true, msg: "Failed to add orders"}
    }
  };

  orders.updateOrder = async function (orderObject, options) {

    if (orderObject.id === undefined || orderObject.id === "") {
      return {success: false, error: true, msg: "Order Id is required"}
    }

    let token = options && options.accessToken;
    let userId = token && token.userId;
    let orderId = orderObject.id;

    delete orderObject["id"];

    if (orderObject.user_id)
      delete orderObject["user_id"];

    if (orderObject.is_deleted)
      delete orderObject["is_deleted"];

    if (orderObject.is_active)
      delete orderObject["is_active"];


    let isURLValid = await validURL(orderObject.keywords)
    if (isURLValid) {
      orderObject.url = orderObject.keywords;
      orderObject.keywords = "";
    }

    return orders.updateAll({
      _id: orderId,
      user_id: userId,
      is_deleted: false
    }, orderObject).then((res) => {
      if (res.count === 1) {
        return {success: true, error: false, msg: "Order updated"}
      } else {
        return {success: false, error: true, msg: "Failed to update order"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to update order"}
    })
  };

  orders.deleteOrder = async function (orderId, options) {

    if (orderId === undefined || orderId === "") {
      return {success: false, error: true, msg: "Order Id is required"}
    }

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return orders.updateAll({
      _id: orderId,
      user_id: userId,
      is_deleted: false
    }, {is_deleted: true}).then((res) => {
      if (res.count === 1) {
        return {success: true, error: false, msg: "Order Deleted"}
      } else {
        return {success: false, error: true, msg: "Failed to delete order"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to delete order"}
    })

  }

  orders.getUserOrders = async function (options) {

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return orders.find({
      where: {
        user_id: userId,
        is_deleted: false
      },
      include: [
        {
          relation: 'profile',
          scope: {
            fields: [
              "profile_name",
              "_id"
            ]
          }
        }, {
          relation: 'proxy'
        }
      ],
      order: 'added_on DESC',
    }).then((res) => {
      return {success: true, error: false, msg: "Orders fetched successfully", orders: res}
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to fetch orders " + e.message}
    })
  };

  orders.deleteMultiOrders = async function (orderObject, options) {
    if (orderObject.orders === undefined || orderObject.orders.length === 0) {
      return {success: false, error: true, msg: "Order IDs are required"}
    }

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return orders.updateAll({
      _id: {inq: orderObject.orders},
      user_id: userId,
      is_deleted: false
    }, {is_deleted: true}).then((res) => {
      if (res.count > 0) {
        return {success: true, error: false, msg: res.count + (res.count === 1 ? " order" : " orders") + " deleted"}
      } else {
        return {success: false, error: true, msg: "No task found to delete"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to delete orders"}
    })

  }

  orders.deleteUserOrders = async function (options) {

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return orders.updateAll({
      user_id: userId,
      is_deleted: false
    }, {is_deleted: true}).then((res) => {
      if (res.count > 0) {
        return {success: true, error: false, msg: res.count + (res.count === 1 ? " order" : " orders") + " deleted"}
      } else {
        return {success: false, error: true, msg: "No task found to delete"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to delete orders"}
    })

  }

  orders.startTask = async function (taskId, options) {

    if (taskId === undefined || taskId === "") {
      return {success: false, error: true, msg: "Task Id is required"}
    }

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return orders.updateAll({
      _id: taskId,
      user_id: userId,
    }, {status: 'load'}).then((res) => {
      if (res.count === 1) {
        return {success: true, error: false, msg: "Task Started"}
      } else {
        return {success: false, error: true, msg: "Failed to start task"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Some error has occurred"}
    })
  }

  orders.startAllTasks = async function (options) {

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return orders.updateAll({
      user_id: userId,
      or: [
        {status: 'created'},
        {status: 'stopped'},
      ],
      is_deleted: false
    }, {status: 'load'}).then((res) => {
      if (res.count > 0)
        return {success: true, error: false, msg: res.count + (res.count === 1 ? " task" : " tasks") + " started"}
      else
        return {success: false, error: false, msg: "No task started"}
    }).catch((e) => {
      return {success: false, error: true, msg: "Some error has occurred"}
    })
  }

  orders.stopAllTasks = async function (options) {

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return orders.updateAll({
      user_id: userId,
      and: [
        {status: {neq: 'created'}},
        {status: {neq: 'stopped'}},
      ],
      is_deleted: false
    }, {status: 'stopped'}).then((res) => {
      if (res.count > 0)
        return {success: true, error: false, msg: res.count + (res.count === 1 ? " task" : " tasks") + " stopped"}
      else
        return {success: false, error: false, msg: "No task stopped"}
    }).catch((e) => {
      return {success: false, error: true, msg: "Some error has occurred"}
    })
  };

  orders.stopTask = async function (taskId, options) {

    if (taskId === undefined || taskId === "") {
      return {success: false, error: true, msg: "Task Id is required"}
    }

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return orders.updateAll({
      _id: taskId,
      user_id: userId,
    }, {status: 'stopped'}).then((res) => {
      if (res.count === 1) {
        return {success: true, error: false, msg: "Task Stopped"}
      } else {
        return {success: false, error: true, msg: "Failed to stop task"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Some error has occurred"}
    })
  }

  orders.getTaskStatus = async function (options) {

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return orders.find({
      where: {
        user_id: userId,
        is_deleted: false
      },
      fields: {
        id: true,
        status: true,
        status_color: true
      }
    }).then((res) => {
      return {success: true, error: false, msg: "Orders fetched successfully", orders: res}
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to fetch orders " + e.message}
    })
  };

  async function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
  }

  async function getAllUserOrders(userId){
    return orders.count({
        user_id: userId,
        status: "created"
    }).then((res) => {
      return {success: true, error: false, msg: "Orders fetched successfully", count: res}
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to fetch orders " + e.message}
    })
  }

  async function getUserCredits(userId){
    let users = app.models.user

    return users.find({
      where:{
        _id: userId
      }
    }).then((res)=>{
      if(res.length > 0)
        return {success: true, error: false, msg: "Credits fetched successfully", credits: res[0].credits}
      else
        return {success: false, error: true, msg: "User not found"}
    }).catch((e)=>{
      return {success: false, error: true, msg: "Failed to fetch user details " + e.message}
    })
  }

  orders.remoteMethod(
    'addOrder', {
      http: {
        path: '/add-order',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'orderObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  orders.remoteMethod(
    'addBulkOrders', {
      http: {
        path: '/add-bulk-orders',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'orderObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  orders.remoteMethod(
    'updateOrder', {
      http: {
        path: '/update-order',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'orderObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  orders.remoteMethod(
    'deleteOrder', {
      http: {
        path: '/delete-order/:orderId',
        verb: 'post',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'orderId', type: 'string', required: true},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  orders.remoteMethod(
    'startTask', {
      http: {
        path: '/start-task/:taskId',
        verb: 'post',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'taskId', type: 'string', required: true},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  orders.remoteMethod(
    'startAllTasks', {
      http: {
        path: '/start-all-tasks',
        verb: 'post',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  orders.remoteMethod(
    'stopAllTasks', {
      http: {
        path: '/stop-all-tasks',
        verb: 'post',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  orders.remoteMethod(
    'stopTask', {
      http: {
        path: '/stop-task/:taskId',
        verb: 'post',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'taskId', type: 'string', required: true},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  orders.remoteMethod(
    'getUserOrders', {
      http: {
        path: '/user-orders',
        verb: 'get',
      },
      returns: {type: 'array', root: true},
      accepts: [{arg: 'options', type: 'object', http: 'optionsFromRequest'}]
    }
  );

  orders.remoteMethod(
    'getTaskStatus', {
      http: {
        path: '/task-status',
        verb: 'get',
      },
      returns: {type: 'array', root: true},
      accepts: [{arg: 'options', type: 'object', http: 'optionsFromRequest'}]
    }
  );

  orders.remoteMethod(
    'deleteMultiOrders', {
      http: {
        path: '/delete-multi-orders',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'orderObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  orders.remoteMethod(
    'deleteUserOrders', {
      http: {
        path: '/delete-user-orders',
        verb: 'post',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );
};

//Sample Order object
// let orderObject = {
//   "keywords": "www.google.com",
//   "size": ["8.0"],
//   "task_name": "New task",
//   "site_name": "http://finishline.com",
//   "profile_id": "5f3b97993d952b0004183ee8",
//   "cardIdentifier": "abc",
//   "profileIdentifier": "pqr",
//   "proxyIdentifier": "xyz"
// }
