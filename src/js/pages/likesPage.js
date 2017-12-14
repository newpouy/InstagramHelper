$(function () {

    'use strict';

    chrome.runtime.onMessage.addListener(function (request) {
      if (request.action === 'openLikesPage') {
          console.log(request);
          startFetching(request);
      }
    });

    function startFetching(request) {
    }


  });

  window.onload = function () {
    _gaq.push(['_trackPageview']);
  };
