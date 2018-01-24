/* globals chrome, document, instaDefOptions, _gaq */

(function () {

  'use strict';

  var defPageSize = instaDefOptions.defPageSize;
  var defDelay = instaDefOptions.defDelay;
  var defFollowDelay = instaDefOptions.defFollowDelay;
  var defLikeDelay = instaDefOptions.defLikeDelay;
  var defPageSizeForFeed = instaDefOptions.defPageSizeForFeed;

  function saveOptions() {
    var pageSize = document.getElementById('pageSize').value;
    var delay = document.getElementById('delay').value;
    var followDelay = document.getElementById('followDelay').value;
    var likeDelay = document.getElementById('likeDelay').value;
    var pageSizeForFeed = document.getElementById('pageSizeForFeed').value;
    chrome.storage.sync.set({
      pageSize: pageSize,
      delay: delay,
      followDelay: followDelay,
      likeDelay: likeDelay,
      pageSizeForFeed: pageSizeForFeed
    }, function () {
      // Update status to let user know options were saved.
      var status = document.getElementById('status');
      status.textContent = 'Options were saved.';
      setTimeout(function () {
        status.textContent = '';
      }, 1000);
    });
  }

  function restoreOptions() {
    chrome.storage.sync.get({
      pageSize: defPageSize,
      delay: defDelay,
      followDelay: defFollowDelay,
      likeDelay: defLikeDelay,
      pageSizeForFeed: defPageSizeForFeed
    }, function (items) {
      document.getElementById('pageSize').value = items.pageSize;
      document.getElementById('delay').value = items.delay;
      document.getElementById('followDelay').value = items.followDelay;
      document.getElementById('likeDelay').value = items.likeDelay;
      document.getElementById('pageSizeForFeed').value = items.pageSizeForFeed;
    });
  }

  function restoreDefaults() {
    chrome.storage.sync.set({
      pageSize: defPageSize,
      delay: defDelay,
      followDelay: defFollowDelay,
      likeDelay: defLikeDelay,
      pageSizeForFeed: defPageSizeForFeed
    }, function () {
      restoreOptions();
      var status = document.getElementById('status');
      status.textContent = 'Default options were restored.';
      setTimeout(function () {
        status.textContent = '';
      }, 1000);
    });

  }

  document.addEventListener('DOMContentLoaded', restoreOptions);
  document.getElementById('save').addEventListener('click', saveOptions);
  document.getElementById('restoreDefaults').addEventListener('click', restoreDefaults);

})();

window.onload = function () {
  _gaq.push(['_trackPageview']);
};
