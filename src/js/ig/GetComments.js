/* globals alert, axios, instaDefOptions, instaMessages, instaTimeout, instaCountdown */
/* jshint -W106 */

var GetComments = function (settings) { //eslint-disable-line no-unused-vars

  'use strict';

  var has_next_page;

  var {
    shortCode, end_cursor, updateStatusDiv, pageSize, vueStatus, url
  } = settings;

  function getComments() {
    return new Promise(function (resolve, reject) {
      getCommentsInternal(resolve, reject);
    });
  }

  function hasMore() {
    return has_next_page;
  }

  function successGetComments(data, resolve) {
    console.log(data); //TEMP
    has_next_page = data.data.data.shortcode_media.edge_liked_by.page_info.has_next_page;
    end_cursor = data.data.data.shortcode_media.edge_liked_by.page_info.end_cursor;
    resolve({
      data: data.data.data.shortcode_media.edge_liked_by.edges,
      shortCode: shortCode,
      url: url
    });
  }

  function retryError(message, errorNumber, resolve, reject) {
    updateStatusDiv(message, 'red');
    instaTimeout.setTimeout(3000)
      .then(function () {
        return instaCountdown.doCountdown(
          'status',
          errorNumber,
          'Getting the comments',
          +(new Date()).getTime() + instaDefOptions.retryInterval,
          vueStatus);
      })
      .then(() => {
        console.log('Continue execution after HTTP error', errorNumber, new Date()); //eslint-disable-line no-console
        getCommentsInternal(resolve, reject);
      });
  }

  function errorGetComments(error, resolve, reject) {
    console.log(error); //eslint-disable-line no-console
    var errorCode = error.response ? error.response.status : 0;
    if (errorCode > 0) {
      console.log(`error response data - ${error.response.data}/${errorCode}`); //eslint-disable-line no-console
    }
    console.log(`Error making http request to get the comments for post, status - ${errorCode}`); //eslint-disable-line no-console

    if (instaDefOptions.httpErrorMap.hasOwnProperty(errorCode)) {
      console.log(`HTTP${errorCode} error trying to get the comments for post.`, new Date()); //eslint-disable-line no-console
      var message = instaMessages.getMessage(instaDefOptions.httpErrorMap[errorCode], errorCode, +instaDefOptions.retryInterval / 60000);
      retryError(message, errorCode, resolve, reject);
      return;
    }
    alert(instaMessages.getMessage('ERRGETTINGCOMMENTS', errorCode));
    reject();
  }

  function getCommentsInternal(resolve, reject) {
    var link = 'https://www.instagram.com/graphql/query/';

    var config = {
      headers: {
        'x-instagram-ajax': 1,
        'eferer': 'https://www.instagram.com/' //+ obj.userName + '/'
      }
    };
    axios.get(link, {
      params: {
        query_hash: instaDefOptions.queryHash.comments,
        variables: JSON.stringify({
          'shortcode': shortCode,
          'first': pageSize,
          'after': end_cursor
        })
      }
    }, config).
      then(
        response => successGetComments(response, resolve),
        error => errorGetComments(error, resolve, reject)
      );
  }

  return {
    getComments: getComments,
    hasMore: hasMore
  };

};
