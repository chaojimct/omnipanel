<template>
	<view>
		<view class="slider-box" style="width: 70%;margin-left: 20px;">
			<movable-area @click="setProgress($event)" class="sliderBar">
				<view class="gone" :style="{width: x +'px'}"></view>
				<movable-view class="slider" :x="x" :y="y" direction="all" @change="onChange">
					<!-- <text>{{ score }}</text> -->
				</movable-view>
			</movable-area>

			<view :style="{width: (100 - maxScore) +'%'}"></view>

			<view><text style="position: absolute;top: -35%;right: -60px;font-weight: bold;">{{ score }}</text></view>
		</view>
	</view>
</template>

<script>
	export default {
		props: ['min', 'max'],
		data() {
			return {
				slideBarWidth: 0,
				minScore: this.min ? this.min : 0,
				maxScore: this.max ? this.max : 100,
				x: 0,
				y: 0,
				score: 35,
				initFlag: false,
			};
		},
		created() {
			console.log("created2")
			var that = this;
			this.$nextTick(() => {
				uni.createSelectorQuery().in(this).select(".slider-box").boundingClientRect(function(res) {
					if (res !== null) {
						that.slideBarWidth = res.width;
					}
					console.log("that.slideBarWidth", that.slideBarWidth);
				}).exec();
			})
		},
		mounted() {
			this.getScreenWidth();
		},
		methods: {
			getScreenWidth() {
				this.x = uni.getSystemInfoSync().windowWidth * 0.7 * this.score / 100;
				setTimeout(() => {
					this.initFlag = true;
				}, 500);
			},
			setProgress(event) {
				// this.onChange(event);
			},
			onChange: function(e) {
				if (!this.initFlag) return;
				this.x = e.detail.x
				this.score = parseInt(e.detail.x / this.slideBarWidth * 100) + parseInt(this.minScore)
				this.$emit('change', this.score)
			}
		}
	}
</script>

<style lang="scss">
	$uni-color-primary: #F63D59;

	.slider-box {
		display: flex;
		width: 100%;
		height: 32rpx;
		position: relative;

		&::before {
			content: '';
			position: absolute;
			height: 8rpx;
			border-radius: 8rpx;
			background-color: #EEEEEE;
			top: 50%;
			left: 0;
			transform: translateY(-50%);
			width: 100%;
		}

		.flex {
			flex: 1;
			height: 8rpx;
			border-radius: 8rpx 0 0 8rpx;
			background: linear-gradient(270deg, #FF5CE4 0%, #36C2FF 100%);
			margin-top: 12rpx;
			position: relative;
			z-index: 1;
		}

		.sliderBar {
			height: 100%;
			border-radius: 8rpx;
			width: 100%;

			.gone {
				background: linear-gradient(270deg, #FF5CE4 0%, #36C2FF 100%);
				height: 100%;
				position: absolute;
				left: 0;
				height: 20rpx;
				top: 12rpx;
				max-width: 100%;
				z-index: 1;
				border-radius: 0 8rpx 8rpx 0;
			}

			.slider {
				width: 0;
				height: 100%;
				position: relative;
				z-index: 2;

				&::after {
					content: '';
					position: absolute;
					border-radius: 16rpx;
					background: linear-gradient(270deg, #FF5CE4 0%, #36C2FF 100%);
					width: 32rpx;
					height: 100%;
					transform: translate(-50%, 15%);
				}

				text {
					position: absolute;
					width: 60rpx;
					color: white;
					border-radius: 14rpx;
					top: -140%;
					left: 0;
					text-align: center;
					transform: translateX(-50%);
					background: linear-gradient(270deg, #FF5CE4 0%, #36C2FF 100%);

					&::after {
						content: '';
						position: absolute;
						border: 6rpx solid transparent;
						border-top-color: $uni-color-primary;
						top: 99%;
						left: 50%;
						transform: translateX(-50%);
					}
				}
			}
		}
	}
</style>