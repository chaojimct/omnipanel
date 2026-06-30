<template>
	<view>
		<view v-if="play&&getVoiceData" class="voice-line-wrap"
			:style=" {'--line-height': upx2px(50), '--line-start-color': 'royalblue', '--line-end-color': 'indianred'} ">
			<view class="voice-line one"></view>
			<view class="voice-line two"></view>
			<view class="voice-line three"></view>
			<view class="voice-line four"></view>
			<view class="voice-line five"></view>
			<view class="voice-line six"></view>
			<view class="voice-line seven"></view>
			<view class="voice-line six"></view>
			<view class="voice-line five"></view>
			<view class="voice-line four"></view>
			<view class="voice-line three"></view>
			<view class="voice-line two"></view>
			<view class="voice-line one"></view>
		</view>
		<view v-if="play&&!getVoiceData" style="margin-top: 8px;">
			<loading-dots></loading-dots>
		</view>
	</view>
</template>
<script>
	export default {
		data() {
			return {}
		},
		props: ['play', 'getVoiceData'],
		methods: {
			upx2px(upx) {
				return uni.upx2px(upx) + 'px';
			},
		}
	}
</script>

<style lang="scss">
	.voice-line-wrap {
		display: flex;
		align-items: center;

		.voice-line {
			width: 5rpx;
			height: 40rpx;
			border-radius: 3rpx;
			margin: 0 5rpx;
		}

		.one {
			animation: wave 0.4s 1s linear infinite alternate;
		}

		.two {
			animation: wave 0.4s 0.9s linear infinite alternate;
		}

		.three {
			animation: wave 0.4s 0.8s linear infinite alternate;
		}

		.four {
			animation: wave 0.4s 0.7s linear infinite alternate;
		}

		.five {
			animation: wave 0.4s 0.6s linear infinite alternate;
		}

		.six {
			animation: wave 0.4s 0.5s linear infinite alternate;
		}

		.seven {
			animation: wave 0.4s linear infinite alternate;
		}
	}

	@keyframes wave {
		0% {
			transform: scale(1, 1);
			background-color: var(--line-start-color);
		}

		100% {
			transform: scale(1, 0.2);
			background-color: var(--line-end-color);
		}
	}
</style>