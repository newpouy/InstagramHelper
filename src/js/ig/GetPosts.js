/* globals GetFeed, GetProfile */
/* jshint -W106 */

var GetPosts = function (settings) { //eslint-disable-line no-unused-vars

  'use strict';

  var mode; //profile or feed

  var {
      updateStatusDiv, end_cursor, vueStatus
    } = settings;


  var instaPosts = new GetFeed  ({ updateStatusDiv: updateStatusDiv, end_cursor: end_cursor, vueStatus: vueStatus });



  function getPosts() {
    return instaPosts.getFeed();
  }

  //do promise from that
  function isLiked(media) {
    return media.node.viewer_has_liked;
  }

  function hasMore() {
    return instaPosts.hasMore();
  }



  return {
  //  init: init,
    getPosts: getPosts,
    isLiked: isLiked,
    hasMore: hasMore
  };

};
