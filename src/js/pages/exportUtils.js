/* exported exportUtils */

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

  var s2ab = function(s) {
    var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
    var view = new Uint8Array(buf);  //create uint8array as viewer
    for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
    return buf;
  };

  return {
    formatDate: formatDate,
    s2ab: s2ab
  };

}());
