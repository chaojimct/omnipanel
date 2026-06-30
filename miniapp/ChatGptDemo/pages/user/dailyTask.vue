<template>
	<view class="vip-container">
		<view class="vip-top">
			<!-- 此处展示权益次数 -->
			<showVipInfo ref="showVipInfoChild"></showVipInfo>
		</view>
		<view class="vip-content">
			<view class="task-name">
				<text class="task-name-1">每日任务&nbsp;&nbsp;</text>
				<text class="task-name-2">免费获取条数</text>
			</view>
			<view class="n-p" hover-class="hover-class" style="margin-bottom:0px;padding-bottom: 20px;"
				v-for="(item,index) in dailyTaskArray" :key="index">
				<view style="position: relative">
					<view class="p-left">
						<uni-icons :type="item.icon" size="24" color="#757575"></uni-icons>
					</view>
				</view>
				<view class="p-right">
					<view class="p-right-main" style="width: 70%;">
						<view class="p-right-main-name">
							<text
								style="font-size: 14px;">{{arrayTaskComputed(item.title1_0,item.title1_1,countIdComputed(item.countId))}}</text>
							<br>
							<text style="font-size: 12px;">
								{{item.title2}}
							</text>
						</view>
					</view>
					<view v-if="item.showSystem" class="lfet-a" style="margin-right: 10px;">
						<button open-type="share" class="adBtn">{{item.btnName}}</button>
					</view>
					<view v-if="!item.showSystem" class="lfet-a" style="margin-right: 10px;">
						<button class="adBtn" @click="clickTaskBtn(item)">{{item.btnName}}</button>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	//激励广告
	let rewardedVideoAd = null
	export default {
		data() {
			return {
				drawCount: '',
				dialogCount: '',
				dialogPlusCount: '',
				//今日分享次数
				shareTodayCount: '',
				//今日签到次数
				signInTodayCount: '',
				//看广告获取plus对话次数
				plusAdTodayCount: '',
				dailyTaskArray: [
					// {
					// 	countId: 1,
					// 	icon: 'checkbox',
					// 	title1_0: '签到(今日',
					// 	title1_1: '/1次)',
					// 	title2: '20基础对话/次',
					// 	btnName: '签到',
					// 	showSystem: false,
					// },
					{
						countId: 2,
						icon: 'paperplane',
						title1_0: '分享到群聊(今日',
						title1_1: '/3次)',
						title2: '1绘画/次',
						btnName: '去转发',
						showSystem: true,
					},
					{
						countId: 3,
						icon: 'paperplane',
						title1_0: '获取plus对话(今日',
						title1_1: '/3次)',
						title2: '1plus对话/次',
						btnName: '看广告',
						showSystem: false,
					}
				]
			}
		},
		created() {
			this.showUserCount();
		},
		onLoad() {
			const that = this;
			if (wx.createRewardedVideoAd) {
				rewardedVideoAd = wx.createRewardedVideoAd({
					adUnitId: 'adunit-86379ddd9364d117'
				})
				rewardedVideoAd.onLoad(() => {
					console.log('onLoad event emit')
				})
				rewardedVideoAd.onError((err) => {
					console.log('onError event emit', err)
				})
				rewardedVideoAd.onClose((res) => {
					console.log('onClose event emit', res)
					if (res && res.isEnded) {
						// 正常播放结束，可以下发游戏奖励
						getApp().globalData.adTypePlay = 'plusStimulateAd';
						uni.http.addValidTime((res, success) => {
							that.$refs.showVipInfoChild.showUserCount();
						});
					} else {
						// 播放中途退出，不下发游戏奖励
					}
				})
			}
		},
		computed: {
			arrayTaskComputed() {
				return (t10, t11, count) => t10 + count + t11;
			},
			countIdComputed() {
				return (countId) => {
					switch (countId) {
						case 1:
							return this.signInTodayCount;
						case 2:
							return this.shareTodayCount;
						case 3:
							return this.plusAdTodayCount;
					}
				};
			}
		},
		onShareAppMessage() {
			const that = this;
			if (getApp().globalData.platform === 'mp-toutiao') {
				if (that.shareTodayCount < 3) {
					getApp().globalData.adTypePlay = 'stimulateShareAd';
					uni.http.addValidTime((res, success) => {
						that.$refs.showVipInfoChild.showUserCount();
					});
				} else {
					uni.showModal({
						content: '分享次数已达上限',
						showCancel: false
					});
				}
			} else if (getApp().globalData.platform === 'mp-weixin') {
				if (that.shareTodayCount < 3) {
					getApp().globalData.adTypePlay = 'stimulateShareAd';
					uni.http.addValidTime((res, success) => {
						that.$refs.showVipInfoChild.showUserCount();
					});
				} else {
					uni.showModal({
						content: '分享次数已达上限',
						showCancel: false
					});
				}
			}

			const timestamp = new Date().getTime();
			return {
				title: "超强AI4.0来袭，免费体验",
				path: '/pages/index/dialog',
				imageUrl: 'https://wx.wtianyu.com/ai/static/share/share.jpg',
			}
		},
		methods: {
			clickTaskBtn(task) {
				console.log("clickTaskBtn", task);
				const that = this;
				if (task.countId === 1) {
					//每日签到
					if (that.signInTodayCount < 1) {
						getApp().globalData.adTypePlay = 'signIn';
						uni.http.addValidTime((res, success) => {
							that.$refs.showVipInfoChild.showUserCount();
						});
					} else {
						uni.showModal({
							content: '您今天已经签到了',
							showCancel: false
						});
					}
				} else if (task.countId === 3) {
					// 用户触发广告后，显示激励视频广告
					if (rewardedVideoAd) {
						rewardedVideoAd.show()
					}
				}
			},
			showUserCount() {
				//获取最新数据
				uni.http.getUserValidTime((res, success) => {
					if (success) {
						this.drawCount = res.data.data.drawCount;
						this.dialogCount = res.data.data
							.dialogCount;
						this.dialogPlusCount = res.data.data
							.dialogPlusCount;
						this.plusAdTodayCount = res.data.data.plusAdTodayCount;
					}
				});
			},
			sendParentUser(user) {
				console.log("sendParentUser", user);
				this.shareTodayCount = user.shareDrawTodayCount;
				this.signInTodayCount = user.signInTodayCount;
				this.plusAdTodayCount = user.plusAdTodayCount;
			}
		}
	}
</script>

<style>
	.vip-container {
		position: relative;
		justify-content: center;
		width: 100%;
	}

	.vip-top {
		width: 100%;
		height: 120px;
		background-color: #4fbbbf;
	}

	.vip-content {
		width: 90%;
		min-height: 100px;
		position: relative;
		left: 5%;
		background-color: white;
		top: -30px;
		margin-top: 10px;
		border-radius: 10px;
	}

	.task-name {
		padding: 10px;
	}

	.task-name-1 {
		font-size: 15px;
		font-weight: bold;
	}

	.task-name-2 {
		font-size: 12px;
		color: #8d9083;
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
		background-color: #4fbbbf;
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
		font-size: 28rpx;
		font-weight: 500;
		width: 100%;
	}

	.p-right-main-time {
		margin-right: 20rpx;
		font-size: 20rpx;
		color: #9d9d9d;
	}

	.adBtn {
		font-size: 12px;
		width: 80px;
		border-radius: 20px;
		background: linear-gradient(270deg, #FF5CE4 0%, #36C2FF 100%);
	}
</style>