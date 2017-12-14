/* globals chrome, PromiseChrome */

(function () {

  'use strict';

  chrome.runtime.onMessage.addListener(function (request) {

    let promiseChrome = new PromiseChrome();
    let url;

    function sendModifyResultPage(tabId, changeInfo, tab) {
      if (tab.url === url && changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(tab.id, request);
        chrome.tabs.onUpdated.removeListener(sendModifyResultPage);
      }
    }

    if (request.action === 'showHelperIcon') {
      promiseChrome.promiseQuery({
        url: 'https://www.instagram.com/*'
      }).then(function (tabs) {
        for (var i = 0; i < tabs.length; i++) {
          chrome.pageAction.show(tabs[i].id);
        }
      });
    } else if (
      ('get_insta_users' === request.action) ||
      ('get_common_users' === request.action) ||
      ('openLikerPage' === request.action)
    ) {
      url = chrome.extension.getURL(request.page);
      promiseChrome.promiseCreateTab({
        'url': url,
        'selected': true
      }).then(function () {
        chrome.tabs.onUpdated.addListener(sendModifyResultPage);
      });
    }
  });

  chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {

    var headers = details.requestHeaders;
    //modify Referer to make insta happy
    for (var header in headers) {
      if (headers[header].name === 'eferer') {
        headers[header].name = 'Referer';
        break;
      }
    }
    return {
      requestHeaders: details.requestHeaders
    };

  }, {
      urls: ['https://www.instagram.com/query/',
        'https://www.instagram.com/web/friendships/*',
        'https://www.instagram.com/web/likes/*']
    },
    ['blocking', 'requestHeaders']);
})();
