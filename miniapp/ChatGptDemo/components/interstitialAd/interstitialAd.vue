<template>
	<view>
		<ad-interstitial ref="adInterstitial" adpid="1815488300" :loadnext="false" v-slot:default="{loading, error}"
			@load="onadload" @close="onadclose" @error="onaderror">
			<view v-if="error">{{error}}</view>
		</ad-interstitial>
		<!-- <button type="primary" :disabled="isLoading" :loading="isLoading" @click="showAd">显示广告</button> -->
	</view>
</template>

<script>
	export default {
		name: "interstitial-ad",
		data() {
			return {
				isLoading: false
			}
		},
		methods: {
			showAd() {
				this.isLoading = true;
				this.$refs.adInterstitial.show();
			},
			onadload(e) {
				this.isLoading = false;
				console.log('广告数据加载成功');
				// this.showAd();
			},
			onadclose(e) {
				// 用户点击了关闭广告
				console.log("onadclose", e);
			},
			onaderror(e) {
				// 广告加载失败
				console.log("onaderror: ", e.detail);
			}
		}
	}
</script>