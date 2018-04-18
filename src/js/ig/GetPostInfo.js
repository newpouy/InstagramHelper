/* globals alert, axios, instaDefOptions, instaMessages, instaTimeout, instaCountdown */
/* jshint -W106 */

var GetPostInfo = function (settings) { //eslint-disable-line no-unused-vars

  'use strict';

  var {
        updateStatusDiv, vueStatus
      } = settings;


  function getPostInfo(post) {
    return new Promise(function (resolve, reject) {
      getPostInfoInternal(post, resolve, reject);
    });
  }

  function successGetPostInfo(data, resolve) {
    resolve(data.data.graphql.shortcode_media);
  }

  function retryError(post, message, errorNumber, resolve, reject) {
    updateStatusDiv(message, 'red');
    instaTimeout.setTimeout(3000)
      .then(function () {
        return instaCountdown.doCountdown(
          'status',
          errorNumber,
          'Getting the post info',
          +(new Date()).getTime() + instaDefOptions.retryInterval,
          vueStatus);
      })
      .then(() => {
        console.log('Continue execution after HTTP error', errorNumber, new Date()); //eslint-disable-line no-console
        getPostInfoInternal(post, resolve, reject);
      });
  }

  function errorGetPostInfo(post, error, resolve, reject) {
    console.log(error); //eslint-disable-line no-console
    var errorCode = error.response ? error.response.status : 0;
    if (errorCode > 0) {
      console.log(`error response data - ${error.response.data}/${errorCode}`); //eslint-disable-line no-console
    }
    console.log(`Error making http request to get post info, status - ${errorCode}`); //eslint-disable-line no-console

    if (instaDefOptions.httpErrorMap.hasOwnProperty(errorCode)) {
      console.log(`HTTP${errorCode} error trying to get post info.`, new Date()); //eslint-disable-line no-console
      var message = instaMessages.getMessage(instaDefOptions.httpErrorMap[errorCode], errorCode, +instaDefOptions.retryInterval / 60000);
      retryError(post, message, errorCode, resolve, reject);
      return;
    }

    alert(instaMessages.getMessage('ERRGETTINGPOST', post, errorCode));
    reject();
  }

  function getPostInfoInternal(post, resolve, reject) {
    var link = `https://www.instagram.com/p/${post}?__a=1`;

    var config = {
      headers: {
        'x-instagram-ajax': 1,
        'eferer': 'https://www.instagram.com/' //+ obj.userName + '/'
      }
    };
    axios.get(link, {}, config).
      then(
      response => successGetPostInfo(response, resolve),
      error => errorGetPostInfo(post, error, resolve, reject)
      );
  }

  return {
    getPostInfo: getPostInfo
  };

};
