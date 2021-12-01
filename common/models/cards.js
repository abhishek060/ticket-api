'use strict';

module.exports = function (cards) {

  cards.addCard = async function (cardObject, options) {

    if (cardObject.number === "" || cardObject.number === undefined)
      return {success: false, error: true, msg: "Card Number is required"}

    if (cardObject.cardType === "" || cardObject.cardType === undefined)
      return {success: false, error: true, msg: "Card Type is required"}

    if (cardObject.month === "" || cardObject.month === undefined)
      return {success: false, error: true, msg: "Expiry Month is required"}

    if (cardObject.year === "" || cardObject.year === undefined)
      return {success: false, error: true, msg: "Expiry Year is required"}

    if (cardObject.cvv === "" || cardObject.cvv === undefined)
      return {success: false, error: true, msg: "CVV is required"}

    let token = options && options.accessToken;
    let userId = token && token.userId;

    let dataObject = {
      user_id: userId,
      number: cardObject.number,
      cardType: cardObject.cardType,
      month: cardObject.month,
      year: cardObject.year,
      cvv: cardObject.cvv,
      added_on: Date.now(),
      available: true,
      is_deleted: false
    }

    return cards.create(dataObject).then((res) => {
      return {success: true, error: false, msg: "Card Added", data: res}
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to add card"}
    })
  }

  cards.updateCard = async function (cardObject, options) {

    if (cardObject.id === undefined || cardObject.id === "") {
      return {success: false, error: true, msg: "Card Id is required"}
    }

    let token = options && options.accessToken;
    let userId = token && token.userId;
    let cardId = cardObject.id

    delete cardObject["id"];

    if (cardObject.user_id)
      delete cardObject["user_id"];

    if (cardObject.is_deleted)
      delete cardObject["is_deleted"];

    if (cardObject.available)
      delete cardObject["available"];

    return cards.updateAll({
      _id: cardId,
      user_id: userId,
      is_deleted: false
    }, cardObject).then((res) => {
      if (res.count === 1) {
        return {success: true, error: false, msg: "Card updated"}
      } else {
        return {success: false, error: true, msg: "Failed to update card"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to update card"}
    })

  }

  cards.deleteCard = async function (cardId, options) {

    if (cardId === undefined || cardId === "") {
      return {success: false, error: true, msg: "Card Id is required"}
    }

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return cards.updateAll({
      _id: cardId,
      user_id: userId,
    }, {is_deleted: true}).then((res) => {
      if (res.count === 1) {
        return {success: true, error: false, msg: "Card Deleted"}
      } else {
        return {success: false, error: true, msg: "Failed to delete card"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to delete card"}
    })

  }

  cards.getUserCards = async function (options) {

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return cards.find({
      where: {
        user_id: userId,
        is_deleted: false
      }
    }).then((res) => {
      return {success: true, error: false, msg: "Cards fetched successfully", cards: res}
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to fetch cards"}
    })

  }

  cards.deleteMultiCards = async function (cardObject, options) {
    if (cardObject.cards === undefined || cardObject.cards.length === 0) {
      return {success: false, error: true, msg: "Card IDs are required"}
    }

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return cards.updateAll({
      _id: {inq: cardObject.cards},
      user_id: userId
    }, {is_deleted: true}).then((res) => {
      if (res.count > 0) {
        return {success: true, error: false, msg: res.count + (res.count === 1 ? " card" : " cards") + " deleted"}
      } else {
        return {success: false, error: true, msg: "Failed to delete cards"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to delete cards"}
    })

  }

  cards.remoteMethod(
    'addCard', {
      http: {
        path: '/add-card',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'cardObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  cards.remoteMethod(
    'updateCard', {
      http: {
        path: '/update-card',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'cardObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  cards.remoteMethod(
    'deleteCard', {
      http: {
        path: '/delete-card/:cardId',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'cardId', type: 'string', required: true},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  cards.remoteMethod(
    'getUserCards', {
      http: {
        path: '/user-cards',
        verb: 'get',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [{arg: 'options', type: 'object', http: 'optionsFromRequest'}]
    }
  );

  cards.remoteMethod(
    'deleteMultiCards', {
      http: {
        path: '/delete-multi-cards',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'cardObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );
};

//Sample card object

// let cardObject = {
//   "card_number": "376284750491892",
//   "card_type": "AMEX",
//   "expiry_month": "06",
//   "expiry_year": "2022",
//   "cvv": "1111"
// }
