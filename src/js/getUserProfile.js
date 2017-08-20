/* globals alert, Promise, $, instaDefOptions, instaMessages */
/* jshint -W106 */

var instaUserInfo = function () { };

instaUserInfo.getUserProfile = function (settings) {

  'use strict';

  var {
    username, userId, updateStatusDiv
  } = settings;


  return new Promise(function (resolve, reject) {
    getUserProfile(username, resolve, reject);
  });

  function promiseGetUsernameById(userId) {
    return new Promise(function (resolve, reject) {
      getUsernameById(userId, resolve, reject);
    });
  }

  function getUsernameById(userId, resolve, reject) {
    var link = `https://www.instagram.com/web/friendships/${userId}/follow/`;
    $.ajax({
      url: link,
      success: function (data) {
        var arr = data.match(instaDefOptions.regFindUser);
        if ((arr || []).length > 0) {
          resolve(arr[1]);
        } else {
          reject();
        }
      },
      error: function (jqXHR) {
        console.log(`Error making ajax request to get ${userId} profile, status - ${jqXHR.status}`); //eslint-disable-line no-console
        console.log(arguments); //eslint-disable-line no-console
        reject();
      },
      async: true
    });
  }

  function isJson(str) {
    try {
      JSON.parse(JSON.stringify(str));
    } catch (e) {
      return false;
    }
    return true;
  }

  function successGetUserProfile(data, status, xhr, link, resolve) {
    if (isJson(data.user)) {
      var {
				id,
        username,
        full_name,
        profile_pic_url_hd,
        biography,
        connected_fb_page,
        external_url,
        followed_by_viewer,
        follows_viewer,
        is_private,
        has_requested_viewer,
        blocked_by_viewer,
        requested_by_viewer,
        has_blocked_viewer
			} = data.user;
      var follows_count = data.user.follows.count;
      var followed_by_count = data.user.followed_by.count;
      var media_count = data.user.media.count;

      followed_by_viewer = requested_by_viewer ? null : followed_by_viewer;
      follows_viewer = has_requested_viewer ? null : follows_viewer;

      var obj = {};
      Object.assign(obj, {
        id,
        username,
        full_name,
        profile_pic_url_hd,
        biography,
        connected_fb_page,
        external_url,
        followed_by_viewer,
        follows_viewer,
        is_private,
        has_requested_viewer,
        blocked_by_viewer,
        requested_by_viewer,
        has_blocked_viewer,
        follows_count,
        followed_by_count,
        media_count
      });
      resolve(obj);
    } else {
      console.log(`returned data in getUserProfile is not JSON - ${userId}/${link}`);
      console.log(arguments);
      //alert ('returned data in getUserProfile is not JSON - ' + userId + '/' + link);
      resolve({ //temp solution: such user should be removed from result list?
        full_name: 'NA',
        biography: 'The detailed user info was not returned by instagram',
        is_private: true,
        followed_by_viewer: false,
        follows_viewer: false,
        follows_count: 0,
        followed_by_count: 0,
        media_count: 0
      });
    }
  }

  function retryError (message, resolve, reject) {
    updateStatusDiv(message, 'red'); //todo: check if I have updateStatusDiv
    instaTimeout.setTimeout(3000)
      .then(function () {
        return instaCountdown.doCountdown('status', '', (new Date()).getTime() + +instaDefOptions.retryInterval);
      })
      .then( () => {
        console.log('Continue execution after HTTP error', new Date()); //eslint-disable-line no-console
        getUserProfile(username, resolve, reject);
      });

  }

  function errorGetUserProfile(jqXHR, resolve, reject) {
    console.log(`Error making ajax request to get ${username} profile, status - ${jqXHR.status}`); //eslint-disable-line no-console
    console.log(arguments); //eslint-disable-line no-console
    var message;
    if (jqXHR.status === 0) {
      console.log('Not connected.', new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('NOTCONNECTED', +instaDefOptions.retryInterval / 60000);
      retryError(message, resolve, reject);
    } else if (jqXHR.status === 403) {
      console.log('HTTP403 error getting the user profile.', new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage(instaMessages.getMessage('HTTP403', +instaDefOptions.retryInterval / 60000));
      retryError(message, resolve, reject);
    } else if (jqXHR.status === 429) {
      console.log('HTTP429 error getting the user profile.', new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage(instaMessages.getMessage('HTTP429', +instaDefOptions.retryInterval / 60000));
      retryError(message, resolve, reject);
    } else if ((jqXHR.status === 500) || (jqXHR.status === 502) || (jqXHR.status === 503)) {
      console.log('HTTP50X error getting the user profile - ' + jqXHR.status, new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage(instaMessages.getMessage('HTTP50X', jqXHR.status, +instaDefOptions.retryInterval / 60000));
      retryError(message, resolve, reject);
    } else if (jqXHR.status === 404) {
      console.log('HTTP404 error getting the user profile.', username, new Date()); //eslint-disable-line no-console
      if (userId) {
        console.log('user id is defined - ' + userId);
        promiseGetUsernameById(userId).then(function (username) {
          //console.log(userId, username);
          getUserProfile(username, resolve, reject);
        }).catch(function () {
          alert('The error trying to find a new username for - ' + userId);
          //todo:
        });
      } else {
        alert('404 error trying to retrieve user profile, and no userid is specified');
        reject();
      }
    } else {
      alert(instaMessages.getMessage('ERRGETTINGUSER', username, jqXHR.status));
      reject();
    }
  }

  function getUserProfile(username, resolve, reject) {
    var link = `https://www.instagram.com/${username}/?__a=1`;
    $.ajax({
      url: link,
      success: function (data, status, xhr) {
        successGetUserProfile(data, status, xhr, link, resolve);
      },
      error: function (jqXHR) {
        errorGetUserProfile(jqXHR, resolve, reject);
      },
      async: true
    });
  }
};
