<template>
	<view>
<!-- 		<ad-rewarded-video ref="adRewardedVideo" adpid="1844001540" :preload="false" :loadnext="false" :disabled="true"
			v-slot:default="{loading, error}" @load="onadload" @close="onadclose" @error="onaderror">
			<view class="ad-error" v-if="error">{{error}}</view>
		</ad-rewarded-video> -->
		<!-- <button type="primary" :disabled="isLoading" :loading="isLoading" @click="showAd">显示广告</button> -->
	</view>
</template>

<script>
	export default {
		name: "stimulate-ad",
		data() {
			return {
				isLoading: false,
				successBack: null
			}
		},
		onReady() {
			this.isLoading = true;
			this.$refs.adRewardedVideo.load();
		},
		methods: {
			showAd(callBack) {
				this.successBack = callBack;
				if (this.isLoading) {
					return
				}
				console.log("adRewardedVideo", this.$refs.adRewardedVideo)
				this.$refs.adRewardedVideo.show();
			},
			onadload(e) {
				this.isLoading = false;
				console.log('广告数据加载成功');
			},
			onadclose(e) {
				const detail = e.detail
				const that = this;
				// 用户点击了【关闭广告】按钮
				if (detail && detail.isEnded) {
					// 正常播放结束
					console.log("onClose " + detail.isEnded);
					uni.http.addValidTime((res, success) => {
						if (success) {
							that.successBack();
						}
					});
				} else {
					// 播放中途退出
					console.log("onClose " + detail.isEnded);
				}
			},
			onaderror(e) {
				// 广告加载失败
				console.log(e.detail);
				this.isLoading = false;
			}
		}
	}
</script>

<style>
	.ad-error {
		color: orangered;
		margin-top: 5px;
	}
</style>