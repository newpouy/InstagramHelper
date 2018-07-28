/* globals alert, axios, instaDefOptions, instaMessages, instaTimeout, instaCountdown */

var blockUser = function () { };

blockUser.block = function (settings) {

  'use strict';

  var {
    username, userId, csrfToken, updateStatusDiv, vueStatus
  } = settings;

  return new Promise(function (resolve, reject) {
    block(userId, csrfToken, resolve, reject);
  });

  function successBlock(data, resolve) {
    updateStatusDiv(`The request to block ${username} was successful with response - ${data.status}`);
    resolve(data.status);
  }

  function retryError(message, errorNumber, resolve, reject) {
    updateStatusDiv(message, 'red');
    instaTimeout.setTimeout(3000)
      .then(function () {
        return instaCountdown.doCountdown(
          'status',
          errorNumber,
          'Blocking',
          +(new Date()).getTime() + instaDefOptions.retryInterval,
          vueStatus);
      })
      .then(() => {
        console.log('Continue execution after HTTP error', errorNumber, new Date()); //eslint-disable-line no-console
        block(userId, csrfToken, resolve, reject);
      });

  }

  function errorBlock(error, resolve, reject) {
    console.log(error); //eslint-disable-line no-console
    var errorCode = error.response ? error.response.status : 0;
    if (errorCode > 0) {
      console.log(`error response data - ${JSON.stringify(error.response.data)}/${errorCode}`); //eslint-disable-line no-console
    }
    console.log(`Error making http request to block ${username}, status - ${errorCode}`); //eslint-disable-line no-console

    if (instaDefOptions.httpErrorMap.hasOwnProperty(errorCode)) {
      console.log(`HTTP${errorCode} error trying to block the user.`, new Date()); //eslint-disable-line no-console
      var message = instaMessages.getMessage(instaDefOptions.httpErrorMap[errorCode], errorCode, +instaDefOptions.retryInterval / 60000);
      retryError(message, errorCode, resolve, reject);
      return;
    }
    alert(instaMessages.getMessage('ERRBLOCKUSER', username, errorCode));
    reject();
  }

  function block(userId, csrfToken, resolve, reject) {

    var link = `https://www.instagram.com/web/friendships/${userId}/block/`;
    var config = {
      headers: {
        'X-CSRFToken': csrfToken,
        'x-instagram-ajax': 1,
        'eferer': 'https://www.instagram.com/'
      }
    };
    axios.post(link, '', config).then(
      response => successBlock(response.data, resolve),
      error => errorBlock(error, resolve, reject)
    );
  }
};


