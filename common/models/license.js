'use strict';
const Utils = require('../../utils/common');
const app = require('../../server/server');

module.exports = function (license) {
  license.validatesUniquenessOf('license_key');

  license.getUsersList = async function(options) {
    let token = options && options.accessToken;
    let userId = token && token.userId;

    let isAdmin = await Utils.checkIfUserIsAdminOrNot(userId);

    if (isAdmin) {
      return license.find({
        where: {is_active: true, is_deleted: false},
        include: [
          {
            relation: 'user',
          },
        ],
      }).then((res) => {
          if (res.length > 0) {
            let data = [];
            for (let index = 0; index < res.length; index++) {
              if (userId.toString() === res[index]['user_id'].toString()) {
                // delete res[index]
              } else {
                // if (userId.toString() !== res[index]['user_id'].toString()) {
                let currentTimestamp = Date.now();
                let expiryDate = parseFloat(res[index].expiry_date);
                if (currentTimestamp > expiryDate) {
                  res[index]['days_left'] = 0;
                } else {
                  res[index]['days_left'] = parseInt((expiryDate - currentTimestamp) / (1000 * 60 * 60 * 24));
                  data.push(res[index]);
                }
              }
            }
            return {
              success: true,
              error: false,
              data: data,
              msg: 'User list fetched',
            };
          } else {
            return {success: false, error: true, msg: 'No users found'};
          }
        },
      ).catch((e) => {
        console.log(e.message)
        return {success: false, error: true, msg: 'Some error has occurred'};
      });
    } else {
      return {success: false, error: true, msg: 'Not authorised'};
    }
  };

  license.deleteLicenseKey = async function(licenseId, user_id, options) {
    let token = options && options.accessToken;
    let userId = token && token.userId;

    let isAdmin = await Utils.checkIfUserIsAdminOrNot(userId);

    if (isAdmin) {
      return license.updateAll({
        _id: licenseId,
        user_id: user_id,
        is_deleted: false,
      }, {is_deleted: true}).then(async(res) => {
        if (res.count === 1) {
          await deleteAccessTokens(user_id);
          return {
            success: true,
            error: false,
            msg: 'License Key Deleted',
          };
        } else {
          console.log(res.count)
          return {success: false, error: true, msg: 'Failed to delete License Key'};
        }
      }).catch((e) => {
        console.log(e.message)
        return {success: false, error: true, msg: 'Failed to delete License Key'};
      });
    } else {
      return {success: false, error: true, msg: 'Not authorised'};
    }
  };

  async function deleteAccessTokens(userId){
    let accessTokens = app.models.AccessToken

    return new Promise((resolve => {
      accessTokens.destroyAll({
        userId: userId,
      }, function(err, result){
        if(err){
          resolve({success: false, error: true, msg: "Something went wrong"})
        }else{
          resolve({success: true, error: false, msg: "Access Tokens deleted"})
        }
      });
    }))

  }

  license.updateLicense = async function(dataObject, options) {
    if(dataObject.id === undefined)
      return {success: false, error: true, msg: "ID is required"}

    let token = options && options.accessToken;
    let userId = token && token.userId;

    let isAdmin = await Utils.checkIfUserIsAdminOrNot(userId);

    let updateObject = {}

    if (dataObject.license_key !== undefined)
      updateObject.license_key = dataObject.license_key

    let isUpdateObjectEmpty = Object.keys(updateObject).length === 0 && updateObject.constructor === Object

    if (isUpdateObjectEmpty)
      return {success: false, error: true, msg: "No fields to update"}

    if (isAdmin) {
      return license.updateAll({
        _id: dataObject.id,
        is_deleted: false,
      }, updateObject).then(async(res) => {
        if (res.count === 1) {
          return {success: true, error: false, msg: 'License Key Updated'};
        } else {
          return {success: false, error: true, msg: 'Failed to update License Key'};
        }
      }).catch((e) => {
        return {success: false, error: true, msg: 'Failed to update License Key'};
      });
    } else {
      return {success: false, error: true, msg: 'Not authorised'};
    }
  };

  license.addLicense = async function(dataObject, options) {
    if (dataObject.email === "" || dataObject.email === undefined)
      return {success: false, error: true, msg: "Email is required"}
    if (dataObject.license === "" || dataObject.license === undefined)
      return {success: false, error: true, msg: "License is required"}

    let token = options && options.accessToken;
    let userId = token && token.userId;

    let isAdmin = await Utils.checkIfUserIsAdminOrNot(userId);
    if(!isAdmin)
      return {success: false, error: true, msg: 'Not authorised'};

    let checkUserRes = await checkIfUserExists(dataObject.email)
    if(!checkUserRes.success)
      return checkUserRes

    let checkLicenseRes = await checkIfLicenseExists(dataObject.license)
    if(!checkLicenseRes.success)
      return checkLicenseRes

    let addUserRes = await addUser(dataObject.email)
    if(!addUserRes.success)
      return addUserRes

    let licenseObject = {
      license_key: dataObject.license,
      user_id: addUserRes.data.id,
      expiry_date: "1640975400000",
      mac_address: "1234",
      is_active: true,
      is_deleted: false
    }

    return license.create(licenseObject).then((res) => {
      if(res)
        return {success: true, error: false, msg: "License Added", data: res}
      else
        return {success: false, error: true, msg: "User created but failed to add License"}
    }).catch((e) => {
      return {success: false, error: true, msg: "User created but failed to add License"}
    })
  }

  async function addUser(email) {
    let users = app.models.user

    let dataObject = {
      email: email,
      password: await Utils.generateRandomPassword(15),
      monitor_delay: 100,
      error_delay: 100,
      credits: 9999,
      discord_webhook: "",
      is_active: true,
      is_deleted: false
    }

    return users.create(dataObject).then((res) => {
      if(res)
        return {success: true, error: false, msg: "User Added", data: res}
      else
        return {success: false, error: true, msg: "Something went wrong"}
    }).catch((e) => {
      return {success: false, error: true, msg: "Something went wrong"}
    })
  }

  async function checkIfUserExists(email) {
    let users = app.models.user

    return users.find({
      where: {
        email: email,
        is_deleted: false
      }
    }).then((res)=>{
      if(res.length > 0)
        return {success: false, msg: "User with this email already Exists"}
      else
        return {success: true, msg: "User Does not exist"}
    }).catch((e)=>{
      return {success: false, msg: "Something Went Wrong"}
    })
  }

  async function checkIfLicenseExists(key) {
    return license.find({
      where: {
        license_key: key,
        is_deleted: false
      }
    }).then((res)=>{
      if(res.length > 0)
        return {success: false, msg: "This license key already Exists"}
      else
        return {success: true, msg: "License Key Does not exist"}
    }).catch((e)=>{
      return {success: false, msg: "Something Went Wrong"}
    })
  }

  license.remoteMethod(
    'getUsersList', {
      http: {
        path: '/get-users-list',
        verb: 'get',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
    },
  );

  license.remoteMethod(
    'deleteLicenseKey', {
      http: {
        path: '/delete-license/:licenseId/:user_id',
        verb: 'post',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'licenseId', type: 'string', required: true},
        {arg: 'user_id', type: 'string', required: true},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  license.remoteMethod(
    'updateLicense', {
      http: {
        path: '/update-license',
        verb: 'post',
      },
      returns: {type: 'array', root: true},
      accepts: [
        {arg: 'dataObject', type: 'object', http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ]
    }
  );

  license.remoteMethod(
    'addLicense', {
      http: {
        path: '/add-license',
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
