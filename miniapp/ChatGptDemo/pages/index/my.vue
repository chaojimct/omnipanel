<template>
	<view>
		<view style="background-color: #4fbbbf;">
			<view class="personal">
				<view class="personal-main">
					<image :src="avatarUrl" class="u-avatar" data-eventsync="true" @click="changeImage"></image>
					<view class="personal-info">
						<view v-if="dialogValidTimeShow">
							<view style="margin-top: 20px;font-size: 18px;font-weight: bold;">{{nickName}}</view>
							<br>
							<view style="font-size: 13px;color: rgb(128, 128, 128);">对话到期：{{dialogValidTime}}</view>
							<br>
							<view style="font-size: 13px;color: rgb(128, 128, 128);">绘画次数：{{drawCount}}</view>
						</view>
						<view v-else>
							<view style="font-size: 18px;">{{nickName}}</view>
						</view>
					</view>
				</view>
				<uni-icons v-if="platform === 'mp-weixin'" type="right" @click="changeImage" size="22"
					class="p-right-icon"></uni-icons>
			</view>
			<view class="vip-buy">
				<view class="vip-bottom" style="display: flex;">
					<image mode="scaleToFill" src="../../static/img/bg-vip.png" style="width: 100%;" class="vip-bottom">
					</image>
					<view style="color:#eed196;z-index: 99;padding: 16px;font-size: 16px;">高速通道&nbsp;&nbsp;更多特权
					</view>
					<button class="vip-btn" @click="buyVip">立即获取</button>
				</view>
			</view>
		</view>

		<!-- 此处展示权益次数 -->
		<view class="wtall-container">
			<view class="wtall-box clickEacct" @click="buyVip">
				<view class="wtall-box-text1"><text>{{dialogCount}}</text>&nbsp;条</view>
				<view class="wtall-box-text2">基础对话</view>
			</view>
			<view class="wtall-box clickEacct" @click="buyVip">
				<view class="wtall-box-text1"><text>{{dialogPlusCount}}</text>&nbsp;条</view>
				<view class="wtall-box-text2">4.0plus对话</view>
			</view>
			<view class="wtall-box clickEacct" @click="buyVip">
				<view class="wtall-box-text1"><text>{{drawCount}}</text>&nbsp;次</view>
				<view class="wtall-box-text2">AI绘画</view>
			</view>
		</view>


		<view class="n-p clickEacct" v-for="(item,index) in list" :key="index" hover-class="hover-class"
			@click="onClick(item)">
			<view style="position: relative">
				<view class="p-left">
					<!-- <u-icon :name="item.icon" size="45" color="#757575"></u-icon> -->
					<uni-icons :type="item.icon" size="24" color="#757575"></uni-icons>
				</view>
			</view>
			<view class="p-right">
				<view class="p-right-main">
					<view class="p-right-main-name" :style="'color: '+item.textColor" v-if="item.showType==0">
						{{item.name}}
					</view>
					<view class="p-right-main-name" v-if="item.showType==1"><button open-type="share"
							class="btn_2_text">{{item.name}}</button></view>
					<view class="p-right-main-name" v-if="item.showType==2">
						<button open-type="im" data-im-id="wtallai" class="btn_2_text" bindim="imCallback"
							binderror="onimError">
							{{item.name}}
						</button>
					</view>
				</view>

				<view class="lfet-a" v-if="item.showArrow">
					<uni-icons type="right" size="22" class="p-right-icon"></uni-icons>
				</view>
			</view>
		</view>
		<!-- 输入框示例 -->
		<uni-popup ref="cardCodeDialog" type="dialog">
			<uni-popup-dialog ref="inputClose" :before-close="true" mode="input" title="请输入兑换码" value=""
				placeholder="请输入兑换码" @confirm="cardCodeDialogConfirm" @close="cardCodeDialogClose"></uni-popup-dialog>
		</uni-popup>

	</view>
</template>

<script>
	import stimulateAd from '../../components/stimulateAd/stimulateAd.vue';
	export default {
		components: {
			stimulateAd
		},
		data() {
			return {
				list: [
					// {
					// 	name: '分享给好友',
					// 	id: 'setUp',
					// 	icon: 'paperplane-filled',
					// 	iconBackground: '#3b2021',
					// 	showArrow: false,
					// 	showType: 1,
					// },
					{
						name: '每日任务',
						id: 'dailyTask',
						icon: 'star',
						textColor: '#333',
						showArrow: true,
						showType: 0,
					},
					{
						name: '卡密兑换',
						id: 'cardCode',
						icon: 'gift',
						textColor: '#333',
						showArrow: true,
						showType: 0,
					},
					{
						name: '绘画记录',
						id: 'drawRecord',
						icon: 'image',
						textColor: '#333',
						showArrow: true,
						showType: 0,
					},
					// {
					// 	name: '卡密兑换',
					// 	id: 'exchange',
					// 	icon: 'gift',
					// 	textColor: '#333',
					// 	showArrow: true,
					// 	showType: 0,
					// },
					{
						name: '充值记录',
						id: 'recharge',
						icon: 'list',
						textColor: '#333',
						showArrow: true,
						showType: 0,
					},
					{
						name: '联系我们',
						id: 'customerSupportIm',
						icon: 'headphones',
						textColor: '#333',
						showArrow: true,
						showType: 0,
					}, {
						name: '设置',
						id: 'settings',
						icon: 'settings',
						textColor: '#333',
						showArrow: true,
						showType: 0,
					}, {
						name: '清除缓存',
						id: 'clearStorage',
						icon: 'close',
						textColor: '#333',
						showArrow: true,
						showType: 0,
					},
					// {
					// 	name: '联系客服',
					// 	id: 'customerSupport',
					// 	icon: 'headphones',
					// 	iconBackground: '#3b2021',
					// 	showArrow: true,
					// 	showType: 0,
					// }, 

				],
				nickName: uni.getStorageSync(getApp().globalData.nickNameCacheName),
				avatarUrl: uni.getStorageSync(getApp().globalData.avatarUrlCacheName),
				dialogValidTime: '',
				dialogValidTimeShow: false,
				dialogCount: '',
				dialogPlusCount: '',
				drawCount: null,
				adDialogTodayCount: 0,
				adDrawTodayCount: 0,
				shareDrawTodayCount: 0,
				dyVideoAd: null,
				platform: getApp().globalData.platform,
			}
		},
		onShareAppMessage() {
			const that = this;
			if (this.platform === 'mp-toutiao') {
				if (that.shareDrawTodayCount < 2) {
					getApp().globalData.adTypePlay = 'stimulateShareAd';
					uni.http.addValidTime((res, success) => {
						that.showValidTime();
					});
				}
			} else if (this.platform === 'mp-weixin') {
				if (that.shareDrawTodayCount < 2) {
					getApp().globalData.adTypePlay = 'stimulateShareAd';
					uni.http.addValidTime((res, success) => {
						that.showValidTime();
					});
				}
			}

			const timestamp = new Date().getTime();
			return {
				title: this.shareText ? this.shareText : "体验AI对话+AI绘画",
				path: '/pages/index/dialog',
				imageUrl: 'https://wx.wtianyu.com/ai/static/share/share.jpg?t=' + timestamp,
			}
		},
		onShow() {
			console.log("onShow");
			this.nickName = getApp().globalData.isBlank(uni.getStorageSync(getApp().globalData.nickNameCacheName)) ?
				'微信用户' :
				uni.getStorageSync(getApp().globalData.nickNameCacheName);
			this.avatarUrl = getApp().globalData.isBlank(uni.getStorageSync(getApp().globalData.avatarUrlCacheName)) ?
				'../../static/img/default_img.png' : uni.getStorageSync(getApp().globalData.avatarUrlCacheName);

			this.showValidTime();
		},
		onLoad() {
			if (this.platform === 'mp-toutiao') {
				uni.dyAd.createRewardedVideoAd(this);
			}
		},
		methods: {
			cardCodeDialogClose() {
				this.$refs.cardCodeDialog.close();
			},
			cardCodeDialogConfirm(e) {
				console.log("cardCodeDialogConfirm", e);
				const that = this;
				if (e === '') {
					return;
				}
				uni.http.cardCodeChange({
					num: e
				}, (res) => {
					console.log('success', res);
					uni.showModal({
						content: "兑换成功，您已获得" + res.data.data.textInfo,
						showCancel: false,
						success: function(res) {
							that.$refs.cardCodeDialog.close();
							that.showValidTime();
						}
					});
				})
			},
			buyVip() {
				uni.navigateTo({
					url: '/pages/user/vipBuy'
				});
			},
			imCallback(e) {
				console.log("跳转IM客服成功", e.detail);
			},
			onimError(e) {
				console.log("拉起IM客服失败", e.detail);
			},
			rewardSuccess() {
				const that = this;
				// 完整观看视频之后的调用事件
				console.log("抖音广告rewardSuccess");
				uni.http.addValidTime(() => {
					that.showValidTime();
				});
			},
			rewardFaile() {
				console.log("抖音广告rewardFaile");
			},
			dialogAd() {
				const that = this;
				if (this.platform === 'mp-toutiao') {
					getApp().globalData.adTypePlay = 'stimulateAd';
					uni.dyAd.showRewardedVideoAd();
				} else if (this.platform === 'mp-weixin') {
					const that = this;
					getApp().globalData.adTypePlay = 'stimulateAd';
					this.$refs.stimulateAd.showAd(() => {
						that.showValidTime();
					});
				}
			},
			drawAd() {
				const that = this;
				if (this.platform === 'mp-toutiao') {
					getApp().globalData.adTypePlay = 'stimulateDrawAd';
					uni.dyAd.showRewardedVideoAd();
				} else if (this.platform === 'mp-weixin') {
					getApp().globalData.adTypePlay = 'stimulateDrawAd';
					this.$refs.stimulateAd.showAd(() => {
						that.showValidTime();
					});
				}
			},
			changeImage() {
				const that = this;
				if (this.platform === 'mp-toutiao') {
					tt.getUserProfile({
						success: (resUser) => {
							console.log('tt.getUserProfile success，获取的用户信息：', resUser);
							uni.login({
								success(res) {
									const requestData = {
										token: res.code,
										'imgUrl': resUser.userInfo.avatarUrl,
										'name': resUser.userInfo.nickName,
										appType: getApp().globalData.appType
									};
									uni.http.updateNameAndImg(requestData, () => {
										that.nickName = resUser.userInfo.nickName;
										that.avatarUrl = resUser.userInfo.avatarUrl;
									});
								}
							})
						},
						fail(err) {
							console.log('tt.getUserProfile failed', err.errMsg);
						},
						complete() {
							console.log('tt.getUserProfile completed');
						},
					});
				} else if (this.platform === 'mp-weixin') {
					uni.navigateTo({
						url: '/pages/user/wx-login'
					});
				}
			},
			showValidTime() {
				//获取最新数据
				uni.http.getUserValidTime((res, success) => {
					if (success) {
						this.drawCount = res.data.data.drawCount;
						this.dialogCount = res.data.data.dialogCount;
						this.dialogPlusCount = res.data.data.dialogPlusCount;
					}
				});
			},
			onClick(item) {
				console.log(item);
				const that = this;
				if (item.id === 'clearStorage') {
					//清除缓存
					uni.clearStorageSync();
					uni.showModal({
						title: '提示',
						content: '缓存已清除，请重新启动小程序',
						showCancel: false,
					});
					getApp().login();
				} else if (item.id === 'customerSupportIm') {
					//联系客服
					uni.navigateTo({
						url: '/pages/user/customerSupport'
					});
				} else if (item.id === 'drawRecord') {
					//绘画记录
					uni.navigateTo({
						url: '/pages/user/drawTask'
					});
				} else if (item.id === 'recharge') {
					//充值记录
					uni.navigateTo({
						url: '/pages/user/rechargeRecord'
					});
				} else if (item.id === 'settings') {
					//设置
					uni.navigateTo({
						url: '/pages/user/setting'
					});
				} else if (item.id === 'dailyTask') {
					//每日任务
					uni.navigateTo({
						url: '/pages/user/dailyTask'
					});
				} else if (item.id === 'cardCode') {
					this.$refs.cardCodeDialog.open();
				}
			},
		}
	}
</script>

<style>
	/* 点击效果 */
	.clickEacct {
		transition: background-color 0.3s ease;
		/* 过渡效果 */
	}

	.clickEacct:active {
		background-color: #ddd;
		/* 点击时的背景色 */
	}

	page {
		background-color: #f7f7f7;
	}

	.wtall-container {
		display: flex;
		padding: 10px;
	}

	.wtall-box {
		text-align: center;
		flex: 1;
		height: 80px;
		margin-right: 10px;
		background-color: white;
		border-radius: 10px;
		font-size: 14px;
	}

	.wtall-box-text1 {
		margin-top: 10px;
	}

	.wtall-box-text1 text {
		font-size: 16px;
		color: #4fbbbf;
		font-weight: bold;
	}

	.wtall-box-text2 {
		margin-top: 6px;
	}

	.vip-buy {
		display: flex;
		position: relative;
		justify-content: center;
		height: 60px;
		width: 100%;
	}

	.vip-bottom {
		position: absolute;
		bottom: -3px;
		height: 60px;
		width: 90%;
	}

	.vip-btn {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100px;
		height: 30px;
		margin-top: 14px;
		background: linear-gradient(-90deg, #f1ce80, #ffe8b5);
		border-radius: 5px;
		font-size: 16px;
		padding: 0;
		margin-right: 15px;
	}

	.adBtn {
		font-size: 14px;
		width: 80px;
		background: linear-gradient(270deg, #FF5CE4 0%, #36C2FF 100%);
	}

	.btn_2_text {
		background: none;
		border: none;
		padding: 0;
		color: #333;
		cursor: pointer;
		text-align: left;
		width: 100%;
	}

	.btn_2_text:after {
		background: none;
		border: none;
		padding: 0;
		color: #333;
		cursor: pointer;
		text-align: left;
		width: 100%;
	}

	.personal {
		display: flex;
		align-items: center;
		/* justify-content: space-between; */
		padding: 30rpx 0 40rpx 30rpx;
	}

	.personal-main {
		display: flex;
		align-items: center;
		width: 80%;
	}

	.personal-info {
		display: flex;
		flex-direction: column;
	}

	.u-avatar {
		margin-right: 30rpx;
		width: 80px;
		height: 80px;
		border-radius: 7px;
	}

	.navbar-right {
		padding: 0 40rpx;
	}

	.navbar-right-icon {
		margin-left: 50rpx;
	}

	.hover-class {
		background-color: #efefef;
	}

	.n-p {
		display: flex;
		align-items: center;
		background-color: #ffffff;
		margin-bottom: 4rpx;
		height: 50px;
	}

	.p-right-icon {
		padding: 0 40rpx;
	}

	.p-left {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 60rpx;
		height: 60rpx;
		padding: 10rpx;
		margin: 16rpx;
		color: #FFFFFF;
		border-radius: 10rpx;

	}

	.p-right {
		height: 60rpx;
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.p-right-main {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	.p-right-main-name {
		font-size: 32rpx;
		font-weight: 500;
		width: 100%;
	}

	.p-right-main-time {
		margin-right: 20rpx;
		font-size: 24rpx;
		color: #9d9d9d;
	}
</style>