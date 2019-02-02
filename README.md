**![Extension's Icon](./src/img/icon32.png) [InstagramHelper](https://github.com/OllegK/InstagramHelper)**

Free Chrome Extension [Helper Tools for Instagram.com](https://github.com/OllegK/InstagramHelper).

# Please fill the [Helper Tools for Instagram.com Survey](https://goo.gl/forms/yoLiFqAPtwH41HlH3). There are only two required to answer questions, so filling the survey will take several minutes, and it will help to make it better.

- [What the Extension Does](#what-the-extension-does)
- [How to start](#how-to-start)
- [Create a List of Following/Followers](#create-a-list-of-followingfollowers)
    - [How to Generate a List](#how-to-generate-a-list)
    - [How the Generated List Looks](#how-the-generated-list-looks)
    - [Export the Generate List into Excel](#export-the-generate-list-into-excel)
    - [How to Make the Process Faster](#how-to-make-the-process-faster)
    - [Follow the Users From the Generated List](#follow-the-users-from-the-generated-list)
    - [Unfollow the Users From the Generated List](#unfollow-the-users-from-the-generated-list)
- [Find the Common Users Between Two Instagram Accounts](#find-the-common-users-between-two-instagram-accounts)
- [Liker](#liker)
    - [Randomization of Delay Interval](#randomization-of-delay-interval)
- [Calculate Likes and Comments for Profile](#calculate-likes-and-comments-for-profile)
- [Mass follow/unfollow](#mass-followunfollow)
- [Mass block/unblock](#mass-blockunblock)
- [Some Usage Tips](#some-usage-tips)
- [Known Issues](#known-issues)
    - [Possible HTTP Errors](#possible-http-errors)
        - [Constant HTTP400 error](#constant-http400-error)
        - [Constant HTTP502 error](#constant-http502-error)
    - [Refresh the inactive tab](#refresh-the-inactive-tab)
- [How to Report Defects](#how-to-report-defects)
- [Links](#links)
- [Donations](#donations)


# What the Extension Does

1. Create a list of people following/followers your own or another user's account. If you want to create a list for another user's account, this account should be public, or you should follow it. **You will not be able to create a list for the private account you do not follow, so you need to be a follower of the private account if you want to generate a list for it.** The [created list](#create-a-list-of-followingfollowers) could be exported to Excel (supported output formats are XLSX and CSV). Invoked by clicking the "Get Insta Users" on extension's popup applet.
    * When you generated a list of somebody's else followers/following, you can [follow the people from the generated list](#follow-the-users-from-the-generated-list). Some of them will follow you back.
    * When you generated a list of your followers/following, you can also [unfollow some people](#unfollow-the-users-from-the-generated-list), e.g. who don't follow you. There is a way to keep some people - this option is not very comfortable now, and probably it will be improved in future versions. For now, you need to put the IDs of people who should be kept followed in the textarea control; pay attention that it should be precisely numeric ID (not username, as the user can easily change the username, however, ID is not changeable), and each ID should be put on the separate line.  
2. Find [the common users](#find-the-common-users-between-two-instagram-accounts) between two Instagram accounts. Invoked by clicking the "Find Common Users" on extension's popup applet.
3. [Like the posts](#liker) in your feed, or in someone's else profile. Invoked by clicking the "Like the posts!" button.  
4. Calculate [the total amounts of likes](#calculate-likes-and-comments-for-profile) in your of someone's else profile, and group them by likers. Try that on your girlfriend's or boyfriend's profile to find her/his secret admirers. Invoked by clicking the "Calculate Likes/Comments for Profile" button.
5. [Mass follow/unfollow](#mass-followunfollow) the list of user IDs/usernames. Invoked by clicking the "Follow/Unfollow!" button.
6. [Mass block/unblock](#mass-blockunblock) the list of user IDs/usernames. Invoked by clicking the "Block users!" button.


# How to start

When you are on Instagram.com, the extension icon is active is enabled in Chrome's toolbar - ![Extension's Icon](./src/img/icon19.png).
You should be logged in Instagram.com for the extension to work correctly.

Click on it, and extension's popup applet appears.  

![Extension's Popup Applet](https://raw.githubusercontent.com/OllegK/InstagramHelper/master/img/extPopupApplet.png)

**Please also read [How to Make the Process Faster](#how-to-make-the-process-faster) and try to adjust the page size settings as described there.**

# Create a List of Following/Followers

## How to Generate a List

1. When you are on Instagram.com, click the extension's icon. The extension's popup applet is displayed. 
2. The extension tries to guess the username from the URL, if the username cannot be found, it sets <<YOU>> as username. It means it will generate the list of your followers/following; *the extension just don't know your username at this point, it is a reason why such alias is used*. You can keep it, or you can another username to generate the list of its followers/following. Please remember that **you will not be able to create a list for the private account you do not follow.**  
3. You can also change the scope of the list to be generated. The default value "All" means that the generated list includes followers and following. You can select followers (User is Followed by) of following (User Follows) only. Reducing the scope makes the process faster, but please take into account that it affects the generated list. If you choose:

    * the followers only, the generated list won't have the "Followed by user" column 
    * the following only, the generated list won't have the "Follows user" column

4. Also, the extension allows limiting the amount of fetched users to **Nth** first returned users. From my observation, the latest followers/following users are returned in the beginning, therefore limiting the output could be useful to get the latest relationships only. If the value is 0 (default value), the limit is not applied. The limit is applied independently to both relationships: followers and following, it means if the limit is 1000, the extension fetches 1000 followers and 1000 following persons when requested relationship is All (followers and following). Therefore the length of the created list could be about 2000 users, depending on how much followers and following intersect. Also, the setting limit to 1000, doesn't mean that exactly 1000 users will be returned in the output, the total amount of returned users could be a little bit higher depending on the amount of users returned by one HTTP requests.
5. Click the "Get Insta Users" button. The process starts, just wait for the process to be completed. Please read [below](#How-to-Make-the-Process-Faster) how to make the process faster.  

## How the Generated List Looks

The collected information displayed in two steps:
1. Short List. This list is displayed first when all followers/following of the requested account were fetched. However these first results are not detailed enough, they only display the username, the small picture of the profile, and several other attributes. 
2. Detailed Info List. The generation of this list starts immediately when the generation of a short list is completed unless you didn't uncheck the "Start detailed info collection when a short list is generated" checkbox. The getting the detailed info continues in the background, and when it completes, the detailed info list replaces the short list. You can stop the detailed info list generation by clicking the "Cancel getting the detailed info" button. The separate HTTP request should be sent for each account on the list to collect the detailed info; therefore, this process could be really time-consuming when you have a lot of accounts on your list. 

The table below explains the information displayed in the short list and in the detailed list.

| Information            | Short List           | Detailed Info List  | Comment                                                           | 
|------------------------|:--------------------:|:-------------------:|-------------------------------------------------------------------|
| User's profile picture | Small                | Large if available  |                                                                   |
| User Id                | Yes                  | Yes                 |                                                                   |
| Info                   | Username + Full Name | + FB page + Ext URL |                                                                   |
| Bio                    | -                    | Yes                 |                                                                   |
| Follows you            | -                    | Yes                 |                                                                   |
| Followed by you        | Yes                  | Yes                 |                                                                   |
| Follows user           | Yes                  | Yes                 | Not displayed if only "User Follows" was selected                 |
| Followed by user       | Yes                  | Yes                 | Not displayed if only "User is Followed by" was selected          |
| Private                | -                    | Yes                 | Indicates if an account is private or public                      |
| Followers              | -                    | Yes                 | A number of followers                                             |
| Following              | -                    | Yes                 | A number of accounts an account if following                      |
| Posts                  | -                    | Yes                 | A number of posts                                                 |
| Date of latest post    | -                    | Yes                 | Displayed only if you follow an account or an account is public   |

If you generated a list on your profile, a user and you is the same person :) Therefore `Followed by you` and `Followed by user` display the same info, and also `Follows you` and `Follows user`.

See the pictures below that displays the short list's header and detailed info list's header.

![Short List](https://raw.githubusercontent.com/OllegK/InstagramHelper/master/img/Short.png)

![Detailed Info List](https://raw.githubusercontent.com/OllegK/InstagramHelper/master/img/Detailed.png)

Both lists have sorting and search capabilities.

## Export the Generate List into Excel

When the short list or the detailed info list is displayed, it could be exported into Excel by clicking the "Export to Excel" button. 

The export is useful to get the list of user IDs or usernames that could be used as an input for mass follow/unfollow/block.

If you exported the short list when the detailed info being collected, the records already processed have the detailed information in the exported file. 

If you have a long list with more than 100k+ accounts, the XLSX-export could take significant time. During this time the tab is not responsive, and you could assume that the process hangs. Please be patient and just wait, it will be finished successfully. One time I tried the XLSX-export of 100k+ users (without detailed info), and it took about 30 minutes; the same export to CSV was completed in less than 1 minute.

There are two supported output formats:
* XLSX (default option)
* CSV. CSV export works faster and consumes less memory; however, anyway depending on different criteria, it seems that the attempt to export more than 100-120k records with detailed info collected brings to the crash.

Please note that the Excel output includes some not-displayed in the grid information, e.g. indication if an user is verified AND if an user is a business user.

## How to Make the Process Faster

Change the extension's options. Right click on the extension's icon in Chrome's toolbar, the context menu will be displayed. 

![Extension's Context Menu](https://raw.githubusercontent.com/OllegK/InstagramHelper/master/img/ContextMenu.png)

Select the `Options` menu item and the Options dialog appears.

![Extension's Options Dialog](https://raw.githubusercontent.com/OllegK/InstagramHelper/master/img/OptionsDialog.png)

The picture above displays the default values, if you have never changed the options, you will see the same values as on this picture.

Two options that could improve the performance of the process, but adjust them wisely:
1. "Page size for fetching users (insta and common users):". The default value is 10, and the maximum allowed value is 50. 50 works for me, however some users reported the constant HTTP400 error when the value is increased. Try to increase the value and start the process. If you have the constant HTTP400 error, try to decrease the value and restart the process. Read also [Constant HTTP400 error](https://instascraper.weebly.com/blog/constant-http400-error). **This is the easiest option to make the process faster**. 
2. "Interval between fetching users requests (insta and common), ms:". If the value of delay is too small, the Instagram.com can return HTTP429 error (too many requests, try several minutes later). 

The changes will be effective when a new process will start.

Also try to keep the tab active when the process is running, as the Chrome slows down the JavaScript execution for background tabs.

## Follow the Users From the Generated List

When the list of following/followers is displayed, you can apply some filter conditions using the comboboxes and inputs controls in the columns' titles. Click the "Follow all not followed/not requested DISPLAYED users" button. It will display the confirmation dialog. 

![Follow Confirmation Dialog](https://raw.githubusercontent.com/OllegK/InstagramHelper/master/img/FollowConfirmation.png)

When you click the OK button, the process starts. 

## Unfollow the Users From the Generated List

When the list of following/followers is displayed, you can apply some filter conditions using the comboboxes and inputs controls in the columns' titles. Click the "Unfollow ALL DISPLAYED users" button. It will display the text area where you can specify the users to be kept following. 

![Unfollow Text Area](https://raw.githubusercontent.com/OllegK/InstagramHelper/master/img/UnfollowTextAra.png)

If you want to keep following some accounts, you can put the IDs of these accounts into the text area control. Please pay attention that it should be the user id, not username. Each user id should be put on the separate line. Click the "Start Unfollowing" button, confirm, and the process starts.

About follow/unfollow read also [here](https://instascraper.weebly.com/blog/mass-followunfollow)

Read also [Unfollow users who do not follow you](https://instascraper.weebly.com/blog/unfollow-users-who-do-not-follow-you).


# Find the Common Users Between Two Instagram Accounts

On the extension's popup applet specify the usernames to be compared in the following input boxes:
* Username 1
* Username 2

Both users should be either public accounts, or the private accounts you follow. Click the "Find Common Users" button, and wait for the process to be finished.

The generated list could be exported [into Excel](#export-the-generate-list-into-excel). The output supported formats are XLSX/CSV.

Read also about [options to make the process faster](#how-to-make-the-process-faster).


# Liker

On the extension's popup applet, click the "Like the posts!" button.

A new tab is opened.

![Liker](https://raw.githubusercontent.com/OllegK/InstagramHelper/master/img/Liker.png)

Before starting the process, you can change the execution options:
* You can like the posts in your feed or the posts in someone's else profile. The default option is liking the posts in your feed (I want to like... The posts in my feed).
* Skip the video posts (default option).
* Skip your own posts (default option).
* Like the post only if it already has the certain amount of likes. Default option is 2. The intention is to avoid liking the racist or discrimination posts. You can set it 0 to disable this option.   

Set the stop criterion:
* when a certain amount of posts is liked. Default option and default amount to be liked is 100.
* when an already liked post was found.

To start the process, click the "LIKE THE POSTS!" button.

## Randomization of Delay Interval

If you change the value of delay, the change is effective immediately.

There is an option to randomize the delay between requests, when you provide the value for the random delay. 


# Calculate Likes and Comments for Profile

On the extension's popup applet, click the "Calculate Likes/Comments for Profile" button.

A new tab is opened.

![Likes](https://raw.githubusercontent.com/OllegK/InstagramHelper/master/img/Likes.png)

To start the process, click the "CALCULATE LIKES!" button.

When it is completed, it displays all users who liked (also optionally commented if the "Get comments" checkbox was checked) the posts on this profile. The row in the table could be expanded by clicking on to display the liked and commented posts by this user. 

If you are calculating the likes on your profile, it makes sense to click the "ADD FOLLOWERS!" button to find the followers who never liked your post. This button adds the followers of the user currently being calculated. *Note: it is open question should it add the followers of the user currently being calculated or the followers of the viewer (your followers); if your followers are added, it would help to find the engaged audience of another profile similar to you, and who is currently not following you.*

The created list could be exported into Excel (XLSX/CSV).

The [same delays' randomization rules](#randomization-of-delay-interval) as for Liker are effective.


# Mass follow/unfollow

On the extension's popup applet, click the "Follow/Unfollow!" button. Insert the list of the accounts to be followed/unfollowed into the text area and click the appropriate button to start the process. The input is either usernames or user ids. It is better and safer to use user id, as the extension needs to resolve the username to the user id anyway, and also the account's username could be easily changed by the account's owner, but user id always remains the same.

The [same delays' randomization rules](#randomization-of-delay-interval) as for Liker are effective.

About follow/unfollow read also [here](https://instascraper.weebly.com/blog/mass-followunfollow)

Read also the blog about possible following issues ["If you cannot follow more accounts"]  (https://instascraper.weebly.com/blog/if-you-cannot-follow-more-accounts).


# Mass block/unblock

On the extension's popup applet, click the "Block/Unblock users!" button. Insert the list of the accounts to be blocked/unblocked into the text area and click the appropriate button to start the process. The input is either usernames or user ids. It is better and safer to use user id, as the extension needs to resolve the username to the user id anyway, and also the account's username could be easily changed by the account's owner, but user id always remains the same.  

The functionality and behavior is very similar to [Mass follow/unfollow](#mass-followunfollow).

The [same delays' randomization rules](#randomization-of-delay-interval) as for Liker are effective.

**Note!** Please take into account that you can accidentally or intentionally unblock the user if you put it (user id or username) into a list for the mass-follow functionality. 


# Some Usage Tips

1. Try to keep the extension's tab foreground, as Chrome slows down the JavaScript execution in the background tabs. Chrome also can [refresh](#refresh-the-inactive-tab) a tab if the tab was background for a long time; in case of the refresh, the progress and the results will be lost. 
2. Also try to have fewer tabs open when the process is running, as the process could be stopped if there is not enough memory.   
3. Try to use the longer intervals between requests, and also the delays' randomization feature (available for liker, likes' calculation, mass follow/unfollow, mass block).
4. Respect Instagram action daily limits, and try to have less daily actions in order do not exceed them, they are subject to change, but now it seems about 600 follow actions and 1000 likes per day. 
5. The limits apply to the account, and you can use the extension simultaneously for two different accounts using in non-incognito mode and incognito mode. *You need to enable the extension for incognito mode*. In addition, you can install the Chromium browser alongside the Chrome browser, and use the extension also with it.


# Known Issues 

## Possible HTTP Errors

The extension is built to handle the different HTTP errors and retry with the interval of three minutes. Sometimes one retry is not enough, the error repeats, and the countdown begins again. Please be patient and wait, in the most cases it disappears sooner or later.

### Constant HTTP400 error

If you are facing the constant HTTP400 error that doesn't disappear after several retries, please read [Constant HTTP400 error](https://instascraper.weebly.com/blog/constant-http400-error). 

### Constant HTTP502 error

Sometimes fetching the user profile, e.g., when calculating likes and comments, you can meet the repeated HTTP502 error.

Some extension's user reported that constant HTTP502 error could also happen when fetching followers/following.

If you meet constant HTTP502 error that doesn't disappear and you cannot also fetch in your web browser, you can do nothing about that. Sooner or later the issue disappears, and you will be able to fetch all information. However sometime the issue persists for several days.

## Refresh the inactive tab

When a tab is not active for a long time, the Chrome could refresh it when it is activated again.

Please try to keep the tab active during the process, it is also described [here](https://superuser.com/questions/1048029/disable-auto-refresh-tabs-in-chrome-desktop#comment1467739_1048029) how to disable this behavior.


# How to Report Defects
If you have an issue, please open the developer console window and check if there are error/warning messages there. To open the the developer console window on Chrome, use the keyboard shortcut `Ctrl+Shift+J` (on Windows) or `Ctrl+Option+J` (on Mac).

Please provide the steps to reproduce the defect.


# Links

* [Github](https://github.com/OllegK/InstagramHelper). The best place to report the defects and to request the new features. 
* [Web page](https://instascraper.weebly.com/). It has some useful blog's articles, however, when the blog's updates get a comment, Weebly doesn't send me an email, so I can overlook a comment. 
* [Extension on Chrome Web Store](https://chrome.google.com/webstore/detail/helper-tools-for-instagra/hcdbfckhdcpepllecbkaaojfgipnpbpb). Unfortunately, Google does not send an email me when the extension gets a comment or a problem description; therefore it could take several hours or even more before I notice the issue.  


# Donations

This extension is free, however if you would like to donate:   
* BTC: 1LtKe6AKDvJ1nhZjPwRBnJe4QovqxhLRjN  
* BCH: 1NgX5ywvuAPTvz6y6tU3kfTvv7NHH8YoKp  
* LTC: LW55k6MD8WBuV8NUxEXBBXeRv3vzzF3tfN  
* ETH: 0x2EB4DB0cA8100E749BDB2D52844A96c86863Ae92  
