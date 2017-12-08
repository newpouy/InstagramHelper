/* globals confirm, chrome, $, _gaq */
/* globals instaDefOptions, instaUserInfo, followUser, exportUtils, FetchUsers */
/* jshint -W106 */

$(function () {

  'use strict';

  var myData = [];
  var userName = '';
  var cancelProcessing = false;

  var htmlElements = {
    statusDiv: document.getElementById('status'),
    follows: $('#follows'),
    followed_by: $('#followed_by'),
    detailedinfo: $('#detailedinfo')
  };

  chrome.runtime.onMessage.addListener(function (request) {
    if (request.action === 'get_insta_users') {

      var promise = instaDefOptions.you === request.userName ? instaUserInfo.getUserProfile({ username: request.viewerUserName }) : request.userName;
      Promise.all([promise]).then(values => {
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

  var updateStatusDiv = function (message, color) {
    htmlElements.statusDiv.textContent = message;
    htmlElements.statusDiv.style.color = color || 'black';
  };

  var fullColModel = [{
    label: 'User',
    name: 'profile_pic_url_hd',
    width: '320',
    align: 'center',
    sortable: false,
    formatter: function (cellvalue, model, row) {
      return `<a href='https://www.instagram.com/${row.username}' target='_blank'><img src='${cellvalue}' alt='' /></a>`;
    },
    search: false
  }, {
    label: 'Info',
    name: 'id',
    sortable: false,
    formatter: function (cellvalue, model, row) {
      var ret = `id:${row.id}<br/>username:<strong>${row.username}</strong><br/>`;
      ret += row.full_name ? `full name:<strong>${row.full_name}</strong><br/>` : '';
      ret += row.connected_fb_page ? `FB:<a href='${row.connected_fb_page}' target='_blank'>${row.connected_fb_page}</a><br/>` : '';
      ret += row.external_url ? `url:<a href='${row.external_url}' target='_blank'>${row.external_url}</a>` : '';
      return ret;
    },
    cellattr: function () {
      return 'style="white-space: normal;"';
    },
    search: false
  }, {
    label: 'Bio',
    name: 'biography',
    sortable: false,
    formatter: function (cellvalue) {
      return cellvalue ? cellvalue : '';
    },
    cellattr: function () {
      return 'style="white-space: normal;"';
    },
    search: false
  }, {
    label: 'Follows <br/>you',
    name: 'follows_viewer',
    width: '80',
    align: 'center',
    stype: 'select',
    searchoptions: {
      sopt: ['eq'],
      value: ':Any;true:Yes;false:No;null:Requested you'
    },
    formatter: function (cellvalue, model, row) {
      var className = row.has_requested_viewer ? 'ui-state-disabled' : '';
      return `<input type='checkbox'
        ${row.follows_viewer || row.has_requested_viewer ? 'checked="checked"' : ''}
        class='${className}' value='${row.follows_viewer}' offval='no' disabled='disabled'>`;
    },
    cellattr: function () {
      return 'style="background-color: #fbf9ee;" title="Follows you"';
    },
    search: true
  }, {
    label: 'Followed <br>by you',
    name: 'followed_by_viewer',
    width: '80',
    align: 'center',
    stype: 'select',
    searchoptions: {
      sopt: ['eq'],
      value: ':Any;true:Yes;false:No;null:Requested by you'
    },
    formatter: function (cellvalue, model, row) {
      var className = row.requested_by_viewer ? 'ui-state-disabled' : '';
      return `<input type='checkbox'
        ${row.followed_by_viewer || row.requested_by_viewer ? 'checked="checked"' : ''}
        class='${className}' value='${row.followed_by_viewer}' offval='no' disabled='disabled'>`;
    },
    cellattr: function () {
      return 'style="background-color: #fbf9ee;" title="Followed by you"';
    },
    search: true
  }, {
    delete: 'follows',
    label: 'Follows <br/>user',
    name: 'user_followed_by', //relationship: followed_by - the list of the user's followers
    width: '80',
    formatter: 'checkbox',
    align: 'center',
    stype: 'select',
    searchoptions: {
      sopt: ['eq'],
      value: ':Any;true:Yes;false:No'
    },
    cellattr: function () {
      return `title="Follows ${userName}"`;
    },
    search: true
  }, {
    delete: 'followed_by',
    label: 'Followed <br/>by user',
    name: 'user_follows', //relationship: follows - from the list of the followed person by user
    width: '80',
    formatter: 'checkbox',
    align: 'center',
    stype: 'select',
    searchoptions: {
      sopt: ['eq'],
      value: ':Any;true:Yes;false:No'
    },
    cellattr: function () {
      return `title="Followed by ${userName}"`;
    },
    search: true
  }, {
    label: 'Private',
    name: 'is_private',
    width: '80',
    formatter: 'checkbox',
    align: 'center',
    stype: 'select',
    searchoptions: {
      sopt: ['eq'],
      value: ':Any;true:Yes;false:No'
    },
    cellattr: function () {
      return 'title="Is private"';
    },
    search: true
  }, {
    label: 'Followers',
    name: 'followed_by_count',
    width: '70',
    align: 'center',
    sorttype: 'number',
    search: true,
    searchoptions: {
      sopt: ['ge', 'le', 'eq']
    },
    cellattr: function () {
      return 'title="Followers"';
    }
  }, {
    label: 'Following',
    name: 'follows_count',
    width: '70',
    align: 'center',
    sorttype: 'number',
    search: true,
    searchoptions: {
      sopt: ['ge', 'le', 'eq']
    },
    cellattr: function () {
      return 'title="Following"';
    }
  }, {
    label: 'Posts',
    name: 'media_count',
    width: '70',
    align: 'center',
    sorttype: 'number',
    search: true,
    searchoptions: {
      sopt: ['ge', 'le', 'eq']
    },
    cellattr: function () {
      return 'title="Posts"';
    }
  }];

  var simpleColModel = [{
    label: 'User',
    name: 'profile_pic_url',
    align: 'center',
    sortable: false,
    formatter: function (cellvalue, model, row) {
      return `<a href='https://www.instagram.com/${row.username}' target='_blank'><img src='${cellvalue}' alt='' /></a>`;
    },
    search: false
  }, {
    label: 'Info',
    name: 'id',
    sortable: false,
    formatter: function (cellvalue, model, row) {
      var ret = `id:${row.id}<br/>username:<strong>${row.username}</strong><br/>`;
      ret += row.full_name ? `full name:<strong>${row.full_name}</strong><br/>` : '';
      return ret;
    },
    cellattr: function () {
      return 'style="white-space: normal;"';
    },
    search: false
  }, {
    label: 'Followed <br>by you',
    name: 'followed_by_viewer',
    width: '80',
    align: 'center',
    stype: 'select',
    searchoptions: {
      sopt: ['eq'],
      value: ':Any;true:Yes;false:No;null:Requested by you'
    },
    formatter: function (cellvalue, model, row) {
      var className = row.requested_by_viewer ? 'ui-state-disabled' : '';
      return `<input type='checkbox'
        ${row.followed_by_viewer || row.requested_by_viewer ? 'checked="checked"' : ''}
        class='${className}' value='${row.followed_by_viewer}' offval='no' disabled='disabled'>`;
    },
    cellattr: function () {
      return 'style="background-color: #fbf9ee;" title="Followed by you"';
    },
    search: true
  }, {
    delete: 'follows',
    label: 'Follows <br/>user',
    name: 'user_followed_by', //relationship: followed_by - the list of the user's followers
    width: '80',
    formatter: 'checkbox',
    align: 'center',
    stype: 'select',
    searchoptions: {
      sopt: ['eq'],
      value: ':Any;true:Yes;false:No'
    },
    cellattr: function () {
      return `title="Follows ${userName}"`;
    },
    search: true
  }, {
    delete: 'followed_by',
    label: 'Followed <br/>by user',
    name: 'user_follows', //relationship: follows - from the list of the followed person by user
    width: '80',
    formatter: 'checkbox',
    align: 'center',
    stype: 'select',
    searchoptions: {
      sopt: ['eq'],
      value: ':Any;true:Yes;false:No'
    },
    cellattr: function () {
      return `title="Followed by ${userName}"`;
    },
    search: true
  }];



  function startFetching(request) {

    var fetchSettings = {
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
      checkDuplicates: myData.length > 0, //probably we are starting with already opened page , now it is obsolete, and actually should be False
      limit: request.limit, //return only first Nth found
      follows_count: request.follows_count,
      followed_by_count: request.followed_by_count,
      follows_processed: 0,
      followed_by_processed: 0,
      startTime: new Date(),
      timerInterval: startTimer(document.querySelector('#timer'), new Date()),
      receivedResponses: 0,	//received HTTP responses
      processedUsers: 0, 	//processed users in get full info
      followProcessedUsers: 0, //processed users for mass follow
      followedUsers: 0,
      requestedUsers: 0,
      viewerUserId: request.viewerUserId
    };
    prepareHtmlElements(fetchSettings);
    promiseFetchInstaUsers(fetchSettings).then(function (obj) {

      showJQGrid(obj, simpleColModel);
      showDetailsDiv(obj);

      prepareHtmlElementsUserDetails(fetchSettings, myData);

      $('#massFollow').on('click', function () {
        if (confirm(`Following will be done with the interval of ${request.followDelay / 1000}sec.\nYou can change the interval value in the settings.
                    \nDon't set it to too small value, because Instagrm.com potentially could ban your account for doing that.
                    \n\nContinue?`)) {
          promiseMassFollow(fetchSettings, myData).then(function () {
            updateStatusDiv(
              `Completed: ${fetchSettings.followProcessedUsers}
                processed/${fetchSettings.followedUsers}
                followed/${fetchSettings.requestedUsers} requested`);
          });
        }
      });

      promiseGetFullInfo(fetchSettings, myData).then(function () {
        generationCompleted(fetchSettings, true);
      }).catch(function () {
        generationCompleted(fetchSettings, false);
      });
    });
  }

  function getFullInfo(obj, arr, resolve, reject) {
    //console.log(arr[obj.processedUsers]);
    instaUserInfo.getUserProfile(
      {
        username: arr[obj.processedUsers].username,
        userId: arr[obj.processedUsers].id,
        updateStatusDiv: updateStatusDiv
      }).then(function (user) {
        //todo: delete user when JSON is not returned by get user profile?
        myData[obj.processedUsers] = $.extend({}, myData[obj.processedUsers], user);
        obj.receivedResponses++;
        htmlElements.detailedinfo.asProgress('go', obj.processedUsers++);
        updateStatusDiv(`Getting detailed info for users: ${obj.processedUsers} of ${arr.length}`);
        if (obj.processedUsers === arr.length) {
          resolve();
          return;
        }
        if (cancelProcessing) {
          reject();
          return;
        }
        setTimeout(function () {
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

    //console.log(obj);
    //console.log(arr[obj.followProcessedUsers]);

    if ((arr[obj.followProcessedUsers].followed_by_viewer === null) ||
      (arr[obj.followProcessedUsers].followed_by_viewer)) { //requested or already followed
      //console.log(`${arr[obj.followProcessedUsers].username} is already followed or requested.`);
      obj.followProcessedUsers++;
      massFollow(obj, arr, resolve, reject);
    } else if (arr[obj.followProcessedUsers].id === obj.viewerUserId) { //shame - it is me
      //console.log('it is me', arr[obj.followProcessedUsers].id);
      obj.followProcessedUsers++;
      massFollow(obj, arr, resolve, reject);
    } else { //is not followed yet
      var username = arr[obj.followProcessedUsers].username;
      var userId = arr[obj.followProcessedUsers].id;
      console.log(`${username} is not followed yet.`); // eslint-disable-line no-console
      updateStatusDiv(
        `${username} is not followed yet:
          processed ${obj.followProcessedUsers + 1} of ${arr.length}/
          followed - ${obj.followedUsers}/requested - ${obj.requestedUsers}`);
      followUser.follow(
        {
          username: username,
          userId: userId,
          csrfToken: obj.csrfToken,
          updateStatusDiv: updateStatusDiv
        }).then(function (result) {
          obj.followProcessedUsers++;
          obj.receivedResponses++;
          if ('following' === result) {
            obj.followedUsers++;
          } else if ('requested' === result) {
            obj.requestedUsers++;
          } else {
            console.log('Not recognized result - ' + result); // eslint-disable-line no-console
          }
          updateStatusDiv(
            `The request to follow ${username} was successful -
              ${result}/processed ${obj.followProcessedUsers + 1} of ${arr.length}/
              followed - ${obj.followedUsers}/requested - ${obj.requestedUsers}`);
          setTimeout(function () {
            massFollow(obj, arr, resolve, reject);
          }, obj.followDelay);
        });
    }

  }


  function promiseFetchInstaUsers(obj) {
    return new Promise(function (resolve) {

      var f = new FetchUsers(Object.assign({}, {
        obj, myData, htmlElements, updateStatusDiv, resolve
      }));

      f.fetchInstaUsers();
    });
  }

  function startTimer(timer, startTime) {

    return setInterval(function () {
      var ms = parseInt(new Date() - startTime);
      var x = ms / 1000;
      var seconds = parseInt(x % 60, 10);
      x /= 60;
      var minutes = parseInt(x % 60, 10);
      x /= 60;
      var hours = parseInt(x % 24, 10);
      timer.textContent =
        `${hours}h:${'00'.substring(0, 2 - ('' + minutes).length) + minutes}m:${'00'.substring(0, 2 - ('' + seconds).length) + seconds}s`;
    }, 1000);
  }

  function showDetailsDiv(obj) {

    $('#details').show();
    $('#exportDiv').show();

    $('#export_XLSX').on('click', function () {
      $('#jqGrid').jqGrid('exportToExcel', {
        includeLabels: true,
        includeGroupHeader: false,
        includeFooter: false,
        fileName:
        `${obj.requestRelType}_users_${obj.userName}${obj.limit > 0 ? '_limit_' + obj.limit : ''}_${exportUtils.formatDate(new Date())}.xlsx`,
        replaceStr: exportUtils.replaceStr
      });
    });

    $('#cancelDetInfo').on('click', () => cancelProcessing = confirm('Do you want to cancel?'));

  }

  function prepareFollowedElements(obj) {
    var followed_by_count = ((obj.limit > 0) && (obj.limit < obj.followed_by_count)) ? obj.limit : obj.followed_by_count;
    var followedChanged = (obj.limit > 0) && (obj.limit < obj.followed_by_count);
    if (obj.callBoth || ('followed_by' === obj.relType)) {
      document.getElementById('followed_by_title').textContent =
        `${obj.userName} is followed by ${obj.followed_by_count} users`;
      if (followedChanged) {
        document.getElementById('followed_by_title').textContent +=
          `; you set the return limit, therefore the collection will be stopped when ${followed_by_count}+ returned`;
      }
      document.getElementById('followed_by_title').style.display = 'block';
      htmlElements.followed_by.show().asProgress({
        namespace: 'progress',
        min: 0,
        max: followed_by_count,
        goal: followed_by_count,
        labelCallback(n) {
          const percentage = this.getPercentage(n);
          return `Followed by:${obj.followed_by_processed}/${followed_by_count}/${percentage}%`;
        }
      });
    }
  }

  function prepareFollowsElements(obj) {
    var follows_count = ((obj.limit > 0) && (obj.limit < obj.follows_count)) ? obj.limit : obj.follows_count;
    var followsChanged = (obj.limit > 0) && (obj.limit < obj.follows_count);
    if (obj.callBoth || ('follows' === obj.relType)) {
      document.getElementById('follows_title').textContent =
        `${obj.userName} follows ${obj.follows_count} users`;
      if (followsChanged) {
        document.getElementById('follows_title').textContent +=
          `; you set the return limit, therefore the collection will be stopped when ${follows_count}+ returned`;
      }
      document.getElementById('follows_title').style.display = 'block';
      htmlElements.follows.show().asProgress({
        namespace: 'progress',
        min: 0,
        max: follows_count,
        goal: follows_count,
        labelCallback(n) {
          const percentage = this.getPercentage(n);
          return `Follows:${obj.follows_processed}/${follows_count}/${percentage}%`;
        }
      });
    }
  }

  function prepareHtmlElements(obj) {

    prepareFollowedElements(obj);
    prepareFollowsElements(obj);
  }

  function generationCompleted(obj, resolved) {
    clearInterval(obj.timerInterval);
    var timer = document.querySelector('#timer');
    htmlElements.detailedinfo.asProgress('finish').asProgress('stop');
    document.getElementById('cancelDetInfo').remove();

    var diffFollowed = '', diffFollows = '';
    if (obj.followed_by_count !== obj.followed_by_processed) {
      diffFollowed = `(actually returned ${obj.followed_by_processed})`;
    }
    if (obj.follows_count !== obj.follows_processed) {
      diffFollows = `(actually returned ${obj.follows_processed})`;
    }

    updateStatusDiv(`Completed${obj.limit > 0 ? ' with limit ' + obj.limit : ''}${!resolved ? ', detailed info collection was cancelled' : ''},
			spent time - ${timer.textContent},
			created list length - ${myData.length} (follows - ${obj.follows_count}${diffFollows},
			followed by - ${obj.followed_by_count}${diffFollowed}),
			sent HTTP requests - ${obj.receivedResponses}`);

    if (resolved) {
      $('.ui-jqgrid').replaceWith('<table id="jqGrid"></table>');
      showJQGrid(obj, fullColModel);
    }

    setTimeout(function () {
      document.getElementById('tempUiElements').remove();
      document.getElementById('details').remove();
    }, 3000);
  }

  function promiseGetFullInfo(obj, arr) {
    return new Promise(function (resolve, reject) {
      getFullInfo(obj, arr, resolve, reject);
    });
  }

  function promiseMassFollow(obj, arr) {
    return new Promise(function (resolve, reject) {
      obj.followProcessedUsers = 0;
      obj.followedUsers = 0;
      obj.requestedUsers = 0;
      massFollow(obj, arr, resolve, reject);
    });
  }

  function prepareHtmlElementsUserDetails(obj, arr) {
    updateStatusDiv(`Found users ${arr.length}`);
    document.getElementById('detailedinfo_title').textContent = 'Getting the detailed info';
    htmlElements.detailedinfo.asProgress({
      namespace: 'progress',
      min: 0,
      max: arr.length,
      goal: arr.length,
      labelCallback(n) {
        const percentage = this.getPercentage(n);
        return `Users: ${obj.processedUsers}/${arr.length}/${percentage}%`;
      }
    });
    //assign on click event if confirm
  }

  function showJQGrid(obj, colModel) {

    userName = obj.userName;

    //modify col model if only one relationship is needed
    if ('All' !== obj.requestRelType) {
      for (var i = 0; i < colModel.length; i++) {
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
      colModel: colModel,
      viewrecords: true, // show the current page, data rang and total records on the toolbar
      loadonce: true,
      caption: 'All' === obj.requestRelType ? `${obj.requestRelType} users of ${obj.userName}` : `${obj.userName} ${obj.requestRelType}`
    }).jqGrid('filterToolbar', {
      searchOperators: true
    }).jqGrid('navGrid', '#jqGridPager', {
      search: true,
      add: false,
      edit: false,
      del: false,
      refresh: true
    }, {}, {}, {}, {
        multipleSearch: true,
        closeAfterSearch: true,
        closeOnEscape: true,
        searchOnEnter: true,
        showQuery: true
      },
      {}).jqGrid('setGridWidth', $('#jqGrid').width() - 20); //TODO: why autowidth doesn't work? what is taken into account

  }


});

window.onload = function () {
  _gaq.push(['_trackPageview']);
};
