/* globals alert, axios, Promise, instaDefOptions, instaMessages, instaTimeout, instaCountdown */

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
    updateStatusDiv(`The request to like ${mediaId} was successful with response - ${data.status}`);
    resolve(data.status);
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
    var message;
    var errorCode = error.response.status;
    console.log(`Error making ajax request to like post ${mediaId}, status - ${errorCode}`); //eslint-disable-line no-console
    console.log(arguments); //eslint-disable-line no-console
    switch(errorCode)
    {
      case 0:
        console.log('Not connected.', new Date()); //eslint-disable-line no-console
        message = instaMessages.getMessage('NOTCONNECTED', +instaDefOptions.retryInterval / 60000);
        retryError(message, errorCode, resolve, reject);
        break;
      case 400:
        console.log('HTTP400 error trying to like the media.', new Date()); //eslint-disable-line no-console
        message = instaMessages.getMessage('HTTP400');
        retryError(message, errorCode, resolve, reject);
        break;
      case 403:
        console.log('HTTP403 error trying to like the media.', new Date()); //eslint-disable-line no-console
        message = instaMessages.getMessage('HTTP403', +instaDefOptions.retryInterval / 60000);
        retryError(message, errorCode, resolve, reject);
        break;
      case 429:
        console.log('HTTP403 error trying to like the media.', new Date()); //eslint-disable-line no-console
        message = instaMessages.getMessage('HTTP429', +instaDefOptions.retryInterval / 60000);
        retryError(message, errorCode, resolve, reject);
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        console.log('HTTP50X error trying to like the media - ' + errorCode, new Date()); //eslint-disable-line no-console
        message = instaMessages.getMessage('HTTP50X', errorCode, +instaDefOptions.retryInterval / 60000);
        retryError(message, errorCode, resolve, reject);
        break;
      default:
        alert(instaMessages.getMessage('ERRLIKEMEDIA', mediaId, errorCode));
        reject();
    }
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
    axios.post(link, '', config).then((response) => successLike(response, resolve)).catch((error) => errorLike(error, resolve, reject));
  }
};
