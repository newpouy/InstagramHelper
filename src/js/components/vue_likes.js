/* globals Vue */

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
    >
    <template slot="items" slot-scope="props">
      <td class="text-xs-right">
        <a v-bind:href="'https://www.instagram.com/'+[props.item.userName][0]" target="_blank"><img v-bind:src="[props.item.url][0]"></img></a>
      </td>
      <td class="text-xs-right">{{ props.item.userName }}</td>
      <td class="text-xs-right">{{ props.item.count }}</td>
      <td class="text-xs-right">{{ props.item.taken }}</td>
      <td class="text-xs-right">{{ props.item.fullName }}</td>
    </template>
  </v-data-table>
</v-card>`,
  data: function () {
    return {
      search: '',
      pagination: { sortBy: 'count', rowsPerPage: 25, descending: true },
      headers: [
        { text: 'Image', value: '', sortable: false },
        { text: 'Username', value: 'userName' },
        { text: 'Count', value: 'count' },
        { text: 'Last date', value: 'taken', sortable: false },
        { text: 'Full Name', value: 'fullName' }
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
    // this.csrfToken = '';

    this.startDate = null; //timestamp when process was started
  },
  data: {
    isInProgress: false,

    delay: 0, //interval ldbetween sending the http requests

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
    totalLikes: 0 //how much likes has the currently analyzed post

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
    binding () {
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
    }
  },
  components: {
    'my-data-table': myDataTable
  }
});


