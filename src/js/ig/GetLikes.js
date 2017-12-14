/* globals alert, axios, instaDefOptions, instaMessages, instaTimeout, instaCountdown */
/* jshint -W106 */

var GetLikes = function (settings) { //eslint-disable-line no-unused-vars

    'use strict';

    var has_next_page;

    var {
        shortCode, end_cursor, updateStatusDiv, pageSize, vueStatus
      } = settings;

    function getLikes() {
      return new Promise(function (resolve, reject) {
        getLikesInternal(resolve, reject);
      });
    }

    function hasMore() {
      return has_next_page;
    }

    function successGetLikes(data, resolve) {
      console.log(data);
      resolve();
    }

    function retryError(message, errorNumber, resolve, reject) {
      updateStatusDiv(message, 'red');
      instaTimeout.setTimeout(3000)
        .then(function () {
          return instaCountdown.doCountdown(
            'status',
            errorNumber,
            'Getting the likes',
            +(new Date()).getTime() + instaDefOptions.retryInterval,
            vueStatus);
        })
        .then(() => {
          console.log('Continue execution after HTTP error', errorNumber, new Date()); //eslint-disable-line no-console
          getLikesInternal(resolve, reject);
        });
    }

    function errorGetLikes(error, resolve, reject) {
      console.log(error); //eslint-disable-line no-console
      var message;
      var errorCode = error.response ? error.response.status : 0;
      console.log(`Error making ajax request to get the likes for post, status - ${errorCode}`); //eslint-disable-line no-console

      if (instaDefOptions.httpErrorMap.hasOwnProperty(errorCode)) {
        console.log(`HTTP${errorCode} error trying to get the likes for post.`, new Date()); //eslint-disable-line no-console
        message = instaMessages.getMessage(instaDefOptions.httpErrorMap[errorCode], errorCode, +instaDefOptions.retryInterval / 60000);
        retryError(message, errorCode, resolve, reject);
        return;
      }
      alert(instaMessages.getMessage('ERRGETTINGFEED', errorCode));
      reject();
    }

    function getLikesInternal(resolve, reject) {
      var link = 'https://www.instagram.com/graphql/query/';

      var config = {
        headers: {
          'x-instagram-ajax': 1,
          'eferer': 'https://www.instagram.com/' //+ obj.userName + '/'
        }
      };
      axios.get(link, {
        params: {
          query_id: instaDefOptions.queryId.likes,
          variables: JSON.stringify({
            'shortcode': shortCode,
            'first': pageSize,
            'after': end_cursor
          })
        }
      }, config).
        then(
        response => successGetLikes(response, resolve),
        error => errorGetLikes(error, resolve, reject)
        );
    }

    return {
      getLikes: getLikes,
      hasMore: hasMore
    };

  };
