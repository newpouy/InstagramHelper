/* exported Db */
/* globals alert, axios, instaTimeout, instaCountdown, instaDefOptions, instaMessages */

const Db = function (settings) {
  const API_HOST = 'localhost';
  const API_USER = 'restuser';
  const API_PASS = 'testpassword12';
  const API_PORT = 8000;

  const {
    updateStatusDiv, user_id, followed_by
  } = settings;

  let run_id;
  let followers;
  let following;
  let status;
  let user;

  const config = {
    auth: {
      username: API_USER,
      password: API_PASS,
    },
  };

  function retryError(message, errorNumber, func, resolve, reject) {
    updateStatusDiv(message, 'pink');
    instaTimeout.setTimeout(3000)
      .then(() => instaCountdown.doCountdown(
        'status', errorNumber, 'DB', +(new Date()).getTime() + instaDefOptions.retryInterval, null, 'pink',
      ))
      .then(() => {
        console.log('Continue execution after HTTP error', errorNumber, new Date()); // eslint-disable-line no-console
        func(resolve, reject);
      });
  }

  function analyzeError(error, func, resolve, reject) {
    console.log(error); // eslint-disable-line no-console
    const errorCode = error.response ? error.response.status : 0;
    if (errorCode > 0) {
      console.log(`error response data - ${error.response.data}/${errorCode}`); // eslint-disable-line no-console
    }
    console.log(`Error making http request to backedn, status - ${errorCode}`); // eslint-disable-line no-console

    if (Object.prototype.hasOwnProperty.call(instaDefOptions.httpErrorMap, errorCode)) {
      console.log(`HTTP${errorCode} error trying to get your feed.`, new Date()); // eslint-disable-line no-console
      const message = instaMessages.getMessage(instaDefOptions.httpErrorMap[errorCode],
        errorCode, +instaDefOptions.retryInterval / 60000);
      retryError(message, errorCode, func, resolve, reject);
      return;
    }

    alert(instaMessages.getMessage('ERRFETCHINGUSER', errorCode));
    reject();
  }

  function postRelationshipsInternal(resolve, reject) {
    const link = `http://${API_HOST}:${API_PORT}/api/relationships/`;

    axios.post(link, {
      user_id,
      run_id,
      followers,
      following,
    }, config).then(
      response => resolve(),
      error => analyzeError(error, postRelationshipsInternal, resolve, reject),
    );
  }

  function postRelationships(_followers, _following) {
    followers = _followers;
    following = _following;
    return new Promise(function (resolve, reject) {
      postRelationshipsInternal(resolve, reject);
    });
  }

  function postRunInternal(resolve, reject) {
    const link = `http://${API_HOST}:${API_PORT}/api/run/`;
    axios.post(link, {
      user_id,
      followed_by,
    }, config).then(
      response => {
        run_id = response.data.insertId;
        resolve(run_id);
      },
      error => analyzeError(error, postRunInternal, resolve, reject),
    );
  }

  function postRun() {
    return new Promise(function (resolve, reject) {
      postRunInternal(resolve, reject);
    });
  }

  function patchRunInternal(resolve, reject) {
    const link = `http://${API_HOST}:${API_PORT}/api/run/${run_id}`;
    axios.patch(link, {
      status
    }, config).then(
      response => resolve(),
      error => analyzeError(error, postRunInternal, resolve, reject),
    );
  }

  function patchRun(_status) {
    status = _status;
    return new Promise(function (resolve, reject) {
      patchRunInternal(resolve, reject);
    });
  }

  function postUserInternal(resolve, reject) {
    const link = `http://${API_HOST}:${API_PORT}/api/user`;
    axios.post(link, user, config).then(
      response => resolve(),
      error => analyzeError(error, postRunInternal, resolve, reject),
    );
  }

  function postUser(_user) {
    user = _user;
    return new Promise(function (resolve, reject) {
      postUserInternal(resolve, reject);
    });
  }

  return {
    postRun,
    postRelationships,
    patchRun,
    postUser,
  };
};
