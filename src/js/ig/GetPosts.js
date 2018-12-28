/* exported GetPosts */
/* globals GetFeed, GetProfile, GetPostInfo, instaUserInfo, instaDefOptions */

const GetPosts = function (settings) {
  'use strict';

  let instaPosts;
  let postInfo;

  const {
    mode, updateStatusDiv, end_cursor, vueStatus, userName, userId,
  } = settings;

  let { pageSize } = settings;

  pageSize = Math.min(pageSize, instaDefOptions.maxPageSizeForFeed); // to avoid HTTP400 error

  const init = {
    likeFeed: () => {
      instaPosts = new GetFeed({
        updateStatusDiv, end_cursor, vueStatus, pageSize,
      });
    },
    likeProfile: () => {
      instaPosts = new GetProfile({
        updateStatusDiv, end_cursor, userId, pageSize, vueStatus,
      });
      postInfo = new GetPostInfo({ updateStatusDiv, vueStatus });
    },
  };

  const get = {
    likeFeed: restart => instaPosts.getFeed(restart),
    likeProfile: () => instaPosts.getProfile(),
  };

  init[mode](); // initialize the needed class

  function getTotal() { // only for getProfile
    if (typeof instaPosts.getTotal === 'function') {
      return instaPosts.getTotal();
    }
    return -1;
  }

  function getPosts(restart) {
    return get[mode](restart);
  }

  function resolveUserName() {
    return new Promise((resolve, reject) => {
      if (('likeProfile' === mode) && ('' === userId)) {
        instaUserInfo.getUserProfile({ username: userName }).then((obj) => {
          instaPosts.setUserId(obj.id);
          resolve(obj);
        }, () => reject());
      } else {
        resolve();
      }
    });
  }

  function isNotLiked(media) {
    return new Promise((resolve) => {
      if ('likeProfile' === mode) {
        postInfo.getPostInfo(media.node.shortcode).then((obj) => {
          resolve(!obj.viewer_has_liked);
        });
      } else { // liking the feed
        resolve(!media.node.viewer_has_liked);
      }
    });
  }

  function hasMore() {
    return instaPosts.hasMore();
  }

  return {
    getPosts,
    resolveUserName,
    isNotLiked,
    hasMore,
    getTotal,
  };
};
