/* globals alert, chrome, _gaq */
/* globals PromiseChrome, instaDefOptions, instaMessages, instaUserInfo */
/* jshint -W106 */

document.addEventListener("DOMContentLoaded", function () {
  'use strict';

  var promiseChrome = new PromiseChrome();

  document.getElementById('liker').addEventListener("click", function () {

    promiseChrome.promiseQuery({
      active: true,
      currentWindow: true
    }).then(function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'openLikerPage',
        page: 'liker.html',
        userName: document.getElementById('username').value
      });
    });
  });

  document.getElementById('likes').addEventListener("click", function () {
    promiseChrome.promiseQuery({
      active: true,
      currentWindow: true
    }).then(function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'openLikesPage',
        page: 'likes.html',
        userName: document.getElementById('username').value
      });
    });
  });

  document.getElementById('massfollow').addEventListener("click", function () {
    promiseChrome.promiseQuery({
      active: true,
      currentWindow: true
    }).then(function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'openMassFollowPage',
        page: 'follow.html'
      });
    });
  });

  document.getElementById('massblock').addEventListener("click", function () {
    promiseChrome.promiseQuery({
      active: true,
      currentWindow: true
    }).then(function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'openMassBlockPage',
        page: 'block.html'
      });
    });
  });

  document.getElementById('instaUsers').addEventListener("click", function () {

    var userName = document.getElementById('username').value;
    if (!userName) {
      alert(instaMessages.getMessage('USERNAMEISREQ'));
      return;
    }

    promiseChrome.promiseCheckOpenTab({
      url: chrome.extension.getURL('instaUsers.html')
    }).then(function () {
      var promiseUserInfo = instaDefOptions.you === userName ? userName : instaUserInfo.getUserProfile({ username: userName });
      var promiseQueryActiveTab = promiseChrome.promiseQuery({
        active: true,
        currentWindow: true
      });

      // todo : find checked radiobutton
      var relType = 'All';
      var radios = document.getElementsByName('relType');
      for (var i = 0, length = radios.length; i < length; i++) {
        if (radios[i].checked) {
            relType = radios[i].id;
            break;
        }
    }
      Promise.all([promiseUserInfo, promiseQueryActiveTab]).then(values => {
        let [obj, tabs] = values;
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'get_insta_users',
          page: 'instaUsers.html',
          userName: userName,
          userId: obj.id,
          user_is_private: obj.is_private,
          user_followed_by_viewer: obj.followed_by_viewer,
          follows_count: obj.follows_count,
          followed_by_count: obj.followed_by_count,
          limit: +document.getElementById('first').value,
          relType: relType // $('input[name=relType]:checked').attr('id')
        });
      });
    }, () => alert(instaMessages.getMessage('TABISOPEN')));
  });

  document.getElementById('findCommonUsers').addEventListener("click", function () {
    var userName_1 = document.getElementById('username_1').value;
    if (!userName_1) {
      alert(instaMessages.getMessage('USERNAMEISREQPAR', '1st'));
      return;
    }

    var userName_2 = document.getElementById('username_2').value;
    if (!userName_2) {
      alert(instaMessages.getMessage('USERNAMEISREQPAR', '2nd'));
      return;
    }

    if (userName_1 === userName_2) {
      alert(instaMessages.getMessage('THESAMEUSERS'));
      return;
    }

    promiseChrome.promiseCheckOpenTab({
      url: chrome.extension.getURL('commonUsers.html')
    }).then(function () {
      var promiseUserInfo1 = instaDefOptions.you === userName_1 ? userName_1 : instaUserInfo.getUserProfile({ username: userName_1 });
      var promiseUserInfo2 = instaDefOptions.you === userName_2 ? userName_2 : instaUserInfo.getUserProfile({ username: userName_2 });
      var promiseQueryActiveTab = promiseChrome.promiseQuery({
        active: true,
        currentWindow: true
      });
      Promise.all([promiseUserInfo1, promiseUserInfo2, promiseQueryActiveTab]).then(values => {
        let [obj1, obj2, tabs] = values;
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'get_common_users',
          page: 'commonUsers.html',
          user_1: {
            userName: userName_1,
            userId: obj1.id,
            user_is_private: obj1.is_private,
            user_followed_by_viewer: obj1.followed_by_viewer,
            follows_count: obj1.follows_count,
            followed_by_count: obj1.followed_by_count
          },
          user_2: {
            userName: userName_2,
            userId: obj2.id,
            user_is_private: obj2.is_private,
            user_followed_by_viewer: obj2.followed_by_viewer,
            follows_count: obj2.follows_count,
            followed_by_count: obj2.followed_by_count,
          },
          relType: 'All'
        });
      });
    }, () => alert(instaMessages.getMessage('TABISOPEN')));
  });
});


window.onload = function () {
  'use strict';

  _gaq.push(['_trackPageview']);

  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {

    var arr = tabs[0].url.match(instaDefOptions.regExtractUserName);

    if (arr) {
      instaUserInfo.getUserProfile({ username: arr[1] }).then(function (obj) {

        var $html = '';
        delete obj.profile_pic_url_hd;
        for (var key in obj) {
          if (obj[key] !== null) {
            if (('connected_fb_page' === key) || ('external_url' === key)) {
              $html += `${key}: <strong><a href='${obj[key]}' target='_blank'>${obj[key]}</a></strong><br/>`;
            } else {
              $html += `${key}: <strong>${obj[key]}</strong><br/>`;
            }
          }
        }
        document.getElementById('username').value = obj.username;
        document.getElementById('username_1').value = obj.username;
        document.getElementById('username_2').value = instaDefOptions.you;
        document.getElementById('details').innerHTML = $html;
      });
    } else {
      document.getElementById('details').innerHTML = 'UserName is not found in URL';
      document.getElementById('username').value = instaDefOptions.you;
      document.getElementById('username_1').value = instaDefOptions.you;
    }
  });
};
