/* exported instaDefOptions */
/* jshint -W106 */

var instaDefOptions = (function () {
  return {
    you: '<<YOU>>',
    defDelay: 1000,
    defFollowDelay: 3000,
    defLikeDelay: 3000,
    defPageSize: 20,
    defFetchMedia: 12, //how many posts to requests in getting the feed //not sure if a big amount helps to speed up the process
    gridPageSize: 500,
    noDelayForInit: true,
    requestsToSkipDelay: 100,
    retryInterval: 180000,
    regFindUser: /link rel="canonical" href="https:\/\/www.instagram.com\/([^"/]*)\/?"/i,
    regExtractUserName: /instagram.com.*\/(?:\?taken-by=)?([^/]+)\/?$/,
    regCheckBox: /^\s*<\s*input.+type\s*=\s*"checkbox".+value\s*=\s*(?:"|')\s*(true|false)/i,
    regProfile: /^\s*<\s*a\s.*href\s*=\s*(?:"|')([^"']+)/i,
    regTestInfo: /^\s*id:/,
    cleanInfo: /<\/?.[^>]*>/g,
    newLine: /<br\s*\/>(?=.)/gi, //should be followed by at least one symbol
    queryId: {
      followed_by: '17851374694183129',
      follows: '17874545323001329',
      feed: '17842794232208280',
      profile: '17888483320059182'
    },
    httpErrorMap: {
      0: 'NOTCONNECTED',
      400: 'HTTP400',
      403: 'HTTP403',
      429: 'HTTP429',
      500: 'HTTP50X',
      502: 'HTTP50X',
      503: 'HTTP50X',
      504: 'HTTP50X'
    }
  };
}());
