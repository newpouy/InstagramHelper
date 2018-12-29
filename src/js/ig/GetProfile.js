/* exported GetProfile */
/* globals alert, axios, instaDefOptions, instaMessages, instaTimeout, instaCountdown */

const GetProfile = function (settings) {
  'use strict';

  let has_next_page;
  let totalMedia;

  const {
    updateStatusDiv, vueStatus,
  } = settings;

  let {
    userId, pageSize, end_cursor,
  } = settings;
  pageSize = Math.min(pageSize, instaDefOptions.maxPageSizeForFeed); // to avoid HTTP400

  function setUserId(value) {
    userId = value;
  }

  function getProfile() {
    return new Promise(((resolve, reject) => {
      getProfileInternal(resolve, reject);
    }));
  }

  function hasMore() {
    return has_next_page;
  }

  function getTotal() {
    return totalMedia;
  }

  function successGetProfile(data, resolve) {
    has_next_page = data.data.data.user.edge_owner_to_timeline_media.page_info.has_next_page;
    end_cursor = data.data.data.user.edge_owner_to_timeline_media.page_info.end_cursor;
    totalMedia = data.data.data.user.edge_owner_to_timeline_media.count;
    resolve(data.data.data.user.edge_owner_to_timeline_media.edges);
  }

  function retryError(message, errorNumber, resolve, reject) {
    updateStatusDiv(message, 'red');
    instaTimeout.setTimeout(3000)
      .then(() => instaCountdown.doCountdown(
        'status',
        errorNumber,
        'Getting the posts',
        +(new Date()).getTime() + instaDefOptions.retryInterval,
        vueStatus,
      ))
      .then(() => {
        console.log('Continue execution after HTTP error', errorNumber, new Date()); // eslint-disable-line no-console
        getProfileInternal(resolve, reject);
      });
  }

  function errorGetProfile(error, resolve, reject) {
    console.log(error); // eslint-disable-line no-console
    const errorCode = error.response ? error.response.status : 0;
    if (errorCode > 0) {
      console.log(`error response data - ${JSON.stringify(error.response.data)}/${errorCode}`); // eslint-disable-line no-console
    }
    console.log(`Error making http request to get the user profile, status - ${errorCode}`); // eslint-disable-line no-console

    if (instaDefOptions.httpErrorMap.hasOwnProperty(errorCode)) {
      console.log(`HTTP${errorCode} error trying to get the user profile.`, new Date()); // eslint-disable-line no-console
      const message = instaMessages.getMessage(instaDefOptions.httpErrorMap[errorCode], errorCode, +instaDefOptions.retryInterval / 60000);
      retryError(message, errorCode, resolve, reject);
      return;
    }

    alert(instaMessages.getMessage('ERRGETTINGUSER', userId, errorCode));
    reject();
  }

  function getProfileInternal(resolve, reject) {
    const link = 'https://www.instagram.com/graphql/query/';
    const config = {
      headers: {
        'x-instagram-ajax': 1,
        eferer: 'https://www.instagram.com/', // + obj.userName + '/'
      },
    };
    axios.get(link, {
      params: {
        query_hash: instaDefOptions.queryHash.profile,
        variables: JSON.stringify({
          id: userId,
          first: pageSize,
          after: end_cursor,
        }),
      },
    }, config)
      .then(
        response => successGetProfile(response, resolve),
        error => errorGetProfile(error, resolve, reject),
      );
  }

  return {
    setUserId,
    getProfile,
    hasMore,
    getTotal,
  };
};
