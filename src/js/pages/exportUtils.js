/* globals chrome, instaDefOptions */
/* exported exportUtils */

const exportUtils = (function () {
  'use strict';

  const headersPublic = [
    'id',
    'username',
    'full_name',
    'user_profile',
    'followed_by_viewer',
    'requested_by_viewer',
    'user_follows',
    'user_followed_by',
    'profile_pic_url',
    'profile_pic_url_hd',
    'is_private',
    'follows_count',
    'followed_by_count',
    'media_count',
    'latestPostDate',
    'follows_viewer',
    'has_requested_viewer',
    'blocked_by_viewer',
    'has_blocked_viewer',
    'biography',
    'is_verified',
    'is_business_account',
  ];

  const headersPrivate = [
    'id',
    'username',
    'full_name',
    'user_profile',
    'user_follows',
    'user_followed_by',
    'profile_pic_url',
    'profile_pic_url_hd',
    'is_private',
    'follows_count',
    'followed_by_count',
    'media_count',
    'latestPostDate',
    'biography',
    'external_url',
    'is_verified',
    'is_business_account',
    'business_category_name',
    'business_email',
    'business_phone_number',
    'street_address',
    'zip_code',
    'city_name',
    'region_name',
    'country_code',
  ];

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
    h1: headersPublic,
    h2: headersPrivate,
    loadExcelFormat: (radios) => {
      chrome.storage.sync.get({
        excelFormat: instaDefOptions.defExcelFormat,
      }, (items) => {
        const value = items.excelFormat.toUpperCase();
        for (let i = 0; i < radios.length; i += 1) {
          if ((radios[i].value).toUpperCase() === value) {
            radios[i].checked = true;
            return;
          }
        }
      });
    },
    loadExcelFormatPromise: () => {
      return new Promise(function (resolve) {
        chrome.storage.sync.get({
          excelFormat: instaDefOptions.defExcelFormat,
        }, items => resolve(items.excelFormat));
      });
    },
    saveExcelFormat: (format) => {
      chrome.storage.sync.set({
        excelFormat: format,
      });
    }
  };
}());
