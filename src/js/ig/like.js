/* globals alert, axios, instaDefOptions, instaMessages, instaTimeout, instaCountdown */

var instaLike = function () { };

instaLike.like = function (settings) {

  'use strict';

  var {
    mediaId, csrfToken, updateStatusDiv, vueStatus
  } = settings;

  return new Promise(function (resolve, reject) {
    like(mediaId, csrfToken, resolve, reject);
  });

  function successLike(data, resolve) {
    updateStatusDiv(`The request to like ${mediaId} was successful with response - ${data.data.status}`);
    resolve(true);
  }

  function retryError(message, errorNumber, resolve, reject) {
    updateStatusDiv(message, 'red');
    instaTimeout.setTimeout(3000)
      .then(function () {
        return instaCountdown.doCountdown('status', errorNumber, 'Liking', +(new Date()).getTime() + instaDefOptions.retryInterval, vueStatus);
      })
      .then(() => {
        console.log('Continue execution after HTTP error', errorNumber, new Date()); //eslint-disable-line no-console
        like(mediaId, csrfToken, resolve, reject);
      });
  }

  function errorLike(error, resolve, reject) {
    console.log(error); //eslint-disable-line no-console
    var errorCode = error.response ? error.response.status : 0;
    if (errorCode > 0) {
      console.log(`error response data - ${error.response.data}/${errorCode}`); //eslint-disable-line no-console
    }
    if (400 === errorCode) {
        if ('missing media' === error.response.data) {
          //if missing media, switch to the next media, as retrying doesn't make any sense
          resolve(false);
          return;
        }
    }
    console.log(`Error making http request to like post ${mediaId}, status - ${errorCode}`); //eslint-disable-line no-console

    if (instaDefOptions.httpErrorMap.hasOwnProperty(errorCode)) {
      console.log(`HTTP${errorCode} error trying to like the media.`, new Date()); //eslint-disable-line no-console
      var message = instaMessages.getMessage(instaDefOptions.httpErrorMap[errorCode], errorCode, +instaDefOptions.retryInterval / 60000);
      retryError(message, errorCode, resolve, reject);
      return;
    }
    alert(instaMessages.getMessage('ERRLIKEMEDIA', mediaId, errorCode));
    reject();
  }

  function like(mediaId, csrfToken, resolve, reject) {
    var link = `https://www.instagram.com/web/likes/${mediaId}/like/`;
    var config = {
      headers: {
        'X-CSRFToken': csrfToken,
        'x-instagram-ajax': 1,
        'eferer': 'https://www.instagram.com/' //+ obj.userName + '/'
      }
    };
    axios.post(link, '', config).then(
      response => successLike(response, resolve),
      error => errorLike(error, resolve, reject)
    );
  }
};
