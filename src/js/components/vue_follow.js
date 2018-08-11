/* globals Vue, chrome, _gaq, followUser, instaUserInfo */

var follow = new Vue({ // eslint-disable-line no-unused-vars
  el: '#app',
  created() {
    this.viewerUserId = '';
    this.viewerUserName = '';

    this.startDate = null; //timestamp when process was started
  },
  mounted: () => {
    _gaq.push(['_trackPageview']);

    chrome.runtime.onMessage.addListener(function (request) {
      if (request.action === 'openMassFollowPage') {

        follow.delay = request.followDelay;
        follow.csrfToken = request.csrfToken;

        follow.viewerUserName = request.viewerUserName;
        follow.viewerUserId = request.viewerUserId;

        follow.pageSize = request.pageSizeForFeed; //is not binded
      }
    });
  },
  data: {
    isInProgress: false,

    delay: 0, //interval between sending the http requests
    rndDelay: 30,

    stop: false, //if user requested the proceess to be stopped by clicking the button

    status: '', //the message displayed in status div
    statusColor: '',

    log: '', //the text displayed in log area
    ids: ''
  },
  computed: {
    startButtonDisabled: function () {
      return this.isInProgress
    },
    binding() {
      const binding = {};

      if (this.$vuetify.breakpoint.mdAndUp) {
        binding.column = true;
      }

      return binding;
    }
  },
  methods: {
    calcDelay: function() {
      var val = + Math.floor(Math.random() * this.delay * this.rndDelay/100) + + this.delay;
      this.updateStatusDiv(`Calculated delay ${val}`);
      return val;
    },
    checkDelay: function () {
      if (!this.delay || (this.delay < 10000)) {
        this.$nextTick(() => {
          this.delay = 10000;
        })
      }
    },
    checkRndDelay: function () {
      if (!this.rndDelay || (this.rndDelay < 0)) {
        this.$nextTick(() => {
          this.rndDelay = 0;
        })
      }
    },
    timeout: function (ms) {
      return new Promise(res => setTimeout(res, ms))
    },
    updateStatusDiv: function (message, color) {
      this.log += message + '\n';
      this.status = message;
      this.statusColor = color || 'black';
      setTimeout(function () {
        var textarea = document.getElementById('log_text_area');
        textarea.scrollTop = textarea.scrollHeight;
      }, 0);
    },
    unFollowButtonClick: async function () {
      follow.isInProgress = true;

      var value = document.getElementById('ids').value;
      follow.processUsers = value.replace(/[\n\r]/g, ',').split(',');
      follow.unFollowedUsers = 0;
      follow.errorsResolvingUserId = 0;

      for (var i = 0; i < follow.processUsers.length; i++) {
        if (follow.processUsers[i] != '') {
          follow.updateStatusDiv(`Mass unfollowing users: ${follow.processUsers[i]}/${i + 1} of ${follow.processUsers.length}`);

          let userId = await this.getUserId(follow.processUsers[i]);
          if ("" === userId) {
            console.log('continue to next iteration');
            continue;
          }

          var result = await followUser.unFollow(
            {
              username: follow.processUsers[i],
              userId: userId,
              csrfToken: follow.csrfToken,
              updateStatusDiv: follow.updateStatusDiv,
              vueStatus: follow
            });

          if ('ok' === result) {
            follow.unFollowedUsers++;
          } else {
            console.log('Not recognized result - ' + result); // eslint-disable-line no-console
          }

          await this.timeout(follow.calcDelay());
        }
      }

      follow.isInProgress = false;

      follow.updateStatusDiv(
        `Completed!
          UnFollowed: ${follow.unFollowedUsers}
          Errors resolving username: ${this.errorsResolvingUserId}`);
    },
    followButtonClick: async function () {

      follow.isInProgress = true;

      var value = document.getElementById('ids').value;
      follow.processUsers = value.replace(/[\n\r]/g, ',').split(',');
      follow.followedUsers = 0;
      follow.requestedUsers = 0;
      follow.errorsResolvingUserId = 0;

      for (var i = 0; i < follow.processUsers.length; i++) {
        if (follow.processUsers[i] != '') {
          follow.updateStatusDiv(`Mass following users: ${follow.processUsers[i]}/${i + 1} of ${follow.processUsers.length}`);

          let userId = await this.getUserId(follow.processUsers[i]);
          if ("" === userId) {
            console.log('continue to next iteration');
            continue;
          }

          var result = await followUser.follow(
            {
              username: follow.processUsers[i],
              userId: userId,
              csrfToken: follow.csrfToken,
              updateStatusDiv: follow.updateStatusDiv,
              vueStatus: follow
            });

          if ('following' === result) {
            follow.followedUsers++;
          } else if ('requested' === result) {
            follow.requestedUsers++;
          } else {
            console.log('Not recognized result - ' + result); // eslint-disable-line no-console
          }

          await this.timeout(follow.calcDelay());
        }
      }

      follow.isInProgress = false;

      follow.updateStatusDiv(
        `Completed!
          Followed: ${follow.followedUsers}
          Requested: ${follow.requestedUsers}
          Errors resolving username: ${this.errorsResolvingUserId}`);
    },
    getUserId: async function(userId) {

      var ret_value = "";

      if (!/^\d+$/.test(userId)) {
        this.updateStatusDiv(`${userId} does not look as user id, maybe username, try to convert username to userid`);
        console.log('resolving username to userid', userId);

        try {
          var obj = await instaUserInfo.getUserProfile({
            username: userId, updateStatusDiv: this.updateStatusDiv, silient: true, vueStatus: this
          });
        } catch (e) {
          this.updateStatusDiv(`${userId} error 404 resolving the username`);
          console.log('error resolving username to userid', userId);
          this.errorsResolvingUserId++;
          return ret_value;
        }
        console.log(obj);
        ret_value = obj.id;
        this.updateStatusDiv(`username resolved to ${ret_value}`);
        console.log('resolved username to userid', ret_value);
      } else {
        ret_value = userId;
      }
      return ret_value;
    }
  }
});
