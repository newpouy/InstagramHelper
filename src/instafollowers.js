/* globals chrome */

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === "get_insta_users") {
		
		chrome. storage.sync.get({
			usersClass: '_539vh'
		}, function (items) {
			var users = document.getElementsByClassName(items.usersClass);
			if (0 === users.length) {
				alert ("Please open followers or following list!");
			} else {		
				chrome.runtime.sendMessage({
					action: "return_insta_users",
					text: users[0].innerHTML
				});
			}
		});		
		
	} else if (request.action === "get_followers_count") {
		//	chrome.runtime.sendMessage({ action : "return_followers_count", text : window._sharedData.entry_data.ProfilePage[0].user.followed_by.count });
		var source = function () {
			return _sharedData;
		};
		var script;
		var id = "";
		while (id.length < 16) {
			id += String.fromCharCode(((!id.length || Math.random() > 0.5) ?
					0x61 + Math.floor(Math.random() * 0x19) : 0x30 + Math.floor(Math.random() * 0x9)));
		}

		script = "(function(){var value={callResult: null, throwValue: false};try{value.callResult=((" +
			source.toString() + ")());}catch(e){value.throwValue=true;value.callResult=e;};" +
			"document.getElementById('" + id + "').innerText=JSON.stringify(value);})();";

		var elem = document.createElement("script");
		elem.type = "text/javascript";
		elem.innerHTML = script;
		elem.id = id;
		document.head.appendChild(elem);
		var ret = JSON.parse(elem.innerText);
		var a = ret.callResult.entry_data.ProfilePage[0].user.followed_by.count; //doesn't work when I started with feed page
		elem.parentNode.removeChild(elem);
		delete (elem);
		chrome.runtime.sendMessage({
			action: "return_followers_count",
			text: a
		});
	}
});

chrome.runtime.sendMessage({
	action: "show"
});