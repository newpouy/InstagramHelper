/* globals Vue, chrome, _gaq, instaDefOptions, followUser */
/* globals GetLikes, GetComments, GetPosts, exportUtils, XLSX, saveAs, FetchUsers, instaUserInfo */

const __items = [];

const myDataTable = {
  props: ['csrfToken', 'updateStatusDiv', 'calcComments'],
  template: `<v-card>
  <v-card-title>
    <h3 class="headline mb-0"> Likes </h3>
    <v-spacer></v-spacer>
    <v-text-field
      append-icon="search"
      label="Search"
      single-line
      hide-details
      v-model="search"
    ></v-text-field>
  </v-card-title>
  <v-data-table
      v-bind:headers="headers"
      v-bind:items="items"
      v-bind:search="search"
      v-bind:pagination.sync="pagination"
      v-bind:rows-per-page-items="[10,20,50,100,500,1000,{ text: 'All', value: -1 }]"
      item-key="username"
    >
    <template slot="headerCell" slot-scope="props">
      <v-tooltip bottom>
        <span slot="activator">
          {{ props.header.text}}
        </span>
        <span>
          {{ props.header.tooltip }}
        </span>
      </v-tooltip>
    </template>
    <template slot="items" slot-scope="props">
      <tr @click="props.expanded = !props.expanded">
      <td class="text-xs-center">{{ props.index + 1 }}</td>
      <td class="text-xs-right">
        <a v-bind:href="'https://www.instagram.com/'+[props.item.username][0]" target="_blank">
          <img v-bind:src="[props.item.profile_pic_url][0]"></img>
        </a>
      </td>
      <td class="text-xs-right">{{ props.item.username }}</td>
      <td class="text-xs-right">{{ props.item.count }}</td>
      <td class="text-xs-right">{{ props.item.firstLike }}</td>
      <td class="text-xs-right">
        <v-btn small v-if="props.item.count == 0 && props.item.followed_by_viewer"
          v-on:click.stop="unfollowButtonClick(props.item)" color="primary">
          Unfollow
        </v-btn>
        <span v-else>
          {{ props.item.lastLike }}
        </span>
      </td>
      <td class="hidden-sm-and-down hidden-sm-and-up">
        {{ props.item.full_name }}
      </td>
      <td class="text-xs-right">{{ props.item.comments }}</td>
      </tr>
    </template>
    <template slot="expand" slot-scope="props">
      <v-card>
        <v-card-title>
          <h2 class="headline mb-0">
            {{ props.item.full_name }}
          </h2>
        </v-card-title>
      </v-card>
    <div v-if="props.item.posts.length > 0" style="padding: 15px;">
      <h3 class="headline mb-0">Liked posts - {{ props.item.count }} posts</h3>
      <v-layout row wrap child-flex>
        <v-flex v-for="post in props.item.posts" :key="post.id" xs12 sm3>
            <v-card :href="post.url" target="_blank">
              <v-card-media :src="post.pic" height="200px" contain>
              </v-card-media>
            </v-card>
        </v-flex>
      </v-layout>
    </div>
    <div v-if="props.item.commentedPosts.length > 0" style="padding: 15px;">
      <h3 class="headline mb-0">Commented posts - {{ props.item.comments }} comments / {{ props.item.commentedPosts.length }} posts</h3>
      <v-layout row wrap child-flex>
        <v-flex v-for="post in props.item.commentedPosts" :key="post.id" xs12 sm3>
            <v-card :href="post.url" target="_blank">
              <v-card-media :src="post.pic" height="200px" contain>
              </v-card-media>
            </v-card>
        </v-flex>
      </v-layout>
    </div>
    </template>
  </v-data-table>
</v-card>`,
  data() {
    return {
      search: '',
      pagination: { sortBy: 'count', rowsPerPage: 50, descending: true },
      headers: [
        {
          text: '#', value: '', sortable: false, tooltip: '#',
        },
        {
          text: 'Image', value: '', sortable: false, tooltip: 'Click the image to open the user profile on Instagram.com',
        },
        { text: 'Username', value: 'username', tooltip: 'User name' },
        { text: 'Likes', value: 'count', tooltip: 'The total amount of likes' },
        { text: 'First', value: 'firstLike', tooltip: 'The date of first liked post' },
        { text: 'Last', value: 'lastLike', tooltip: 'The date of last liked post' },
        {
          text: 'Full Name',
          value: 'full_name',
          class: 'hidden-sm-and-down hidden-sm-and-up',
        },
        { text: 'Comments', value: 'comments', tooltip: 'The total amount of comments' },
      ],
      items: __items,
    };
  },
  methods: {
    unfollowButtonClick(item) {
      followUser.unFollow(
        {
          username: item.username,
          userId: item.id,
          csrfToken: this.csrfToken,
          updateStatusDiv: this.updateStatusDiv,
          vueStatus: likes,
        },
      ).then(() => {
        Vue.set(item, 'followed_by_viewer', false);
      });
    },
  },
  mounted() {
    // console.log('v-data-table mounted');
    if (!this.calcComments) { // remove comments
      this.headers.pop();
    }
  },
};

var likes = new Vue({ // eslint-disable-line no-unused-vars
  el: '#app',
  created() {
    this.viewerUserId = '';
    this.viewerUserName = '';

    this.startDate = null; // timestamp when process was started
  },
  mounted: () => {
    // console.log('likes mounted...'); // eslint-disable-line no-console
    _gaq.push(['_trackPageview']);

    chrome.runtime.onMessage.addListener((request) => {
      if (request.action === 'openLikesPage') {
        likes.delay = request.likeDelay;

        likes.viewerUserName = request.viewerUserName;
        likes.viewerUserId = request.viewerUserId;

        likes.pageSize = request.pageSizeForFeed; // is not binded

        likes.userToGetLikes = request.userName === instaDefOptions.you ? request.viewerUserName : request.userName;

        // to support the adding followeres
        likes.fetchDelay = request.delay;
        likes.csrfToken = request.csrfToken;
        likes.fetchPageSize = request.pageSize;
      }
    });
  },
  data: {
    rules: {
      required: value => !!value || 'Required.',
    },
    isGettingLikesInProgress: false,
    isAddingFollowersInProgress: false,
    followersAdded: false,

    delay: 0, // interval between sending the http requests
    rndDelay: 0,

    fetchedPosts: 0, // how may posts were fetched
    processedPosts: 0, // for how much posts the likes were already analyzed
    totalPosts: 0, // total posts on the user profile

    stop: false, // if user requested the proceess to be stopped by clicking the button

    status: '', // the message displayed in status div
    statusColor: '',

    log: '', // the text displayed in text are

    userToGetLikes: '',

    processedLikes: 0,
    processedComments: 0,

    postEntity: 'zzz',
    postProcessedEntity: 0,
    postTotalEntity: 0,

    commentedPosts: [],
    mostLikedPost: {},
    lessLikedPost: {},

    progressValue: 0, // progress bar

    calcComments: true, // when getting likes

    init: true,

    outType: 'csv',
    itemsLength: 0
  },
  computed: {
    isCompleted() {
      if (this.stop) {
        this.updateStatusDiv(`${new Date().toLocaleString()}/The process will be stopped now because you clicked the Stop button`);
        return true;
      }
      return false;
    },
    startButtonDisabled() {
      return this.isGettingLikesInProgress // process is running
        || '' === this.userToGetLikes; // profile is specified
    },
    addFollowersButtonDisabled() {
      return this.isRunning // process is running
        || __items.length === 0 // no items to export
        || this.followersAdded; // already added
    },
    exportButtonDisabled() {
      return this.isGettingLikesInProgress // process is running
        || __items.length === 0; // no items to export
    },
    isRunning() {
      return this.isGettingLikesInProgress
        || this.isAddingFollowersInProgress;
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
      this.updateStatusDiv(`Calculated delay ${val}ms`);
      return val;
    },
    checkDelay() {
      if (!this.delay || (this.delay < 100)) {
        this.$nextTick(() => {
          this.delay = 100;
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
    updateStatusDiv(message, color) {
      this.log += `${message}\n`;
      this.status = message;
      this.statusColor = color || 'black';
      setTimeout(() => {
        const textarea = document.getElementById('log_text_area');
        if (textarea) {
          textarea.scrollTop = textarea.scrollHeight;
        }
      }, 0);
    },
    timeout(ms) {
      return new Promise(res => setTimeout(res, ms));
    },
    async getPosts(instaPosts, restart) {
      const media = await instaPosts.getPosts(restart);
      likes.fetchedPosts += media.length;
      likes.totalPosts = instaPosts.getTotal();
      await this.getPostLikesAndComments(instaPosts, media, 0);
    },
    formatDate(date) {
      const d = date.getDate();
      const m = date.getMonth() + 1;
      const y = date.getFullYear();
      return `${y}-${m <= 9 ? `0${m}` : m}-${d <= 9 ? `0${d}` : d}`;
    },
    whenCompleted() {
      console.log('when completed entered.....');

      // TODO: second criterion is taken date?
      if (likes.commentedPosts.length > 1) {
        likes.commentedPosts.sort((a, b) => {
          if (a.comments < b.comments) {
            return 1;
          } if (a.comments > b.comments) {
            return -1;
          }
          return 0;
        });
      }

      // likes.updateStatusDiv(`Started at ${likes.startDate}`);
      likes.updateStatusDiv(`Processed ${likes.processedPosts} posts/${likes.processedLikes} likes/${likes.processedComments} comments`);

      likes.isGettingLikesInProgress = false;
      // likes.log = JSON.stringify([...data]);

      __items.length = 0;
      Array.from(this.data.values()).forEach((e) => {
        // convert dates
        if (e.lastLike) { // to skip the users who just commented
          e.diff = Math.round((e.lastLike - e.firstLike) / 60 / 60 / 24);
          e.lastLike = this.formatDate(new Date(e.lastLike * 1000));
          e.firstLike = this.formatDate(new Date(e.firstLike * 1000));
        }
        __items.push(e);
      });
      // console.log(__items);
    },
    async getPostLikesAndComments(instaPosts, media, index) {
      if (media.length > index) { // we still have something to get
        if (this.isCompleted) {
          return;
        }
        const obj = media[index];
        const url = obj.node.display_url;
        const taken = new Date(obj.node.taken_at_timestamp * 1000).toLocaleString();
        const shortcode = obj.node.shortcode;
        likes.postTotalEntity = obj.node.edge_media_preview_like.count;
        likes.postProcessedEntity = 0;
        likes.postEntity = 'Likes';
        likes.updateStatusDiv(`Post ${url} taken on ${taken} has ${likes.postTotalEntity} ${likes.postEntity.toLowerCase()}`);

        // check if it is the most liked post
        if (likes.postTotalEntity > (likes.mostLikedPost.likes || 0)) {
          likes.mostLikedPost = {
            id: shortcode,
            likes: likes.postTotalEntity,
            pic: url,
            url: `https://www.instagram.com/p/${shortcode}`,
          };
        }

        // check if it is the less liked post
        if (likes.postTotalEntity < (likes.lessLikedPost.likes || 999999)) {
          likes.lessLikedPost = {
            id: shortcode,
            likes: likes.postTotalEntity,
            pic: url,
            url: `https://www.instagram.com/p/${shortcode}`,
          };
        }

        await this.getPostLikes(new GetLikes({
          shortCode: shortcode,
          end_cursor: '',
          updateStatusDiv: likes.updateStatusDiv,
          pageSize: instaDefOptions.defPageSizeForLikes, // TODO: parametrize
          vueStatus: likes,
          url,
        }), instaPosts, media, index, obj.node.taken_at_timestamp);

        // Calculate comments
        // console.log('comments count', obj.node.edge_media_to_comment.count);
        // TODO: do we need delay before calculating comments
        if (this.calcComments) {
          // likes.postTotalEntity = obj.node.edge_media_to_comment.count;
          if (obj.node.edge_media_to_comment.count > 0) {
            likes.postEntity = 'Comments';
            likes.postProcessedEntity = 0;
            likes.postTotalEntity = obj.node.edge_media_to_comment.count;
            const commentsCount = await this.getPostComments(new GetComments({
              shortCode: shortcode,
              end_cursor: '',
              updateStatusDiv: likes.updateStatusDiv,
              pageSize: instaDefOptions.defPageSizeForLikes, // TODO: parametrize
              vueStatus: likes,
              url,
            }), instaPosts, media, index, obj.node.taken_at_timestamp);
            // console.log('comments count - ', commentsCount);
            if (commentsCount > 0) {
              likes.commentedPosts.push({
                id: shortcode,
                pic: url,
                url: `https://www.instagram.com/p/${shortcode}`,
                comments: Number(commentsCount),
              });
            }
          }
        }

        likes.processedPosts += 1;
        // update progress bar
        likes.progressValue = (likes.processedPosts / likes.totalPosts) * 100;
        await this.timeout(likes.calcDelay());
        await this.getPostLikesAndComments(instaPosts, media, ++index);
      } else if (instaPosts.hasMore()) { // do we still have something to fetch
        likes.updateStatusDiv(`The more posts will be fetched now...${new Date()}`);
        await this.timeout(likes.calcDelay());
        await this.getPosts(instaPosts, false);
      }
    },
    async getPostComments(insta, instaPosts, media, index, taken) {
      if (this.isCompleted) {
        return;
      }
      const result = await insta.get();
      likes.updateStatusDiv(`... fetched information about ${result.data.length} comments`);
      for (let i = 0; i < result.data.length; i += 1) {
        const { id, username, profile_pic_url } = result.data[i].node.owner;
        if (this.data.has(id)) { // already was
          const obj = this.data.get(id);
          obj.comments = obj.comments + 1 || 1;

          // check if the same user is not commented yet
          if (!obj.commentedPosts.some(obj => (obj.id === result.shortCode))) {
            obj.commentedPosts.push({
              id: result.shortCode,
              pic: result.url,
              url: `https://www.instagram.com/p/${result.shortCode}`,
            });
          }
          this.data.set(id, obj);
        } else {
          this.data.set(id, {
            id,
            username,
            count: 0,
            comments: 1,
            // full_name: full_name,
            profile_pic_url,
            // followed_by_viewer: result.data[i].node.followed_by_viewer,
            // requested_by_viewer: result.data[i].node.requested_by_viewer,
            // is_verified: result.data[i].node.is_verified,
            posts: [],
            commentedPosts: [{
              id: result.shortCode,
              pic: result.url,
              url: `https://www.instagram.com/p/${result.shortCode}`,
            }],
          });
        }
        likes.postProcessedEntity += 1;
        likes.processedComments += 1;
      }
      if (insta.hasMore()) {
        await this.timeout(likes.calcDelay());
        return this.getPostComments(insta, instaPosts, media, index, taken);
      }
      return likes.postProcessedEntity;
    },
    async getPostLikes(instaLike, instaPosts, media, index, taken) {
      if (this.isCompleted) {
        return;
      }
      const result = await instaLike.get();
      likes.updateStatusDiv(`... fetched information about ${result.data.length} likes`);
      for (let i = 0; i < result.data.length; i += 1) {
        const {
          id, username, full_name, profile_pic_url,
        } = result.data[i].node;
        if (this.data.has(id)) { // already was, but maybe from comments
          const obj = this.data.get(id);
          obj.count += 1;
          obj.lastLike = obj.lastLike || taken; // if an user added from comments
          obj.firstLike = obj.firstLike || taken; // if an user added from comments
          if (taken > obj.lastLike) {
            obj.lastLike = taken;
          } else if (taken < obj.firstLike) {
            obj.firstLike = taken;
          }

          // just in case it was added from comments flow
          obj.full_name = full_name;
          obj.followed_by_viewer = result.data[i].node.followed_by_viewer;
          obj.requested_by_viewer = result.data[i].node.requested_by_viewer;
          obj.is_verified = result.data[i].node.is_verified;

          obj.posts.push({
            id: result.shortCode,
            pic: result.url,
            url: `https://www.instagram.com/p/${result.shortCode}`,
          });
          this.data.set(id, obj);
        } else {
          this.data.set(id, {
            id,
            username,
            count: 1,
            lastLike: taken,
            firstLike: taken,
            full_name,
            profile_pic_url,
            followed_by_viewer: result.data[i].node.followed_by_viewer,
            requested_by_viewer: result.data[i].node.requested_by_viewer,
            is_verified: result.data[i].node.is_verified,
            posts: [{
              id: result.shortCode,
              pic: result.url,
              url: `https://www.instagram.com/p/${result.shortCode}`,
            }],
            commentedPosts: [],
          });
        }
        likes.postProcessedEntity += 1;
        likes.processedLikes += 1;
      }
      if (instaLike.hasMore()) {
        await this.timeout(likes.calcDelay());
        await this.getPostLikes(instaLike, instaPosts, media, index, taken);
      }
    },
    exportToExcel() {

      const fileName = `getLikes_${this.userToGetLikes}_${exportUtils.formatDate(new Date())}.${this.outType}`;

      if ('xlsx' === this.outType) {

        const wb = XLSX.utils.book_new();
        wb.Props = {
          Title: 'Get Likes Title',
          Subject: 'Get Likes Subject',
          Author: 'Instagram Helper',
          CreatedDate: new Date(),
        };
        wb.SheetNames.push('GetLikesSheet');

        const ws = XLSX.utils.json_to_sheet(__items, { cellDates: true });

        wb.Sheets.GetLikesSheet = ws;
        const wbout = XLSX.write(wb, { bookType: this.outType, type: 'binary' });
        saveAs(new Blob([exportUtils.s2ab(wbout)], { type: 'application/octet-stream' }), fileName);

      } else { // THIS IS CVS
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(__items);
        XLSX.utils.book_append_sheet(wb, ws, 'output');
        XLSX.writeFile(wb, fileName);
      }

    },
    async addFollowers() {
      if (!likes.userInfo) {
        // todo : it is viewer?
        likes.userInfo = await instaUserInfo.getUserProfile({ username: likes.viewerUserName });
      }

      const fetchSettings = {
        request: null,
        userName: likes.userInfo.username,
        pageSize: likes.fetchPageSize,
        delay: likes.delay, // OR SHOULD IT BE likes.fetchDelay
        // followDelay: request.followDelay,
        csrfToken: likes.csrfToken,
        userId: likes.userInfo.id,
        relType: 'followed_by',
        callBoth: false,
        checkDuplicates: true,
        limit: 0,
        // follows_count: request.follows_count,
        followed_by_count: likes.userInfo.followed_by_count,
        // follows_processed: 0,
        followed_by_processed: 0,
        startTime: new Date(),
        // timerInterval: startTimer(document.querySelector('#timer'), new Date()),
        receivedResponses: 0, // received HTTP responses
        processedUsers: 0, // processed users in get full info
        followProcessedUsers: 0, // processed users for mass follow
        // followedUsers: 0,
        // requestedUsers: 0,
        viewerUserId: likes.viewerUserId,
      };

      likes.isAddingFollowersInProgress = true;
      likes.promiseFetchInstaUsers(fetchSettings).then((obj) => {
        let candidatesToUnFollow = 0;
        for (const i in __items) {
          candidatesToUnFollow += (!__items[i].count);

          // to provide default values if a follower who never liked/commented was added
          Vue.set(__items[i], 'count', __items[i].count || 0);
          Vue.set(__items[i], 'diff', __items[i].diff || 0);
          Vue.set(__items[i], 'posts', __items[i].posts || []);
          Vue.set(__items[i], 'commentedPosts', __items[i].commentedPosts || []);

          // __items[i].count = __items[i].count || 0;
          // __items[i].diff = __items[i].diff || 0;

          delete __items[i].user_profile;
          delete __items[i].user_follows;
        }
        this.updateStatusDiv(`Potential candidates to be unfollowed - ${candidatesToUnFollow}`);
        // console.log('candidatesToUnFollow', candidatesToUnFollow);

        likes.isAddingFollowersInProgress = false;
        this.followersAdded = true;
        // console.log('resolved', obj);
      });
    },
    promiseFetchInstaUsers(obj) {
      return new Promise(((resolve) => {
        // console.log('followed by count', obj.followed_by_count);

        const f = new FetchUsers(Object.assign({}, {
          obj,
          myData: __items,
          htmlElements: {},
          updateStatusDiv: likes.updateStatusDiv,
          resolve,
          funcUpdateProgressBar(newValue) {
            likes.progressValue = (newValue / obj.followed_by_count) * 100;
          },
          vueStatus: likes,
        }));

        f.fetchInstaUsers();
      }));
    },
    // async test() {
    //   chrome.identity.getAuthToken({ 'interactive': true }, async function (token) {
    //     console.log(token);
    //     gapi.client.setToken({ access_token: token });

    //     await gapi.client.load('sheets', 'v4');

    //     let response = await gapi.client.sheets.spreadsheets.create({
    //       properties: {
    //         title: 'TITLE'
    //       },
    //       sheets: [{
    //         'properties': {
    //           'sheetType': 'GRID',
    //           'sheetId': 0,
    //           'title': 'output'
    //         }
    //       }]

    //     });
    //     console.log(response);

    //     let response1 = await gapi.client.sheets.spreadsheets.values.append({
    //       spreadsheetId: response.result.spreadsheetId,
    //       range: 'output',
    //       valueInputOption: 'RAW',
    //       insertDataOption: 'INSERT_ROWS',
    //       resource: {
    //         values: [
    //           [new Date().toISOString(), "Some value 2", "Another value 2"],
    //           [new Date().toISOString(), "Some value 3", "Another value 3"]
    //         ],
    //       }
    //     });

    //   });
    // },
    startButtonClick() {
      let instaPosts = new GetPosts({
        pageSize: likes.pageSize,
        mode: 'likeProfile',
        updateStatusDiv: likes.updateStatusDiv,
        end_cursor: null,
        vueStatus: likes,
        userName: likes.userToGetLikes,
        userId: likes.viewerUserName === likes.userToGetLikes ? likes.viewerUserId : '',
      });

      instaPosts.resolveUserName().then(async (obj) => {
        likes.init = false;

        likes.followersAdded = false;
        likes.isGettingLikesInProgress = true;

        likes.userInfo = obj;

        likes.data = new Map();

        likes.startDate = (new Date()).toLocaleTimeString();
        likes.fetchedPosts = 0;
        likes.processedPosts = 0;
        likes.totalPosts = 0;
        likes.stop = false;
        likes.log = '';
        likes.processedLikes = 0;
        likes.processedComments = 0;

        likes.commentedPosts = [];
        likes.lessLikedPost = {};
        likes.mostLikedPost = {};

        likes.updateStatusDiv(`The interval between the requests is ${likes.delay}ms`);

        await this.getPosts(instaPosts, true);

        this.whenCompleted();
      }, () => {
        alert('Specified user was not found');
        instaPosts = null;
      });
    },
  },
  components: {
    'my-data-table': myDataTable,
  },
});
