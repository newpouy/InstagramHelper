/* globals _gaq, chrome, alert */
/* globals GetPosts, GetLikes, likes, instaDefOptions */
/* jshint -W106 */

window.onload = function () {

  'use strict';

  var data;

  document.getElementById('start').onclick = function () {

    var instaPosts =
      new GetPosts({
        mode: 'likeProfile',
        updateStatusDiv: likes.updateStatusDiv,
        end_cursor: null,
        vueStatus: likes,
        userName: likes.userToGetLikes,
        userId: likes.viewerUserName === likes.userToGetLikes ? likes.viewerUserId : ''
      });


    instaPosts.resolveUserName().then(() => {

      data = new Map();

      likes.fetched = 0;
      likes.startDate = (new Date()).toLocaleTimeString();
      likes.stop = false;
      likes.log = '';
      likes.allPostsFetched = false;

      likes.isInProgress = true;

      likes.updateStatusDiv(`The interval between liking requests is ${likes.delay}ms`);

      getPosts(instaPosts, true);

    }, () => {
      alert('Specified user was not found');
      instaPosts = null;
    });
  };

  function getPosts(instaPosts, restart) {
    instaPosts.getPosts(restart).then(media => {

      likes.fetched += media.length;
      getLikes(instaPosts, media, 0);

    }).catch(e => {
      likes.updateStatusDiv(e.toString());
    });
  }

  function getLikes(instaPosts, media, index) {
    console.log('index at get likes - ' + index);
    console.log('media.length at get likes - ' + media.length);
    if (likes.isCompleted) {

      likes.updateStatusDiv(`Started at ${likes.startDate}`);
      likes.updateStatusDiv(`Fetched ${likes.fetched} posts`);

      likes.isInProgress = false;

      console.log('completed');
      console.log(data);
      return;
    }
    var i = media.length;
    if (i > index) { //we still have something to get
      console.log(media[index]);
      var obj = media[index];
      var id = obj.node.id;
      var url = obj.node.display_url;
      var likesCount = obj.node.edge_media_preview_like.count;
      var shortcode = obj.node.shortcode;
      likes.updateStatusDiv(`Post ${url} has ${likesCount} likes`);

      var instaLike = new GetLikes({
        shortCode: shortcode,
        end_cursor: '',
        updateStatusDiv: likes.updateStatusDiv,
        pageSize: 20, //todo
        vueStatus: likes
      });

      getPostLikes(instaLike, instaPosts, media, index);
      // instaLike = null;


    } else if (instaPosts.hasMore()) { //do we still have something to fetch
      likes.updateStatusDiv(`The more posts will be fetched now...${new Date()}`);
      setTimeout(() => getPosts(instaPosts, false), likes.delay);
    } else { // nothing more found in profile >> to restart
      likes.allPostsFetched = true;
      setTimeout(() => getLikes(instaPosts, media, ++index), 0);
    }
  }

  function getPostLikes(instaLike, instaPosts, media, index) {

    instaLike.getLikes().then(result => {
      console.log('get likes resolved');
      console.log(result);
      var len = result.length;
      for (var i = 0; i < result.length; i++) {
        var userId = result[i].node.id;
        var userName = result[i].node.username;
        if (data.has(userId)) {
          var obj = data.get(userId);
          obj.count++;
          data.set(userId, obj)
        } else {
          data.set(userId, { username: userName, count: 1 })
        }
      }
      console.log('there are more likes' + instaLike.hasMore());
      if (instaLike.hasMore()) {
        console.log('has more...')
        setTimeout(() => getPostLikes(instaLike, instaPosts, media, index), likes.delay);

      } else {
        console.log('nothing more, go to next post')
        instaLike = null;
        //return to getLikes
        setTimeout(() => getLikes(instaPosts, media, ++index), likes.delay);
      }
    });


  }

  chrome.runtime.onMessage.addListener(function (request) {
    if (request.action === 'openLikesPage') {
      console.log(request);

      //likes.csrfToken = request.csrfToken;
      likes.delay = request.likeDelay;

      likes.viewerUserName = request.viewerUserName;
      likes.viewerUserId = request.viewerUserId;

      likes.userToGetLikes = request.userName === instaDefOptions.you ? request.viewerUserName : request.userName;

    }
  });

  _gaq.push(['_trackPageview']);

};

