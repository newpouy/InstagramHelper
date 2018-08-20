# ![Extension's Icon](./src/img/icon32.png) [InstagramHelper](https://github.com/OllegK/InstagramHelper)
Free Chrome Extension [Helper Tools for Instagram.com](https://github.com/OllegK/InstagramHelper).

## What the Extension Does
1. Create a list of people following/followers your own or another user's account. If you want to create a list for another user's account, this account should be public, or you should follow it. **You will not be able to create a list for the private account you do not follow, so you need to be a follower of the private account if you want to generate a list for it.** The [created list](#create-a-list-of-followingfollowers) could be exported to Excel. Invoked by clicking the "Get Insta Users" on extension's popup applet.
  * When you generated a list of somebody's else followers/following, you can [follow the people from the generated list](#follow-the-users-from-the-generated-list). Some of them will follow you back.
  * When you generated a list of your followers/following, you can also [unfollow some people](#unfollow-the-users-from-the-generated-list), e.g. who don't follow you. There is a way to keep some people - this option is not very comfortable now, and probably it will be improved in future versions. For now, you need to put the IDs of people who should be kept followed in the textarea control; pay attention that it should be precisely numeric ID (not username, as the user can easily change the username, however, ID is not changeable), and each ID should be put on the separate line.  
2. Find [the common users](#find-the-common-users-between-two-instagram-accounts) between two Instagram accounts. Invoked by clicking the "Find Common Users" on extension's popup applet.
3. [Like the posts](#liker) in your feed, or in someone's else profile. Invoked by clicking the "Like the posts!" button.  
4. Calculate [the total amounts of likes](#calculate-likes-and-comments-for-profile) in your of someone's else profile, and group them by likers. Try that on your girlfriend's or boyfriend's profile to find her/his secret admirers. Invoked by clicking the "Calculate Likes/Comments for Profile" button.
5. [Mass follow/unfollow](#mass-followunfollow) the list of user IDs/usernames. Invoked by clicking the "Follow/Unfollow!" button.
6. [Mass block](#mass-block) the list of user IDs/usernames. Invoked by clicking the "Block users!" button.

## How to start
When you are on Instagram.com, the extension icon is active is enabled in Chrome's toolbar - ![Extension's Icon](./src/img/icon19.png).
You should be logged in Instagram.com for the extension to work correctly.

Click on it, and extension's popup applet appears.  

![Extension's Popup Applet](https://raw.githubusercontent.com/OllegK/InstagramHelper/master/img/extPopupApplet.png)

## Create a List of Following/Followers
1. When you are on Instagram.com, click the extension's icon. The extension's popup applet is displayed. 
2. The extension tries to guess the username from the context, if the username cannot be found, it sets <<YOU>> as username. It means it will generate the list of your followers/following. You can keep it, or you can another username to generate the list of its followers/following. Please remember that **you will not be able to create a list for the private account you do not follow.**  
3. You can also change the scope of the list to be generated. The default value "All" means that the generated list includes followers and following. You can select followers of following only. Also, the extension allows limiting the amount of fetched users to Nth first returned users. From my observation, the latest followers/following users are returned in the beginning, therefore limiting the output could be useful to get the latest relationships only. If the value is 0 (default value), the limit is not applied. The limit is applied independently to both relationships: followers and following, it means if the limit is 1000, the extension fetches 1000 followers and 1000 following persons when requested relationship is All (followers and following). Therefore the length of the created list could be about 2000 users, depending on how much followers and following intersect. Also, the setting limit to 1000, doesn't mean that exactly 1000 users will be returned in the output, the total amount of returned users could be a little bit higher depending on the amount of users returned by 1 requests.

4. Click the "Get Insta Users" button. The process starts, just wait for the process to be completed. Please read [below](#How-to-Make-the-Process-Faster) how to make the process faster. The first results are displayed just when all users are fetched from Instagram.com. However these first results are not detailed enough, they only display the username, the small picture of the profile, and several other attributes. The getting the detailed info continues in the background, and when it completes, the list with detailed info is displayed.  
 
If not detailed info is enough for you, you can cancel getting the detailed info by clicking "Cancel getting the detailed info" button. 

### Export the Generate List into Excel
If you have a long list with more than 100k+ accounts, the export could take significant time. During this time the tab is not responsive, and you could assume that the process hangs. Please be patient and just wait, it will be finished successfully. One time I tried the export of 100k+ users, and it took about 30 minutes.

### How to Make the Process Faster
Change the extension's options. Right click on the extension's icon in Chrome's toolbar, the context menu will be displayed. 

![Extension's Context Menu](https://raw.githubusercontent.com/OllegK/InstagramHelper/master/img/ContextMenu.png)

Select the Options item and the Options dialog appears.

![Extension's Options Dialog](https://raw.githubusercontent.com/OllegK/InstagramHelper/master/img/OptionsDialog.png)

The picture above displays the default values, if you have never changed the options, you will have the same values as on this picture.

Two options that could improve the performance of the process, but adjust them wisely:
1. "Page size for fetching users (insta and common users):". The default value is 10, and the maximum allowed value is 
50. 50 works for me, however some users reported the constant HTTP400 error when the value is increased. Try to increase the value and start the process. If you have the constant HTTP400 error, try to decrease the value and restart the process. Read also [Constant HTTP400 error](https://instascraper.weebly.com/blog/constant-http400-error).
2. "Interval between fetching users requests (insta and common), ms:". If the value of delay is too small, the Instagram.com can return HTTP429 error (too many requests, try several minutes later). 

The changes will be effective when a new process will start.

Also try to keep the tab active when the process is running, as the Chrome slows down the JavaScript execution for background tabs.

### Follow the Users From the Generated List
When the list of following/followers is displayed, you can apply some filter conditions using the comboboxes and inputs controls in the columns' titles. Click the "Follow all not followed/not requested DISPLAYED users" button. It will display the confirmation dialog. 

![Follow Confirmation Dialog](https://raw.githubusercontent.com/OllegK/InstagramHelper/master/img/FollowConfirmation.png)

When you click the OK button, the process starts. 

### Unfollow the Users From the Generated List
When the list of following/followers is displayed, you can apply some filter conditions using the comboboxes and inputs controls in the columns' titles. Click the "Unfollow ALL DISPLAYED users" button. It will display the text area where you can specify the users to be kept following. 

![Unfollow Text Area](https://raw.githubusercontent.com/OllegK/InstagramHelper/master/img/UnfollowTextAra.png)

If you want to keep following some accounts, you can put the IDs of these accounts into the text area control. Please pay attention that it should be the user id, not username. Each user id should be put on the separate line. Click the "Start Unfollowing" button, confirm, and the process starts.

About follow/unfollow read also [here](https://instascraper.weebly.com/blog/mass-followunfollow)

Read also [Unfollow users who do not follow you](https://instascraper.weebly.com/blog/unfollow-users-who-do-not-follow-you).

## Find the Common Users Between Two Instagram Accounts
On the extension's popup applet specify the usernames to be compared in the following input boxes:
* Username 1
* Username 2

Both users should be either public accounts, or the private accounts you follow. Click the "Find Common Users" button, and wait for the process to be finished.

The generated list could be exported [into Excel](#export-the-generate-list-into-excel).

Read also about [options to make the process faster](#how-to-make-the-process-faster).

## Liker
On the extension's popup applet, click the "Like the posts!" button.

A new tab is opened.

![Liker](https://raw.githubusercontent.com/OllegK/InstagramHelper/master/img/Liker.png)

Before starting the process, you can change the execution options:
* You can like the posts in your feed or the posts in someone's else profile. The default option is liking the posts in your feed (I want to like... The posts in my feed).
* Skip the video posts (default option)
* Skip your own posts (default option)
* Like the post only if it already has the certain amount of likes. Default option is 2. The intention is to avoid liking the racist or discrimination posts. You can set it 0 to disable this option.   

Set the stop criterion:
* when a certain amount of posts is liked. Default option and default amount to be liked is 100.
* when an already liked post met

To start the process, click the "LIKE THE POSTS!" button.

### Randomization of Delay Interval
If you change the value of delay, the change is effective immediately.

There is an option to randomize the delay between requests, when you provide the value for the random delay. 

## Calculate Likes and Comments for Profile
On the extension's popup applet, click the "Calculate Likes/Comments for Profile" button.

A new tab is opened.

![Likes](https://raw.githubusercontent.com/OllegK/InstagramHelper/master/img/Likes.png)

To start the process, click the "CALCULATE LIKES!" button.

When it is completed, it displays all users who liked (also optionally commented if the "Get comments" checkbox was checked) the posts on this profile. The row in the table could be expanded by clicking on to display the liked and commented posts by this user. If you are calculating the likes on your profile, it makes sense to click the "ADD FOLLOWERS!" button to find the followers who never liked your post. The created list could be exported into Excel.

The [same delays' randomization rules](#randomization-of-delay-interval) as for Liker are effective.

## Mass follow/unfollow
On the extension's popup applet, click the "Follow/Unfollow!" button.

The [same delays' randomization rules](#randomization-of-delay-interval) as for Liker are effective.

About follow/unfollow read also [here](https://instascraper.weebly.com/blog/mass-followunfollow)

Read also the blog about possible following issues ["If you cannot follow more accounts"]  (https://instascraper.weebly.com/blog/if-you-cannot-follow-more-accounts).

## Mass block
On the extension's popup applet, click the "Block users!" button.

The functionality and behavior is very similar to [Mass follow/unfollow](#mass-followunfollow).

The [same delays' randomization rules](#randomization-of-delay-interval) as for Liker are effective.

## Possible HTTP Errors
The extension is built to handle the different HTTP errors and retry with the interval of three minutes. Sometimes one retry is not enough, the error repeats, and the countdown begins again. Please be patient and wait, in the most cases it disappears sooner or later.

If you are facing the constant HTTP400 error, please read [Constant HTTP400 error](https://instascraper.weebly.com/blog/constant-http400-error). 

## Links
* [Github](https://github.com/OllegK/InstagramHelper)
* [Web page](https://instascraper.weebly.com/)
* [Extension on Chrome Web Store](https://chrome.google.com/webstore/detail/helper-tools-for-instagra/hcdbfckhdcpepllecbkaaojfgipnpbpb)

## Refresh the inactive tab
When a tab is not active for a long time, the Chrome could refresh it when 

Please try to keep the tab active, it is also described [here](https://superuser.com/questions/1048029/disable-auto-refresh-tabs-in-chrome-desktop#comment1467739_1048029) how to disable this behavior.

## Donations
This extension is free, however if you would like to donate:   
* BTC: 1LtKe6AKDvJ1nhZjPwRBnJe4QovqxhLRjN  
* BCH: 1NgX5ywvuAPTvz6y6tU3kfTvv7NHH8YoKp  
* LTC: LW55k6MD8WBuV8NUxEXBBXeRv3vzzF3tfN  
* ETH: 0x2EB4DB0cA8100E749BDB2D52844A96c86863Ae92  
