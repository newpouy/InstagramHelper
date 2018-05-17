/* exported instaDefOptions */
/* jshint -W106 */

var instaDefOptions = (function () {
  return {
    you: '<<YOU>>',
    defDelay: 2000,
    defFollowDelay: 30000,
    defLikeDelay: 7000,
    defPageSize: 10, //reduced from 24 to avoid HTTP400 error
    maxPageSize: 50,
    defPageSizeForFeed: 10, // how many posts to be asked for getting the feed OR user profile
    maxPageSizeForFeed: 50,
    defPageSizeForLikes: 50, // TODO: parametrize
    gridPageSize: 500,
    noDelayForInit: true,
    requestsToSkipDelay: 100,
    retryInterval: 180000,
    regFindUser: /link rel="canonical" href="https:\/\/www.instagram.com\/([^"/]*)\/?"/i,
    regExtractUserName: /instagram.com.*\/(?:\?taken-by=)?([^/?]+)\/?/, // fixes #10, respects the URL with parameters
    // regCheckBox: /^\s*<\s*input.+type\s*=\s*"checkbox".+value\s*=\s*(?:"|')\s*(true|false)/i,
    regCheckBox: /checkbox[\s\S]*value\s*=\s*(?:"|')(true|false)/i,
    regProfile: /^\s*<\s*a\s.*href\s*=\s*(?:"|')([^"']+)/i,
    regTestInfo: /^\s*username:/,
    cleanInfo: /<\/?.[^>]*>/g,
    newLine: /<br\s*\/>(?=.)/gi, //should be followed by at least one symbol
    queryId: {
      followed_by: '17851374694183129',
      follows: '17874545323001329',
      feed: '17842794232208280',
      profile: '17888483320059182',
      likes: '17864450716183058'
    },
    queryHash: {
      followed_by: '37479f2b8209594dde7facb0d904896a',
      follows: '58712303d941c6855d4e888c5f0cd22f',
      feed: '485c25657308f08317c1e4b967356828',
      profile: '42323d64886122307be10013ad2dcc44',
      likes: '1cb6ec562846122743b61e492c85999f'
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
