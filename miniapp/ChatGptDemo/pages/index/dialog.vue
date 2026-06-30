<template>
	<view class="uni-column" style="overflow-y: hidden;">
		<uni-nav-bar :border="false" @clickLeft="barLeftClick" :leftText="'模型'" :left-icon="'arrowdown'"
			:color="'#ffffff'" background-color="#4fbbbf" shadow height="180rpx" :title="barTitle"></uni-nav-bar>
		<my-js-select @selectModel="selectModel" :selectDatas="selectDatas"
			:showHidden="showModelSelect"></my-js-select>
		<view class="content" id="content">
			<scroll-view id="scrollview" scroll-y="true" :style="{height:style.contentViewHeight+'px'}"
				:scroll-with-animation="showAnimation" :scroll-top="scrollTop" scroll-into-view="bottom-input">
				<message-show ref="messageShow" v-for="(message,index) in messages" :key="index"
					v-bind:message="message" :id="index" :currentMax="currentMax"></message-show>
				<view id="bottom"></view>
			</scroll-view>
		</view>
		<view id="bottom-input" class="float-container" :style="{width:style.windowWidth+'px'}">
			<chat-input ref="chatInput" @send-message="getInputMessage"></chat-input>
		</view>
		<uni-notice-bar v-if="noticeMessage!=''" show-close
			style="position: absolute;top: 180rpx;height: 50px;width: 100%;z-index: 99;" show-icon
			:text="noticeMessage" />
		<view v-if="showTopGuide" style="top: 192rpx;" class="dialog_container" @click="changeShowTopGuide">
			<view class="dialog_text">添加到我的小程序，下拉即可使用&nbsp;&nbsp;
				<text style="color: red;">X</text>
			</view>
		</view>
	</view>
</template>

<script>
	import chatInput from '../../components/chatinput.vue';
	import messageShow from '../../components/messageshow.vue';
	var requestTaskG = null;
	var result = '';
	// 在页面中定义插屏广告
	let interstitialAd = null
	export default {
		data() {
			return {
				style: {
					pageHeight: 0,
					contentViewHeight: 0,
					footViewHeight: 90,
					mitemHeight: 0,
					windowWidth: 0,
				},
				scrollTop: 0,
				messages: [],
				isLoading: false,
				isShowLoading: false,
				//模拟队列做屏幕自动下滑
				queueCount: 0,
				queueTimer: null,
				noticeMessage: '',
				currentMode: null,
				currentMax: 1,
				showAnimation: true,
				showTopGuide: false,
				barTitle: '对话',
				selectDatas: [{
					index: 0,
					name: '3.5基础模型',
					model: 'base',
				}, {
					index: 1,
					name: '4.0plus模型',
					model: 'plus'
				}],
				showModelSelect: false,
			}
		},
		components: {
			chatInput,
			messageShow,
		},
		beforeCreate: function() {
			console.log("beforeCreate");
		},
		onShareAppMessage() {
			return {
				title: "超强AI4.0来袭，免费体验",
				path: '/pages/index/dialog',
				imageUrl: 'https://wx.wtianyu.com/ai/static/share/share.jpg',
			}
		},
		onShow() {
			const inputValue = getApp().globalData.produceInfo;
			console.log("onShow");
			if (inputValue !== null) {
				this.$refs.chatInput.setInputValue(inputValue);
			}
			getApp().globalData.produceInfo = null;
			if (getApp().globalData.platform === 'mp-toutiao') {
				//抖音采用websocket连接交互
				uni.websocket.initSocket(1);
				uni.websocket.createSocket(1, this.webSocketReceive);
			}
			if (uni.isShowLoading) {
				uni.hideLoading();
				uni.isShowLoading = false;
			}

			this.$nextTick(() => {
				// 在页面渲染结束后执行的代码
				if (this.$refs.messageShow != undefined) {
					this.$refs.messageShow.forEach(child => {
						child.updateUi();
					});
				};
				this.$refs.chatInput.updateUi();
				// 这里可以进行你需要的操作
			});

			this.currentMode = getApp().globalData.isBlank(uni.getStorageSync(getApp().globalData.modeNameCacheName)) ? {
				index: 0,
				name: '3.5基础模型',
				mode: 'base',
			} : uni.getStorageSync(getApp().globalData.modeNameCacheName);
			this.barTitle = "对话(" + this.currentMode.name + ")";
			// uni.setNavigationBarTitle({
			// 	title: this.barTitle
			// });
			if (!this.isLoading) {
				//重新设置引导语
				this.currentMax = this.messages.length;
				//强制滑动到底部
				this.forceScrollBottom();
			}
		},
		onReady: function() {
			console.log("onReady");
			const that = this;
			this.queueTimer = setInterval(() => {
				if (that.queueCount > 0) {
					that.queueCount--;
					console.log(that.queueCount);
					that.scrollToBottom();
				}
			}, 500);
			wx.checkIsAddedToMyMiniProgram({
				success: (res) => {
					that.showTopGuide = !res.added;
					console.log("checkIsAddedToMyMiniProgram_success", res);
				}
			})
		},
		onLoad: function() {
			console.log("onLoad");
			const that = this;
			//查询通知
			uni.notice.mainNotice((msg) => {
				console.log("msg", msg);
				that.noticeMessage = msg;
			})

			const res = uni.getSystemInfoSync();
			this.style.pageHeight = res.windowHeight;
			this.style.contentViewHeight = getApp().globalData.platform === 'mp-weixin' ? res.windowHeight - res
				.windowTop - res.statusBarHeight - 116 : res.screenHeight / 1.4;
			this.style.windowWidth = res.screenWidth;
			//获取缓存数据，并展示
			const resSt = uni.getStorageSync(getApp().globalData.messageQueueName);
			if (resSt) {
				this.messages = resSt;
			} else {
				this.messages.push({
					user: 'home',
					type: 'head',
					content: '我是小月，你的专属智能助手，有什么能帮助您的吗'
				});
			}
			this.queueCount = this.queueCount++;

			if (wx.createInterstitialAd) {
				interstitialAd = wx.createInterstitialAd({
					adUnitId: 'adunit-ee4a586a235c8e84'
				})
				interstitialAd.onLoad(() => {})
				interstitialAd.onError((err) => {})
				interstitialAd.onClose(() => {})
			}
			// 在适合的场景显示插屏广告
			setTimeout(() => {
				if (interstitialAd) {
					console.log("显示插屏广告")
					interstitialAd.show().catch((err) => {
						console.error(err)
					})
				}
			}, 100);
		},
		methods: {
			selectModel: function(modelInfo) {
				this.currentMode = modelInfo;
				this.barTitle = "对话(" + this.currentMode.name + ")";
				uni.setStorageSync(getApp().globalData.modeNameCacheName, modelInfo);
				this.showModelSelect = false;
			},
			barLeftClick: function(e) {
				console.log("barLeftClick点击了");
				this.showModelSelect = !this.showModelSelect;
			},
			forceScrollBottom: function() {
				//关闭动画，滑倒底部 
				this.showAnimation = false;
				this.scrollTop = this.scrollTop - 10;
				this.scrollToBottom();
			},
			changeShowTopGuide: function() {
				this.showTopGuide = false;
			},
			saveCache: function() {
				const that = this;
				setTimeout(() => {
					uni.setStorage({
						key: getApp().globalData.messageQueueName,
						data: that.messages.length > 20 ? that.messages.slice(that.messages.length -
							20, that.messages.length) : that.messages
					});
				}, 500)
			},
			getInputMessage: function(message) { //获取子组件的输入数据
				if (this.isLoading) {
					this.showStopDialog();
					return;
				}
				this.showAnimation = true;
				result = '';
				this.addMessage('customer', message.content, false);
				this.addMessage('home', '', false, false, true);
				this.queueCount++;
				this.toRobot(message.content);
			},
			addMessage: function(user, content, hasSub, subcontent, loading) {
				var that = this;
				const msgData = {
					user: user,
					content: content,
					hasSub: hasSub,
					subcontent: subcontent,
					loading: loading,
				};
				that.messages.push(msgData);
			},
			arrayBufferToString: function(arr) {
				if (typeof arr === 'string') {
					return arr;
				}
				var dataview = new DataView(arr.data);
				var ints = new Uint8Array(arr.data.byteLength);
				for (var i = 0; i < ints.length; i++) {
					ints[i] = dataview.getUint8(i);
				}
				arr = ints;
				var str = '',
					_arr = arr;
				for (var i = 0; i < _arr.length; i++) {
					var one = _arr[i].toString(2),
						v = one.match(/^1+?(?=0)/);
					if (v && one.length == 8) {
						var bytesLength = v[0].length;
						var store = _arr[i].toString(2).slice(7 - bytesLength);
						for (var st = 1; st < bytesLength; st++) {
							store += _arr[st + i].toString(2).slice(2);
						}
						str += String.fromCharCode(parseInt(store, 2));
						i += bytesLength - 1;
					} else {
						str += String.fromCharCode(_arr[i]);
					}
				}
				return str;
			},
			calculateMitemHeight: function(callBack) {
				const promises = [];
				const that = this;
				let totalHeight = that.style.mitemHeight || 0;

				if (this.$refs.messageShow === undefined) return;
				this.$refs.messageShow.forEach(child => {
					const promise = new Promise((resolve, reject) => {
						child.getDomByClass(".m-item_flag").boundingClientRect().exec(function(rect) {
							resolve(rect[0].height);
						});
					});
					promises.push(promise);
				});

				Promise.all(promises)
					.then(heights => {
						heights.forEach(height => {
							totalHeight += height + 20;
						});
						that.style.mitemHeight = totalHeight;
						console.log(that.style.mitemHeight);
						callBack();
					})
					.catch(error => {
						console.log(error);
					});
			},
			scrollToBottom: function() {
				const that = this;
				that.style.mitemHeight = 0;
				// that.scrollTop = 0;
				//抖音小程序和微信小程序
				if (getApp().globalData.platform === 'mp-toutiao') {
					let query = tt.createSelectorQuery();
					query.selectAll('.m-item_flag').boundingClientRect();
					query.exec(res => {
						res[0].forEach((item) => {
							that.style.mitemHeight += item.height + 20;
						})
						//判断是否超过展示页面高度
						if (that.style.mitemHeight > that.style.contentViewHeight) {
							that.scrollTop = that.style.mitemHeight - that.style.contentViewHeight + 40;
						}
					});
				} else if (getApp().globalData.platform === 'mp-weixin') {
					this.calculateMitemHeight(() => {
						// if (that.style.mitemHeight > that.style.contentViewHeight) {
						// 	that.scrollTop = that.style.mitemHeight - that.style.contentViewHeight;
						// }
						that.scrollTop = that.style.mitemHeight;
					});
				}
			},
			showStopDialog: function() {
				const that = this;
				uni.showModal({
					title: '提示',
					content: '您的问题还在回复中',
					showCancel: false,
					success: function(res) {

					}
				});
			},
			wxRobatRequest: function(question) {
				const that = this;
				that.isLoading = true;
				// //展示加载框
				// uni.showLoading({
				// 	title: '加载中,请稍后'
				// });
				this.isShowLoading = true;

				if (getApp().globalData.platform === 'mp-weixin') {
					const requestData = {
						'prompt': question,
						"network": false,
						"system": "",
						"withoutContext": false,
						"stream": true,
						"rolePlay": false,
					};

					requestTaskG = uni.http.streamWx(this, requestData,
						sucess => {
							console.log("request success", sucess);
						}, fail => {
							console.log("request fail", fail);
							//用户主动中断请求，不进行提示
							if (fail.errMsg != 'request:fail abort') {
								result += "服务器网络异常，请重试";
								let msg = that.messages.pop();
								if (msg.user === 'customer') {
									that.messages.push(msg);
								}
								that.addMessage("home", result, true);
								this.queueCount++;
							}
						}, complete => {
							console.log("request complete", complete);
							that.isLoading = false;
							that.saveCache();
							this.queueCount++;
							// uni.hideLoading();
						}, onHeadersReceivedCallBack => {
							// uni.hideLoading();
							console.log("onHeadersReceived", onHeadersReceivedCallBack);
						}, onChunkReceivedCallBack => {
							if (!getApp().globalData.isDevTools()) {
								let requestData = that.arrayBufferToString(onChunkReceivedCallBack);
								if (requestData.indexOf("WTALL:") > -1) {
									requestData = requestData.substring(6, requestData.length);
								}
								console.log("onChunkReceived", requestData);
								result += requestData;
								let msg = that.messages.pop();
								if (msg.user === 'customer') {
									that.messages.push(msg);
								}
								that.addMessage("home", result, true);
								this.queueCount++;
							} else {
								let requestData = "i am test answer";
								result += requestData;
								let msg = that.messages.pop();
								if (msg.user === 'customer') {
									that.messages.push(msg);
								}
								that.addMessage("home", result, true);
								this.queueCount++;
							}
						}
					);
				} else if (getApp().globalData.platform === 'mp-toutiao') {
					if (!getApp().globalData.isDevTools()) {
						let req = {
							type: "1",
							content: question,
							security: true,
							appType: getApp().globalData.appType,
							"rolePlay": false,
						}
						uni.websocket.sendMessage(1, JSON.stringify(req), that.webSocketReceive, () => {
								setTimeout(() => {
									if (that.isShowLoading) {
										uni.hideLoading()
										that.isShowLoading = false;
										that.isLoading = false;
									}
								}, 5000);
							},
							() => {
								if (this.isShowLoading) {
									uni.hideLoading()
									this.isShowLoading = false;
								}
								this.isLoading = false;
								uni.showToast({
									title: "网络异常，请稍后重试",
									icon: "error",
									position: "top",
									duration: 2000
								});
							});
					} else {
						uni.hideLoading();
						// todo 此处调整为webscoket交互
						let requestData = "i am test answer";
						that.isLoading = false;
						result += requestData;
						let msg = that.messages.pop();
						if (msg.user === 'customer') {
							that.messages.push(msg);
						}
						that.addMessage("home", result, true);
						this.queueCount++;
					}
				}

			},
			webSocketReceive: function(receiveMsg) {
				//webscoket交互
				const that = this;
				if (this.isShowLoading) {
					uni.hideLoading()
					this.isShowLoading = false;
					this.isLoading = false;
				}
				let requestData = receiveMsg.data;
				if (requestData.indexOf("WTALL:") > -1) {
					requestData = requestData.substring(6, requestData.length);
				}
				if (requestData === 'WTALL_END') {
					that.isLoading = false;
					that.saveCache();
					this.queueCount++;
					return;
				}
				result += requestData;
				let msg = that.messages.pop();
				if (msg.user === 'customer') {
					that.messages.push(msg);
				}
				that.addMessage("home", result, true);
				this.queueCount++;
			},
			toRobot: function(info) {
				const that = this;
				uni.getSystemInfo({
					success: function(res) {
						if (res.uniPlatform === 'web') {
							//web网页
							that.addMessage('home', info + '_response', false);
							//saveCache
							that.saveCache();
							this.queueCount++;
						} else if (res.uniPlatform !== 'mp-weixin1') {
							//微信小程序
							that.wxRobatRequest(info);
						}
					}
				});
			}
		}
	}
</script>

<style>
	.dialog_container::after {
		border: 12px solid transparent;
		border-bottom: 12px solid rgb(76, 76, 76, 0.8);
		top: -24px;
		right: 10vw;
		width: 0;
		height: 0;
		position: absolute;
		content: ' ';
	}

	.dialog_container {
		position: fixed;
		top: 12px;
		right: 12px;
		display: flex;
		align-items: flex-start;
		justify-content: flex-end;
		width: 200px;
		z-index: 9999;
	}

	.dialog_text {
		padding: 10px 20px;
		background-color: rgb(76, 76, 76, 0.8);
		color: #fafafa;
		font-size: 14px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		font-family: Arial, sans-serif;
		border-radius: 5px;
		max-width: 300px;
	}

	.float-container {
		position: fixed;
		bottom: 0px;
		z-index: 999;
		/* 将容器置于最顶层 */
	}

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.logo {
		height: 100rpx;
		width: 100rpx;
		margin-top: 100rpx;
		margin-left: auto;
		margin-right: auto;
		margin-bottom: 25rpx;
	}

	.text-area {
		display: flex;
		justify-content: center;
	}

	.title {
		font-size: 36rpx;
		color: #8f8f94;
	}
</style>