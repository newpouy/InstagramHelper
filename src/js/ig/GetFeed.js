/* globals alert, axios, instaDefOptions, instaMessages, instaTimeout, instaCountdown */
/* jshint -W106 */

var GetFeed = function (settings) { //eslint-disable-line no-unused-vars

  'use strict';

  var has_next_page;

  var {
    updateStatusDiv, end_cursor, vueStatus, pageSize
  } = settings;

  function getFeed(restart) {
    if (restart) {
      end_cursor = null;
    }
    return new Promise(function (resolve, reject) {
      getFeedInternal(resolve, reject);
    });
  }

  function hasMore() {
    return has_next_page;
  }

  function successGetFeed(data, resolve) {
    has_next_page = data.data.data.user.edge_web_feed_timeline.page_info.has_next_page;
    end_cursor = data.data.data.user.edge_web_feed_timeline.page_info.end_cursor;
    resolve(data.data.data.user.edge_web_feed_timeline.edges);
  }

  function retryError(message, errorNumber, resolve, reject) {
    updateStatusDiv(message, 'red');
    instaTimeout.setTimeout(3000)
      .then(function () {
        return instaCountdown.doCountdown(
          'status',
          errorNumber,
          'Getting your feed',
          +(new Date()).getTime() + instaDefOptions.retryInterval,
          vueStatus);
      })
      .then(() => {
        console.log('Continue execution after HTTP error', errorNumber, new Date()); //eslint-disable-line no-console
        getFeedInternal(resolve, reject); //20171110: changed to internal
      });
  }

  function errorGetFeed(error, resolve, reject) {
    console.log(error); //eslint-disable-line no-console
    var message;
    var errorCode = error.response ? error.response.status : 0;
    console.log(`Error making ajax request to get your feed, status - ${errorCode}`); //eslint-disable-line no-console

    if (instaDefOptions.httpErrorMap.hasOwnProperty(errorCode)) {
      console.log(`HTTP${errorCode} error trying to get your feed.`, new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage(instaDefOptions.httpErrorMap[errorCode], errorCode, +instaDefOptions.retryInterval / 60000);
      retryError(message, errorCode, resolve, reject);
      return;
    }

    alert(instaMessages.getMessage('ERRGETTINGFEED', errorCode));
    reject();
  }

  function getFeedInternal(resolve, reject) {
    var link = 'https://www.instagram.com/graphql/query/';

    var config = {
      headers: {
        'x-instagram-ajax': 1,
        'eferer': 'https://www.instagram.com/' //+ obj.userName + '/'
      }
    };
    axios.get(link, {
      params: {
        query_id: instaDefOptions.queryId.feed,
        variables: JSON.stringify({
          'fetch_media_item_count': pageSize,
          'fetch_media_item_cursor': end_cursor,
          'fetch_comment_count': 0,
          'fetch_like': 0,
          'has_stories': false
        })
      }
    }, config).
      then(
      response => successGetFeed(response, resolve),
      error => errorGetFeed(error, resolve, reject)
      );
  }

  return {
    getFeed: getFeed,
    hasMore: hasMore
  };

};
