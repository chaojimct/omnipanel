<template>
	<view class="vip-container">
		<view class="vip-top">
			<!-- 此处展示权益次数 -->
			<showVipInfo ref="showVipInfoChild"></showVipInfo>
		</view>
		<view class="vip-content" v-for="(product, index) in productList" :key="index">
			<view class="info1">{{product.productName}}</view>
			<view class="info2">{{product.productDesc}}</view>
			<view class="gift">
				<text class="gift-left">基础额度</text>
				<text class="gift-right">无限</text>
			</view>
			<view class="gift">
				<text class="gift-left">4.0plus额度</text>
				<text class="gift-right">{{product.chatPlusCount}}</text>
			</view>
			<view class="gift">
				<text class="gift-left">绘画额度</text>
				<text class="gift-right">{{product.drawCount}}</text>
			</view>
			<view class="gift">
				<text class="gift-price">￥{{product.price}}</text>
				<button class="gift-buy" @click="buyProduct(product.productCode)">购买套餐</button>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				productList: [],
			}
		},
		onLoad() {
			console.log("初始化产品信息");
			uni.wxPay.queryProductList((res) => {
				console.log("queryProductList", res);
				this.productList = res.data.data;
			})
		},
		onShow() {},
		methods: {
			sendParentUser(user) {

			},
			buyProduct(code) {
				console.log("buyProduct", code);
				const that = this;
				if (uni.getSystemInfoSync().osName === 'ios') {
					uni.showModal({
						title: '提示',
						content: '由于相关规范，ios充值功能暂不可用。是否前去联系客服充值？',
						success: function(res) {
							if (res.confirm) {
								//联系客服
								uni.navigateTo({
									url: '/pages/user/customerSupport'
								});
							} else if (res.cancel) {
								console.log('用户点击取消');
							}
						}
					});
					return;
				}
				const requestData = {
					appType: 'WXXCX',
					payType: 'WXPAY',
					productCode: code,
				}
				uni.wxPay.createPayOrder(requestData, (res) => {
					console.log("createPayOrder", res);

					uni.requestPayment({
						"timeStamp": res.data.data.wxPayCreateOrderResp.timestamp,
						"nonceStr": res.data.data.wxPayCreateOrderResp.nonceStr,
						"package": res.data.data.wxPayCreateOrderResp.packageVal,
						"signType": res.data.data.wxPayCreateOrderResp.signType,
						"paySign": res.data.data.wxPayCreateOrderResp.paySign,
						"success": function(succ) {
							console.log("paysuccess", succ)
							const queryRequestData = {
								orderNo: res.data.data.orderNo,
								payType: "WXPAY"
							}
							uni.wxPay.queryOrder(queryRequestData, (res) => {
								//支付成功，刷新数据。
								if (res.data.data.orderStatus === 'S') {
									//调用子组件方法刷新用户权益次数
									that.$refs.showVipInfoChild.showUserCount();
									uni.showModal({
										title: '系统提示',
										content: '支付成功',
										showCancel: false
									});
								}
							});
						},
						"fail": function(err) {
							console.log("payfail", err);
							uni.showModal({
								title: '系统提示',
								content: '支付失败，请重试',
								showCancel: false
							});
							uni.wxPay.cancelOrder(res.data.data.orderNo)
						},
						"complete": function(com) {
							console.log("paycomplete", com)
						}
					})
				});


			}
		}
	}
</script>

<style>
	.vip-container {
		position: relative;
		justify-content: center;
		width: 100%;
	}

	.vip-top {
		width: 100%;
		height: 120px;
		background-color: #4fbbbf;
	}

	.vip-content {
		width: 90%;
		min-height: 100px;
		position: relative;
		left: 5%;
		background-color: white;
		top: -30px;
		margin-top: 10px;
		border-radius: 10px;
	}

	.vip-content .info1 {
		font-size: 18px;
		padding-left: 20px;
		padding-right: 20px;
		padding-top: 10px;
		font-weight: 700;
	}

	.vip-content .info2 {
		font-size: 16px;
		padding-left: 20px;
		padding-right: 20px;
		padding-top: 10px;
	}

	.gift {
		display: flex;
		padding-left: 20px;
		padding-right: 20px;
		padding-top: 10px;
	}

	.gift-left {
		text-align: left;
		width: 50%;
		font-size: 18px;
		font-weight: 500;
	}

	.gift-right {
		text-align: right;
		width: 50%;
		font-size: 18px;
		font-weight: bold;
	}

	.gift-price {
		text-align: left;
		width: 50%;
		font-size: 18px;
		font-weight: 500;
		margin-top: 10px;
		margin-bottom: 10px;
		color: red;
	}

	.gift-buy {
		font-weight: 500;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100px;
		height: 30px;
		background: #ddf1f2;
		border-radius: 5px;
		font-size: 16px;
		padding: 0;
		margin-right: 0px;
		margin-top: 10px;
		margin-bottom: 20px;
	}
</style>