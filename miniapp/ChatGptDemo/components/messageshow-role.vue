<template>
	<view>
		<view class="m-item m-item_flag" ref="nessageChild" :id="'message'+id">
			<view class="m-left">
				<image class="head_icon" :src="message.imgUrl" v-if="message.user=='home'"></image>
			</view>
			<view class="m-content" v-if="!message.loading">
				<view class="m-content-head" :class="{'m-content-head-right':message.user=='customer'}">
					<view :class="'m-content-head-'+message.user" @longpress="copy(message.user)">{{message.content}}
					</view>
				</view>
			</view>
			<view class="m-right" v-if="!message.loading">
				<image class="head_icon" :src="myIcon" v-if="message.user=='customer'"></image>
				<view class="copy-parent" v-if="message.user=='home'">
					<!-- <view class="copy-child" @tap="copy(message.user)">复制</view> -->
				</view>
			</view>


			<view v-if="message.loading" style="width: 80px;">
				<view class="m-content-head m-content-head-home" style="padding-left: 20px;padding-top: 15px;">
					<loading-dots></loading-dots>
				</view>
				<text style="font-size: 12px;margin-left: 10px;">正在思考中</text>
			</view>
		</view>

		<!-- 如果是最后一条记录，则在后面加上引导 -->
		<view class="m-item_flag" v-if="currentMax===id+1 && guideInfo!==null"
			style="padding-bottom: 60px;padding-top: 40px;">
			<view class="guide">
				<view class="guide_title" v-if="guideInfo.title!==''">
					{{guideInfo.title}}
				</view>
				<view class="guide_text" v-if="guideInfo.content!==''">
					{{guideInfo.content}}
				</view>
				<view class="guide_select clickEacct" @click="inputSelect(item)"
					v-for="(item,index) in guideInfo.selectList" :key="index">
					<text>{{item}}</text>
					<uni-icons type="right" size="14" class="p-right-icon"></uni-icons>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		mapState
	} from 'vuex'

	export default {
		data() {
			return {
				robatIcon: "",
				myIcon: getApp().globalData.isBlank(uni.getStorageSync(getApp().globalData.avatarUrlCacheName)) ?
					'../static/img/my_ask.jpg' : uni.getStorageSync(getApp().globalData.avatarUrlCacheName),
				guideInfo: null,
			}
		},
		props: ['message', 'id', 'currentMax'],
		computed: mapState(['user']),
		beforeUpdate() {
			console.log("beforeUpdate");
			this.initGuideInfo();
		},
		created() {
			console.log("beforeUpdate_created");
			this.initGuideInfo();
		},
		methods: {
			initGuideInfo: function() {
				if (this.id + 1 === this.currentMax && this.guideInfo === null) {
					//最后显示，可以添加引导元素
					uni.http.guide(this.message.infoId, (res) => {
						console.log("查询到数据", res);
						this.guideInfo = res.data.data;
						//通知父组件去滑动
						this.$parent.forceScrollBottom();
					})
				}
			},
			inputSelect: function(selectValue) {
				console.log("inputSelect");
				this.$parent.getInputMessage({
					type: 'text',
					content: selectValue
				});
			},
			getDomByClass: function(classNameSelect) {
				return uni.createSelectorQuery().in(this).select(classNameSelect);
			},
			copy: function(msg) {
				const that = this;
				console.log(this.message);
				uni.setClipboardData({
					data: that.message.content
				});
				uni.showToast({
					title: '已复制到剪贴板',
					duration: 2000
				});
			}
		}
	}
</script>

<style>
	.guide {
		background-color: white;
		margin-left: 20px;
		margin-right: 20px;
		padding: 10px;
		border-radius: 5px;
	}

	.guide_title {
		font-size: 16px;
		font-weight: bold;
		padding-top: 10px;
		padding-bottom: 10px;
	}

	.guide_text {
		font-size: 14px;
		color: #575659;
		margin-bottom: 10px;
	}

	.guide_select {
		margin-top: 4px;
		display: flex;
		padding: 10px;
		background-color: #f5f6f8;
	}

	.guide_select text {
		width: 100%;
		font-size: 14px;
		font-weight: 600;
	}

	/* 点击效果 */
	.clickEacct {
		transition: background-color 0.3s ease;
		/* 过渡效果 */
	}

	.clickEacct:active {
		background-color: #ddd;
		/* 点击时的背景色 */
	}

	.m-item_flag {}

	.m-item {
		display: flex;
		flex-direction: row;
		padding-top: 10px;
		padding-bottom: 10px;

	}

	.m-left {
		display: flex;
		width: 60px;
		justify-content: center;
		align-items: flex-start;
	}

	.m-content {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: center;
		word-break: break-all;
	}

	.m-right {
		display: flex;
		width: 60px;
		justify-content: center;
		align-items: flex-start;
	}

	.copy-parent {
		display: flex;
		width: 100%;
		/* align-items: center; */
		justify-content: flex-start;
		height: 100%;
	}

	.copy-parent .copy-child {
		font-size: 12px;
		padding: 10px;
		color: #a7dddf;
	}


	.head_icon {
		width: 40px;
		height: 40px;
		border-radius: 7px;
	}

	.m-content-head {
		position: relative;
	}

	.m-content-head-right {
		display: flex;
		justify-content: flex-end;
		user-select: none;
	}

	.m-content-head-home {
		font-size: 14px;
		text-align: left;
		/* background: #1482d1; */
		background: white;
		border: 0.5px white solid;
		border-radius: 10px;
		padding: 10px;
		color: black;
		white-space: pre-line;
		white-space: pre-wrap;
		/* -webkit-user-select: text; */
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
	}

	.m-content-head-home:before {
		border: 7px solid transparent;
		border-right: 7px solid white;
		left: -13px;
		width: 0;
		height: 0;
		position: absolute;
		content: ' '
	}

	.m-content-head-customer {
		border: 0.5px #a7dddf solid;
		/* border: 0.5px white solid; */
		background-color: #a7dddf;
		/* background-color: white; */
		border-radius: 10px;
		padding: 10px;
		white-space: pre-line;
		white-space: pre-wrap;
		/* -webkit-user-select: text; */
		color: #000000;

		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		/* color: black; */
	}

	.m-content-head-customer:after {
		border: 7px solid transparent;
		border-left: 7px solid #a7dddf;
		/* border-left: 7px solid white; */
		top: 10px;
		right: -13px;
		width: 0;
		height: 0;
		position: absolute;
		content: ' '
	}
</style>