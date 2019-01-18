/* exported GetHashTag */
/* globals alert, axios, instaDefOptions, instaMessages, instaTimeout, instaCountdown */

const GetHashTag = function (settings) {
  'use strict';

  let has_next_page;

  const {
    updateStatusDiv, vueStatus, hashTag,
  } = settings;

  let {
    end_cursor, pageSize,
  } = settings;
  pageSize = Math.min(pageSize, instaDefOptions.maxPageSizeForFeed); // to avoid HTTP400

  function getHashTag(restart) {
    if (restart) {
      end_cursor = null;
    }
    return new Promise(((resolve, reject) => {
      getHashTagInternal(resolve, reject);
    }));
  }

  function hasMore() {
    return has_next_page;
  }

  function successGetHashTag(data, resolve, reject) {
    if (data.data.data.hashtag) { // if hashtag found
      has_next_page = data.data.data.hashtag.edge_hashtag_to_media.page_info.has_next_page;
      end_cursor = data.data.data.hashtag.edge_hashtag_to_media.page_info.end_cursor;
      resolve(data.data.data.hashtag.edge_hashtag_to_media.edges);
    } else { // no found posts for hashtag
      reject('Hashtag does not have the posts?');
    }
  }

  function retryError(message, errorNumber, resolve, reject) {
    updateStatusDiv(message, 'red');
    instaTimeout.setTimeout(3000)
      .then(() => instaCountdown.doCountdown(
        'status',
        errorNumber,
        `Getting the ${hashTag} hashtag`,
        +(new Date()).getTime() + instaDefOptions.retryInterval,
        vueStatus,
      ))
      .then(() => {
        console.log('Continue execution after HTTP error', errorNumber, new Date()); // eslint-disable-line no-console
        getHashTagInternal(resolve, reject); // 20171110: changed to internal
      });
  }

  function errorGetHashTag(error, resolve, reject) {
    console.log(error); // eslint-disable-line no-console
    const errorCode = error.response ? error.response.status : 0;
    if (errorCode > 0) {
      console.log(`error response data - ${error.response.data}/${errorCode}`); // eslint-disable-line no-console
    }
    console.log(`Error making http request to get ${hashTag} hashtag, status - ${errorCode}`); // eslint-disable-line no-console

    if (instaDefOptions.httpErrorMap.hasOwnProperty(errorCode)) {
      console.log(`HTTP${errorCode} error trying to get your feed.`, new Date()); // eslint-disable-line no-console
      const message = instaMessages.getMessage(instaDefOptions.httpErrorMap[errorCode], errorCode, +instaDefOptions.retryInterval / 60000);
      retryError(message, errorCode, resolve, reject);
      return;
    }

    alert(instaMessages.getMessage('ERRFETCHINGHASHTAG', errorCode));
    reject();
  }

  function getHashTagInternal(resolve, reject) {
    const link = 'https://www.instagram.com/graphql/query/';

    const config = {
      headers: {
        'x-instagram-ajax': 1,
        eferer: 'https://www.instagram.com/',
      },
    };
    axios.get(link, {
      params: {
        query_hash: instaDefOptions.queryHash.hashTag,
        variables: JSON.stringify({
          tag_name: hashTag,
          show_ranked: false,
          after: end_cursor,
          first: pageSize,
        }),
      },
    }, config)
      .then(
        response => successGetHashTag(response, resolve, reject),
        error => errorGetHashTag(error, resolve, reject),
      );
  }

  return {
    getHashTag,
    hasMore,
  };
};
