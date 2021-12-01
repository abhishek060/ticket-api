'use strict';
const app = require('../../server/server');
const common = require('../../utils/common')
const Request = require('request');

module.exports = function (profiles) {

  profiles.addProfile = async function (profileObject, options) {

    if (profileObject.firstName === "" || profileObject.firstName === undefined)
      return {success: false, error: true, msg: "First Name is required"}

    if (profileObject.lastName === "" || profileObject.lastName === undefined)
      return {success: false, error: true, msg: "Last Name is required"}

    if (profileObject.country.isocode === "" || profileObject.country.isocode === undefined)
      return {success: false, error: true, msg: "Country ISO Code is required"}

    if (profileObject.country.name === "" || profileObject.country.name === undefined)
      return {success: false, error: true, msg: "Country Name is required"}

    if (profileObject.region.countryIso === "" || profileObject.region.countryIso === undefined)
      return {success: false, error: true, msg: "Region Country ISO is required"}

    if (profileObject.region.isocode === "" || profileObject.region.isocode === undefined)
      return {success: false, error: true, msg: "Region ISO Code is required"}

    if (profileObject.region.isocodeShort === "" || profileObject.region.isocodeShort === undefined)
      return {success: false, error: true, msg: "Short Region ISO Code is required"}

    if (profileObject.region.name === "" || profileObject.region.name === undefined)
      return {success: false, error: true, msg: "Region Name is required"}

    if (profileObject.line1 === "" || profileObject.line1 === undefined)
      return {success: false, error: true, msg: "Address is required"}

    if (profileObject.postalCode === "" || profileObject.postalCode === undefined)
      return {success: false, error: true, msg: "Postal Code is required"}

    if (profileObject.town === "" || profileObject.town === undefined)
      return {success: false, error: true, msg: "Town is required"}

    if (profileObject.phone === "" || profileObject.phone === undefined)
      return {success: false, error: true, msg: "Phone is required"}

    if (profileObject.email === "" || profileObject.email === undefined)
      return {success: false, error: true, msg: "Email is required"}

    if (profileObject.billing === "" || profileObject.billing === undefined)
      return {success: false, error: true, msg: "Billing Data is required"}

    if (profileObject.billing.firstName === "" || profileObject.billing.firstName === undefined)
      return {success: false, error: true, msg: "Billing First Name is required"}

    if (profileObject.billing.lastName === "" || profileObject.billing.lastName === undefined)
      return {success: false, error: true, msg: "Billing Last Name is required"}

    if (profileObject.billing.country.isocode === "" || profileObject.billing.country.isocode === undefined)
      return {success: false, error: true, msg: "Billing Country ISO Code is required"}

    if (profileObject.billing.country.name === "" || profileObject.billing.country.name === undefined)
      return {success: false, error: true, msg: "Billing Country Name is required"}

    if (profileObject.billing.region.countryIso === "" || profileObject.billing.region.countryIso === undefined)
      return {success: false, error: true, msg: "Billing Region Country ISO is required"}

    if (profileObject.billing.region.isocode === "" || profileObject.billing.region.isocode === undefined)
      return {success: false, error: true, msg: "Billing Region ISO Code is required"}

    if (profileObject.billing.region.isocodeShort === "" || profileObject.billing.region.isocodeShort === undefined)
      return {success: false, error: true, msg: "Billing Short Region ISO Code is required"}

    if (profileObject.billing.region.name === "" || profileObject.billing.region.name === undefined)
      return {success: false, error: true, msg: "Billing Region Name is required"}

    if (profileObject.billing.line1 === "" || profileObject.billing.line1 === undefined)
      return {success: false, error: true, msg: "Billing Address is required"}

    if (profileObject.billing.postalCode === "" || profileObject.billing.postalCode === undefined)
      return {success: false, error: true, msg: "Billing Postal Code is required"}

    if (profileObject.billing.town === "" || profileObject.billing.town === undefined)
      return {success: false, error: true, msg: "Billing Town is required"}

    if (profileObject.billing.phone === "" || profileObject.billing.phone === undefined)
      return {success: false, error: true, msg: "Billing Phone is required"}

    if (profileObject.billing.email === "" || profileObject.billing.email === undefined)
      return {success: false, error: true, msg: "Billing Email is required"}

    if (profileObject.profile_name === "" || profileObject.profile_name === undefined)
      return {success: false, error: true, msg: "Profile Name is required"}

    if (profileObject.card.number === "" || profileObject.card.number === undefined)
      return {success: false, error: true, msg: "Card Number is required"}

    if (profileObject.card.month === "" || profileObject.card.month === undefined)
      return {success: false, error: true, msg: "Card Month is required"}

    if (profileObject.card.year === "" || profileObject.card.year === undefined)
      return {success: false, error: true, msg: "Card Year is required"}

    if (profileObject.card.cvv === "" || profileObject.card.cvv === undefined)
      return {success: false, error: true, msg: "Card CVV is required"}

    if (profileObject.card.cardType === "" || profileObject.card.cardType === undefined)
      return {success: false, error: true, msg: "Card Type is required"}

    if (profileObject.card.cardHolderName === "" || profileObject.card.cardHolderName === undefined)
      return {success: false, error: true, msg: "Card holder name is required"}

    let token = options && options.accessToken;
    let userId = token && token.userId;

    let identifier = ""

    if (profileObject.profile_name === "" || profileObject.profile_name === undefined) {
      identifier = await common.generateIdentifier(10);
    } else {
      identifier = profileObject.profile_name
    }

    let cardObject = {
      user_id: userId,
      number: profileObject.card.number,
      month: profileObject.card.month,
      year: profileObject.card.year,
      cardHolderName: profileObject.card.cardHolderName,
      cvv: profileObject.card.cvv,
      cardType: profileObject.card.cardType,
      identifier: identifier,
      added_on: Date.now(),
      available: true,
      is_deleted: false
    };

    let cardRes = await addCard(cardObject)

    if (!cardRes.success) {
      return {success: false, error: true, msg: "Failed to add profile"}
    } else {
      let cardId = cardRes.data.id;

      let billingObject = {
        firstName: profileObject.billing.firstName,
        lastName: profileObject.billing.lastName,
        country: {
          isocode: profileObject.billing.country.isocode,
          name: profileObject.billing.country.name,
        },
        region: {
          countryIso: profileObject.billing.region.countryIso,
          isocode: profileObject.billing.region.isocode,
          isocodeShort: profileObject.billing.region.isocodeShort,
          name: profileObject.billing.region.name,
        },
        line1: profileObject.billing.line1,
        line2: profileObject.billing.line2,
        postalCode: profileObject.billing.postalCode,
        town: profileObject.billing.town,
        phone: profileObject.billing.phone,
        email: profileObject.billing.email
      }

      let dataObject = {
        user_id: userId,
        card_id: cardId,
        profile_name: profileObject.profile_name,
        firstName: profileObject.firstName,
        lastName: profileObject.lastName,
        country: {
          isocode: profileObject.country.isocode,
          name: profileObject.country.name,
        },
        region: {
          countryIso: profileObject.region.countryIso,
          isocode: profileObject.region.isocode,
          isocodeShort: profileObject.region.isocodeShort,
          name: profileObject.region.name,
        },
        line1: profileObject.line1,
        line2: profileObject.line2,
        postalCode: profileObject.postalCode,
        town: profileObject.town,
        phone: profileObject.phone,
        email: profileObject.email,
        billing: billingObject,
        identifier: identifier,
        added_on: Date.now(),
        available: true,
        is_deleted: false
      }

      return profiles.create(dataObject).then((res) => {
        return {success: true, error: false, msg: "Profile Added", data: res}
      }).catch((e) => {
        return {success: false, error: true, msg: "Failed to add profile"}
      })
    }

  };

  profiles.addBulkProfiles = async function (profileObject, options) {

    if (profileObject.profiles.length === 0)
      return {success: false, error: true, msg: "Profiles are required"}

    let allProfiles = profileObject.profiles;
    let token = options && options.accessToken;
    let userId = token && token.userId;
    let newProfiles = []

    for (let i = 0; i < allProfiles.length; i++) {

      if (allProfiles[i].firstName === "" || allProfiles[i].firstName === undefined)
        continue
      if (allProfiles[i].lastName === "" || allProfiles[i].lastName === undefined)
        continue
      if (allProfiles[i].country.isocode === "" || allProfiles[i].country.isocode === undefined)
        continue
      if (allProfiles[i].country.name === "" || allProfiles[i].country.name === undefined)
        continue
      if (allProfiles[i].region.countryIso === "" || allProfiles[i].region.countryIso === undefined)
        continue
      if (allProfiles[i].region.isocode === "" || allProfiles[i].region.isocode === undefined)
        continue
      if (allProfiles[i].region.isocodeShort === "" || allProfiles[i].region.isocodeShort === undefined)
        continue
      if (allProfiles[i].region.name === "" || allProfiles[i].region.name === undefined)
        continue
      if (allProfiles[i].line1 === "" || allProfiles[i].line1 === undefined)
        continue
      if (allProfiles[i].postalCode === "" || allProfiles[i].postalCode === undefined)
        continue
      if (allProfiles[i].town === "" || allProfiles[i].town === undefined)
        continue
      if (allProfiles[i].phone === "" || allProfiles[i].phone === undefined)
        continue
      if (allProfiles[i].email === "" || allProfiles[i].email === undefined)
        continue
      // if (allProfiles[i].billing === "" || allProfiles[i].billing === undefined)
      //   continue
      if (allProfiles[i].billing.firstName === "" || allProfiles[i].billing.firstName === undefined)
        continue
      if (allProfiles[i].billing.lastName === "" || allProfiles[i].billing.lastName === undefined)
        continue
      if (allProfiles[i].billing.country.isocode === "" || allProfiles[i].billing.country.isocode === undefined)
        continue
      if (allProfiles[i].billing.country.name === "" || allProfiles[i].billing.country.name === undefined)
        continue
      if (allProfiles[i].billing.region.countryIso === "" || allProfiles[i].billing.region.countryIso === undefined)
        continue
      if (allProfiles[i].billing.region.isocode === "" || allProfiles[i].billing.region.isocode === undefined)
        continue
      if (allProfiles[i].billing.region.isocodeShort === "" || allProfiles[i].billing.region.isocodeShort === undefined)
        continue
      if (allProfiles[i].billing.region.name === "" || allProfiles[i].billing.region.name === undefined)
        continue
      if (allProfiles[i].billing.line1 === "" || allProfiles[i].billing.line1 === undefined)
        continue
      if (allProfiles[i].billing.postalCode === "" || allProfiles[i].billing.postalCode === undefined)
        continue
      if (allProfiles[i].billing.town === "" || allProfiles[i].billing.town === undefined)
        continue
      if (allProfiles[i].billing.phone === "" || allProfiles[i].billing.phone === undefined)
        continue
      if (allProfiles[i].billing.email === "" || allProfiles[i].billing.email === undefined)
        continue
      if (allProfiles[i].profile_name === "" || allProfiles[i].profile_name === undefined)
        continue
      if (allProfiles[i].card.number === "" || allProfiles[i].card.number === undefined)
        continue
      if (allProfiles[i].card.month === "" || allProfiles[i].card.month === undefined)
        continue
      if (allProfiles[i].card.year === "" || allProfiles[i].card.year === undefined)
        continue
      if (allProfiles[i].card.cvv === "" || allProfiles[i].card.cvv === undefined)
        continue
      // if (allProfiles[i].card.cardType === "" || allProfiles[i].card.cardType === undefined)
      //   continue
      if (allProfiles[i].card.cardHolderName === "" || allProfiles[i].card.cardHolderName === undefined)
        continue;

      let identifier = "";

      if (allProfiles[i].profile_name === "" || allProfiles[i].profile_name === undefined) {
        identifier = await common.generateIdentifier(10);
      } else {
        identifier = allProfiles[i].profile_name.profile_name
      }

      let cardObject = {
        user_id: userId,
        number: allProfiles[i].card.number,
        month: allProfiles[i].card.month,
        year: allProfiles[i].card.year,
        cvv: allProfiles[i].card.cvv,
        cardType: allProfiles[i].card.cardType,
        cardHolderName: allProfiles[i].card.cardHolderName,
        identifier: identifier,
        added_on: Date.now(),
        available: true,
        is_deleted: false
      };

      let cardRes = await addCard(cardObject)

      if (cardRes.success) {
        let cardId = cardRes.data.id;

        let billingObject = {
          firstName: allProfiles[i].billing.firstName,
          lastName: allProfiles[i].billing.lastName,
          country: {
            isocode: allProfiles[i].billing.country.isocode,
            name: allProfiles[i].billing.country.name,
          },
          region: {
            countryIso: allProfiles[i].billing.region.countryIso,
            isocode: allProfiles[i].billing.region.isocode,
            isocodeShort: allProfiles[i].billing.region.isocodeShort,
            name: allProfiles[i].billing.region.name,
          },
          line1: allProfiles[i].billing.line1,
          line2: allProfiles[i].billing.line2,
          postalCode: allProfiles[i].billing.postalCode,
          town: allProfiles[i].billing.town,
          phone: allProfiles[i].billing.phone,
          email: allProfiles[i].billing.email
        }

        let dataObject = {
          user_id: userId,
          card_id: cardId,
          profile_name: allProfiles[i].profile_name,
          firstName: allProfiles[i].firstName,
          lastName: allProfiles[i].lastName,
          country: {
            isocode: allProfiles[i].country.isocode,
            name: allProfiles[i].country.name,
          },
          region: {
            countryIso: allProfiles[i].region.countryIso,
            isocode: allProfiles[i].region.isocode,
            isocodeShort: allProfiles[i].region.isocodeShort,
            name: allProfiles[i].region.name,
          },
          line1: allProfiles[i].line1,
          line2: allProfiles[i].line2,
          postalCode: allProfiles[i].postalCode,
          town: allProfiles[i].town,
          phone: allProfiles[i].phone,
          email: allProfiles[i].email,
          billing: billingObject,
          identifier: identifier,
          added_on: Date.now(),
          available: true,
          is_deleted: false
        };
        newProfiles.push(dataObject)
      }
    }

    let message = "";
    if (newProfiles.length === allProfiles.length) {
      message = allProfiles.length + " " + (allProfiles.length === 1 ? "profile" : "profiles") + " added successfully"
    } else {
      let errorProfiles = allProfiles.length - newProfiles.length;
      message = newProfiles.length + " " + (newProfiles.length === 1 ? "profile" : "profiles") + " added successfully and failed to add " + errorProfiles + (errorProfiles === 1 ? " profile" : " profiles")
    }

    if (newProfiles.length > 0) {
      return profiles.create(newProfiles).then((res) => {
        return {success: true, error: false, msg: message, data: res}
      }).catch((e) => {
        return {success: false, error: true, msg: "Failed to add profiles " + e.message}
      })
    } else {
      return {success: false, error: true, msg: "Failed to add profiles"}
    }
  };

  async function addCard(cardObject) {
    let cards = app.models.cards;

    return cards.create(cardObject).then((res) => {
      return {success: true, error: false, msg: "Card Added", data: res}
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to add card"}
    })
  }

  profiles.updateProfile = async function (profileObject, options) {

    if (profileObject.id === undefined || profileObject.id === "") {
      return {success: false, error: true, msg: "Profile Id is required"}
    }

    let token = options && options.accessToken;
    let userId = token && token.userId;
    let profileId = profileObject.id;

    delete profileObject["id"];

    if (profileObject.user_id)
      delete profileObject["user_id"];

    if (profileObject.is_deleted)
      delete profileObject["is_deleted"];

    if (profileObject.available)
      delete profileObject["available"];

    return profiles.updateAll({
      _id: profileId,
      user_id: userId,
      is_deleted: false
    }, profileObject).then((res) => {
      if (res.count === 1) {
        let cards = app.models.cards;
        return cards.updateAll({
          _id: profileObject.card.id,
          user_id: userId,
          is_deleted: false
        }, profileObject.card).then((res) => {
          if (res.count === 1) {
            return {success: true, error: false, msg: "Profile updated"}
          } else {
            return {success: false, error: true, msg: "Failed to update profile"}
          }
        }).catch((e) => {
          return {success: false, error: true, msg: "Failed to update profile"}
        })
      } else {
        return {success: false, error: true, msg: "Failed to update profile"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to update profile"}
    })

  }

  profiles.deleteProfile = async function (profileId, options) {

    if (profileId === undefined || profileId === "") {
      return {success: false, error: true, msg: "Profile Id is required"}
    }

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return profiles.updateAll({
      _id: profileId,
      user_id: userId,
      is_deleted: false
    }, {is_deleted: true}).then((res) => {
      if (res.count === 1) {
        return {success: true, error: false, msg: "Profile Deleted"}
      } else {
        return {success: false, error: true, msg: "Failed to delete profile"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to delete profile"}
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

  profiles.userProfiles = async function (options) {

    let token = options && options.accessToken;
    let userId = token && token.userId;

    let licenseKeyResponse = (await checkLicenseKey(userId));
    if (!licenseKeyResponse.success) {
      return {success: false, error: true,fail : true, msg: "Some error occured", data: []}
    }

    return profiles.find({
      where: {
        user_id: userId,
        is_deleted: false
      },
      include: {
        relation: 'card'
      }
    }).then((res) => {
      return {success: true, error: false, msg: "Profiles fetched successfully", profiles: res}
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to fetch profiles"}
    })

  }

  profiles.getUserProfiles = async function (options) {

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return profiles.find({
      where: {
        user_id: userId,
        is_deleted: false
      },
      include: {
        relation: 'card'
      }
    }).then((res) => {
      return {success: true, error: false, msg: "Profiles fetched successfully", profiles: res}
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to fetch profiles"}
    })

  }

  profiles.deleteMultiProfiles = async function (profileObject, options) {
    if (profileObject.profiles === undefined || profileObject.profiles.length === 0) {
      return {success: false, error: true, msg: "Profile IDs are required"}
    }

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return profiles.updateAll({
      _id: {inq: profileObject.profiles},
      user_id: userId,
      is_deleted: false
    }, {is_deleted: true}).then((res) => {
      if (res.count > 0) {
        return {success: true, error: false, msg: res.count + (res.count === 1 ? " profile" : " profiles") + " deleted"}
      } else {
        return {success: false, error: true, msg: "No profile deleted"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to delete profiles"}
    })

  }

  profiles.deleteUserProfiles = async function (options) {

    let token = options && options.accessToken;
    let userId = token && token.userId;

    return profiles.updateAll({
      user_id: userId,
      is_deleted: false
    }, {is_deleted: true}).then((res) => {
      if (res.count > 0) {
        return {success: true, error: false, msg: res.count + (res.count === 1 ? " profile" : " profiles") + " deleted"}
      } else {
        return {success: false, error: true, msg: "Failed to delete profiles"}
      }
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to delete profiles"}
    })

  }

  profiles.remoteMethod(
    'addProfile', {
      http: {
        path: '/add-profile',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'profileObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  profiles.remoteMethod(
    'addBulkProfiles', {
      http: {
        path: '/add-bulk-profiles',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'profileObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  profiles.remoteMethod(
    'updateProfile', {
      http: {
        path: '/update-profile',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'profileObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  profiles.remoteMethod(
    'deleteProfile', {
      http: {
        path: '/delete-profile/:profileId',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'profileId', type: 'string', required: true},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  profiles.remoteMethod(
    'userProfiles', {
      http: {
        path: '/get-user-profiles',
        verb: 'get',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [{arg: 'options', type: 'object', http: 'optionsFromRequest'}]
    }
  );

  profiles.remoteMethod(
    'getUserProfiles', {
      http: {
        path: '/user-profiles',
        verb: 'get',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [{arg: 'options', type: 'object', http: 'optionsFromRequest'}]
    }
  );

  profiles.remoteMethod(
    'deleteMultiProfiles', {
      http: {
        path: '/delete-multi-profiles',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'profileObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  profiles.remoteMethod(
    'deleteUserProfiles', {
      http: {
        path: '/delete-user-profiles',
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
};

//Sample Profile Object
//
// let profileObject = {
//   "firstName": "Sayyam",
//   "lastName": "Kapoor",
//   "country": {
//     "isocode": "US",
//     "name": "United States"
//   },
//   "region": {
//     "countryIso": "US",
//     "isocode": "US-IL",
//     "isocodeShort": "IL",
//     "name": "Illinois"
//   },
//   "line1": "9056 Keating Ave",
//   "line2": "28",
//   "postalCode": "60076",
//   "town": "SKOKIE",
//   "phone": "9999999999",
//   "email": "sayyamk.tas@gmail.com",
//   "card": {
//     "number": "4767718268294024",
//     "month": "05",
//     "year": "2026",
//     "cvv": "303",
//     "cardType": "visa",
//     "cardHolderName":"Sayyam"
//   },
// "profile_name":"Latest Profile",
// "billing":{
//   "firstName": "Sayyam2",
//   "lastName": "Kapoor2",
//   "country": {
//     "isocode": "US",
//     "name": "United States"
//   },
//   "region": {
//     "countryIso": "US",
//     "isocode": "US-IL",
//     "isocodeShort": "IL",
//     "name": "Illinois"
//   },
//   "line1": "9056 Keating Ave",
//   "line2": "28",
//   "postalCode": "60076",
//   "town": "SKOKIE",
//   "phone": "9999999999",
//   "email": "sayyamk2.tas@gmail.com"
// }
// }
