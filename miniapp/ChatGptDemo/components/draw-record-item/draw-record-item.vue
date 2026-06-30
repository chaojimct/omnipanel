<template>
	<view class="warp">
		<uni-section title="" type="line">
			<uni-grid :column="2" :show-border="false" :square="false">
				<uni-grid-item v-for="(item ,index) in options">
					<view class="grid-item-box" @tap="click(item)">
						<text class="content3">{{item.drawStatus=='0'?'排队中':item.drawStatus=='2'?'绘制中':''}}</text>
						<image class="image3" :src="item.tmpImageUrl" mode="aspectFit" />
					</view>
				</uni-grid-item>
			</uni-grid>
		</uni-section>
	</view>
</template>


<script>
	export default {
		props: {
			options: {
				type: Object,
				default: function(e) {
					return {}
				}
			}
		},
		created() {},
		methods: {
			click(itemData) {
				this.$emit('click', itemData);
			}
		}
	}
</script>




<style lang="scss">
	.example-body {
		/* #ifndef APP-NVUE */
		// display: block;
		/* #endif */
	}

	.grid-dynamic-box {}

	.grid-item-box {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background-color: rgb(247, 247, 248);
		margin: 10px;
	}

	.grid-item-box .image3 {
		width: 100%;
		height: 300px;
		object-fit: cover;
	}

	.grid-item-box .content3 {
		background: rgb(99, 95, 97, 0.5);
		width: 80%;
		text-align: center;
		vertical-align: middle;
		position: absolute;
		z-index: 5;
		bottom: 0;
		margin-bottom: 10px;
		color: white;
		font-size: 14px;
	}
</style>