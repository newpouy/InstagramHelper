/* globals confirm, chrome, $, _gaq */
/* globals instaDefOptions, instaUserInfo, followUser, exportUtils, FetchUsers, XLSX, saveAs */

$(() => {
  'use strict';

  // https://stackoverflow.com/questions/9775115/get-all-rows-not-filtered-from-jqgrid
  let lastSelected;

  const myData = [];
  let userName = '';
  let cancelProcessing = false;

  const htmlElements = {
    statusDiv: document.getElementById('status'),
    follows: $('#follows'),
    followed_by: $('#followed_by'),
    detailedinfo: $('#detailedinfo'),
    detInfoCheckbox: $('#detInfoCheckbox'),
  };

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'get_insta_users') {
      const promise = instaDefOptions.you === request.userName ? instaUserInfo.getUserProfile({ username: request.viewerUserName }) : request.userName;
      Promise.all([promise]).then((values) => {
        if (typeof values[0] === 'object') {
          request.userName = request.viewerUserName;
          request.user_is_private = values[0].is_private;
          request.follows_count = values[0].follows_count;
          request.followed_by_count = values[0].followed_by_count;
          request.userId = values[0].id;
          request.user_followed_by_viewer = false;
        }
        startFetching(request);
      });
    }
  });

  const updateStatusDiv = function (message, color) {
    htmlElements.statusDiv.textContent = message;
    htmlElements.statusDiv.style.color = color || 'black';
  };

  const fullColModel = [{
    label: 'User',
    name: 'profile_pic_url_hd',
    width: '320',
    align: 'center',
    sortable: false,
    formatter(cellvalue, model, row) {
      return `<a href='https://www.instagram.com/${row.username}' target='_blank'><img src='${cellvalue}' alt='' /></a>`;
    },
    search: false,
  }, {
    label: 'User Id',
    name: 'id',
    width: '80',
    align: 'center',
    search: true,
    searchoptions: {
      sopt: ['bw', 'cn'],
    },
  }, {
    label: 'Info',
    name: 'username',
    sortable: false,
    formatter(cellvalue, model, row) {
      let ret = `username:<strong>${row.username}</strong><br/>`;
      ret += row.full_name ? `full name:<strong>${row.full_name}</strong><br/>` : '';
      ret += row.connected_fb_page ? `FB:<a href='${row.connected_fb_page}' target='_blank'>${row.connected_fb_page}</a><br/>` : '';
      ret += row.external_url ? `url:<a href='${row.external_url}' target='_blank'>${row.external_url}</a>` : '';
      return ret;
    },
    cellattr() {
      return 'style="white-space: normal;"';
    },
    search: true,
    stype: 'text',
    searchoptions: {
      dataInit(elem) {
        $(elem).attr('placeholder', '<<Filter by username>>');
      },
    },
  }, {
    label: 'Bio',
    name: 'biography',
    sortable: false,
    formatter(cellvalue) {
      return cellvalue || '';
    },
    cellattr() {
      return 'style="white-space: normal;"';
    },
    search: false,
  }, {
    label: 'Follows <br/>you',
    name: 'follows_viewer',
    width: '80',
    align: 'center',
    stype: 'select',
    searchoptions: {
      sopt: ['eq'],
      value: ':Any;true:Yes;false:No;null:Requested you',
    },
    formatter(cellvalue, model, row) {
      const className = row.has_requested_viewer ? 'ui-state-disabled' : '';
      return `<input type='checkbox'
        ${row.follows_viewer || row.has_requested_viewer ? 'checked="checked"' : ''}
        class='${className}' value='${row.follows_viewer}' offval='no' disabled='disabled'>`;
    },
    cellattr() {
      return 'style="background-color: #fbf9ee;" title="Follows you"';
    },
    search: true,
  }, {
    label: 'Followed <br>by you',
    name: 'followed_by_viewer',
    width: '80',
    align: 'center',
    stype: 'select',
    searchoptions: {
      sopt: ['eq'],
      value: ':Any;true:Yes;false:No;null:Requested by you',
    },
    formatter(cellvalue, model, row) {
      const className = row.requested_by_viewer ? 'ui-state-disabled' : '';
      return `<input type='checkbox'
        ${row.followed_by_viewer || row.requested_by_viewer ? 'checked="checked"' : ''}
        class='${className}' value='${row.followed_by_viewer}' offval='no' disabled='disabled'>`;
    },
    cellattr() {
      return 'style="background-color: #fbf9ee;" title="Followed by you"';
    },
    search: true,
  }, {
    delete: 'follows',
    label: 'Follows <br/>user',
    name: 'user_followed_by', // relationship: followed_by - the list of the user's followers
    width: '80',
    formatter: 'checkbox',
    align: 'center',
    stype: 'select',
    searchoptions: {
      sopt: ['eq'],
      value: ':Any;true:Yes;false:No',
    },
    cellattr() {
      return `title="Follows ${userName}"`;
    },
    search: true,
  }, {
    delete: 'followed_by',
    label: 'Followed <br/>by user',
    name: 'user_follows', // relationship: follows - from the list of the followed person by user
    width: '80',
    formatter: 'checkbox',
    align: 'center',
    stype: 'select',
    searchoptions: {
      sopt: ['eq'],
      value: ':Any;true:Yes;false:No',
    },
    cellattr() {
      return `title="Followed by ${userName}"`;
    },
    search: true,
  }, {
    label: 'Private',
    name: 'is_private',
    width: '80',
    formatter: 'checkbox',
    align: 'center',
    stype: 'select',
    searchoptions: {
      sopt: ['eq'],
      value: ':Any;true:Yes;false:No',
    },
    cellattr() {
      return 'title="Is private"';
    },
    search: true,
  }, {
    label: 'Followers',
    name: 'followed_by_count',
    width: '70',
    align: 'center',
    sorttype: 'number',
    search: true,
    searchoptions: {
      sopt: ['ge', 'le', 'eq'],
    },
    cellattr() {
      return 'title="Followers"';
    },
  }, {
    label: 'Following',
    name: 'follows_count',
    width: '70',
    align: 'center',
    sorttype: 'number',
    search: true,
    searchoptions: {
      sopt: ['ge', 'le', 'eq'],
    },
    cellattr() {
      return 'title="Following"';
    },
  }, {
    label: 'Posts',
    name: 'media_count',
    width: '70',
    align: 'center',
    sorttype: 'number',
    search: true,
    searchoptions: {
      sopt: ['ge', 'le', 'eq'],
    },
    cellattr() {
      return 'title="Posts"';
    },
  }, {
    label: 'Date of latest post',
    name: 'latestPostDate',
    width: '70',
    align: 'center',
    formatter: 'date',
    sorttype: 'date',
    search: true,
    searchoptions: {
      sopt: ['ge', 'le'],
      dataInit(elem) {
        const self = this;
        $(elem).datepicker({
          dateFormat: 'mm/dd/yy',
          changeYear: true,
          changeMonth: true,
          showButtonPanel: true,
          showOn: 'focus',
          onSelect() {
            if (this.id.substr(0, 3) === 'gs_') {
              // in case of searching toolbar
              setTimeout(() => {
                self.triggerToolbar();
              }, 50);
            } else {
              // refresh the filter in case of
              // searching dialog
              $(this).trigger('change');
            }
          },
        });
      },
    },
    cellattr() {
      return 'title="The date of the latest post (cannot be displayed for private accounts you don\'t follow)\r\n\r\nDate format is MM/DD/YYYY"';
    },
  }];

  const simpleColModel = [{
    label: 'User',
    name: 'profile_pic_url',
    align: 'center',
    sortable: false,
    formatter(cellvalue, model, row) {
      return `<a href='https://www.instagram.com/${row.username}' target='_blank'><img src='${cellvalue}' alt='' /></a>`;
    },
    search: false,
  }, {
    label: 'User Id',
    name: 'id',
    width: '80',
    align: 'center',
    search: true,
    searchoptions: {
      sopt: ['bw', 'cn'],
    },
  }, {
    label: 'Info',
    name: 'username',
    sortable: false,
    formatter(cellvalue, model, row) {
      let ret = `username:<strong>${row.username}</strong><br/>`;
      ret += row.full_name ? `full name:<strong>${row.full_name}</strong><br/>` : '';
      return ret;
    },
    cellattr() {
      return 'style="white-space: normal;"';
    },
    search: true,
    stype: 'text',
    searchoptions: {
      dataInit(elem) {
        $(elem).attr('placeholder', '<<Filter by username>>');
      },
    },
  }, {
    label: 'Followed <br>by you',
    name: 'followed_by_viewer',
    width: '80',
    align: 'center',
    stype: 'select',
    searchoptions: {
      sopt: ['eq'],
      value: ':Any;true:Yes;false:No;null:Requested by you',
    },
    formatter(cellvalue, model, row) {
      const className = row.requested_by_viewer ? 'ui-state-disabled' : '';
      return `<input type='checkbox'
        ${row.followed_by_viewer || row.requested_by_viewer ? 'checked="checked"' : ''}
        class='${className}' value='${row.followed_by_viewer}' offval='no' disabled='disabled'>`;
    },
    cellattr() {
      return 'style="background-color: #fbf9ee;" title="Followed by you"';
    },
    search: true,
  }, {
    delete: 'follows',
    label: 'Follows <br/>user',
    name: 'user_followed_by', // relationship: followed_by - the list of the user's followers
    width: '80',
    formatter: 'checkbox',
    align: 'center',
    stype: 'select',
    searchoptions: {
      sopt: ['eq'],
      value: ':Any;true:Yes;false:No',
    },
    cellattr() {
      return `title="Follows ${userName}"`;
    },
    search: true,
  }, {
    delete: 'followed_by',
    label: 'Followed <br/>by user',
    name: 'user_follows', // relationship: follows - from the list of the followed person by user
    width: '80',
    formatter: 'checkbox',
    align: 'center',
    stype: 'select',
    searchoptions: {
      sopt: ['eq'],
      value: ':Any;true:Yes;false:No',
    },
    cellattr() {
      return `title="Followed by ${userName}"`;
    },
    search: true,
  }];

  function startFetching(request) {
    const fetchSettings = {
      request: null,
      userName: request.userName,
      pageSize: request.pageSize,
      delay: request.delay,
      followDelay: request.followDelay,
      csrfToken: request.csrfToken,
      userId: request.userId,
      requestRelType: request.relType,
      relType: 'All' === request.relType ? request.follows_count > request.followed_by_count ? 'follows' : 'followed_by' : request.relType,
      callBoth: 'All' === request.relType,
      checkDuplicates: myData.length > 0, // probably we are starting with already opened page , now it is obsolete, and actually should be False
      limit: request.limit, // return only first Nth found
      follows_count: request.follows_count,
      followed_by_count: request.followed_by_count,
      follows_processed: 0,
      followed_by_processed: 0,
      startTime: new Date(),
      timerInterval: startTimer(document.querySelector('#timer'), new Date()),
      receivedResponses: 0,	// received HTTP responses
      processedUsers: 0, 	// processed users in get full info
      followProcessedUsers: 0, // processed users for mass follow
      followedUsers: 0,
      requestedUsers: 0,
      viewerUserId: request.viewerUserId,
    };
    prepareHtmlElements(fetchSettings);
    promiseFetchInstaUsers(fetchSettings).then((obj) => {
      // WHEN FETCHING IS COMPLETED
      showJQGrid(obj, simpleColModel);
      showExportDiv(obj);

      // DO WE NEED TO RUN DETAILED INFO COLLECTION
      // $('#startDetailedInfoCollection').attr("disabled", "disabled");
      if ($('#startDetailedInfoCollection').is(':checked')) {
        showDetailsDiv();
        prepareHtmlElementsUserDetails(obj, myData);
        promiseGetFullInfo(obj, myData).then(() => {
          generationCompleted(obj, true);
        }).catch(() => {
          generationCompleted(obj, false);
        });
      } else {
        generationCompleted(obj, false);
      }
      htmlElements.detInfoCheckbox.remove();
    });
  }

  function getFullInfo(obj, arr, resolve, reject) {
    // console.log(arr[obj.processedUsers]);
    instaUserInfo.getUserProfile(
      {
        username: arr[obj.processedUsers].username,
        userId: arr[obj.processedUsers].id,
        updateStatusDiv,
      },
    ).then((user) => {
      // TODO: delete user when JSON is not returned by get user profile?
      myData[obj.processedUsers] = $.extend({}, myData[obj.processedUsers], user);
      obj.receivedResponses += 1;
      htmlElements.detailedinfo.asProgress('go', obj.processedUsers += 1);
      updateStatusDiv(`Getting detailed info for users: ${obj.processedUsers} of ${arr.length}`);
      if (obj.processedUsers === arr.length) {
        resolve();
        return;
      }
      if (cancelProcessing) {
        reject();
        return;
      }
      setTimeout(() => {
        getFullInfo(obj, arr, resolve, reject);
      }, 0);
    });
  }

  function massFollow(obj, arr, resolve, reject) {
    if (obj.followProcessedUsers >= arr.length) {
      resolve();
      return;
    }
    updateStatusDiv(`Mass following users: ${obj.followProcessedUsers + 1} of ${arr.length}`);

    if ((arr[obj.followProcessedUsers].followed_by_viewer === null)
      || (arr[obj.followProcessedUsers].followed_by_viewer)) { // requested or already followed
      obj.followProcessedUsers += 1;
      massFollow(obj, arr, resolve, reject);
    } else if (arr[obj.followProcessedUsers].id === obj.viewerUserId) { // shame - it is me
      obj.followProcessedUsers += 1;
      massFollow(obj, arr, resolve, reject);
    } else { // is not followed yet
      const username = arr[obj.followProcessedUsers].username;
      const userId = arr[obj.followProcessedUsers].id;
      console.log(`${username} is not followed yet.`); // eslint-disable-line no-console
      updateStatusDiv(
        `${username} is not followed yet:
          processed ${obj.followProcessedUsers + 1} of ${arr.length}/
          followed - ${obj.followedUsers}/requested - ${obj.requestedUsers}`,
      );
      followUser.follow(
        {
          username,
          userId,
          csrfToken: obj.csrfToken,
          updateStatusDiv,
        },
      ).then((result) => {
        obj.followProcessedUsers += 1;
        obj.receivedResponses += 1;
        if ('following' === result) {
          obj.followedUsers += 1;
        } else if ('requested' === result) {
          obj.requestedUsers += 1;
        } else {
          console.log(`Not recognized result - ${result}`); // eslint-disable-line no-console
        }
        updateStatusDiv(
          `The request to follow ${username} was successful -
              ${result}/processed ${obj.followProcessedUsers} of ${arr.length}/
              followed - ${obj.followedUsers}/requested - ${obj.requestedUsers}`,
        );
        setTimeout(() => {
          massFollow(obj, arr, resolve, reject);
        }, obj.followDelay);
      });
    }
  }

  function massUnFollow(obj, arr, resolve, reject) {
    if (obj.unFollowProcessedUsers >= arr.length) {
      resolve();
      return;
    }
    updateStatusDiv(`Mass unFollowing users: ${obj.unFollowProcessedUsers + 1} of ${arr.length}`);

    // if (!arr[obj.unFollowProcessedUsers].user_followed_by) { // take only who doesn't follow

    const username = arr[obj.unFollowProcessedUsers].username;
    const userId = arr[obj.unFollowProcessedUsers].id;

    if (!obj.keepUsers.includes(userId)) { // no exception
      console.log(`${username}/${userId} will be unfollowed.`); // eslint-disable-line no-console
      updateStatusDiv(`${username}/${userId} will be unfollowed:
            processed ${obj.unFollowProcessedUsers + 1} of ${arr.length}/
            followed - ${obj.unFollowedUsers}`);

      followUser.unFollow(
        {
          username,
          userId,
          csrfToken: obj.csrfToken,
          updateStatusDiv,
        },
      ).then((result) => {
        obj.unFollowProcessedUsers += 1;
        obj.receivedResponses += 1;
        obj.unFollowedUsers += 1;
        updateStatusDiv(
          `The request to unfollow ${username} was successful -
                processed ${obj.unFollowProcessedUsers} of ${arr.length}/unfollowed - ${obj.unFollowedUsers}`,
        );
        setTimeout(() => {
          massUnFollow(obj, arr, resolve, reject);
        }, obj.followDelay);
      });
    } else {
      console.log(`>>>>>>>>>>>>>>>${username} is followed and it will NOT be unfollowed.`); // eslint-disable-line no-console
      obj.unFollowProcessedUsers += 1;
      massUnFollow(obj, arr, resolve, reject);
    }
    // } else { //else for those who doesn't follow
    //  obj.unFollowProcessedUsers++;
    //  massUnFollow(obj, arr, resolve, reject);
    // }
  }

  function promiseFetchInstaUsers(obj) {
    return new Promise(((resolve) => {
      const f = new FetchUsers(Object.assign({}, {
        obj, myData, htmlElements, updateStatusDiv, resolve,
      }));

      f.fetchInstaUsers();
    }));
  }

  function startTimer(timer, startTime) {
    return setInterval(() => {
      const ms = parseInt(new Date() - startTime);
      let x = ms / 1000;
      const seconds = parseInt(x % 60, 10);
      x /= 60;
      const minutes = parseInt(x % 60, 10);
      x /= 60;
      const hours = parseInt(x % 24, 10);
      timer.textContent = `${hours}h:${'00'.substring(0, 2 - (`${minutes}`).length) + minutes}m:${'00'.substring(0, 2 - (`${seconds}`).length) + seconds}s`;
    }, 1000);
  }

  function showExportDiv(obj) {
    $('#exportDiv').show();

    $('#export_XLSX').on('click', () => {
      // find the bookType
      let bookType = 'xlsx';
      const radios = document.getElementsByName('outType');
      for (let i = 0; i < radios.length; i += 1) {
        if (radios[i].checked) {
          bookType = radios[i].value;
          break;
        }
      }

      const fileName = `${obj.requestRelType}_users_${obj.userName}${obj.limit > 0 ? `_limit_${obj.limit}` : ''}_${exportUtils.formatDate(new Date())}.${bookType}`;
      let arr = [];
      if (lastSelected) {
        console.log('Have filtered list', lastSelected.length); // eslint-disable-line no-console
        arr = lastSelected; // if we have filtered data set?
        //  fileName = 'FILTERED_' + fileName;
      } else {
        console.log('DO NOT have filtered list', myData.length); // eslint-disable-line no-console
        arr = myData; // if we do not have filtered data set?
      }

      var idb;
      // storing to storage
      let obj1 = {test: '1222', test1: '1223', test2: '1224', test3: '1225', test4: '1226', test5: '1226', test6: '1227'};
      try {
        const arr1 = [];
        console.log(new Date(), arr1.length);
        for (let j = 0; j < 1000000; j++ ) {
          obj1.id = j;
          arr1.push(Object.assign({}, obj1));
        }
        console.log(new Date(), arr1.length);
        // const val = JSON.stringify(arr1);
        // localStorage.setItem(fileName, val);
        // chrome.storage.sync.set({key: val}, function(){
        // console.log(new Date(), val.length);

        var request = indexedDB.open("the_name", 1);
        request.onerror = function(err){
          console.log(err);
        };
        request.onsuccess = function(){
          console.log('onsuccess 1', new Date());
          idb = request.result;
          var objectStore = idb.transaction("customers", "readwrite").objectStore("customers");
          for (var i in arr1) {
             objectStore.add(arr1[i]);
          }
          // db.close();
          console.log('onsuccess 2', new Date());
        }
        request.onupgradeneeded = (event) => {
          console.log('onupgradeneeded 1', new Date());
          var db = request.result;
          db.createObjectStore("customers", {keyPath: "id", autoIncrement: true}).onsuccess = () => {
            idb = db;
        };

          console.log('onupgradeneeded 2', new Date());
        };

      } catch(e) {
        console.log(`Error  ${e.name} : ${e.message} : ${e.stack}`);
      }


      const headers = [
        'id',
        'username',
        'full_name',
        'user_profile',
        'followed_by_viewer',
        'requested_by_viewer',
        'user_follows',
        'user_followed_by',
        'profile_pic_url',
        'profile_pic_url_hd',
        'is_private',
        'follows_count',
        'followed_by_count',
        'media_count',
        'latestPostDate',
        'follows_viewer',
        'has_requested_viewer',
        'blocked_by_viewer',
        'has_blocked_viewer',
        'biography',
        'connected_fb_page',
        'external_url',
        'is_verified',
      ];

      if ('xlsx' === bookType) {
        const wb = XLSX.utils.book_new();
        wb.Props = {
          Title: 'Users Title',
          Subject: 'Users Subject',
          Author: 'Instagram Helper',
          CreatedDate: new Date(),
        };
        wb.SheetNames.push('UsersSheet');

        const ws = XLSX.utils.json_to_sheet(arr, { header: headers, cellDates: true });
        // console.log(ws['!cols']);

        const endRow = XLSX.utils.decode_range(ws['!ref']).e.r + 1;
        // ws['H2'].f = "HYPERLINK('http://www.test.com', 'U')";
        for (let i = 2; i <= endRow; i += 1) { // format URL for user profile
          XLSX.utils.cell_set_hyperlink(ws[`D${i}`], ws[`D${i}`].v, ws[`D${i}`].v);
        }

        wb.Sheets.UsersSheet = ws;
        const wbout = XLSX.write(wb, { bookType, type: 'binary' });
        saveAs(new Blob([exportUtils.s2ab(wbout)], { type: 'application/octet-stream' }), fileName);

      } else { // THIS IS CVS
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(arr);
        XLSX.utils.book_append_sheet(wb, ws, 'output');
        XLSX.writeFile(wb, fileName);
      }
    });

    $('#massFollow').on('click', () => {
      if (confirm('It will follow ALL not-followed/not-requested ousers DISPLAYED in the table below (it means filtering in table is respected).'
        + `\nFollowing will be done with the interval of ${obj.followDelay / 1000}sec.`
        + '\nYou can change the interval value in the settings'
        + '\nWhen process is started, the change of filter criteria in the table is ignored.'
        + '\nContinue?')) {
        let arr = [];
        if (lastSelected) {
          console.log('Have filtered list', lastSelected.length); // eslint-disable-line no-console
          arr = lastSelected; // if we have filtered data set?
        } else {
          console.log('DO NOT have filtered list', myData.length); // eslint-disable-line no-console
          arr = myData; // if we do not have filtered data set?
        }
        promiseMassFollow(obj, arr).then(() => {
          updateStatusDiv(
            `Completed: ${obj.followProcessedUsers}
              processed/${obj.followedUsers}
              followed/${obj.requestedUsers} requested`,
          );
        });
      }
    });

    $('#massUnFollow').on('click', () => {
      $('#unfollowDiv').show();
      $('#startMassUnFollow').on('click', () => {
        // obj.keepPrivate = $('#keepPrivateAccounts').is(':checked');
        if ('' === $('#keepUsers').val().trim()) {
          if (!confirm('You have not specified the users to be kept. Continue?')) {
            return;
          }
        }
        if (confirm(
          'It will unfollow ALL USERS displayed in the table below except the users whose id you specified in the textarea.'
          + `\nUnFollowing will be done with the interval of ${obj.followDelay / 1000}sec.`
          + '\nWhen process is started, the changes of filter criteria in the table or/and the list of users to be kept are ignored.'
          + '\nContinue?',
        )) {
          obj.keepUsers = $('#keepUsers').val().replace(/[\n\r]/g, ',').split(',');
          obj.keepUsers.push(obj.viewerUserId); // to keep viewer itself - shame condition
          let arr = [];
          if (lastSelected) {
            console.log('Have a filtered list', lastSelected.length); // eslint-disable-line no-console
            arr = lastSelected; // if we have filtered data set?
          } else {
            console.log('DO NOT have a filtered list', myData.length); // eslint-disable-line no-console
            arr = myData; // if we do not have filtered data set?
          }
          promiseMassUnFollow(obj, arr).then(() => {
            updateStatusDiv(
              `Completed: ${obj.unFollowProcessedUsers}
              processed/${obj.unFollowedUsers}`,
            );
          });
        }
      });
    });
  }

  function showDetailsDiv() {
    $('#details').show();

    $('#cancelDetInfo').on('click', () => cancelProcessing = confirm('Do you want to cancel?'));
  }

  function prepareFollowedElements(obj) {
    const followed_by_count = ((obj.limit > 0) && (obj.limit < obj.followed_by_count)) ? obj.limit : obj.followed_by_count;
    const followedChanged = (obj.limit > 0) && (obj.limit < obj.followed_by_count);
    if (obj.callBoth || ('followed_by' === obj.relType)) {
      document.getElementById('followed_by_title').textContent = `${obj.userName} is followed by ${obj.followed_by_count} users`;
      if (followedChanged) {
        document.getElementById('followed_by_title').textContent
          += `; you set the return limit, therefore the collection will be stopped when ${followed_by_count}+ returned`;
      }
      document.getElementById('followed_by_title').style.display = 'block';
      htmlElements.followed_by.show().asProgress({
        namespace: 'progress',
        min: 0,
        max: followed_by_count,
        goal: followed_by_count,
        easing: 'linear',
        labelCallback(n) {
          const percentage = this.getPercentage(n);
          return `Followed by:${obj.followed_by_processed}/${followed_by_count}/${percentage}%`;
        },
      });
    }
  }

  function prepareFollowsElements(obj) {
    const follows_count = ((obj.limit > 0) && (obj.limit < obj.follows_count)) ? obj.limit : obj.follows_count;
    const followsChanged = (obj.limit > 0) && (obj.limit < obj.follows_count);
    if (obj.callBoth || ('follows' === obj.relType)) {
      document.getElementById('follows_title').textContent = `${obj.userName} follows ${obj.follows_count} users`;
      if (followsChanged) {
        document.getElementById('follows_title').textContent
          += `; you set the return limit, therefore the collection will be stopped when ${follows_count}+ returned`;
      }
      document.getElementById('follows_title').style.display = 'block';
      htmlElements.follows.show().asProgress({
        namespace: 'progress',
        min: 0,
        max: follows_count,
        goal: follows_count,
        easing: 'linear',
        labelCallback(n) {
          const percentage = this.getPercentage(n);
          return `Follows:${obj.follows_processed}/${follows_count}/${percentage}%`;
        },
      });
    }
  }

  function prepareHtmlElements(obj) {
    prepareFollowedElements(obj);
    prepareFollowsElements(obj);
    htmlElements.detInfoCheckbox.show();
  }

  function generationCompleted(obj, resolved) {
    clearInterval(obj.timerInterval);
    const timer = document.querySelector('#timer');
    htmlElements.detailedinfo.asProgress('finish').asProgress('stop');
    document.getElementById('cancelDetInfo').remove();

    let diffFollowed = '';
    let diffFollows = '';
    if (obj.followed_by_count !== obj.followed_by_processed) {
      diffFollowed = `(actually returned ${obj.followed_by_processed})`;
    }
    if (obj.follows_count !== obj.follows_processed) {
      diffFollows = `(actually returned ${obj.follows_processed})`;
    }

    updateStatusDiv(`Completed${obj.limit > 0 ? ` with limit ${obj.limit}` : ''}${!resolved ? ', detailed info collection was cancelled' : ''},
      spent time - ${timer.textContent},
      created list length - ${myData.length} (follows - ${obj.follows_count}${diffFollows},
      followed by - ${obj.followed_by_count}${diffFollowed}),
      sent HTTP requests - ${obj.receivedResponses}`);

    if (resolved) {
      $('.ui-jqgrid').replaceWith('<table id="jqGrid"></table><div id="jqGridPager"></div>');
      // $('#jqGridPager').replaceWith('<div id="jqGridPager"></div>');

      // console.log(myData);
      showJQGrid(obj, fullColModel);
    }

    setTimeout(() => {
      document.getElementById('tempUiElements').remove();
      document.getElementById('details').remove();
    }, 3000);
  }

  function promiseGetFullInfo(obj, arr) {
    return new Promise(((resolve, reject) => {
      getFullInfo(obj, arr, resolve, reject);
    }));
  }

  function promiseMassFollow(obj, arr) {
    return new Promise(((resolve, reject) => {
      obj.followProcessedUsers = 0;
      obj.followedUsers = 0;
      obj.requestedUsers = 0;
      massFollow(obj, arr, resolve, reject);
    }));
  }

  function promiseMassUnFollow(obj, arr) {
    return new Promise(((resolve, reject) => {
      obj.unFollowProcessedUsers = 0;
      obj.unFollowedUsers = 0;
      massUnFollow(obj, arr, resolve, reject);
    }));
  }

  function prepareHtmlElementsUserDetails(obj, arr) {
    updateStatusDiv(`Found users ${arr.length}`);
    document.getElementById('detailedinfo_title').textContent = 'Getting the detailed info';
    htmlElements.detailedinfo.asProgress({
      namespace: 'progress',
      min: 0,
      max: arr.length,
      goal: arr.length,
      easing: 'linear',
      labelCallback(n) {
        const percentage = this.getPercentage(n);
        return `Users: ${obj.processedUsers}/${arr.length}/${percentage}%`;
      },
    });
  }

  function showJQGrid(obj, colModel) {
    userName = obj.userName;

    // modify col model if only one relationship is needed
    if ('All' !== obj.requestRelType) {
      for (let i = 0; i < colModel.length; i += 1) {
        if (colModel[i].delete === obj.requestRelType) {
          colModel.splice(i, 1);
          break;
        }
      }
    }

    $('#jqGrid').jqGrid({
      pager: '#jqGridPager',
      datatype: 'local',
      data: myData,
      rowNum: instaDefOptions.gridPageSize,
      autowidth: true,
      height: '100%',
      rownumbers: true,
      colModel,
      viewrecords: true, // show the current page, data range and total records on the toolbar
      loadonce: true,
      ignoreCase: true,
      caption: 'All' === obj.requestRelType ? `${obj.requestRelType} users of ${obj.userName}` : `${obj.userName} ${obj.requestRelType}`,
    }).jqGrid('filterToolbar', {
      searchOperators: true,
      defaultSearch: 'cn',
      searchOnEnter: false,
    }).jqGrid('navGrid', '#jqGridPager', {
      search: true,
      add: false,
      edit: false,
      del: false,
      refresh: true,
    }, {}, {}, {}, {
        multipleSearch: true,
        closeAfterSearch: true,
        closeOnEscape: true,
        searchOnEnter: true,
        showQuery: true,
      },
      {})
      .jqGrid('setGridWidth', $('#jqGrid').width() - 20); // TODO: why autowidth doesn't work? what is taken into account

    // https://stackoverflow.com/questions/9775115/get-all-rows-not-filtered-from-jqgrid
    const oldFrom = $.jgrid.from;

    $.jgrid.from = function (source, initalQuery) {
      const result = oldFrom.call(this, source, initalQuery);
      const old_select = result.select;
      result.select = function (f) {
        lastSelected = old_select.call(this, f);
        return lastSelected;
      };
      return result;
    };
  }
});

window.onload = function () {
  _gaq.push(['_trackPageview']);
};
