/* exported instaMessages */

var instaMessages = (function () {
  'use strict';

  var m = {
    HTTP400: 'Bad request [400]. The execution will continue in ${1} minutes!', //only for getFeed and like
    HTTP404: 'Requested page not found [404]. The execution will continue in ${1} minutes!',
    HTTP403: 'Got HTTP 403 Error [403]. The execution will continue in ${1} minutes!',
    HTTP429: 'Instagram returned HTTP 429 Error Code that means too many requests were already sent. The execution will continue in ${1} minutes!',
    HTTP50X: 'Got HTTP ${0} Error. The execution will continue in ${1} minutes!',
    NOTCONNECTED: 'Not connected. Verify Network. Request will be retried in ${1} munutes!',
    NOTLOGGEDIN: 'Seems you are not logged in!',
    NOTALLOWEDUSER: 'You cannot get the followers/following users of user ${0}, its account is private and you are not following it.',
    JSONPARSEERROR: 'Requested JSON parse failed.',
    TIMEOUT: 'Time out error.',
    AJAXABORT: 'Ajax request aborted.',
    UNCAUGHT: 'Uncaught Error: ${0}',
    THESAMEUSERS: 'You are going to find the common users between the same users, please provide the different first or second user name.',
    ERRGETTINGUSER: 'Error getting the ${0} user profile, status - ${1}.',
    ERRGETTINGFEED: 'Error getting your feed, status - ${0}.',
    ERRFOLLOWUSER: 'Error trying to follow ${0} user, status - ${1}.',
    ERRLIKEMEDIA: 'Error liking the ${0} post, status - ${1}.',
    USERNAMEISREQ: 'Please provide the user name.',
    USERNAMEISREQPAR: 'Please specify the ${0} user name.',
    TABISOPEN: 'Found already open tab with results, please close this tab before processing!'
  };

  function getMessage(key) {
    var arr = Array.prototype.slice.call(arguments, 1);
    var ret = m[key];
    for (var i = 0; i < arr.length; i++) {
      var reg = new RegExp('\\$\\{' + i + '}', 'g');
      ret = ret.replace(reg, arr[i]);
    }
    return ret;
  }

  return {
    getMessage: getMessage
  };
}());
