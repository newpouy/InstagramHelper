/* globals Vue */

var liker = new Vue({ // eslint-disable-line no-unused-vars
  el: '#app',
  created() {
    this.viewerUserId = '';
    this.viewerUserName = '';
    this.csrfToken = '';

    this.startDate = null; //timestamp when process was started

  },
  data: {
    isInProgress: false, //indicate if liking is in progress

    amountToLike: 100, //how many should be liked
    stopCriterion: 'amountPosts', //stop criterion assigned to radio button
    delay: 0, //interval between sending the http requests
    liked: 0, //how many liked during execution
    alreadyLiked: 0, //how many found already liked

    restarted: 0, //how many times the getting feed was restarted
    fetched: 0, //how may posts were fetched

    stop: false, //if user requested the proceess to be stopped by clicking the button

    status: '', //the message displayed in status div
    statusColor: '',

    log: '', //the text displayed in text are

    whatToLike: 'likeFeed', //radiobutton - like your feed or posts of another user (likeFeed or likeProfile)
    userToLike: '',
    allPostsFetched: false // when all posts from user's profile are fetched

  },
  computed: {
    isCompleted: function () {
      if (this.stop) {
        this.updateStatusDiv(`${new Date().toLocaleString()}/The process is stopped now because you clicked the Stop button`);
        return true;
      } else if ((this.stopCriterion === 'alreadyLiked') && (this.alreadyLiked > 0)) {
        this.updateStatusDiv(`${new Date().toLocaleString()}/The process is stopped because already liked posts are found - ${this.alreadyLiked}`);
        return true;
      } else if ((this.stopCriterion === 'amountPosts') && (this.amountToLike <= this.liked)) {
        this.updateStatusDiv(`${new Date().toLocaleString()}/The process is stopped because ${this.liked} posts were liked`);
        return true;
      } else if ((this.whatToLike === 'likeProfile') && (this.allPostsFetched)) {
        this.updateStatusDiv(`${new Date().toLocaleString()}/The process is stopped because no more posts in the user's profile`);
        return true;
      }
      return false;
    },
    startButtonDisabled: function () {
      return this.isInProgress ||  //process is not running
        (('likeProfile' === this.whatToLike) && ('' === this.userToLike)); //profile is specified when profile should be liked
    }
  },
  methods: {
    updateStatusDiv: function (message, color) {
      this.log += message + '\n';
      this.status = message;
      this.statusColor = color || 'black';
      setTimeout(function () {
        var textarea = document.getElementById('log_text_area');
        textarea.scrollTop = textarea.scrollHeight;
      }, 0);
    },
    validateUserProfile: function (e) {
      //e.target.select();
    }
  }
});
