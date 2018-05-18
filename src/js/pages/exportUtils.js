/* exported exportUtils */
/* globals instaDefOptions */

var exportUtils = (function () {

  'use strict';

  var formatDate = function (date) {

    var year = date.getFullYear(),
      month = date.getMonth() + 1,
      day = date.getDate(),
      hour = date.getHours(),
      minute = date.getMinutes();
    month = '00'.substr(('' + month).length, 1) + month;
    hour = '00'.substr(('' + hour).length, 1) + hour;
    day = '00'.substr(('' + day).length, 1) + day;
    minute = '00'.substr(('' + minute).length, 1) + minute;
    return '' + year + month + day + '_' + hour + minute;
  };

  return {
    formatDate: formatDate
  };

}());
