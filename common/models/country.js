'use strict';

module.exports = function (country) {

  country.getStates = async function(countryId){
    return country.find({
      where:{
        country_code: countryId
      }
    }).then((res)=>{
      return {success: true, error: false, msg: "States fetched successfully", data: res}
    }).catch((e)=>{
      return {success: false, error: true, msg: "Some error has occurred"}
    })
  };

  country.remoteMethod(
    'getStates', {
      http: {
        path: '/get-states/:countryId',
        verb: 'get',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {
          arg: 'countryId',
          type: 'string',
          required: true
        }
      ]
    }
  )
};
