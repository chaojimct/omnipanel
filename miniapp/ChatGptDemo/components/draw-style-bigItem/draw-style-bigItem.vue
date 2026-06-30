<template>
	<view class="warp">
		<uni-section title="" type="line">
			<uni-grid :column="columnCount" :show-border="false" :square="false">
				<uni-grid-item v-for="(item ,index) in options" :index="index" :key="index">
					<view  :class="item.active?'grid-item-box item-active':'grid-item-box'"
						@tap="click(options,item)">
						<!-- <text class="content2">{{item.msg}}</text> -->
						<image class="image2" :src="item.imgUrl" mode="aspectFit" />
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
			},
			columnCount: {
				type: Object,
				default: function(e) {
					return 3
				}
			},
			showItem: {
				type: Boolean,
				default: function(e) {
					return false
				}
			},
			defaultSelect: {
				type: Object,
				default: function(e) {
					return ""
				}
			}
		},
		data() {
			return {
				items: this.options,
				selectedData: '',
			}
		},
		created() {
			console.log("created");
			this.updateDefaultSelect(this.defaultSelect);
		},
		updated() {
			console.log("updated");

		},
		methods: {
			updateDefaultSelect(a) {
				this.selectedData = a;
				if (this.selectedData === '' || this.selectedData === null) {
					this.click(this.options, this.options[0]);
				} else {
					for (let i in this.options) {
						if (this.options[i].code === this.selectedData) {
							this.click(this.options, this.options[i]);
						}
					}
				}
			},
			click(items, itemData) {
				console.log("click")
				if (items.length === 0) {
					return;
				}
				for (let i in items) {
					if (items[i].code !== itemData.code) {
						items[i].active = false;
					}
				}
				itemData.active = true;
				this.$emit('click', itemData);
			}
		}
	}
</script>




<style lang="scss">
	.item-active {
		position: relative;
		border-left: 2px solid blue;
		border-right: 2px solid purple;
	}

	.item-active::before,
	.item-active::after {
		content: "";
		position: absolute;
		left: 0;
		right: 0;
		height: 2px;
	}

	.item-active::before {
		top: 0;
		background: linear-gradient(to right, blue, purple);
	}

	.item-active::after {
		bottom: 0;
		background: linear-gradient(to right, blue, purple);
	}

	.item-active .item-inner {
		border: 2px solid;
		border-color: blue purple blue purple;
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
		height: 75px;
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background-color: rgb(247, 247, 248);
		margin: 10px;
	}

	.grid-item-box .image {
		width: 40px;
		height: 40px;
		margin: 5px;
	}

	.grid-item-box .image2 {
		width: 100%;
		height: 160px;
		object-fit: cover;
	}

	.grid-item-box .content {
		min-height: 20px;
		text-align: center;
		font-size: 16px;
		width: 100%;
	}

	.grid-item-box .content2 {
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