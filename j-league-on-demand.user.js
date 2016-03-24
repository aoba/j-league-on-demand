// ==UserScript==
// @name           j-league-on-demand
// @namespace      http://twitter.com/hongo
// @include        https://vod.skyperfectv.co.jp/live_list.php
// @downloadUrl    https://raw.githubusercontent.com/downloads/aoba/j-league-on-demand/master/j-league-on-demand.user.js
// @updateUrl      https://raw.githubusercontent.com/downloads/aoba/j-league-on-demand/master/j-league-on-demand.user.js
// @version        0.5
// @description    Show J-League On Demand Streaming Video List
// ==/UserScript==
(function(){

	var JOD = function(){
		var self = this;

		self.getLiveInfoUrl   = '/ajax_getEpisodeLive_list.php';
		self.getLiveInfoData  = 'episode_type=0&channel_id=65&after_view_flag=0&sort_type=1&order_type=1&pager_range=2&limit=30&page=1';
		self.getVideoInfoData = 'episode_type=0&channel_id=65&after_view_flag=1&sort_type=1&order_type=0&pager_range=2&limit=40&page=1';
		self.LiveUrl = '/episode_detail.php?EI=';
		self.container = document.getElementById('container');
		self.liveDivId = '____now_on_air';
		self.videoDivId = '____video_list';
		self.now;

		self.insertAfter = function(newNode, referenceNode){
			referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
		}

		self.getYYYYMMDDHHMISS = function(){
			var now = new Date();
			var YYYY = now.getFullYear();
			var MM = now.getMonth() + 1;
			MM = ('0' + MM).slice(-2);
			var DD = ('0' + now.getDate()).slice(-2);
			var HH = ('0' + now.getHours()).slice(-2);
			var MI = ('0' + now.getMinutes()).slice(-2);
			var SS = ('0' + now.getSeconds()).slice(-2);
			return YYYY+'-'+MM+'-'+DD+' '+HH+':'+MI+':'+SS;
		}

		self.createHtml = function(episodes, title){
			var html = [];
			if (title){
				html.push('<div style="font-size:20px; font-weight:bold;">'+title+'</div>');
			}
			for(var i in episodes){
				var epi = episodes[i];
				html.push('<a style="font-size:15px;" target="____live" href="' + self.LiveUrl + epi.episode_id + '">' + epi.episode_name + '</a><br />');
			}
			return html.join('');
		}

		self.createDiv = function(data, title, id){
			var div = document.createElement('div');
			if (id){
				div.setAttribute('id', id);
			}
			div.setAttribute('class', 'live_contents');
			div.innerHTML = '<h1 class="pageTitle">' + title + '</h1>';
			div.innerHTML += self.createHtml(data.j1, '■J1');
			div.innerHTML += self.createHtml(data.j2, '■J2');
			div.innerHTML += self.createHtml(data.j3, '■J3');
			div.innerHTML += self.createHtml(data.other, '■Other');
			return div;
		}

		self.classify = function(episodes, isLive){
			isLive = (isLive) ? true : false;
			var highlightRegexp = /ハイライト/;
			var data = {'j1':[],'j2':[],'j3':[],'other':[]};
			for(var i in episodes){
				var epi = episodes[i];
				var name = epi.episode_name;
				if (isLive){
					// isLive=true の場合、現在放送中の映像ソースのみが対象
					if (self.now < epi.encode_start_end){
						continue;
					}
				} else {
					// isLive=false の場合、ハイライトはotherへ追加
					if (name.match(highlightRegexp)){
						data.other.push(epi);
						continue;
					}
				}
				if (0 < name.indexOf('J1')){
					data.j1.push(epi);
				} else if (0 < name.indexOf('J2')){
					data.j2.push(epi);
				} else if (0 < name.indexOf('J3')){
					data.j3.push(epi);
				} else {
					data.other.push(epi);
				}
			}
			return data;
		}

		self.showLiveList = function(postData, title, isLive){
			self.now = self.getYYYYMMDDHHMISS();
			isLive = (isLive) ? true : false;
			newDivId = (isLive) ? self.liveDivId : self.videoDivId;
			GM_xmlhttpRequest({
				method: "POST",
				url: self.getLiveInfoUrl + '?cache=' + Date.now(),
				data: postData,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
					,"Accept": "application/json, text/javascript, */*; q=0.01"
					,"Referer": "https://vod.skyperfectv.co.jp/live_list.php"
					,"X-Requested-With": "XMLHttpRequest"
				},
				onload: function(response){
					var json = JSON.parse(response.responseText);
					var episodes = json[1].episode;
					var data = self.classify(episodes, isLive);
					var div = self.createDiv(data, title, newDivId);
					if (isLive){
						self.container.insertBefore(div, self.container.firstChild);
						self.showLiveList(self.getVideoInfoData, 'Video List', false);
					} else {
						self.insertAfter(div, document.getElementById(self.liveDivId));
					}
				}
			});
		}

	}

	var j = new JOD();
	j.showLiveList(j.getLiveInfoData, 'Now On Air!', true);
})();