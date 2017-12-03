/* globals confirm, chrome, _gaq */
/* globals instaLike, GetPosts, GetFeed, liker   */
/* jshint -W106 */

window.onload = function () {

  'use strict';

  document.getElementById('start').onclick = function () {

    var message = {
      'alreadyLiked' : 'It will be stopped when already liked post is met',
      'amountPosts' : `It will be stopped when ${liker.amountToLike} posts will be liked.`
    };

    //todo: if profile to be liked, validate profile and get it id
      //support <<YOU>>
      //send it in the request

    var instaPosts =
      //new GetFeed  ({ updateStatusDiv: liker.updateStatusDiv, end_cursor: null, vueStatus: liker });
      //new GetProfile({ userId: 4146553056, updateStatusDiv: liker.updateStatusDiv, end_cursor: null, pageSize: 12, vueStatus: liker });
      new GetPosts  ({ mode: liker.whatToLike, updateStatusDiv: liker.updateStatusDiv, end_cursor: null, vueStatus: liker, userName : liker.userToLike });

    liker.liked = 0;
    liker.alreadyLiked = 0;
    liker.restarted = 0;
    liker.fetched = 0;
    liker.startDate = (new Date()).toLocaleTimeString();
    liker.stop = false;
    liker.log = '';

    liker.isInProgress = true;

    liker.updateStatusDiv(`The interval between liking requests is ${liker.delay}ms`);
    liker.updateStatusDiv(message[liker.stopCriterion]);
    liker.updateStatusDiv('You can change the stop criteria during running the process');

    getPosts(instaPosts, true);
  };

  function getPosts(instaPosts, restart) {
    instaPosts.getPosts(restart).then(media => {

      liker.updateStatusDiv(`${media.length} posts are fetched ${new Date()}`);
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
      var userName = obj.node.owner.username;
      var likes = obj.node.edge_media_preview_like.count;
      liker.updateStatusDiv(`Post ${url} from ${userName} has ${likes} likes`);
      instaPosts.isNotLiked(obj).then( result => {
        if (result) { //not yet liked
          instaLike.like({ mediaId: id, csrfToken: liker.csrfToken, updateStatusDiv: liker.updateStatusDiv, vueStatus: liker }).then(function () {
            liker.updateStatusDiv(`...liked post ${++liker.liked} on ${new Date()}`);
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
      setTimeout(() => getPosts(instaPosts), liker.delay);
    } else {
      liker.updateStatusDiv(`IG has returned no more posts, restart ...${new Date()}`);
      //todo: it should be applied only to feed !!!!!!!
      //todo: make the getPosts method to nullify end_cursor
      //instaPosts = null;
      //instaPosts = new GetFeed({ updateStatusDiv: liker.updateStatusDiv, end_cursor: '', vueStatus: liker });
      liker.restarted++;
      setTimeout(() => getPosts(instaPosts, true), liker.delay);
    }
  }

  chrome.runtime.onMessage.addListener(function (request) {
    if (request.action === 'open_liker') {
      liker.csrfToken = request.csrfToken;
      liker.delay = request.likeDelay;
      liker.userToLike = request.userName;
      //todo : get the page size?
    }
  });

  _gaq.push(['_trackPageview']);
};
