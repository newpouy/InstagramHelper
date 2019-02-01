/* globals alert, axios, instaDefOptions, instaMessages, instaTimeout, instaCountdown */

const igUserProfileRegularExpression = /window._sharedData = (.*);<\/script>/i;

const instaUserInfo = function () {
};

instaUserInfo.getUserProfile = function (settings) {
  'use strict';

  const {
    // silent is set to true from vue_block, vue_follow
    username, userId, updateStatusDiv, silent, vueStatus,
  } = settings;

  return new Promise(((resolve, reject) => {
    getUserProfile(username, resolve, reject);
  }));

  function promiseGetUsernameById(userId) {
    return new Promise(((resolve, reject) => {
      getUsernameById(userId, resolve, reject);
    }));
  }

  function getUsernameById(userId, resolve, reject) {
    const link = `https://www.instagram.com/web/friendships/${userId}/follow/`;
    axios.get(link, {}, {})
      .then(
        (response) => {
          const arr = response.data.match(instaDefOptions.regFindUser);
          if ((arr || []).length > 0) {
            resolve(arr[1]);
          } else {
            // reject();
            // We are here if "Sorry, this page isn't available."
            resolve();
          }
        },
        (error) => {
          console.log(error); // eslint-disable-line no-console
          const errorCode = error.response ? error.response.status : 0;
          console.log(`(getUsernameById) ${userId} error code - ${errorCode}`); // eslint-disable-line no-console
          if (instaDefOptions.httpErrorMap.hasOwnProperty(errorCode)) {
            const message = instaMessages.getMessage(instaDefOptions.httpErrorMap[errorCode], errorCode, +instaDefOptions.retryInterval / 60000);
            updateStatusDiv(message, 'red');
            instaTimeout.setTimeout(3000)
              .then(() => instaCountdown.doCountdown('status', errorCode, 'Resolving user id to username', +(new Date()).getTime() + instaDefOptions.retryInterval, vueStatus))
              .then(() => {
                console.log('Continue execution after HTTP error', errorCode, new Date()); // eslint-disable-line no-console
                getUsernameById(userId, resolve, reject);
              });
          } else {
            alert(`Error resolving ${userId} to username/${errorCode}`);
            reject();
          }
        },
      );
  }

  function isJson(str) {
    try {
      JSON.parse(JSON.stringify(str));
    } catch (e) {
      return false;
    }
    return true;
  }

  function successGetUserProfile(data, link, resolve) {
    const p2 = true;
    // getUserProfile.js:1 Uncaught (in promise) TypeError: Cannot read property '1' of null
    // at a (getUserProfile.js:1)
    // at axios.get.then.e (getUserProfile.js:1)
    const arr = igUserProfileRegularExpression.exec(data);
    if (!arr) {
      console.log(`exec failed in getUserProfile - ${userId}/${link}`); // eslint-disable-line no-console
      console.log(data); // eslint-disable-line no-console
      resolve({ // such user should be removed from result list?
        username: instaDefOptions.you,
        full_name: 'NA0',
        biography: 'The detailed user info was not returned by instagram (exec)',
        is_private: true,
        followed_by_viewer: false,
        follows_viewer: false,
        follows_count: 0,
        followed_by_count: 0,
        media_count: 0,
      });
    } else {
      const json = JSON.parse(arr[1]);
      if ((json.entry_data.ProfilePage) && (isJson(json.entry_data.ProfilePage[0].graphql.user))) {
        let {
          id,
          username,
          full_name,
          profile_pic_url_hd,
          biography,
          connected_fb_page,
          external_url,
          followed_by_viewer,
          follows_viewer,
          is_private,
          has_requested_viewer,
          blocked_by_viewer,
          requested_by_viewer,
          has_blocked_viewer,
          is_verified,
          is_business_account,
          business_category_name,
          business_email,
          business_phone_number,
          business_address_json,
        } = json.entry_data.ProfilePage[0].graphql.user;
        const follows_count = json.entry_data.ProfilePage[0].graphql.user.edge_follow.count;
        const followed_by_count = json.entry_data.ProfilePage[0].graphql.user.edge_followed_by.count;
        const media_count = json.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.count;

        let street_address;
        let zip_code;
        let city_name;
        let region_name;
        let country_code;
        if (p2 && business_address_json) {
          ({
            street_address, zip_code, city_name, region_name, country_code,
          } = JSON.parse(business_address_json));
        }

        let latestPostDate;
        if (media_count > 0) { // get the date of the latest post
          if (json.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges[0]) {
            latestPostDate = new Date(json.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges[0].node.taken_at_timestamp * 1000);
            // .toLocaleDateString();
          }
        }

        followed_by_viewer = requested_by_viewer ? null : followed_by_viewer;
        follows_viewer = has_requested_viewer ? null : follows_viewer;

        const obj = {};
        Object.assign(obj, {
          id,
          username,
          full_name,
          profile_pic_url_hd,
          biography,
          connected_fb_page,
          external_url,
          followed_by_viewer,
          follows_viewer,
          is_private,
          has_requested_viewer,
          blocked_by_viewer,
          requested_by_viewer,
          has_blocked_viewer,
          follows_count,
          followed_by_count,
          media_count,
          latestPostDate,
          is_verified,
          is_business_account,
        }, p2 ? {
          business_category_name,
          business_email,
          business_phone_number,
        } : {}, p2 && business_address_json ? {
          street_address,
          zip_code,
          city_name,
          region_name,
          country_code,
        } : {});
        resolve(obj);
      } else {
        console.log(`returned data in getUserProfile is not JSON - ${userId}/${link}`); // eslint-disable-line no-console
        console.log(data); // eslint-disable-line no-console
        resolve({ // such user should be removed from result list?
          username: instaDefOptions.you,
          full_name: 'NA',
          biography: 'The detailed user info was not returned by instagram (no-json)',
          is_private: true,
          followed_by_viewer: false,
          follows_viewer: false,
          follows_count: 0,
          followed_by_count: 0,
          media_count: 0,
        });
      }
    }
  }

  function retryError(message, errorNumber, resolve, reject) {
    if (typeof updateStatusDiv === 'function') {
      updateStatusDiv(message, 'red');
      instaTimeout.setTimeout(3000)
        .then(() => instaCountdown.doCountdown('status', errorNumber, 'Getting users profiles', +(new Date()).getTime() + instaDefOptions.retryInterval, vueStatus))
        .then(() => {
          console.log('Continue execution after HTTP error', errorNumber, new Date()); // eslint-disable-line no-console
          getUserProfile(username, resolve, reject);
        });
    } else {
      // this is from the popup applet?
      alert(`Error ${errorNumber} trying to get the detailed user info for ${username}. Please try again later`);
      reject();
    }
  }

  function errorGetUserProfile(error, resolve, reject) {
    console.log(error); // eslint-disable-line no-console
    const errorCode = error.response ? error.response.status : 0;
    if (errorCode > 0) {
      console.log(`error response data - ${error.response.data}/${errorCode}`); // eslint-disable-line no-console
    }
    console.log(`Error making http request to get user profile ${username}, status - ${errorCode}`); // eslint-disable-line no-console

    if (errorCode === 404) {
      console.log('>>>HTTP404 error getting the user profile.', username, new Date()); // eslint-disable-line no-console
      if (userId) {
        console.log(`>>>user id is defined - ${userId}`); // eslint-disable-line no-console
        promiseGetUsernameById(userId).then((username) => {
          console.log('>>> resolved a new user name', userId, username); // eslint-disable-line no-console
          if (username) {
            getUserProfile(username, resolve, reject);
          } else {
            // need to resolve here as it comes from Content Unavailable - Sorry, this page isn't available.
            resolve({ // such user should be removed from result list?
              username: instaDefOptions.you,
              full_name: 'NA1',
              biography: 'The detailed user info was not returned by instagram (content unavailable)',
              is_private: true,
              followed_by_viewer: false,
              follows_viewer: false,
              follows_count: 0,
              followed_by_count: 0,
              media_count: 0,
            });
          }
        }).catch(() => {
          alert(`The error trying to find a new username for - ${userId}`);
        });
      } else {
        if (!silent) { // silent is set to true from vue_follow and vue_block
          alert('404 error trying to retrieve user profile, userid is not specified, check if username is correct');
        }
        reject();
      }
    } else if (instaDefOptions.httpErrorMap.hasOwnProperty(errorCode)) {
      console.log(`HTTP${errorCode} error trying to get the user profile.`, new Date()); // eslint-disable-line no-console
      const message = instaMessages.getMessage(instaDefOptions.httpErrorMap[errorCode], errorCode, +instaDefOptions.retryInterval / 60000);
      retryError(message, errorCode, resolve, reject);
    } else {
      alert(instaMessages.getMessage('ERRGETTINGUSER', username, errorCode));
      reject();
    }
  }

  function getUserProfile(name, resolve, reject) {
    const link = `https://www.instagram.com/${name}/`;

    const config = {
      headers: {
        'x-instagram-ajax': 1,
        eferer: 'https://www.instagram.com/',
      },
    };
    axios.get(link, {}, config)
      .then(
        (response) => {
          successGetUserProfile(response.data, link, resolve);
        },
        error => errorGetUserProfile(error, resolve, reject),
      );
  }
};
