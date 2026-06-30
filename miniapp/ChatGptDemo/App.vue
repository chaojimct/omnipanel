<script>
	import * as http from '@/common/js/http.js'
	import * as draw from '@/common/js/draw.js'
	import * as dyAd from '@/common/js/dyAd.js'
	import * as imageDraw from '@/common/js/imageDraw.js'
	import * as websocket from '@/common/js/websocket.js'
	import * as wxPay from '@/common/js/wxPay.js'
	import * as notice from '@/common/js/notice.js'
	import * as audio from '@/common/js/audio.js'

	const platform = uni.getSystemInfoSync().uniPlatform;
	console.log("platform", platform);
	export default {
		globalData: {
			isDev: false,
			platform: platform,
			// url: "http://192.168.1.8:8099/wtall/",
			url: "https://cy2.wtianyu.com/wtall/",
			// webSocketUrl: "ws://192.168.1.3:8099/wtall/",
			// webSocketUrl: "wss://cy2.wtianyu.com/wtall/",
			webSocketUrl: "wss://cy2.wtianyu.com/wtall/",
			// 小程序的appId -生产
			appId: platform === 'mp-weixin' ? uni.getAccountInfoSync().miniProgram.appId : (platform === 'mp-toutiao' ?
				'tt13d565688ce9cbfa01' : ''),
			// 小程序的appId -沙盒
			// appId: platform === 'mp-weixin' ? uni.getAccountInfoSync().miniProgram.appId : (platform === 'mp-toutiao' ?
			// 	'tt5dcb2b76c2f7701101' : ''),
			appType: platform === 'mp-weixin' ? 'WXXCX' : platform === 'mp-toutiao' ? 'DYXCX' : '',
			//消息队列的缓存名称
			messageQueueName: 'messages_list_real_leiyunbaihuo',
			// openIdCacheName
			openIdCacheName: 'openId',
			// avatarUrlCacheName
			avatarUrlCacheName: 'avatarUrl',
			// nickNameCacheName
			nickNameCacheName: 'nickName',
			// modeNameCacheName
			modeNameCacheName: 'modeName',
			//temperatureNameCacheName
			temperatureNameCacheName: 'temperature',
			// audioSwitchName
			audioSwitchName: 'audioSwitch',
			audioSexName: 'audioSex',
			//创作页跳转到会话页的参数
			produceInfo: null,
			//绘画详情也进行重画操作
			reDrawTask: null,
			//播放广告获取奖励类型
			adTypePlay: null,
			isBlank: function(data) {
				return data == null || data == 'null' || data == '' || data == 'undefined';
			},
			isNotBlank: function(data) {
				return !this.isBlank(data);
			},
			// 判断是否在开发者工具中
			isDevTools: function() {
				if (this.isDev || (this.globalData != null && this.globalData.isDev)) {
					return true;
				}
				const systemInfo = uni.getSystemInfoSync();
				return systemInfo.platform === 'devtools';
			}
		},
		onLaunch: function() {
			console.log('App Launch');
			uni.showLoading({
				title: "数据正在初始化"
			});
			uni.isShowLoading = true;
			uni.http = http;
			uni.draw = draw;
			uni.dyAd = dyAd;
			uni.imageDraw = imageDraw;
			uni.websocket = websocket;
			uni.notice = notice;
			uni.wxPay = wxPay;
			uni.audio = audio;
			uni.audioContextMap = new Map();
			//全局唯一录音
			uni.recorderManager = uni.getRecorderManager();
			uni.recorderManager.onFrameRecorded((res) => {
				console.log("recorderManager.onFrameRecorded", res);
			})
			//此处进行登录操作。
			this.login();

			let that = this;
			uni.addInterceptor('navigateTo', { //监听跳转
				success(e) {
					that.watchRouter();
				}
			})
			uni.addInterceptor('redirectTo', { //监听关闭本页面跳转
				success(e) {
					that.watchRouter();
				}
			})
			uni.addInterceptor('switchTab', { //监听tabBar跳转
				success(e) {
					that.watchRouter();
				}
			})
			uni.addInterceptor('navigateBack', { //监听返回
				success(e) {
					that.watchRouter();
				}
			})

			//微信小程序检测更新
			this.getNewSystems();
		},
		onShow: function() {

		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			watchRouter() {
				this.login();
			},
			login: function() {
				const that = this;
				console.log("check_login");
				if (that.globalData.isNotBlank(uni.getStorageSync(that.globalData.openIdCacheName)) &&
					that.globalData.isNotBlank(uni.getStorageSync(that.globalData.avatarUrlCacheName)) &&
					that.globalData.isNotBlank(uni.getStorageSync(that.globalData.nickNameCacheName))) {
					return;
				}
				console.log("用户登陆");
				var appId = that.globalData.appId;
				uni.login({
					success(res1) {
						if (res1.code) {
							console.log("uni.login", res1);
							that.sendLoginTokenToServer(res1.code, appId)
						} else {
							uni.showModal({
								title: '提示',
								content: '用户组件创建失败，请确认网络正常后重试！',
								confirmText: '确认',
								success: function(res2) {
									if (res2.confirm) {
										that.sendLoginTokenToServer(res1.code, appId)
									} else if (res2.cancel) {
										console.log('用户点击了取消');
									}
								}
							});
						}
					}
				});
			},
			sendLoginTokenToServer: function(code, appId) {
				const that = this;
				const requestData = {
					token: code,
					appType: that.globalData.appType,
				}
				uni.http.userLogin(requestData, (success) => {
					console.log("login_req_success", success);
					uni.setStorageSync(that.globalData.openIdCacheName, success.data.data.openId);
					uni.setStorageSync(that.globalData.avatarUrlCacheName, success.data.data.imgUrl);
					uni.setStorageSync(that.globalData.nickNameCacheName, success.data.data.name);
				}, (fail) => {
					//登陆失败
					console.log("login_req_fail", fail);
					setTimeout(function() {
						that.login();
					}, 2000);
				})

			},
			//检测小程序更新
			getNewSystems() {
				if (wx.canIUse('getUpdateManager')) {
					const updateManager = wx.getUpdateManager() //管理小程序更新
					updateManager.onCheckForUpdate(function(res) {
						console.log(res)
						if (res.hasUpdate) { //res.hasUpdate返回boolean类型
							updateManager.onUpdateReady(function() {
								wx.showModal({
									title: '更新提示',
									content: '新版本已经准备好，是否重启当前应用？',
									showCancel: false,
									success(res) {
										if (res.confirm) {
											// 新的版本已经下载好，调用applyUpdate应用新版本并重启
											updateManager.applyUpdate()
										}
									}
								})
							})
							// 新版本下载失败时执行
							updateManager.onUpdateFailed(function() {
								wx.showModal({
									title: '发现新版本',
									content: '新版本更新失败，请稍后重试',
								})
							})
						}
					})
				} else {
					//如果小程序需要在最新的微信版本体验，如下提示
					wx.showModal({
						title: '更新提示',
						content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
					})
				}
			},
		}
	}
</script>

<style>
	@import '@/common/uni.css';

	/*每个页面公共css */
	page {
		min-height: 100%;
		background-color: #ede8ee;
		height: 100%;
		font-size: 16px;
		line-height: 1.6;
	}
</style>