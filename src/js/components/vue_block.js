/* globals Vue, , _gaq, chrome, instaUserInfo, blockUser */

var block = new Vue({ // eslint-disable-line no-unused-vars
  el: '#app',
  created() {
    this.viewerUserId = '';
    this.viewerUserName = '';

    this.startDate = null; //timestamp when process was started
  },
  mounted: () => {
    _gaq.push(['_trackPageview']);

    chrome.runtime.onMessage.addListener(function (request) {

      if (request.action === 'openMassBlockPage') {

        block.delay = request.followDelay; //FIXME
        if (block.delay < 10000) { //TEMP FIXME
          block.delay = 10000;
        }

        block.viewerUserName = request.viewerUserName;
        block.viewerUserId = request.viewerUserId;

        block.csrfToken = request.csrfToken;
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
    startButtonClick: async function () {

      console.log(this.ids);

      this.isInProgress = true;

      var value = document.getElementById('ids').value;
      this.processUsers = value.replace(/[\n\r]/g, ',').split(',');
      this.blockedUsers = 0;
      this.processedUsers = 0;
      this.errorsResolvingUserId = 0;

      for (var i = 0; i < this.processUsers.length; i++) {
        if (this.processUsers[i] != '') {
          this.updateStatusDiv(`Mass blocking users: ${this.processUsers[i]}/${i + 1} of ${this.processUsers.length}`);

          var userId = this.processUsers[i];
          this.processedUsers++;

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
              continue;
            }
            console.log(obj);
            userId = obj.id;
            console.log(obj.id);
            this.updateStatusDiv(`username resolved to ${userId}`);
            console.log('resolved username to userid', userId);
            await this.timeout(this.delay);

          }

          var result = await blockUser.block(
            {
              username: this.processUsers[i],
              userId: userId,
              csrfToken: this.csrfToken,
              updateStatusDiv: this.updateStatusDiv,
              vueStatus: this
            });
          console.log(result);
          if ('ok' === result) {
            this.blockedUsers++;
          } else {
            console.log('Not recognized result - ' + result); // eslint-disable-line no-console
          }

          await this.timeout(this.delay);
        }
      }

      this.isInProgress = false;

      this.updateStatusDiv(
        `Completed!
          Processed: ${this.processedUsers}
          Errors resolving username: ${this.errorsResolvingUserId}
          Blocked: ${this.blockedUsers}`);
    }
  }
});
