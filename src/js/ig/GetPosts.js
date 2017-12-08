/* globals GetFeed, GetProfile, GetPostInfo, instaUserInfo */
/* jshint -W106 */

var GetPosts = function (settings) { //eslint-disable-line no-unused-vars

  'use strict';

  console.log(settings);

  var instaPosts, postInfo;

  var {
    mode, updateStatusDiv, end_cursor, vueStatus, userName, userId
  } = settings;

  var init = {
    'likeFeed': () => {
      console.log('likeFeed');
      instaPosts = new GetFeed({ updateStatusDiv: updateStatusDiv, end_cursor: end_cursor, vueStatus: vueStatus });
    },
    'likeProfile': () => { //todo : pageSize?
      console.log('likeProfile')
      instaPosts = new GetProfile({ updateStatusDiv: updateStatusDiv, end_cursor: end_cursor, userId: userId, pageSize: 12, vueStatus: vueStatus });
      postInfo = new GetPostInfo({ updateStatusDiv: updateStatusDiv, vueStatus: vueStatus });
    }
  }

  var get = {
    'likeFeed': (restart) => {
      console.log('getFeed');
      return instaPosts.getFeed(restart);
    },
    'likeProfile': () => { //todo : pageSi
      console.log('getProfile')
      return instaPosts.getProfile();
    }
  }

  init[mode]();  //initialize the needed class

  function getPosts(restart) {
    //return instaPosts.getFeed(restart);
    return get[mode](restart);
  }

  function resolveUserName() {
    return new Promise((resolve, reject) => {
      if (('likeProfile' === mode) && ('' === userId)) {
        //reject();
        console.log('need to resolve the username');
        instaUserInfo.getUserProfile({ username: userName }).then(obj => {
          console.log('username is resolved');
          instaPosts.setUserId(obj.id);
          resolve();
        }, () => reject());
      } else {
        resolve();
      }
    });
  }

  function isNotLiked(media) {
    return new Promise(resolve => {
      if ('likeProfile' === mode) {
        console.log(media);
        console.log('need to check the profile info - ' + media.node.shortcode);
        console.log(postInfo);
        postInfo.getPostInfo(media.node.shortcode).then(obj => {
          console.log('postInfo is got');
          console.log(obj);
          console.log(obj.viewer_has_liked);
          resolve(!obj.viewer_has_liked);
        })
      } else { //liking the feed
        resolve(!media.node.viewer_has_liked);
      }
    });
  }

  function hasMore() {
    return instaPosts.hasMore();
  }

  return {
    getPosts: getPosts,
    resolveUserName: resolveUserName,
    isNotLiked: isNotLiked,
    hasMore: hasMore
  };

};
