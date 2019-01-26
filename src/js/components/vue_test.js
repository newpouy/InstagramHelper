var likes = new Vue({
  el: '#app',
  data: {
  },
  methods: {
    async cb(token) {
      console.log(token);
      gapi.client.setToken({ access_token: token });

      await gapi.client.load('sheets', 'v4');

      let response = await gapi.client.sheets.spreadsheets.create({
        properties: {
          title: 'TITLE'
        },
        sheets: [{
          'properties': {
            'sheetType': 'GRID',
            'sheetId': 0,
            'title': 'output'
          }
        }]

      });
      console.log(response);

      let response1 = await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: response.result.spreadsheetId,
        range: 'output',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [
            [new Date().toISOString(), "Some value 2", "Another value 2"],
            [new Date().toISOString(), "Some value 3", "Another value 3"]
          ],
        }
      });
    },
    async test() {
      chrome.identity.getAuthToken({ 'interactive': true }, this.cb);
    },
  }
});
