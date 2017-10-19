/* globals alert, $, instaDefOptions, instaMessages, instaTimeout, instaCountdown */

var instaLike = function () { };

instaLike.like = function (settings) {

  'use strict';

  var {
    mediaId, csrfToken, updateStatusDiv
  } = settings;

  return new Promise(function (resolve, reject) {
    like(mediaId, csrfToken, resolve, reject);
  });

  function successLike(data, resolve) {
    updateStatusDiv(`The request to like ${mediaId} was successful with response - ${data.status}`);
    resolve(data.status);
  }

  function retryError(message, resolve, reject) {
    updateStatusDiv(message, 'red');
    instaTimeout.setTimeout(3000)
      .then(function () {
        return instaCountdown.doCountdown('status', 'Liking', (new Date()).getTime() + +instaDefOptions.retryInterval);
      })
      .then(() => {
        console.log('Continue execution after HTTP error', new Date()); //eslint-disable-line no-console
        like(mediaId, csrfToken, resolve, reject);
      });
  }

  function errorLike(jqXHR, resolve, reject) {
    console.log(`Error making ajax request to like post ${mediaId}, status - ${jqXHR.status}`); //eslint-disable-line no-console
    console.log(arguments); //eslint-disable-line no-console
    var message;
    if (jqXHR.status === 0) {
      console.log('Not connected.', new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('NOTCONNECTED', +instaDefOptions.retryInterval / 60000);
      retryError(message, resolve, reject);
    } else if (jqXHR.status === 400) {
      console.log('HTTP400 error trying to like the media.', new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('HTTP400');
      retryError(message, resolve, reject);
    } else if (jqXHR.status === 403) {
      console.log('HTTP403 error trying to like the media.', new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('HTTP403', +instaDefOptions.retryInterval / 60000);
      retryError(message, resolve, reject);
    } else if (jqXHR.status === 429) {
      console.log('HTTP403 error trying to like the media.', new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('HTTP429', +instaDefOptions.retryInterval / 60000);
      retryError(message, resolve, reject);
    } else if ((jqXHR.status === 500) || (jqXHR.status === 502) || (jqXHR.status === 503)) {
      console.log('HTTP50X error trying to like the media - ' + jqXHR.status, new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('HTTP50X', jqXHR.status, +instaDefOptions.retryInterval / 60000);
      retryError(message, resolve, reject);
    } else {
      alert(instaMessages.getMessage('ERRLIKEMEDIA', mediaId, jqXHR.status));
      reject();
    }
  }

  function like(mediaId, csrfToken, resolve, reject) {
    var link = `https://www.instagram.com/web/likes/${mediaId}/like/`;
    $.ajax({
      url: link,
      method: 'POST',
      success: function (data) {
        successLike(data, resolve);
      },
      error: function (jqXHR) {
        errorLike(jqXHR, resolve, reject);
      },
      headers: {
        'X-CSRFToken': csrfToken,
        'x-instagram-ajax': 1,
        'eferer': 'https://www.instagram.com/' //+ obj.userName + '/'
      },
      async: true
    });
  }
};
