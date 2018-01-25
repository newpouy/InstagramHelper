/* globals confirm, chrome, _gaq, alert */
/* globals instaLike, GetPosts, liker, instaDefOptions   */
/* jshint -W106 */

window.onload = function () {

  'use strict';

  document.getElementById('start').onclick = function () {

    var message = {
      'alreadyLiked': 'It will be stopped when already liked post is met',
      'amountPosts': `It will be stopped when ${liker.amountToLike} posts will be liked.`
    };

    var instaPosts =
      new GetPosts({
        pageSize: liker.pageSize,
        mode: liker.whatToLike,
        updateStatusDiv: liker.updateStatusDiv,
        end_cursor: null,
        vueStatus: liker,
        userName: liker.userToLike,
        userId: liker.viewerUserName === liker.userToLike ? liker.viewerUserId : ''
      });


    instaPosts.resolveUserName().then(() => {

      liker.liked = 0;
      liker.alreadyLiked = 0;
      liker.restarted = 0;
      liker.fetched = 0;
      liker.startDate = (new Date()).toLocaleTimeString();
      liker.stop = false;
      liker.log = '';
      liker.allPostsFetched = false;

      liker.isInProgress = true;

      liker.updateStatusDiv(`The interval between liking requests is ${liker.delay}ms`);
      liker.updateStatusDiv(message[liker.stopCriterion]);
      liker.updateStatusDiv('You can change the stop criteria during running the process');

      getPosts(instaPosts, true);

    }, () => {
      alert('Specified user was not found');
      instaPosts = null;
    });
  };

  function getPosts(instaPosts, restart) {
    instaPosts.getPosts(restart).then(media => {

      liker.fetched += media.length;
      likeMedia(instaPosts, media, 0);

    }).catch(e => {
      liker.updateStatusDiv(e.toString());
    });
  }

  function likeMedia(instaPosts, media, index) {
    if (liker.isCompleted) {

      liker.updateStatusDiv(`Started at ${liker.startDate}`);
      liker.updateStatusDiv(`Liked ${liker.liked} posts`);
      liker.updateStatusDiv(`Found already liked ${liker.alreadyLiked} posts`);
      liker.updateStatusDiv(`Fetched ${liker.fetched} posts`);
      liker.updateStatusDiv(`Fetching feed restarted ${liker.restarted} times`);

      liker.isInProgress = false;
      return;
    }
    var i = media.length;
    if (i > index) { //we still have something to like
      var obj = media[index];
      var id = obj.node.id;
      var url = obj.node.display_url;
      var taken = new Date(obj.node.taken_at_timestamp * 1000).toLocaleString();
      var userName = 'likeProfile' === liker.whatToLike ? liker.userToLike : obj.node.owner.username;
      var likesCount = obj.node.edge_media_preview_like.count;
      liker.updateStatusDiv(`Post ${url} taken on ${taken} by ${userName} has ${likesCount} likes`);
      instaPosts.isNotLiked(obj).then(result => {
        if (result) { //not yet liked
          instaLike.like({ mediaId: id, csrfToken: liker.csrfToken, updateStatusDiv: liker.updateStatusDiv, vueStatus: liker }).then(function (result) {
            if (result) { //liked
              liker.updateStatusDiv(`...liked post ${++liker.liked} on ${new Date().toLocaleString()}`);
            } else { //missing media error
              //TODO: indicate at the end of processing how many "missing media" errors
              liker.updateStatusDiv('...missing media, proceeding to the next post!');
            }
            setTimeout(() => likeMedia(instaPosts, media, ++index), liker.delay);
          });
        } else {
          liker.updateStatusDiv('...and it is already liked by you!');
          liker.alreadyLiked += 1;
          setTimeout(() => likeMedia(instaPosts, media, ++index), 0);
        }
      });
    } else if (instaPosts.hasMore()) { //do we still have something to fetch
      liker.updateStatusDiv(`The more posts will be fetched now...${new Date()}`);
      setTimeout(() => getPosts(instaPosts, false), liker.delay);
    } else if ('likeFeed' === liker.whatToLike) { // nothing more in feed > restart
      liker.updateStatusDiv(`IG has returned no more posts, restart ...${new Date()}`);
      liker.restarted++;
      setTimeout(() => getPosts(instaPosts, true), liker.delay);
    } else { // nothing more found in profile >> no restart
      liker.allPostsFetched = true;
      setTimeout(() => likeMedia(instaPosts, media, ++index), 0);
    }
  }

  chrome.runtime.onMessage.addListener(function (request) {
    if (request.action === 'openLikerPage') {

      liker.csrfToken = request.csrfToken;
      liker.delay = request.likeDelay;

      liker.viewerUserName = request.viewerUserName;
      liker.viewerUserId = request.viewerUserId;

      liker.pageSize = request.pageSizeForFeed; //is not binded

      liker.userToLike = request.userName === instaDefOptions.you ? request.viewerUserName : request.userName;

    }
  });

  _gaq.push(['_trackPageview']);
};
