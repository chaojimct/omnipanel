<template>
	<view class="container">
		<view class="table">
			<view class="row header-row">
				<text class="cell">产品名称</text>
				<text class="cell">金额(元)</text>
				<text class="cell">状态</text>
				<text class="cell" style="flex: 1.5;">日期</text>
			</view>
			<block v-for="(item, index) in rechargeList" :key="index">
				<view class="row">
					<text class="cell">{{ item.productName }}</text>
					<text class="cell">{{ item.amount.toFixed(2) }}</text>
					<text class="cell">{{ item.orderStatusName }}</text>
					<text class="cell" style="flex: 1.5;">{{ item.dateStr }}</text>
				</view>
			</block>
			<view v-if="loading" class="row loading-row">
				<text class="cell" colSpan="4">加载中...</text>
			</view>
			<view v-else-if="noMoreData" class="row no-more-data-row">
				<text class="cell" colSpan="4">没有更多数据了</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				loading: false,
				noMoreData: false,
				rechargeList: [
					// 初始为空数组，用于存放后端返回的充值记录数据
				],
				pageCurrent: 1,
				pageSize: 20,
			};
		},
		onLoad() {
			// 页面加载完成后，首次加载充值记录数据
			this.loadData(true);
		},
		methods: {
			loadData(init) {
				// 模拟请求后端数据
				this.loading = true; // 显示加载中状态
				const queryReq = {
					page: {
						current: this.pageCurrent,
						size: this.pageSize
					}
				}
				uni.wxPay.orderRecord(queryReq, (success) => {
					uni.stopPullDownRefresh();
					this.loading = false;
					this.pageCurrent++;
					console.log("success", success);
					if (success.data.data.records.length > 0) {
						// 如果有新数据
						if (init) {
							this.rechargeList = success.data.data.records; // 将新数据追加到原有数据后面
						} else {
							this.rechargeList = this.rechargeList.concat(success.data.data
							.records); // 将新数据追加到原有数据后面
						}
					} else {
						// 如果没有新数据
						this.noMoreData = true; // 设置没有更多数据了的标志
					}
				}, (fail) => {
					uni.stopPullDownRefresh();
					this.loading = false;
				})
			},
			loadMore(init) {
				// 上拉加载更多时触发，调用loadData方法加载更多数据
				if (this.loading || this.noMoreData) {
					return;
				}
				this.loadData(init);
			},
		},
		onReachBottom() {
			// 当页面滚动到底部时触发上拉加载更多事件
			console.log("onReachBottom");
			this.loadMore(false);
		},
		onPullDownRefresh() {
			this.pageCurrent = 1;
			this.loadMore(true);
		}
	};
</script>

<style>
	.container {
		padding: 20px;
	}

	.header {
		margin-bottom: 20px;
	}

	.title {
		font-size: 24px;
		font-weight: bold;
	}

	.table {
		width: 100%;
	}

	.row {
		display: flex;
		border-bottom: 1px solid #ddd;
		font-size: 14px;
		text-align: center;
		margin-top: 15px;
		margin-bottom: 15px;
	}

	.header-row {
		background-color: #f2f2f2;
		text-align: center;
		margin-top: 15px;
		margin-bottom: 15px;
	}

	.cell {
		flex: 1;
		padding: 8px;
	}

	.loading-row,
	.no-more-data-row {
		margin-top: 20px;
		justify-content: center;
		text-align: center;
		color: #999;
	}
</style>