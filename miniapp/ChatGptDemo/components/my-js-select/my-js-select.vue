<template>
	<view>
		<view class="arrivalNavigation" v-if="showHidden">
			<view class="d4"></view>
			<view class="sideNavigation">
				<nav>
					<view class="li" v-for="(item ,index) in selectDatas" :index="index" :key="index"
						@tap="clickSelect(item)">
						{{item.name}}
						<view class="liBottomBorder"></view>
					</view>
				</nav>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {

			};
		},
		props: ['showHidden', 'selectDatas'],
		methods: {
			clickSelect(item) {
				this.$emit('selectModel', item);
			}
		},
		mounted() {},
	}
</script>

<style lang="less">
	.arrivalNavigation {
		width: 210rpx;
		position: absolute;
		left: 20rpx;
		z-index: 9999;

		.sideNavigation {
			width: 208rpx;
			background-color: #202020;
			color: #eee;
			border-radius: 10rpx;

			.li {
				height: 85rpx;
				text-align: center;
				line-height: 85rpx;
				font-size: 25rpx;
			}

			.liBottomBorder {
				border: 0.1rpx solid #373737;
			}

		}

		.d4 {
			width: 0;
			height: 0;
			margin-left: 20rpx;
			margin-top: -20rpx;
			border-width: 20rpx;
			border-style: solid;
			border-color: transparent #373737 transparent transparent;
			transform: rotate(90deg);
			/*顺时针旋转90°*/

		}

	}
</style>