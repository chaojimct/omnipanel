<template>
	<view style="margin-top: 17px;margin-left: 10px;display: flex">
		<view v-if="play&&getVoiceData" v-for="(delay, index) in delays" :key="index">
			<div class="animated-div" :style="{'animation-delay': delay}">
			</div>
		</view>
		<view v-if="play&&!getVoiceData" style="margin-top: 8px;">
			<loading-dots></loading-dots>
		</view>
	</view>
</template>

<style>
	.animated-div {
		float: left;
		margin-left: 2px;
		width: 3px;
		height: 20px;
		background-color: #000;
		transform: scaleY(0.2);
		border-radius: 5px;
		animation: chang 1s linear infinite alternate;
	}

	.animated-div-stop {
		float: left;
		margin-left: 2px;
		width: 3px;
		height: 20px;
		background-color: #000;
		border-radius: 5px;
	}

	/* 颜色和高度动态变化 */
	@keyframes chang {
		0% {
			background-color: #000;
			transform: scaleY(0.2);
		}

		100% {
			background-color: #000;
			transform: scaleY(1);
		}
	}
</style>

<script>
	export default {
		props: ['play', 'getVoiceData'],
		methods: {
			initTY(index) {
				let indexL = index / 10;
				return indexL > 0.5 ? (1 - indexL) * 2 : indexL * 2
			}
		},
		data() {
			return {
				delays: [
					'0.2s',
					'0.4s',
					'0.4s',
					'0.6s',
					'0.8s',
					'1s',
					'1.2s',
					'1.4s',
					'1.6s',
					'1.8s',
				],
			};
		},
	};
</script>