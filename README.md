# Stack Overflow Moderation Userscripts

_by [Samuel Liew](https://stackoverflow.com/users/584192/samuel-liew)_

[Bug reports](https://github.com/samliew/SO-mod-userscripts/issues), Forks, and PRs welcome!


<br>

## Recommended for moderators


These are highly recommended. Minor changes to the UI/defaults makes your mod life easier by a *huge* amount (saving clicks, or having to hunt for a particular link/mod feature, or displaying more info upfront). Click these to jump to their descriptions below:

- [Mod User Quicklinks Everywhere](#mod-user-quicklinks-everywhere-)
- [Mod Popup Dialog Improvements](#mod-popup-dialog-improvements-)
- [User Review Ban Helper](#user-review-ban-helper-)
- [Comment Flags Helper](#comment-flags-helper-)
- [Not An Answer Flag Queue Helper](#not-an-answer-flag-queue-helper-)
- [Display Inline Comment Flag History](#display-inline-comment-flag-history-)


<br>

## General userscripts


### [Mod User Quicklinks Everywhere](https://github.com/samliew/SO-mod-userscripts/blob/master/ModUserQuicklinksEverywhere.user.js) ♦

- Adds user moderation collapsable left-sidebar to user-specific pages: quick links & selection of user details from Mod Dashboard
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-12_210450.png)
- Adds user quick links under display name in posts (opens in new tabs)
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/user-quicklinks.gif)


### [Mod Popup Dialog Improvements](https://github.com/samliew/SO-mod-userscripts/blob/master/ModPopupDialogImprovements.user.js) ♦

- Delete moved comments is checked by default
- Prevent Mod actions in Flag Queue redirecting to post - instead opens in a new tab


### [Personal Mod Message History](https://github.com/samliew/SO-mod-userscripts/blob/master/PersonalModMessageHistory.user.js) ♦

- Displays link to switch to your recently sent mod messages in the inbox dialog
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/mod-messages.png)


### [User Review Ban Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/UserReviewBanHelper.user.js) ♦

- Display users' prior review bans in review (links to review ban history), ban quicklink
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-24_140417.png)
- Insert review ban button in user review ban history page
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-24_140443.png)
- Load ban form for user if user ID passed via hash
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-24_140419.png)


### [Hide Viewed Posts](https://github.com/samliew/SO-mod-userscripts/blob/master/HideViewedPosts.user.js) ♦

- Avoid posts already seen and possibly handled by another moderator


### [Show Flags On Deleted Posts](https://github.com/samliew/SO-mod-userscripts/blob/master/ShowFlagsOnDeletedPosts.user.js) ♦

- Hide normal flags in flag queue and only show deleted posts


### [Display Inline Comment Flag History](https://github.com/samliew/SO-mod-userscripts/blob/master/DisplayInlineCommentFlagHistory.user.js) ♦

- Grabs post timelines and display comment flag counts beside post comments. This also permalinks to comment in post timeline
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-10_230533.png)
- Displays flags on comment hover
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-10_230507.png)


### [Post Ids Everywhere](https://github.com/samliew/SO-mod-userscripts/blob/master/PostIdsEverywhere.user.js)

- Inserts post IDs everywhere where there's a post or post link (for copying/easier x-referencing/etc)
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/postids-everywhere.gif)
- Useful for copying ID of answer, for coverting an answer to a comment of the target post
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-23_190400.png)


### [Hover Expand Navigation Links](https://github.com/samliew/SO-mod-userscripts/blob/master/HoverExpandNavigationLinks.user.js)

- On pagination dots "```...```" mouseover, adds additional 30 in-between links
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/nav-expand.gif)


### [Discussed On Meta](https://github.com/samliew/SO-mod-userscripts/blob/master/DiscussedOnMeta.user.js)

*This userscript has only been tested on Tampermonkey, and requires additional permissions for cross-site requests to Meta as it's on a different domain. Simply click on "Always allow" when prompted.*

- For questions, displays info if it's discussed on Meta
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-18_210542.png)
- On arrow mouseover, displays the Meta posts
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-18_210522.png)


### [Election Supporter Flairs](https://github.com/samliew/SO-mod-userscripts/blob/master/ElectionSupporterFlairs.user.js)

- Flair users who voted in the elections...
  - mods:  when you were elected
  - users: for the latest election
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-17_210559.png)


<br>

## Chat-specific userscripts


### [Chat Room Info Annotations](https://github.com/samliew/SO-mod-userscripts/blob/master/ChatRoomInfoAnnotations.user.js) ♦

- Display users' annotation count in chat room general info tab
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-23_210431.png)


### [Chat Transcripts By Default](https://github.com/samliew/SO-mod-userscripts/blob/master/ChatTranscriptsByDefault.user.js)

- Rewrites chat room links in comments to chat transcript, to avoid joining the room


### [Chat Transcript Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/ChatTranscriptHelper.user.js)

- Replaces timestamps in chat transcripts with your local time


### [No Oneboxes in Chat Transcripts](https://github.com/samliew/SO-mod-userscripts/blob/master/NoOneboxesInChatTranscripts.user.js)

- Collapses oneboxes from chat transcripts, bookmarked conversations (**live chat untouched**)
- Click to display onebox


### [No Oneboxes in Chat](https://github.com/samliew/SO-mod-userscripts/blob/master/NoOneboxesInChat.user.js)

- Collapses oneboxes from live chat, chat transcripts, bookmarked conversations
- Click to display onebox
- Has exposed function to work together with [Show Deleted Messages in Chat](#show-deleted-messages-in-chat) userscript


### [Chat More Magic Links](https://github.com/samliew/SO-mod-userscripts/blob/master/ChatMoreMagicLinks.user.js)

- Some magic links are not parsed in Stack Overflow Chat. This script parses and submit expanded magic links via an edit to your latest message.
- List of additional magic links handled by this userscript:
  - `[mcve]`
  - `[help]`
  - `[help/on-topic]`
  - `[help/dont-ask]`
  - `[help/behavior]`
  - `[meta-help]`
  - `[tour]`
  - `[chat]`


### [Show Deleted Messages in Chat](https://github.com/samliew/SO-mod-userscripts/blob/master/ShowDeletedMessagesInChat.user.js) ♦

- Show deleted messages from live chat, chat transcripts, bookmarked conversations
- Works with [No Oneboxes in Chat](#no-oneboxes-in-chat) userscript


<br>

## Queue-specific userscripts


### [Comment Flags Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/CommentFlagsHelper.user.js) ♦

- Highlight common chatty/rude keywords
- Some style improvements
- Rename "dismiss" link to "decline" with hover warning color
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-23_210443.png)
- Always expand comments if post is expanded (**includes deleted posts**), and highlights flagged user comments in expanded posts
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-23_210428.png)
- Quick **purge all comments link** (with confirmation prompt)
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-01_100511.png)
- Option to review from the bottom of the page (so page won't jump around after handling each flag)
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-23_210423.png)
- Option to hide comments posted within the past day
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-09_160527.png)


### [Duplicate Answers Flags Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/DuplicateAnswersFlagsHelper.user.js) ♦

- Add action button to delete AND insert duplicate comment at the same time, saving you from deleting and then having to open up a new tab to manually insert comment
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-05_120501.png)
- Comment left on answer:<br>`Please [don't post identical answers to multiple questions](https://meta.stackexchange.com/q/104227). Instead, tailor the answer to the question asked. If the questions are exact duplicates of each other, please vote/flag to close instead.`


### [Not An Answer Flag Queue Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/NotAnAnswerFlagQueueHelper.user.js) ♦

- Inserts several sort options for the **NAA / VLQ / Review LQ Disputed** queues
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-30_150426.png)


### [Too Many Comments Flag Queue Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/TooManyCommentsFlagQueueHelper.user.js) ♦

- Auto-expand unhandled posts
- Inserts quicklinks to "Move comments to chat + delete" and "Delete all comments"
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-04_120553.png)
- Confirmation displayed after successful response from server (don't forget to mark as helpful)
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-04_120549.png)


### [Possible Vandalism Deletions Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/PossibleVandalismDeletionsHelper.user.js) ♦

- Sort answers first
- Display post score, number of undeleted answers, post age
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-09_220559.png)

- Recommend action based on post info
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-09_220518.png)


### [Possible Vandalism Edits Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/PossibleVandalismEditsHelper.user.js) ♦

- Similar to the above, display revision count, post age
- Does not recommend as edits still need to be reviewed manually
