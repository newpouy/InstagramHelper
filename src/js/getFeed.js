/* globals alert, Promise, $, instaDefOptions, instaMessages, instaTimeout, instaCountdown */
/* jshint -W106 */

var InstaFeed = function (settings) {

  'use strict';

  var {
    updateStatusDiv, has_next_page, end_cursor
  } = settings;

  function getFeed() {
    return new Promise(function (resolve, reject) {
      getFeedInternal(resolve, reject);
    });
  }

  function hasMore() {
    return has_next_page;
  }

  function successGetFeed(data, status, xhr, link, resolve) {
    has_next_page = data.data.user.edge_web_feed_timeline.page_info.has_next_page;
    end_cursor = data.data.user.edge_web_feed_timeline.page_info.end_cursor;
    resolve(data.data.user.edge_web_feed_timeline.edges);
  }

  function retryError(message, resolve, reject) {
    updateStatusDiv(message, 'red'); //todo: check if I have updateStatusDiv
    instaTimeout.setTimeout(3000)
      .then(function () {
        return instaCountdown.doCountdown('status', 'Getting your feed', (new Date()).getTime() + +instaDefOptions.retryInterval);
      })
      .then(() => {
        console.log('Continue execution after HTTP error', new Date()); //eslint-disable-line no-console
        getFeedInternal(resolve, reject); //20171110: changed to internal
      });

  }

  function errorGetFeed(jqXHR, resolve, reject) {
    console.log(`Error making ajax request to get your feed, status - ${jqXHR.status}`); //eslint-disable-line no-console
    console.log(arguments); //eslint-disable-line no-console
    var message;
    if (jqXHR.status === 0) {
      console.log('Not connected.', new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('NOTCONNECTED', +instaDefOptions.retryInterval / 60000);
      retryError(message, resolve, reject);
    } else if (jqXHR.status === 400) {
      console.log('HTTP400 error getting your feed.', new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('HTTP400');
      retryError(message, resolve, reject);
    } else if (jqXHR.status === 403) {
      console.log('HTTP403 error getting your feed.', new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('HTTP403', +instaDefOptions.retryInterval / 60000);
      retryError(message, resolve, reject);
    } else if (jqXHR.status === 429) {
      console.log('HTTP429 error getting your feed.', new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('HTTP429', +instaDefOptions.retryInterval / 60000);
      retryError(message, resolve, reject);
    } else if ((jqXHR.status === 500) || (jqXHR.status === 502) || (jqXHR.status === 503) || (jqXHR.status === 504)) {
      console.log('HTTP50X error getting your feed - ' + jqXHR.status, new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('HTTP50X', jqXHR.status, +instaDefOptions.retryInterval / 60000);
      retryError(message, resolve, reject);
    } else if (jqXHR.status === 404) {
      console.log('HTTP404 error getting your feed.', new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('HTTP404');
    } else {
      alert(instaMessages.getMessage('ERRGETTINGFEED', jqXHR.status));
      reject();
    }
  }

  function getFeedInternal(resolve, reject) {
    var link = 'https://www.instagram.com/graphql/query/';
    $.ajax({
      url: link,
      method: 'GET',
      data: {
        query_id: instaDefOptions.queryId.feed,
        variables: JSON.stringify({
          'fetch_media_item_count': instaDefOptions.defFetchMedia, //also in options?
          'fetch_media_item_cursor': end_cursor,
          'fetch_comment_count': 0,
          'fetch_like': 0,
          'has_stories': false
        })
      },
      success: function (data, status, xhr) {
        successGetFeed(data, status, xhr, link, resolve);
      },
      error: function (jqXHR) {
        errorGetFeed(jqXHR, resolve, reject);
      },
      async: true
    });
  }

  return {
    getFeed: getFeed,
    hasMore: hasMore
  };

};




