/* globals chrome, PromiseChrome */

(function () {
  'use strict';

  console.log('background script executed')
  chrome.identity.getAuthToken({ 'interactive': true }, function (token) {
    console.log(token);
    if (chrome.runtime.lastError) {
      alert(chrome.runtime.lastError.message);
      return;
    }
    var x = new XMLHttpRequest();
    x.open('GET', 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + token);
    x.onload = function () {
      alert(x.response);
    };
    x.send();
    console.log(chrome.runtime.id);
    var CWS_LICENSE_API_URL = 'https://www.googleapis.com/chromewebstore/v1.1/userlicenses/';
    var req = new XMLHttpRequest();
    req.open('GET', CWS_LICENSE_API_URL + chrome.runtime.id);
    req.setRequestHeader('Authorization', 'Bearer ' + token);
    req.onreadystatechange = function () {
      if (req.readyState == 4) {
        var license = JSON.parse(req.responseText);
        // verifyAndSaveLicense(license);
        console.log(license);
      }
    };
    req.onload = function () {
      console.log(this.status);
      console.log(this.response);
    }
    req.send();
  });

  const promiseChrome = new PromiseChrome();

  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'update') {
      // const thisVersion = chrome.runtime.getManifest().version;
      // console.log(`Updated from ${details.previousVersion} to ${thisVersion}`);
      // if ('0.361' === thisVersion) {
      //  const url = chrome.extension.getURL('readme.html');
      //  promiseChrome.promiseCreateTab({
      //    url,
      //    selected: true,
      //  });
      // }
    } else if (details.reason === 'install') {
      const url = chrome.extension.getURL('readme.html');
      promiseChrome.promiseCreateTab({
        url,
        selected: true,
      });

      // inject scripts and activate icons
      promiseChrome.promiseQuery({
        url: 'https://www.instagram.com/*',
      }).then((tabs) => {
        for (let i = 0; i < tabs.length; i += 1) {
          const { id } = tabs[i];
          chrome.tabs.executeScript(id, { file: 'js/instaDefOptions.js' }, () => {
            chrome.tabs.executeScript(id, { file: 'js/PromiseChrome.js' }, () => {
              chrome.tabs.executeScript(id, { file: 'js/instaMessages.js' }, () => {
                chrome.tabs.executeScript(id, { file: 'js/instagramHelper.js' }, () => {
                  chrome.pageAction.setTitle({
                    tabId: id,
                    title: `Helper Tools for Instagram.com - ${chrome.app.getDetails().version}`,
                  });
                  chrome.pageAction.show(id);
                });
              });
            });
          });
        }
      });
    }
  });

  chrome.runtime.onMessage.addListener((request) => {
    let url;

    function sendModifyResultPage(tabId, changeInfo, tab) {
      if (tab.url === url && changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(tab.id, request);
        chrome.tabs.onUpdated.removeListener(sendModifyResultPage);
      }
    }

    if (request.action === 'showHelperIcon') {
      promiseChrome.promiseQuery({
        url: 'https://www.instagram.com/*',
      }).then((tabs) => {
        for (let i = 0; i < tabs.length; i += 1) {
          chrome.pageAction.setTitle({ tabId: tabs[i].id, title: `Helper Tools for Instagram.com - ${chrome.app.getDetails().version}` });
          chrome.pageAction.show(tabs[i].id);
        }
      });
    } else if (
      ('get_insta_users' === request.action)
      || ('get_common_users' === request.action)
      || ('openLikerPage' === request.action)
      || ('openLikesPage' === request.action)
      || ('openMassFollowPage' === request.action)
      || ('openMassBlockPage' === request.action)
    ) {
      url = chrome.extension.getURL(request.page);
      promiseChrome.promiseCreateTab({
        url,
        selected: true,
      }).then(() => {
        chrome.tabs.onUpdated.addListener(sendModifyResultPage);
      });
    }
  });

  chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
    const headers = details.requestHeaders;
    // modify Referer to make insta happy
    for (const header in headers) {
      if (headers[header].name === 'eferer') {
        headers[header].name = 'Referer';
        break;
      }
    }
    return {
      requestHeaders: details.requestHeaders,
    };
  }, {
      urls: ['https://www.instagram.com/query/',
        'https://www.instagram.com/web/friendships/*',
        'https://www.instagram.com/web/likes/*'],
    },
    ['blocking', 'requestHeaders']);
}());
