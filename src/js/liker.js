/* globals confirm, chrome, $, _gaq, Promise */
/* globals instaDefOptions, instaUserInfo, exportUtils, FetchUsers */

$(function () {

  'use strict';

  chrome.runtime.onMessage.addListener(function (request) {
    if (request.action === 'open_liker') {
    }
  });


});

window.onload = function () {
  _gaq.push(['_trackPageview']);
};
