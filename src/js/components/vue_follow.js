/* globals Vue, chrome, _gaq, followUser, instaUserInfo */

const follow = new Vue({
  el: '#app',
  created() {
    this.viewerUserId = '';
    this.viewerUserName = '';

    this.startDate = null; // timestamp when process was started
  },
  mounted: () => {
    _gaq.push(['_trackPageview']);

    chrome.runtime.onMessage.addListener((request) => {
      if (request.action === 'openMassFollowPage') {
        follow.delay = request.followDelay;
        follow.csrfToken = request.csrfToken;

        follow.viewerUserName = request.viewerUserName;
        follow.viewerUserId = request.viewerUserId;

        follow.pageSize = request.pageSizeForFeed; // is not binded
      }
    });
  },
  data: {
    p2 : true,
    isInProgress: false,

    delay: 0, // interval between sending the http requests
    rndDelay: 30,

    stop: false, // if user requested the proceess to be stopped by clicking the button

    status: '', // the message displayed in status div
    statusColor: '',

    log: '', // the text displayed in log area

    followedUsers: 0,
    requestedUsers: 0,
    unFollowedUsers: 0,
    processUsersLength: 0,

    hoursPerPeriod: 1,
    actionsPerPeriod: 50,
    donePerPeriod: 0,
    periodStarted: null,
  },
  computed: {
    endOfCurrentPeriod() {
      if (!this.periodStarted) {
        return '';
      }
      return this.periodStarted + this.hoursPerPeriod * 60 * 60 * 1000;
    },
    stillInQueue() {
      return this.processUsersLength - this.requestedUsers - this.followedUsers - this.unFollowedUsers;
    },
    startButtonDisabled() {
      return this.isInProgress;
    },
    isPaused() {
      if (!this.p2) {
        return false;
      }
      if (this.actionsPerPeriod <= this.donePerPeriod) {
        this.updateStatusDiv(
          `${new Date().toLocaleString()}/The process will be paused because the actions limit per period is reached: ${this.actionsPerPeriod}/${this.donePerPeriod}`,
        );
        this.donePerPeriod = 0;
        return true;
      }
      if (Date.now() - this.periodStarted > this.hoursPerPeriod * 60 * 60 * 1000) {
        this.updateStatusDiv(
          `${new Date().toLocaleString()}/WE ARE GOING TO START A NEW PERIOD EVEN IF AMOUNT OF LIKES IS NOT REACHED: ${this.actionsPerPeriod}/${this.donePerPeriod}`,
        );
        this.periodStarted = Date.now();
        this.donePerPeriod = 0;
      }
      return false;
    },
  },
  methods: {
    calcDelay(isPeriodPaused) {
      if (isPeriodPaused) { // pause between periods
        this.updateStatusDiv(`${new Date().toLocaleString()}: Calculating the time to start a new period.`);
        // const endOfCurrentPeriod = this.periodStarted + this.hoursPerPeriod * 60 * 60 * 1000;
        const ret = this.endOfCurrentPeriod - Date.now();
        this.updateStatusDiv(`${new Date().toLocaleString()}: End of this period should be on
          ${new Date(this.endOfCurrentPeriod).toLocaleString()}/${ret}, so we start a new period on that time.`);
        return ret;
      } else {
        const val = +Math.floor(Math.random() * this.delay * this.rndDelay / 100) + +this.delay;
        this.updateStatusDiv(`Calculated delay ${val}ms`);
        return val;
      }
    },
    checkDurationPeriod () {
      if (!this.hoursPerPeriod || (this.hoursPerPeriod < 1)) {
        this.$nextTick(() => this.hoursPerPeriod = 1);
      }
      if (this.hoursPerPeriod > 24) {
        this.$nextTick(() => this.hoursPerPeriod = 24);
      }
    },
    checkActionsPerPeriod () {
      if (!this.actionsPerPeriod || (this.actionsPerPeriod < 1)) {
        this.$nextTick(() => this.actionsPerPeriod = 1);
      }
      if (this.actionsPerPeriod > 1000) {
        this.$nextTick(() => this.actionsPerPeriod = 1000);
      }
    },
    checkDelay() {
      if (!this.delay || (this.delay < 10000)) {
        this.$nextTick(() => this.delay = 10000);
      }
    },
    checkRndDelay() {
      if (!this.rndDelay || (this.rndDelay < 0)) {
        this.$nextTick(() => this.rndDelay = 0);
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
    prepareInput() {
      const { value } = document.getElementById('ids');
      const ret = value.replace(/[\n\r]/g, ',').split(',').map(el => el.trim()).filter(el => el !== '');
      this.processUsersLength = ret.length;
      return ret;
    },
    async unFollowButtonClick() {
      follow.isInProgress = true;

      follow.processUsers = this.prepareInput();
      follow.unFollowedUsers = 0;
      follow.errorsResolvingUserId = 0;
      this.periodStarted = Date.now();
      this.donePerPeriod = 0;

      for (let i = 0; i < follow.processUsers.length; i += 1) {
        follow.updateStatusDiv(`Mass unfollowing users: ${follow.processUsers[i]}/${i + 1} of ${follow.processUsers.length}`);

        const userId = await this.getUserId(follow.processUsers[i]);
        if ('' === userId) {
          console.log('userId is empty, continue to next iteration');
          continue;
        }

        const result = await followUser.unFollow({
          username: follow.processUsers[i],
          userId,
          csrfToken: follow.csrfToken,
          updateStatusDiv: follow.updateStatusDiv,
          vueStatus: follow,
        });

        if ('ok' === result) {
          follow.unFollowedUsers += 1;
        } else {
          console.log(`Not recognized result - ${result}`); // eslint-disable-line no-console
        }
        this.donePerPeriod += 1;

        if (i < follow.processUsers.length - 1) { // to avoid delay after last
          if (this.isPaused) {
            await this.timeout(follow.calcDelay(true));
            this.periodStarted = Date.now();
            follow.updateStatusDiv(`${new Date().toLocaleString()} Starting a new period`);
          } else {
            await this.timeout(follow.calcDelay());
          }
        }
      }
      follow.isInProgress = false;
      follow.updateStatusDiv(
        `Completed!
          UnFollowed: ${follow.unFollowedUsers}
          Errors resolving username: ${this.errorsResolvingUserId}`,
      );
    },
    async followButtonClick() {
      follow.isInProgress = true;

      follow.processUsers = this.prepareInput();
      follow.followedUsers = 0;
      follow.requestedUsers = 0;
      follow.errorsResolvingUserId = 0;
      this.periodStarted = Date.now();
      this.donePerPeriod = 0;

      for (let i = 0; i < follow.processUsers.length; i += 1) {
        follow.updateStatusDiv(`Mass following users: ${follow.processUsers[i]}/${i + 1} of ${follow.processUsers.length}`);

        const userId = await this.getUserId(follow.processUsers[i]);
        if ('' === userId) {
          console.log('userId is empty, continue to next iteration');
          continue;
        }

        const result = await followUser.follow({
          username: follow.processUsers[i],
          userId,
          csrfToken: follow.csrfToken,
          updateStatusDiv: follow.updateStatusDiv,
          vueStatus: follow,
        });

        if ('following' === result) {
          follow.followedUsers += 1;
        } else if ('requested' === result) {
          follow.requestedUsers += 1;
        } else {
          console.log(`Not recognized result - ${result}`); // eslint-disable-line no-console
        }
        this.donePerPeriod += 1;

        if (i < follow.processUsers.length - 1) { // to avoid delay after last
          if (this.isPaused) {
            await this.timeout(follow.calcDelay(true));
            this.periodStarted = Date.now();
            follow.updateStatusDiv(`${new Date().toLocaleString()} Starting a new period`);

          } else {
            await this.timeout(follow.calcDelay());
          }
        }
      }
      follow.isInProgress = false;
      follow.updateStatusDiv(
        `Completed!
          Followed: ${follow.followedUsers}
          Requested: ${follow.requestedUsers}
          Errors resolving username: ${this.errorsResolvingUserId}`,
      );
    },
    async getUserId(userId) {
      let ret_value = '';

      if (!/^\d+$/.test(userId)) {
        this.updateStatusDiv(`${userId} does not look as user id, maybe username, try to convert username to userid`);
        console.log('resolving username to userid', userId);
        let obj;
        try {
          obj = await instaUserInfo.getUserProfile({
            username: userId, updateStatusDiv: this.updateStatusDiv, silent: true, vueStatus: this,
          });
        } catch (e) {
          this.updateStatusDiv(`${userId} error 404 resolving the username`);
          console.log('error resolving username to userid', userId);
          this.errorsResolvingUserId += 1;
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
    },
  },
});
