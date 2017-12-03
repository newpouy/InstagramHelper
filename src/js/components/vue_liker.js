/* globals Vue */

var liker = new Vue({ // eslint-disable-line no-unused-vars
  el: '#app',
  data: {
    isInProgress: false, //indicate if liking is in progress

    csrfToken: '',

    amountToLike: 100, //how many should be liked
    stopCriterion: 'amountPosts', //stop criterion assigned to radio button
    delay: 0, //interval between sending the http requests
    liked: 0, //how many liked during execution
    alreadyLiked: 0, //how many found already liked
    restarted: 0, //how many times the getting feed was restarted
    fetched: 0, //how may posts were fetched

    startDate: null, //timestamp when process was started

    stop: false, //if user requested the proceess to be stopped by clicking the button

    log: '', //the text displayed in text are
    status: '', //the message displayed in status div
    statusColor: '',

    whatToLike: 'likeFeed', //radiobutton - like your feed or posts of another user (likeFeed or likeUser)
    userToLike: ''
  },
  computed: {
    isCompleted: function () {
      if (this.stop) {
        this.updateStatusDiv(`${new Date()}/The process will be stopped now because you clicked the Stop button`);
        return true;
      } else if ((this.stopCriterion === 'alreadyLiked') && (this.alreadyLiked > 0)) {
        this.updateStatusDiv(`${new Date()}/The process will be stopped because already liked posts are found - ${this.alreadyLiked}`);
        return true;
      } else if ((this.stopCriterion === 'amountPosts') && (this.amountToLike <= this.liked)) {
        this.updateStatusDiv(`${new Date()}/The process will be stopped because ${this.liked} posts were liked`);
        return true;
      }
      return false;
    },
    startButtonDisabled: function () {
      return this.isInProgress ||  //process is not running
        (('likeUser' === this.whatToLike) && ('' === this.userToLike)); //profile is specified when profile should be liked
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
    validateUserProfile: function(e) {
      //e.target.select();
    }
  }
});
