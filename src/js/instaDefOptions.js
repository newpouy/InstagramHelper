/* exported instaDefOptions */

const instaDefOptions = (function () {
  return {
    you: '<<YOU>>',
    defDelay: 2000,
    defFollowDelay: 35000,
    defLikeDelay: 5000, // TODO: separate parameter for Get Likes
    defPageSize: 10, // reduced from 24 to avoid HTTP400 error
    maxPageSize: 50,
    defPageSizeForFeed: 10, // how many posts to be asked for getting the feed OR user profile
    maxPageSizeForFeed: 50,
    defPageSizeForLikes: 50, // TODO: parametrize
    gridPageSize: 500,
    noDelayForInit: true, // respect requestsToSkipDelay
    requestsToSkipDelay: 100, // for insta and common users
    retryInterval: 180000,
    regFindUser: /link rel="canonical" href="https:\/\/www.instagram.com\/([^"/]*)\/?"/i,
    regExtractUserName: /instagram.com.*\/(?:\?taken-by=)?([^/?]+)\/?/, // fixes #10, respects the URL with parameters
    queryHash: {
      followed_by: '37479f2b8209594dde7facb0d904896a',
      follows: '58712303d941c6855d4e888c5f0cd22f',
      feed: '485c25657308f08317c1e4b967356828',
      profile: '42323d64886122307be10013ad2dcc44',
      likes: '1cb6ec562846122743b61e492c85999f',
      comments: '33ba35852cb50da46f5b5e889df7d159',
      hashTag: 'f92f56d47dc7a55b606908374b43a314',
    },
    httpErrorMap: {
      0: 'NOTCONNECTED',
      400: 'HTTP400',
      403: 'HTTP403',
      429: 'HTTP429',
      500: 'HTTP50X',
      502: 'HTTP50X',
      503: 'HTTP50X',
      504: 'HTTP50X',
    },
  };
}());
