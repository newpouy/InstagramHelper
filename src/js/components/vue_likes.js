/* globals Vue, chrome, _gaq, instaDefOptions */
/* globals GetLikes, GetPosts, exportUtils, XLSX, saveAs */

var __items = [];

var myDataTable = {
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
      item-key="userName"
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
        <a v-bind:href="'https://www.instagram.com/'+[props.item.userName][0]" target="_blank"><img v-bind:src="[props.item.url][0]"></img></a>
      </td>
      <td class="text-xs-right">{{ props.item.userName }}</td>
      <td class="text-xs-right">{{ props.item.count }}</td>
      <td class="text-xs-right">{{ props.item.firstLike }}</td>
      <td class="text-xs-right">{{ props.item.lastLike }}</td>
      <td class="text-xs-right">{{ props.item.diff }}</td>
      <td class="text-xs-right">{{ props.item.fullName }}</td>
      </tr>
    </template>
    <template slot="expand" slot-scope="props">
    <h3 class="headline mb-0">Liked posts</h3>
<!--
      <ul>
        <li v-for="post in props.item.posts">{{post.url}}</li>
      </ul>
-->
      <v-layout row wrap child-flex>
        <v-flex v-for="post in props.item.posts" :key="post.id" xs12 sm3>
            <v-card :href="post.url" target="_blank">
              <v-card-media :src="post.pic" height="200px" contain>
              </v-card-media>
            </v-card>
        </v-flex>
      </v-layout>
    </template>
  </v-data-table>
</v-card>`,
  data: function () {
    return {
      search: '',
      pagination: { sortBy: 'count', rowsPerPage: 50, descending: true },
      headers: [
        { text: '#', value: '', sortable: false, tooltip: '#' },
        { text: 'Image', value: '', sortable: false, tooltip: 'Click the image to open the user profile on Instagram.com' },
        { text: 'Username', value: 'userName', tooltip: 'User name' },
        { text: 'Count', value: 'count', tooltip: 'The total amount of likes' },
        { text: 'First', value: 'firstLike', tooltip: 'The date of first liked post' },
        { text: 'Last', value: 'lastLike', tooltip: 'The date of last liked post' },
        { text: 'Days', value: 'diff', tooltip: 'The amount of days between first and last liked posts' },
        { text: 'Full Name', value: 'fullName', tooltip: 'User full name' }
      ],
      items: __items
    };
  }
};

var likes = new Vue({ // eslint-disable-line no-unused-vars
  el: '#app',
  created() {
    this.viewerUserId = '';
    this.viewerUserName = '';

    this.startDate = null; //timestamp when process was started
  },
  mounted: () => {
    console.log('likes mounted...'); // eslint-disable-line no-console
    _gaq.push(['_trackPageview']);

    chrome.runtime.onMessage.addListener(function (request) {

      if (request.action === 'openLikesPage') {

        likes.delay = request.likeDelay;

        likes.viewerUserName = request.viewerUserName;
        likes.viewerUserId = request.viewerUserId;

        likes.pageSize = request.pageSizeForFeed; //is not binded

        likes.userToGetLikes = request.userName === instaDefOptions.you ? request.viewerUserName : request.userName;

        // to support the adding followeres
        likes.fetchDelay = request.delay;
        likes.csrfToken = request.csrfToken;
        likes.fetchPageSize = request.pageSize;
      }
    });

  },
  data: {
    isInProgress: false,

    delay: 0, //interval between sending the http requests

    fetchedPosts: 0, //how may posts were fetched
    processedPosts: 0, //for how much posts the likes were already analyzed
    totalPosts: 0, //total posts in profile

    stop: false, //if user requested the proceess to be stopped by clicking the button

    status: '', //the message displayed in status div
    statusColor: '',

    log: '', //the text displayed in text are

    userToGetLikes: '',

    allPostsFetched: false, // when all posts from user's profile are fetched

    processedLikes: 0, //how much processed likes for current post
    totalLikes: 0, //how much likes has the currently analyzed post

    mostLikedPost: { },
    lessLikedPost: { }
  },
  computed: {
    isCompleted: function () {
      if (this.stop) {
        this.updateStatusDiv(`${new Date().toLocaleString()}/The process will be stopped now because you clicked the Stop button`);
        return true;
      } else if (this.allPostsFetched) {
        this.updateStatusDiv(`${new Date().toLocaleString()}/The process will be stopped because no more posts in the user's profile`);
        return true;
      }
      return false;
    },
    startButtonDisabled: function () {
      return this.isInProgress ||  //process is not running
        '' === this.userToGetLikes; //profile is specified
    },
    exportButtonDisabled: function () {
      return this.isInProgress ||  //process is not running
        __items.length === 0; //no items to export
    },
    addFollowersButtonDisabled: function () {
      return this.isInProgress ||  //process is not running
        __items.length === 0; //no items to export
        //TODO
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
    updateStatusDiv: function (message, color) {
      this.log += message + '\n';
      this.status = message;
      this.statusColor = color || 'black';
      setTimeout(function () {
        var textarea = document.getElementById('log_text_area');
        textarea.scrollTop = textarea.scrollHeight;
      }, 0);
    },
    getPosts: function (instaPosts, restart) {
      instaPosts.getPosts(restart).then(media => {

        likes.fetchedPosts += media.length;
        likes.totalPosts = instaPosts.getTotal();

        this.getLikes(instaPosts, media, 0);

      }).catch(e => {
        likes.updateStatusDiv(e.toString());
      });
    },
    formatDate: function (date) {
      var d = date.getDate();
      var m = date.getMonth() + 1;
      var y = date.getFullYear();
      return '' + y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
    },
    whenCompleted: function () {
      likes.updateStatusDiv(`Started at ${likes.startDate}`);
      likes.updateStatusDiv(`Fetched ${likes.fetchedPosts} posts`);

      likes.isInProgress = false;
      //likes.log = JSON.stringify([...data]);

      __items.length = 0;
      Array.from(this.data.values()).forEach(e => {
        //convert dates
        e.diff = Math.round((e.lastLike - e.firstLike) / 60 / 60 / 24);
        e.lastLike = this.formatDate(new Date(e.lastLike * 1000));
        e.firstLike = this.formatDate(new Date(e.firstLike * 1000));
        __items.push(e);
      });
    },
    getLikes: function (instaPosts, media, index) {
      if (likes.isCompleted) {
        return this.whenCompleted();
      }

      if (media.length > index) { //we still have something to get
        var obj = media[index];
        var url = obj.node.display_url;
        var taken = new Date(obj.node.taken_at_timestamp * 1000).toLocaleString();
        var shortcode = obj.node.shortcode;
        likes.totalLikes = obj.node.edge_media_preview_like.count;
        likes.processedLikes = 0;
        likes.updateStatusDiv(`Post ${url} taken on ${taken} has ${likes.totalLikes} likes`);

        //check if it is most liked post
        if (likes.totalLikes > (likes.mostLikedPost.likes || 0)) {
          likes.mostLikedPost = {
            id: shortcode,
            likes: likes.totalLikes,
            pic: url,
            url: `https://www.instagram.com/p/${shortcode}`
          }
        }

        //check if it is less liked post
        if (likes.totalLikes < (likes.lessLikedPost.likes || 999)) {
          likes.lessLikedPost = {
            id: shortcode,
            likes: likes.totalLikes,
            pic: url,
            url: `https://www.instagram.com/p/${shortcode}`
          }
        }

        var instaLike = new GetLikes({
          shortCode: shortcode,
          end_cursor: '',
          updateStatusDiv: likes.updateStatusDiv,
          pageSize: instaDefOptions.defPageSizeForLikes, //TODO: parametrize
          vueStatus: likes,
          url: url
        });

        this.getPostLikes(instaLike, instaPosts, media, index, obj.node.taken_at_timestamp);

      } else if (instaPosts.hasMore()) { //do we still have something to fetch
        likes.updateStatusDiv(`The more posts will be fetched now...${new Date()}`);
        setTimeout(() => this.getPosts(instaPosts, false), likes.delay);
      } else { // nothing more found in profile
        likes.allPostsFetched = true;
        setTimeout(() => this.getLikes(instaPosts, media, ++index), 0);
      }
    },
    getPostLikes: function (instaLike, instaPosts, media, index, taken) {
      if (likes.isCompleted) {
        return this.whenCompleted();
      }

      instaLike.getLikes().then(result => {
        likes.updateStatusDiv(`... fetched information about ${result.data.length} likes`);
        for (var i = 0; i < result.data.length; i++) {
          var userId = result.data[i].node.id;
          var userName = result.data[i].node.username;
          var fullName = result.data[i].node.full_name;
          var url = result.data[i].node.profile_pic_url;
          if (this.data.has(userId)) { // already was
            var obj = this.data.get(userId);
            obj.count++;
            if (taken > obj.lastLike) {
              obj.lastLike = taken;
            } else if (taken < obj.firstLike) {
              obj.firstLike = taken;
            }
            obj.posts.push({
              id: result.shortCode,
              pic: result.url,
              url: `https://www.instagram.com/p/${result.shortCode}`
            });
            this.data.set(userId, obj);
          } else {
            this.data.set(userId, {
              userId: userId,
              userName: userName,
              count: 1,
              lastLike: taken,
              firstLike: taken,
              fullName: fullName,
              url: url,
              followed_by_viewer: result.data[i].node.followed_by_viewer,
              requested_by_viewer: result.data[i].node.requested_by_viewer,
              is_verified: result.data[i].node.is_verified,
              posts: [{
                id: result.shortCode,
                pic: result.url,
                url: `https://www.instagram.com/p/${result.shortCode}`
              }]
            });
          }
          likes.processedLikes += 1;
        }
        if (instaLike.hasMore()) {
          setTimeout(() => this.getPostLikes(instaLike, instaPosts, media, index, taken), likes.delay);
        } else {
          instaLike = null;
          likes.processedPosts += 1;
          setTimeout(() => this.getLikes(instaPosts, media, ++index), likes.delay);
        }
      });
    },
    exportToExcel: function () {
      var fileName =
        `getLikes_${this.userToGetLikes}_${exportUtils.formatDate(new Date())}.xlsx`;

      var wb = XLSX.utils.book_new();
      wb.Props = {
        Title: "Get Likes Title",
        Subject: "Get Likes Subject",
        Author: "Instagram Helper",
        CreatedDate: new Date()
      };
      wb.SheetNames.push("GetLikesSheet");

      var ws = XLSX.utils.json_to_sheet(__items, {cellDates: true});

      wb.Sheets["GetLikesSheet"] = ws;
      var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      saveAs(new Blob([exportUtils.s2ab(wbout)], { type: "application/octet-stream" }), fileName);
    },
    addFollowers: function () {

      //I can have userid here
      //todo: resolve profile, find followers

      var fetchSettings = {
        request: null,
        userName: likes.userInfo.username,
        pageSize: likes.fetchPageSize,
        delay: likes.fetchDelay,
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
        receivedResponses: 0,	//received HTTP responses
        processedUsers: 0, 	//processed users in get full info
        followProcessedUsers: 0, //processed users for mass follow
        // followedUsers: 0,
        // requestedUsers: 0,
        viewerUserId: likes.viewerUserId
      };

      console.log(fetchSettings);

      likes.promiseFetchInstaUsers(fetchSettings).then(function (obj) {
        debugger;
        console.log('resolved', obj);
      });

      //todo: fetch all followers
      //todo: progress bar
      //todo: and add it
    },
    promiseFetchInstaUsers: function (obj) {
      return new Promise(function (resolve) {

        var f = new FetchUsers(Object.assign({}, {
          obj: obj,
          myData: __items,
          htmlElements: {},
          updateStatusDiv: message => console.log(message),
          resolve: resolve
        }));

        f.fetchInstaUsers();
      });
    },
    startButtonClick: function () {
      var instaPosts =
        new GetPosts({
          pageSize: likes.pageSize,
          mode: 'likeProfile',
          updateStatusDiv: likes.updateStatusDiv,
          end_cursor: null,
          vueStatus: likes,
          userName: likes.userToGetLikes,
          userId: likes.viewerUserName === likes.userToGetLikes ? likes.viewerUserId : ''
        });

      instaPosts.resolveUserName().then((obj) => {

        likes.userInfo = obj;

        likes.data = new Map();

        likes.startDate = (new Date()).toLocaleTimeString();
        likes.fetchedPosts = 0;
        likes.processedPosts = 0;
        likes.totalPosts = 0;
        likes.stop = false;
        likes.log = '';
        likes.allPostsFetched = false;

        likes.lessLikedPost = {};
        likes.mostLikedPost = {};

        likes.isInProgress = true;

        likes.updateStatusDiv(`The interval between the requests is ${likes.delay}ms`);

        this.getPosts(instaPosts, true);

      }, () => {
        alert('Specified user was not found');
        instaPosts = null;
      });

    }
  },
  components: {
    'my-data-table': myDataTable
  }
});
