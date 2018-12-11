/* globals Vue, , _gaq, chrome, instaUserInfo, blockUser */

const block = new Vue({ // eslint-disable-line no-unused-vars
  el: '#app',
  created() {
    this.viewerUserId = '';
    this.viewerUserName = '';

    this.startDate = null; // timestamp when process was started
  },
  mounted: () => {
    _gaq.push(['_trackPageview']);

    chrome.runtime.onMessage.addListener((request) => {
      if (request.action === 'openMassBlockPage') {
        block.delay = request.followDelay; // FIXME
        if (block.delay < 10000) { // FIXME
          block.delay = 10000;
        }

        block.viewerUserName = request.viewerUserName;
        block.viewerUserId = request.viewerUserId;

        block.csrfToken = request.csrfToken;
      }
    });
  },
  data: {
    isInProgress: false,

    delay: 0, // interval between sending the http requests
    rndDelay: 30,

    stop: false, // if user requested the proceess to be stopped by clicking the button

    status: '', // the message displayed in status div
    statusColor: '',

    log: '', // the text displayed in log area
    ids: '',

  },
  computed: {
    startButtonDisabled() {
      return this.isInProgress;
    },
    binding() {
      const binding = {};

      if (this.$vuetify.breakpoint.mdAndUp) {
        binding.column = true;
      }

      return binding;
    },
  },
  methods: {
    calcDelay() {
      const val = +Math.floor(Math.random() * this.delay * this.rndDelay / 100) + +this.delay;
      this.updateStatusDiv(`Calculated delay ${val}`);
      return val;
    },
    checkDelay() {
      if (!this.delay || (this.delay < 10000)) {
        this.$nextTick(() => {
          this.delay = 10000;
        });
      }
    },
    checkRndDelay() {
      if (!this.rndDelay || (this.rndDelay < 0)) {
        this.$nextTick(() => {
          this.rndDelay = 0;
        });
      }
    },
    timeout(ms) {
      return new Promise(res => setTimeout(res, ms));
    },
    updateStatusDiv(message, color) {
      this.log += `${message}\n`;
      this.status = message;
      this.statusColor = color || 'black';
      setTimeout(() => {
        const textarea = document.getElementById('log_text_area');
        textarea.scrollTop = textarea.scrollHeight;
      }, 0);
    },
    async blockButtonClick(mode) {
      console.log('block button click', mode);
      this.isInProgress = true;

      const value = document.getElementById('ids').value;
      this.processUsers = value.replace(/[\n\r]/g, ',').split(',');
      this.blockedUsers = 0;
      this.processedUsers = 0;
      this.errorsResolvingUserId = 0;

      for (let i = 0; i < this.processUsers.length; i += 1) {
        if (this.processUsers[i] != '') {
          this.updateStatusDiv(`Mass ${mode}ing users: ${this.processUsers[i]}/${i + 1} of ${this.processUsers.length}`);

          let userId = this.processUsers[i];
          this.processedUsers++;

          if (!/^\d+$/.test(userId)) {
            this.updateStatusDiv(`${userId} does not look as user id, maybe username, resolve username to userid`);
            try {
              const obj = await instaUserInfo.getUserProfile({
                username: userId, updateStatusDiv: this.updateStatusDiv, silient: true, vueStatus: this,
              });
              userId = obj.id;
            } catch (e) {
              this.updateStatusDiv(`${userId} error 404 resolving the username`);
              console.log('error resolving username to userid', userId);
              this.errorsResolvingUserId += 1;
              continue;
            }
            this.updateStatusDiv(`username resolved to ${userId}`);
            await this.timeout(this.calcDelay());
          }

          const result = await blockUser.block(
            {
              username: this.processUsers[i],
              userId,
              csrfToken: this.csrfToken,
              updateStatusDiv: this.updateStatusDiv,
              vueStatus: this,
              mode,
            },
          );
          console.log(result);
          if ('ok' === result) {
            this.blockedUsers += 1;
          } else {
            console.log(`Not recognized result - ${result}`); // eslint-disable-line no-console
          }

          await this.timeout(this.calcDelay());
        }
      }

      this.isInProgress = false;

      this.updateStatusDiv(
        `Completed mass ${mode}!
          Processed: ${this.processedUsers}
          Errors resolving username: ${this.errorsResolvingUserId}
          ${mode.charAt(0).toUpperCase() + mode.slice(1)}ed: ${this.blockedUsers}`,
      );
    },
  },
});
