'use strict';

module.exports = function (applications) {
  applications.validatesUniquenessOf('app_id');
};
