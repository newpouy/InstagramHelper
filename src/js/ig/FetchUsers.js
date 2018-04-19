/* globals alert, axios, instaDefOptions, instaMessages, instaTimeout, instaCountdown */
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
        setTimeout(() => fetchInstaUsers(), calculateTimeOut(obj));
        return;
      }
    }

    htmlElements[obj.relType].asProgress('finish').asProgress('stop');
    if (obj.callBoth) {
      obj.end_cursor = null;
      obj.relType = obj.relType === 'follows' ? 'followed_by' : 'follows';
      obj.callBoth = false;
      obj.checkDuplicates = true;
      setTimeout(() => fetchInstaUsers(), calculateTimeOut(obj));
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
        fetchInstaUsers();
      });
  };

  var errorFetch = function (error) {
    console.log(error); //eslint-disable-line no-console
    var errorCode = error.response ? error.response.status : 0;
    if (errorCode > 0) {
      console.log(`error response data - ${error.response.data}/${errorCode}`); //eslint-disable-line no-console
    }
    console.log(`Error making http request to fetch the users, status - ${errorCode}`); //eslint-disable-line no-console

    if (instaDefOptions.httpErrorMap.hasOwnProperty(errorCode)) {
      console.log(`HTTP${errorCode} error trying to fetch the users.`, new Date()); //eslint-disable-line no-console
      var message = instaMessages.getMessage(instaDefOptions.httpErrorMap[errorCode], errorCode, +instaDefOptions.retryInterval / 60000);
      retryError(message, errorCode);
      return;
    }
    alert(instaMessages.getMessage('ERRGETTINGFEED', errorCode));
  };

  var fetchInstaUsers = function () {
    var link = 'https://www.instagram.com/graphql/query';
    var config = {
      headers: {
        'X-CSRFToken': obj.csrfToken,
        'x-instagram-ajax': 1,
        'eferer': 'https://www.instagram.com/' + obj.userName + '/'
      }
    };
    axios.get(link, {
      params: {
        //query_id: instaDefOptions.queryId[obj.relType],
        query_hash: instaDefOptions.queryHash[obj.relType],
        variables: JSON.stringify({
          id: obj.userId,
          first: obj.pageSize,
          after: obj.end_cursor ? obj.end_cursor : null
      })
      }
    }, config).then(
      response => successFetch(response.data),
      error => errorFetch(error)
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
