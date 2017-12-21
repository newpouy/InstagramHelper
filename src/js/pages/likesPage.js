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

      likes.startDate = (new Date()).toLocaleTimeString();
      likes.fetched = 0;
      likes.stop = false;
      likes.log = '';
      likes.allPostsFetched = false;

      likes.isInProgress = true;

      likes.updateStatusDiv(`The interval between the requests is ${likes.delay}ms`);

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
    if (likes.isCompleted) {

      likes.updateStatusDiv(`Started at ${likes.startDate}`);
      likes.updateStatusDiv(`Fetched ${likes.fetched} posts`);

      likes.isInProgress = false;

      likes.log = JSON.stringify([...data]);

     Array.from(data.values()).forEach(e => __items.push(e)); //use for

      console.log(__items);

      return;
    }
    var i = media.length;
    if (i > index) { //we still have something to get
      var obj = media[index];
      var url = obj.node.display_url;
      var taken = new Date(obj.node.taken_at_timestamp * 1000).toLocaleString();
      var likesCount = obj.node.edge_media_preview_like.count;
      var shortcode = obj.node.shortcode;
      likes.updateStatusDiv(`Post ${url} taken on ${taken} has ${likesCount} likes`);

      var instaLike = new GetLikes({
        shortCode: shortcode,
        end_cursor: '',
        updateStatusDiv: likes.updateStatusDiv,
        pageSize: 20, //todo
        vueStatus: likes
      });

      getPostLikes(instaLike, instaPosts, media, index, obj.node.taken_at_timestamp);

    } else if (instaPosts.hasMore()) { //do we still have something to fetch
      likes.updateStatusDiv(`The more posts will be fetched now...${new Date()}`);
      setTimeout(() => getPosts(instaPosts, false), likes.delay);
    } else { // nothing more found in profile >> to restart
      likes.allPostsFetched = true;
      setTimeout(() => getLikes(instaPosts, media, ++index), 0);
    }
  }

  function getPostLikes(instaLike, instaPosts, media, index, taken) {

    instaLike.getLikes().then(result => {
      likes.updateStatusDiv(`... fetched information about ${result.length} likes`);
      for (var i = 0; i < result.length; i++) {
        var userId = result[i].node.id;
        var userName = result[i].node.username;
        var fullName = result[i].node.full_name;
        var url = result[i].node.profile_pic_url;
        if (data.has(userId)) {
          var obj = data.get(userId);
          obj.count++;
          if (taken > obj.taken) {
            obj.taken = taken;
          }
          data.set(userId, obj);
        } else {
          data.set(userId, { userName: userName, count: 1, taken: taken, fullName: fullName, url: url });
        }
      }
      if (instaLike.hasMore()) {
        setTimeout(() => getPostLikes(instaLike, instaPosts, media, index, taken), likes.delay);
      } else {
        instaLike = null;
        setTimeout(() => getLikes(instaPosts, media, ++index), likes.delay);
      }
    });


  }

  chrome.runtime.onMessage.addListener(function (request) {
    if (request.action === 'openLikesPage') {

      likes.delay = request.likeDelay;

      likes.viewerUserName = request.viewerUserName;
      likes.viewerUserId = request.viewerUserId;

      likes.userToGetLikes = request.userName === instaDefOptions.you ? request.viewerUserName : request.userName;

    }
  });

  _gaq.push(['_trackPageview']);

};

