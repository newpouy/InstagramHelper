/* globals Vue, chrome, _gaq, followUser */

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
    rules: {
      required: (value) => !!value || 'Required.'
    },
    isInProgress: false,

    delay: 0, //interval between sending the http requests

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
    checkDelay: function () {
      if ((!this.delay) || (this.delay < 10000)) {
        this.$nextTick(() => {
          this.delay = 10000;
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

      for (var i = 0; i < follow.processUsers.length; i++) {
        if (follow.processUsers[i] != '') {
          follow.updateStatusDiv(`Mass unfollowing users: ${follow.processUsers[i]}/${i + 1} of ${follow.processUsers.length}`);

          var result = await followUser.unFollow(
            {
              username: follow.processUsers[i],
              userId: follow.processUsers[i],
              csrfToken: follow.csrfToken,
              updateStatusDiv: follow.updateStatusDiv,
              vueStatus: follow
            });

          if ('ok' === result) {
            follow.unFollowedUsers++;
          } else {
            console.log('Not recognized result - ' + result); // eslint-disable-line no-console
          }

          await this.timeout(follow.delay);
        }
      }

      follow.isInProgress = false;

      follow.updateStatusDiv(
        `Completed!
          UnFollowed: ${follow.unFollowedUsers}`);
    },
    followButtonClick: async function () {

      follow.isInProgress = true;

      var value = document.getElementById('ids').value;
      follow.processUsers = value.replace(/[\n\r]/g, ',').split(',');
      follow.followedUsers = 0;
      follow.requestedUsers = 0;

      for (var i = 0; i < follow.processUsers.length; i++) {
        if (follow.processUsers[i] != '') {
          follow.updateStatusDiv(`Mass following users: ${follow.processUsers[i]}/${i + 1} of ${follow.processUsers.length}`);

          var result = await followUser.follow(
            {
              username: follow.processUsers[i],
              userId: follow.processUsers[i],
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

          await this.timeout(follow.delay);
        }
      }

      follow.isInProgress = false;

      follow.updateStatusDiv(
        `Completed!
          Followed: ${follow.followedUsers}
          Requested: ${follow.requestedUsers}`);
    }
  }
});
