/* globals alert, chrome, document, instaDefOptions, PromiseChrome, instaMessages */
/* jshint -W106 */

(function () {

  'use strict';

  function checkCommonUsersRequest(request) {
    if ((request.viewerUserName === request.user_1.userName) || (request.viewerUserName === request.user_2.userName)) {
      if ((request.user_1.userName === instaDefOptions.you) || (request.user_2.userName === instaDefOptions.you)) {
        alert(instaMessages.getMessage('THESAMEUSERS'));
        return false;
      }
    }
    if (request.user_1.user_is_private && !request.user_1.user_followed_by_viewer && request.viewerUserName !== request.user_1.userName) {
      alert(instaMessages.getMessage('NOTALLOWEDUSER', request.user_1.userName));
      return false;
    }
    if (request.user_2.user_is_private && !request.user_2.user_followed_by_viewer && request.viewerUserName !== request.user_2.userName) {
      alert(instaMessages.getMessage('NOTALLOWEDUSER', request.user_2.userName));
      return false;
    }
    return true;
  }

  chrome.runtime.onMessage.addListener(function (request) {

    var getSharedData = function () {
      var id = 'InstaHelperInjection';
      var script = `(function (){
			var ret_value = ((function (){
				return _sharedData;
			})());
			document.getElementById('InstaHelperInjection').innerText = JSON.stringify(ret_value);
			})();`;
      var injScript = document.createElement('script');
      injScript.type = 'text/javascript';
      injScript.innerHTML = script;
      injScript.id = id;
      document.head.appendChild(injScript);
      var ret_value = JSON.parse(injScript.innerText);
      injScript.parentNode.removeChild(injScript);
      return ret_value;
    };

    if (('get_insta_users' === request.action) ||
      ('get_common_users' === request.action) ||
      ('openLikerPage' === request.action) ||
      ('openMassFollowPage' === request.action) ||
      ('openMassBlockPage' === request.action) ||
      ('openLikesPage' === request.action)) {
      (new PromiseChrome()).promiseGetStorage({
        pageSize: instaDefOptions.defPageSize,
        delay: instaDefOptions.defDelay,
        followDelay: instaDefOptions.defFollowDelay,
        likeDelay: instaDefOptions.defLikeDelay,
        detailedInfoDelay: instaDefOptions.defDetailedInfoDelay,
        pageSizeForFeed: instaDefOptions.defPageSizeForFeed
      }).then(function (items) {

        var sharedData = getSharedData();

        request.pageSize = Math.min(items.pageSize, instaDefOptions.maxPageSize); // to avoid HTTP400
        request.delay = items.delay;
        request.followDelay = items.followDelay;
        request.detailedInfoDelay = items.detailedInfoDelay;
        request.likeDelay = items.likeDelay;
        request.pageSizeForFeed = Math.min(items.pageSizeForFeed, instaDefOptions.maxPageSizeForFeed); // to avoid HTTP400
        request.csrfToken = sharedData.config.csrf_token;

        if (sharedData.config.viewer === null) {
          alert(instaMessages.getMessage('NOTLOGGEDIN'));
          return;
        }
        request.viewerUserName = sharedData.config.viewer.username;
        request.viewerUserId = sharedData.config.viewer.id;

        if ('get_common_users' === request.action) {
          if (!checkCommonUsersRequest(request)) {
            return;
          }
        } else if ('get_insta_users' === request.action) {
          if (request.user_is_private && !request.user_followed_by_viewer && request.viewerUserName !== request.userName) {
            alert(instaMessages.getMessage('NOTALLOWEDUSER', request.userName));
            return;
          }
        }

        chrome.runtime.sendMessage(request);

      });
    }
  });

  chrome.runtime.sendMessage({
    action: 'showHelperIcon'
  });

})();
