/* globals alert, $, instaDefOptions, instaMessages, instaTimeout, instaCountdown */
/* exported FetchUsers */
/* jshint -W106 */

var FetchUsers = function (settings) {

  'use strict';

  var {
    obj,
    myData,
    htmlElements,
    updateStatusDiv,
    resolve
  } = settings;

  function checkForDuplicates(obj, data, i) {
    for (let j = 0; j < myData.length; j++) {
      if (data.edges[i].node.id === myData[j].id) {
        myData[j]['user_' + obj.relType] = true;
        return true;
      }
    }
  }

  function updateDataArray(obj, data) {
    for (let i = 0; i < data.edges.length; i++) {
      //only when the second run happens (or we started with already opened result page)
      var found = obj.checkDuplicates && checkForDuplicates(obj, data, i);
      if (!found) {
        data.edges[i].node.user_follows = false; //explicitly set the value for correct search
        data.edges[i].node.user_followed_by = false; //explicitly set the value for correct search
        data.edges[i].node['user_' + obj.relType] = true;
        if (data.edges[i].node.requested_by_viewer) {
          data.edges[i].node.followed_by_viewer = null;
        }
        myData.push(data.edges[i].node);
      }
    }
  }

  var successFetch = function (res) {
    obj.receivedResponses += 1;
    var data = res.data.user[Object.keys(res.data.user)[0]];
    updateStatusDiv(`received users - ${data.edges.length} (${obj.relType}/${obj.receivedResponses})`);
    updateDataArray(obj, data);
    updateProgressBar(obj, data.edges.length);

    //Have we already achieved the limit?
    if ((obj.limit === 0) || (obj[obj.relType + '_processed'] < obj.limit)) {
      if (data.page_info.has_next_page) { //need to continue
        obj.end_cursor = data.page_info.end_cursor;
        setTimeout(() => this.fetchInstaUsers(), calculateTimeOut(obj));
        return;
      }
    }

    htmlElements[obj.relType].asProgress('finish').asProgress('stop');
    if (obj.callBoth) {
      obj.end_cursor = null;
      obj.relType = obj.relType === 'follows' ? 'followed_by' : 'follows';
      obj.callBoth = false;
      obj.checkDuplicates = true;
      setTimeout(() => this.fetchInstaUsers(), calculateTimeOut(obj));
      return;
    }
    resolve(obj);
  };

  var retryError = function (message, errorNumber) {
    updateStatusDiv(message, 'red');
    instaTimeout.setTimeout(3000)
      .then(function () {
        return instaCountdown.doCountdown('status', errorNumber, 'Users fetching', +(new Date()).getTime() + instaDefOptions.retryInterval);
      })
      .then(() => {
        console.log('Continue execution after HTTP error', errorNumber, new Date()); //eslint-disable-line no-console
        this.fetchInstaUsers();
      });
  };

  var errorFetch = function (error, resolve, reject) {
    console.log(error); //eslint-disable-line no-console
    var errorCode = error.response ? error.response.status : 0;
    console.log(`Error making ajax request to fetch the users, status - ${errorCode}`); //eslint-disable-line no-console

    if (instaDefOptions.httpErrorMap.hasOwnProperty(errorCode)) {
      console.log(`HTTP${errorCode} error trying to get your feed.`, new Date()); //eslint-disable-line no-console
      var message = instaMessages.getMessage(instaDefOptions.httpErrorMap[errorCode], errorCode, +instaDefOptions.retryInterval / 60000);
      retryError(message, errorCode, resolve, reject);
      return;
    }

    alert(instaMessages.getMessage('ERRGETTINGFEED', errorCode));
    reject();


    console.log('error ajax'); //eslint-disable-line no-console
    console.log(arguments); //eslint-disable-line no-console
    var message;
    if (jqXHR.status === 0) {
      console.log('Not connected.', new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('NOTCONNECTED', null, +instaDefOptions.retryInterval / 60000);
      this.retryError(message, jqXHR.status);
    } else if (jqXHR.status === 429) {
      console.log('HTTP429 error.', new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('HTTP429', null, +instaDefOptions.retryInterval / 60000);
      this.retryError(message, jqXHR.status);
    } else if ((jqXHR.status === 500) || (jqXHR.status === 502) || (jqXHR.status === 503) || (jqXHR.status === 504)) {
      console.log('HTTP50X error - ' + jqXHR.status, new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('HTTP50X', jqXHR.status, +instaDefOptions.retryInterval / 60000);
      this.retryError(message, jqXHR.status);
    } else if (jqXHR.status === 404) {
      alert(instaMessages.getMessage('HTTP404I'));
    } else if (exception === 'parsererror') {
      alert(instaMessages.getMessage('JSONPARSEERROR'));
    } else if (exception === 'timeout') {
      alert(instaMessages.getMessage('TIMEOUT'));
    } else if (exception === 'abort') {
      alert(instaMessages.getMessage('AJAXABORT'));
    } else {
      alert(instaMessages.getMessage('UNCAUGHT', jqXHR.responseText));
    }
  };

  var fetchInstaUsers = function () {
    var link = 'https://www.instagram.com/graphql/query';
    var config = {
      headers: {
        'X-CSRFToken': csrfToken,
        'x-instagram-ajax': 1,
        'eferer': 'https://www.instagram.com/'
      }
    };
    axios.get(link, {
      params: {
        query_id: instaDefOptions.queryId[obj.relType],
        variables: JSON.stringify({
          id: obj.userId,
          first: obj.pageSize,
          after: obj.end_cursor ? obj.end_cursor : null
      })
      }
    }, config).then(
      response => successFetch(response.data, resolve),
      error => errorFetch(error, resolve, reject)
    );
  };

  function calculateTimeOut(obj) {
    if (instaDefOptions.noDelayForInit && (obj.receivedResponses < instaDefOptions.requestsToSkipDelay)) {
      return 0;
    }
    return obj.delay;
  }

  function updateProgressBar(obj, count) {
    var newValue = 0 + obj[obj.relType + '_processed'] + count;
    htmlElements[obj.relType].asProgress('go', newValue);
    obj[obj.relType + '_processed'] = newValue;
  }

  return {
    fetchInstaUsers: fetchInstaUsers,
    retryError: retryError
  };
};
