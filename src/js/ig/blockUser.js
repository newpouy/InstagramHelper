/* globals alert, axios, instaDefOptions, instaMessages, instaTimeout, instaCountdown */

const blockUser = function () { };

blockUser.block = function (settings) {
  'use strict';

  const {
    username,
    userId,
    csrfToken,
    updateStatusDiv,
    vueStatus,
    mode,
  } = settings;

  return new Promise(((resolve, reject) => {
    block(userId, csrfToken, resolve, reject, mode);
  }));

  function successBlock(data, resolve, mode) {
    updateStatusDiv(`The request to ${mode} ${username} was successful with response - ${data.status}`);
    resolve(data.status);
  }

  function block(userId, csrfToken, resolve, reject, mode) {
    const link = `https://www.instagram.com/web/friendships/${userId}/${mode}/`;
    const config = {
      headers: {
        'X-CSRFToken': csrfToken,
        'x-instagram-ajax': 1,
        eferer: 'https://www.instagram.com/',
      },
    };
    axios.post(link, '', config)
      .then(response => successBlock(response.data, resolve, mode), error => errorBlock(error, resolve, reject, mode));
  }

  function retryError(message, errorNumber, resolve, reject, mode) {
    updateStatusDiv(message, 'red');
    instaTimeout.setTimeout(3000)
      .then(() => instaCountdown.doCountdown(
        'status',
        errorNumber,
        `${mode.charAt(0).toUpperCase() + mode.slice(1)}ing`,
        +(new Date()).getTime() + instaDefOptions.retryInterval,
        vueStatus,
      ))
      .then(() => {
        console.log('Continue execution after HTTP error', errorNumber, new Date()); // eslint-disable-line no-console
        block(userId, csrfToken, resolve, reject, mode);
      });
  }

  function errorBlock(error, resolve, reject, mode) {
    console.log(error); // eslint-disable-line no-console
    const errorCode = error.response ? error.response.status : 0;
    if (errorCode > 0) {
      console.log(`error response data - ${JSON.stringify(error.response.data)}/${errorCode}`); // eslint-disable-line no-console
    }
    console.log(`Error making http request to ${mode} ${username}, status - ${errorCode}`); // eslint-disable-line no-console

    if (instaDefOptions.httpErrorMap.hasOwnProperty(errorCode)) {
      console.log(`HTTP${errorCode} error trying to ${mode} the user.`, new Date()); // eslint-disable-line no-console
      const message = instaMessages.getMessage(instaDefOptions.httpErrorMap[errorCode], errorCode, +instaDefOptions.retryInterval / 60000);
      retryError(message, errorCode, resolve, reject, mode);
      return;
    }
    alert(instaMessages.getMessage('ERRBLOCKUSER', username, errorCode)); // eslint-disable-line no-alert
    reject();
  }
};
