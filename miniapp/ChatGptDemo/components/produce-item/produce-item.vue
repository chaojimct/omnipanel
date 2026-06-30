<template>
	<view class="warp">
		<uni-section title="无边框带角标（3列）" type="line">
			<uni-grid :column="2" :show-border="false" :square="false">
				<uni-grid-item v-for="(item ,index) in options" :index="index" :key="index">
					<view class="grid-item-box" @click="click(item)">
						<!-- 	<view class="title"><text>{{item.title}}</text></view>
						<view class="content"><text>{{item.content}}</text></view> -->
						<text class="content2">{{item.title}}</text>
						<image class="image" :src="item.imgUrl" mode="aspectFill" />
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
		methods: {
			click(item) {
				console.log("click", item)
				this.$emit('click', item);
			},
			close(e) {
				this.$emit('close');
			}
		}
	}
</script>




<style lang="scss">
	.image {
		width: 25px;
		height: 25px;
	}

	.text {
		font-size: 14px;
		margin-top: 5px;
	}

	.example-body {
		/* #ifndef APP-NVUE */
		// display: block;
		/* #endif */
	}

	.grid-dynamic-box {
		margin-bottom: 15px;
	}

	.grid-item-box {
		min-height: 120px;
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background-color: rgb(247, 247, 248);
		margin: 10px;
		border-radius: 10px;
		margin-top: 0px;


		// display:flex; flex-direction:column; height:200rpx; justify-content:space-between;
	}

	.grid-item-box .image {
		width: 100%;
		height: 220px;
		object-fit: cover;
	}

	.grid-item-box .content2 {
		width: 100%;
		font-weight: bold;
		font-size: 24px;
		color: white;
		text-align: center;
		vertical-align: middle;
		position: absolute;
		z-index: 5;
		bottom: 0;
		margin-bottom: 10px;
	}

	.grid-item-box .title {
		font-size: 16px;
		font-weight: bold;
		display: flex;
		justify-content: center;
		align-items: center;
		flex: 1;
	}

	.grid-item-box .content {
		padding: 10px;
		font-size: 13px;
		flex: 2;
		display: flex;
		align-items: center;
		padding-bottom: 20px;
	}

	.grid-item-box-row {
		flex: 1;
		// position: relative;
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		align-items: center;
		justify-content: center;
		padding: 15px 0;
	}

	.grid-dot {
		position: absolute;
		top: 5px;
		right: 15px;
	}

	.swiper {
		height: 420px;
	}

	/* #ifdef H5 */
	@media screen and (min-width: 768px) and (max-width: 1425px) {
		.swiper {
			height: 630px;
		}
	}

	@media screen and (min-width: 1425px) {
		.swiper {
			height: 830px;
		}
	}

	/* #endif */
</style>