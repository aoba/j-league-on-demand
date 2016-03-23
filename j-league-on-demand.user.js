// ==UserScript==
// @name           j-league-on-demand
// @namespace      http://twitter.com/hongo
// @include        https://vod.skyperfectv.co.jp/live_list.php
// @downloadUrl    https://raw.githubusercontent.com/downloads/aoba/j-league-on-demand/master/j-league-on-demand.user.js
// @updateUrl      https://raw.githubusercontent.com/downloads/aoba/j-league-on-demand/master/j-league-on-demand.user.js
// @version        0.4
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
		self.newDivId = '____now_on_air';
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

		self.createDiv = function(j1, j2, j3, other, title, id){
			var div = document.createElement('div');
			if (id){
				div.setAttribute('id', self.newDivId);
			}
			div.setAttribute('class', 'live_contents');
			div.innerHTML = '<h1 class="pageTitle">' + title + '</h1>';
			div.innerHTML += self.createHtml(j1, '■J1');
			div.innerHTML += self.createHtml(j2, '■J2');
			div.innerHTML += self.createHtml(j3, '■J3');
			div.innerHTML += self.createHtml(other, '■Other');
			return div;
		}

		self.showLiveList = function(){
			self.now = self.getYYYYMMDDHHMISS();
			GM_xmlhttpRequest({
				method: "POST",
				url: self.getLiveInfoUrl,
				data: self.getLiveInfoData,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
					,"Accept": "application/x-www-form-urlencoded"
				},
				onload: function(response){
					var json = JSON.parse(response.responseText);
					var episodes = json[1].episode;
					var j1 = [];
					var j2 = [];
					var j3 = [];
					var other = [];
					
					for(var i in episodes){
						var epi = episodes[i];
						// 現在放送中の映像ソースのみが対象
						if (self.now < epi.encode_start_end){
							continue;
						}
						var name = epi.episode_name;
						if (0 < name.indexOf('J1')){
							j1.push(epi);
						} else if (0 < name.indexOf('J2')){
							j2.push(epi);
						} else if (0 < name.indexOf('J3')){
							j3.push(epi);
						} else {
							other.push(epi);
						}
					}
					var div = self.createDiv(j1, j2, j3, other, 'Now On Air!', self.newDivId);
					self.container.insertBefore(div, self.container.firstChild);
					self.showVideoList();
				}
			});
		}

		self.showVideoList = function(){
			GM_xmlhttpRequest({
				method: "POST",
				url: self.getLiveInfoUrl,
				data: self.getVideoInfoData,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
					,"Accept": "application/x-www-form-urlencoded"
				},
				onload: function(response){
					var json = JSON.parse(response.responseText);
					var episodes = json[1].episode;
					var regexp = /第([0-9]+)節/; // 第3節 川崎F VS 名古屋
					var highlightRegexp = /ハイライト/;
					var j1 = [];
					var j2 = [];
					var j3 = [];
					var other = [];
					
					for(var i in episodes){
						var epi = episodes[i];
						if (self.now < epi.encode_end_end){
							continue;
						}
						var name = epi.episode_name;
						// ハイライトはotherへ追加
						if (name.match(highlightRegexp)){
							other.push(epi);
							continue;
						}
						// 「第n節」が含まれる場合は試合とみなす
						if (name.match(regexp)){
							if (0 < name.indexOf('J1')){
								j1.push(epi);
							} else if (0 < name.indexOf('J2')){
								j2.push(epi);
							} else if (0 < name.indexOf('J3')){
								j3.push(epi);
							} else {
								other.push(epi);
							}
						} else {
							other.push(epi);
						}
					}
					var div = self.createDiv(j1, j2, j3, other, 'Video List');
					self.insertAfter(div, document.getElementById(self.newDivId));
				}
			});
		}
	}

	var j = new JOD();
	j.showLiveList();
})();