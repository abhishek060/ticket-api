"use strict";

module.exports = function (group) {

  group.getGroups = async (options) => {
   return group.find({
        where: {"is_deleted": false, "is_active": true },
      }).then(res=>{  
       return {
          success: true,
          error: false,
          groups: res,
          msg: "Groups fetched",
        };
      }).catch(err=>{  
       return { success: false, error: true, msg: "Failed to fetch group" };
      })
  };

  group.remoteMethod("getGroups", {
    http: {
      path: "/get-groups",
      verb: "get",
    },
    returns: {
      root: true,
      type: "array",
    },
    accepts: [
      {arg: 'options', type: 'object', http: 'optionsFromRequest'}
    ],
  });

  
};
