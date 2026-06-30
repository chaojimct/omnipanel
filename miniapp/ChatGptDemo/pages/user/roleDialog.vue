<template>
	<view class="uni-column">
		<view class="content" id="content">
			<scroll-view id="scrollview" scroll-y="true" :style="{height:style.contentViewHeight+'px'}"
				:scroll-with-animation="showAnimation" :scroll-top="scrollTop">
				<message-show ref="messageShow" v-for="(message,index) in messages" :key="index"
					v-bind:message="message" :id="index" :currentMax="currentMax"></message-show>
				<view id="bottom"></view>
			</scroll-view>
		</view>
		<view class="float-container" :style="{width:style.windowWidth+'px'}">
			<chat-input ref="chatInput" @send-message="getInputMessage"></chat-input>
		</view>
		<uni-notice-bar v-if="noticeMessage!=''" show-close
			style="position: absolute;top: 0px;height: 50px;width: 100%;z-index: 99;" show-icon :text="noticeMessage" />
	</view>
</template>

<script>
	import chatInput from '../../components/chatinput-role.vue';
	import messageShow from '../../components/messageshow-role.vue';
	var requestTaskG = null;
	var result = '';
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
				info: null,
				currentMode: null,
				currentMax: 1,
				showAnimation: true,
			}
		},
		components: {
			chatInput,
			messageShow,
		},
		beforeCreate: function() {
			console.log("beforeCreate");
		},
		onReady() {
			console.log("onReady");
		},
		onShow() {
			console.log("onShow");
			if (getApp().globalData.platform === 'mp-toutiao') {
				//抖音采用websocket连接交互
				uni.websocket.initSocket(2);
				uni.websocket.createSocket(2, this.webSocketReceive);
			}
			if (!this.isLoading) {
				//重新设置引导语
				this.currentMax = this.messages.length;
				this.forceScrollBottom();
			}
		},
		onReady: function() {
			console.log("onReady");
			const that = this;
			this.queueTimer = setInterval(() => {
				if (that.queueCount > 0) {
					that.queueCount--;
					that.scrollToBottom();
				}
			}, 500);
		},
		onLoad: function(option) {
			console.log("onLoad");
			const that = this;
			const res = uni.getSystemInfoSync();
			this.info = JSON.parse(option.info);
			console.log(res);
			this.style.pageHeight = res.windowHeight;
			this.style.contentViewHeight = getApp().globalData.platform === 'mp-weixin' ? res.windowHeight - res
				.windowTop - res.statusBarHeight - 44 : res.screenHeight / 1.4;
			this.style.windowWidth = res.screenWidth;
			//获取缓存数据，并展示
			const resSt = uni.getStorageSync(getApp().globalData.messageQueueName + "_" + this.info.id);
			if (resSt) {
				this.messages = resSt;
			}
			if (this.messages.length === 0) {
				this.addMessage('home', this.info.contentH, false);
			}
			this.queueCount++;
			this.currentMode = getApp().globalData.isBlank(uni.getStorageSync(getApp().globalData.modeNameCacheName)) ?
			{
				index: 0,
				name: '3.5基础模型',
				mode: 'base',
			} : uni.getStorageSync(getApp().globalData.modeNameCacheName);
			uni.setNavigationBarTitle({
				title: this.info.title + "(" + this.currentMode.name + ")"
			});
			uni.setNavigationBarColor({
				backgroundColor: '#4fbbbf',
				frontColor: '#ffffff',
				animation: {
					duration: 400,
					timingFunc: 'easeIn'
				}
			})
		},
		methods: {
			forceScrollBottom: function() {
				//关闭动画，滑倒底部
				this.showAnimation = false;
				this.scrollTop = this.scrollTop - 10;
				this.scrollToBottom();
			},
			saveCache: function() {
				const that = this;
				setTimeout(() => {
					uni.setStorage({
						key: getApp().globalData.messageQueueName + "_" + this.info.id,
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
					imgUrl: that.info.imgHUrl,
					loading: loading,
					infoId: that.info.id,
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
						that.scrollTop = that.style.mitemHeight; //- that.style.contentViewHeight;
						// }
					});
				}
			},
			showStopDialog: function() {
				const that = this;
				uni.showModal({
					title: '提示',
					content: '您的问题还在回复中，是否需要停止回复',
					confirmText: '停止',
					success: function(res) {
						if (res.confirm) {
							requestTaskG.abort();
						} else if (res.cancel) {
							console.log('用户点击了取消');
						}
					}
				});
			},
			wxRobatRequest: function(question) {
				const that = this;
				that.isLoading = true;
				//展示加载框
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
						rolePlay: true,
						infoId: that.info.id,
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
							rolePlay: true,
							infoId: that.info.id,
						}
						uni.websocket.sendMessage(2, JSON.stringify(req), that.webSocketReceive, () => {
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