/* globals GetFeed, GetProfile */
/* jshint -W106 */

var GetPosts = function (settings) { //eslint-disable-line no-unused-vars

  'use strict';

  var mode; //profile or feed

  var {
      mode, updateStatusDiv, end_cursor, vueStatus
    } = settings;


  var instaPosts = new GetFeed({ updateStatusDiv: updateStatusDiv, end_cursor: end_cursor, vueStatus: vueStatus });



  function getPosts(restart) {
    return instaPosts.getFeed(restart);
  }

  function isNotLiked(media) {
    return new Promise(resolve => {
      var result = !media.node.viewer_has_liked;
      resolve(result);
    });
  }

  function hasMore() {
    return instaPosts.hasMore();
  }

  return {
    getPosts: getPosts,
    isNotLiked: isNotLiked,
    hasMore: hasMore
  };

};
