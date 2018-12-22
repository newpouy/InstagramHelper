/* exported exportUtils */

const exportUtils = (function () {
  'use strict';

  const formatDate = function (date) {
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    month = '00'.substr((`${month}`).length, 1) + month;
    let day = date.getDate();
    day = '00'.substr((`${day}`).length, 1) + day;
    let hour = date.getHours();
    hour = '00'.substr((`${hour}`).length, 1) + hour;
    let minute = date.getMinutes();
    minute = '00'.substr((`${minute}`).length, 1) + minute;
    return `${year}${month}${day}_${hour}${minute}`;
  };

  const s2ab = function (s) {
    const buf = new ArrayBuffer(s.length); // convert s to arrayBuffer
    const view = new Uint8Array(buf); // create uint8array as viewer
    for (let i = 0; i < s.length; i += 1) {
      view[i] = s.charCodeAt(i) & 0xFF; // convert to octet
    }
    return buf;
  };

  return {
    formatDate,
    s2ab,
  };
}());
