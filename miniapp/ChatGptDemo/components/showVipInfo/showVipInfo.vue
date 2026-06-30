<template>
	<view class="vip-top">
		<!-- 此处展示权益次数 -->
		<view class="wtall-container">
			<view class="wtall-box">
				<view class="wtall-box-text1"><text>{{dialogCount}}</text>&nbsp;条</view>
				<view class="wtall-box-text2">基础对话</view>
			</view>
			<view class="wtall-box">
				<view class="wtall-box-text1"><text>{{dialogPlusCount}}</text>&nbsp;条</view>
				<view class="wtall-box-text2">4.0plus对话</view>
			</view>
			<view class="wtall-box">
				<view class="wtall-box-text1"><text>{{drawCount}}</text>&nbsp;次</view>
				<view class="wtall-box-text2">AI绘画</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				drawCount: '',
				dialogCount: '',
				dialogPlusCount: '',
				user: null,
			}
		},
		created() {
			console.log("showVipInfo");
			this.showUserCount();
		},
		methods: {
			showUserCount() {
				//获取最新数据
				uni.http.getUserValidTime((res, success) => {
					if (success) {
						this.drawCount = res.data.data.drawCount;
						this.dialogCount = res.data.data
							.dialogCount;
						this.dialogPlusCount = res.data.data
							.dialogPlusCount;
						this.user = res.data.data;
						this.$parent.sendParentUser(this.user);
					}
				});
			},
		}
	}
</script>

<style>
	.vip-top {
		width: 100%;
		height: 120px;
		background-color: #4fbbbf;
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
		/* background-color: white; */
		border-radius: 10px;
		font-size: 14px;
		color: white;
	}

	.wtall-box-text1 {
		margin-top: 10px;
	}

	.wtall-box-text1 text {
		font-size: 16px;
		color: red;
		font-weight: bold;
	}

	.wtall-box-text2 {
		margin-top: 6px;
	}
</style>