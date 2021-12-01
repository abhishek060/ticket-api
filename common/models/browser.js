'use strict';

module.exports = function (browser) {

  browser.addRecord = async function (recordObject) {

    // let recordRes = await checkIfRecordExists(recordObject)
    //
    // if(!recordRes.success)
    //   return recordRes

    let dataObject = {
      status: "created",
      data: recordObject,
      is_active: true,
      is_deleted: false
    }

    return browser.create(dataObject).then((res) => {
      return {success: true, error: false, msg: "Record Added", data: res}
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to add record"}
    })
  }

  async function checkIfRecordExists(recordObject){
    return browser.find({
      where: {
        'data.ja3.ja3': recordObject.ja3.ja3
      }
    }).then((res)=>{
      if(res.length > 0){
        return {success: false, error: true, msg: "Ja3 already exists"}
      } else {
        return {success: true, error: false, msg: "Ja3 not present"}
      }
    }).catch((e)=>{
      return {success: false, error: true, msg: "Some error has occurred"}
    })
  }

  browser.remoteMethod(
    'addRecord', {
      http: {
        path: '/add-record',
        verb: 'post',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'recordObject', type: 'object', http: {source: 'body'}}
      ]
    }
  );
}
