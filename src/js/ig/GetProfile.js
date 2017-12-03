/* globals alert, Promise, axios, instaDefOptions, instaMessages, instaTimeout, instaCountdown */
/* jshint -W106 */

var GetProfile = function (settings) { //eslint-disable-line no-unused-vars

  'use strict';

  var has_next_page;

  var {
      userId, updateStatusDiv, end_cursor, pageSize, vueStatus
    } = settings;

  function getProfile() {
    return new Promise(function (resolve, reject) {
      getProfileInternal(resolve, reject);
    });
  }

  function hasMore() {
    return has_next_page;
  }

  function successGetProfile(data, resolve) {
    has_next_page = data.data.data.user.edge_owner_to_timeline_media.page_info.has_next_page;
    end_cursor = data.data.data.user.edge_owner_to_timeline_media.page_info.end_cursor;
    resolve(data.data.data.user.edge_owner_to_timeline_media.edges);
  }

  function retryError(message, errorNumber, resolve, reject) {
    updateStatusDiv(message, 'red'); //todo: check if I have updateStatusDiv
    instaTimeout.setTimeout(3000)
      .then(function () {
        return instaCountdown.doCountdown(
          'status',
          errorNumber,
          'Getting the posts', //todo : how do I call that
          +(new Date()).getTime() + instaDefOptions.retryInterval,
          vueStatus);
      })
      .then(() => {
        console.log('Continue execution after HTTP error', errorNumber, new Date()); //eslint-disable-line no-console
        getProfileInternal(resolve, reject);
      });
  }

  function errorGetProfile(error, resolve, reject) {
    console.log(error); //eslint-disable-line no-console
    var message;
    var errorCode = error.response ? error.response.status : 0;
    console.log(`Error making ajax request to get your feed, status - ${errorCode}`); //eslint-disable-line no-console

    if (instaDefOptions.httpErrorMap.hasOwnProperty(errorCode)) {
      console.log(`HTTP${errorCode} error trying to like the media.`, new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage(instaDefOptions.httpErrorMap[errorCode], errorCode, +instaDefOptions.retryInterval / 60000);
      retryError(message, errorCode, resolve, reject);
      return;
    }

    alert(instaMessages.getMessage('ERRGETTINGFEED', errorCode));
    reject();
  }

  function getProfileInternal(resolve, reject) {
    var link = 'https://www.instagram.com/graphql/query/';

    var config = {
      headers: {
        'x-instagram-ajax': 1,
        'eferer': 'https://www.instagram.com/' //+ obj.userName + '/'
      }
    };
    axios.get(link, {
      params: {
        query_id: instaDefOptions.queryId.profile,
        variables: JSON.stringify({
          'id': userId,
          'first': pageSize,
          'after': end_cursor
        })
      }
    }, config).
      then(
      response => successGetProfile(response, resolve),
      error => errorGetProfile(error, resolve, reject)
      );
  }

  return {
    getProfile: getProfile,
    hasMore: hasMore
  };

};
