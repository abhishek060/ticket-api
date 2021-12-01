'use strict';

module.exports = function (taskLogs) {

  taskLogs.getUserTaskLogs = async function (taskID, options) {

    let token = options && options.accessToken;
    let userId = token && token.userId;
    return taskLogs.find({
      where: {
        user_id: userId,
        task_id: taskID
      },
      order: 'timeStamp DESC',
    }).then((res) => {
      return {success: true, error: false, msg: "logs fetched successfully", data: res}
    }).catch((e) => {
      return {success: false, error: true, msg: "Failed to fetch logs"}
    })
  }

  taskLogs.remoteMethod(
    'getUserTaskLogs', {
      http: {
        path: '/task-logs/:taskID',
        verb: 'get',
      },
      returns: {
        root: true,
        type: 'array',
      },
      accepts: [
        {arg: 'taskID', type: 'string', required: true},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}]
    }
  );

};
