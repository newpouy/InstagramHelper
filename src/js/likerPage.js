/* globals confirm, chrome, $, _gaq */
/* globals instaLike, InstaFeed   */

$(function () {

  'use strict';

  var csrfToken;
  var delay;

  var liked;
  var foundLiked;
  var stop; //will be set to true on cancel and checked in isCompleted


  $('#cancel').on('click', function () {
    stop = true;
  });


  $('#start').on('click', function () {

    var instaFeed = new InstaFeed({ updateStatusDiv: updateStatusDiv, has_next_page: false, end_cursor: '' });

    liked = 0;
    foundLiked = 0;
    stop = false;

    document.getElementById('cancel').disabled = false;
    document.getElementById('start').disabled = true;

    updateStatusDiv(`The interval between liking requests is ${delay}ms`);
    if (document.getElementById('AlreadyLiked').checked) {
      updateStatusDiv('It will be stopped when already liked post is met');
    }
    if (document.getElementById('AmountPosts').checked) {
      updateStatusDiv(`It will be stopped when ${document.getElementById('amount').value} posts will be liked.`);
    }
    updateStatusDiv('You can change the stop criteria during running the process');

    getFeed(instaFeed);

  });

  function getFeed(instaFeed) {
    instaFeed.getFeed().then(media => {

      updateStatusDiv(`${media.length} posts are fetched ${new Date()}`);
      likeMedia(instaFeed, media, 0);

    }).catch(e => {
      updateStatusDiv('The catch of getFeed');
      updateStatusDiv(e);
    });
  }

  function isCompleted() {
    if (stop) {
      updateStatusDiv('The process will be stopped now because you clicked the Stop button');
      return false;
    }
    if ((document.getElementById('AlreadyLiked').checked) && (foundLiked > 0)) {
      updateStatusDiv('The process will be stopped because already liked posts are found - ' + foundLiked);
      return false;
    }
    if (document.getElementById('AmountPosts').checked) {
      if (document.getElementById('amount').value <= liked) {
        updateStatusDiv(`The process will be stopped because ${liked} posts were liked`);
        return false;
      }
    }
    return true;
  }

  function likeMedia(instaFeed, media, index) {
    if (!isCompleted()) {
      return;
    }
    var i = media.length;
    if (i > index) { //we still have something to like
      var obj = media[index];
      var id = obj.node.id;
      var url = obj.node.display_url;
      var userName = obj.node.owner.username;
      var likes = obj.node.edge_media_preview_like.count;
      updateStatusDiv(`Post ${url} from ${userName} has ${likes} likes`);
      var isLiked = obj.node.viewer_has_liked;
      if (!isLiked) { //not yet liked
        instaLike.like({ mediaId: id, csrfToken: csrfToken, updateStatusDiv: updateStatusDiv }).then(function () {
          console.log('liked post', ++liked, new Date());
          updateStatusDiv(`...liked post ${liked} on ${new Date()}`);
          setTimeout(() => likeMedia(instaFeed, media, ++index), delay);
        });
      } else {
        updateStatusDiv('...and it is already liked by you!');
        foundLiked += 1;
        likeMedia(instaFeed, media, ++index);
      }
    } else if (instaFeed.hasMore()) { //do we still have something to fetch
      updateStatusDiv(`The more posts will be fetched now...${new Date()}`);
      setTimeout(() => getFeed(instaFeed), delay);
    } else {
      updateStatusDiv(`IG has returned that no more posts, restart ...${new Date()}`);
      //todo: nullify
      instaFeed = new InstaFeed({updateStatusDiv: updateStatusDiv, has_next_page: false, end_cursor: '' });
      setTimeout(() => getFeed(instaFeed), delay);
    }
  }

  chrome.runtime.onMessage.addListener(function (request) {
    if (request.action === 'open_liker') {
      console.log(request);
      csrfToken = request.csrfToken;
      delay = request.likeDelay;
    }
  });

  var addToTextArea = function (message) {
    var textarea = document.getElementById('log_text_area');
    textarea.value += message + '\n';
    textarea.scrollTop = textarea.scrollHeight;
  };

  var updateStatusDiv = function (message, color) {

    addToTextArea(message);

    var el = document.getElementById('status');
    el.textContent = message;
    el.style.color = color || 'black';
  };


});

window.onload = function () {
  _gaq.push(['_trackPageview']);
};
