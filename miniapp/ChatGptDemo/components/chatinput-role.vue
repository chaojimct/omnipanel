<template>
	<view class="footer1" style="margin-top: 30rpx;margin-bottom: 20px;">
		<!-- <view class="footer-left">
			<view @tap="startRecognize">
				<image class="vl_icon" src="../static/img/vl_1.png"></image>
			</view>
		</view> -->
		<!-- <view class="footer-center"> -->

		<!-- <input maxlength="500" class="input-text" type="text" v-model="inputValue" /> -->
		<!-- <textarea always-embed="true" adjust-position="true" cursor-spacing="30" maxlength="1000" class="input-text"
				type="text" v-model="inputValue"></textarea> -->
		<!-- <uni-easyinput class="input-text"type="textarea" autoHeight v-model="inputValue" placeholder="请输入内容"></uni-easyinput> -->

 
		<div class="textarea-container">
			<textarea :style="'height:'+textAreaMinHeight" placeholder="请输入您的问题"
				@linechange="inputHeightChange"  always-embed="true" adjust-position="true" cursor-spacing="30"
				 maxlength="500" type="text" v-model="inputValue" confirm-type="send" @confirm="sendMessge"></textarea>
			<uni-icons class="icon fas fa-search" @tap="sendMessge" type="paperplane-filled" size="24"
				color="#757575"></uni-icons>
		</div>


		<!-- </view> -->
		<!-- <view class="footer-right" @tap="sendMessge">
			<view id='msg-type'>发送</view>
		</view> -->
	</view>
</template>

<script>
	export default {
		name: "chat-input",
		data() {
			return {
				inputValue: '',
				textAreaMinHeight: '42px'
			}
		},
		methods: {
			inputHeightChange: function(e) {
				console.log(e)
				this.textAreaMinHeight = (e.detail.height + 24)+'px';
			},
			startRecognize: function() {
				uni.showModal({
					content: "功能开发中",
					showCancel: false
				});
				// console.log(123);
				// var options = {};
				// var that = this;
				// options.engine = 'iFly';
				// that.inputValue = "";
				// plus.speech.startRecognize(options, function(s) {
				// 	console.log(s);
				// 	that.inputValue += s;
				// }, function(e) {
				// 	console.log("语音识别失败：" + e.message);
				// });
			},
			setInputValue: function(value) {
				this.inputValue = value;
			},
			sendMessge: function(event) {
				var that = this;
				if (that.inputValue.trim() == '') {

					that.inputValue = '';
				} else {
					console.log("chatInput", "send", that.inputValue)
					//点击发送按钮时，通知父组件用户输入的内容
					this.$emit('send-message', {
						type: 'text',
						content: that.inputValue
					});
					that.inputValue = '';
				}
			}
		}
	}
</script>

<style>
	@import "../common/icon.css";

	.footer-left .vl_icon {
		width: 40px;
		height: 40px;
	}

	.footer {
		display: flex;
		flex-direction: row;
		width: 100%;
		max-height: 170px;
		min-height: 70px;
		border-top: solid 1px #bbb;
		overflow: hidden;
		padding: 3px;
		background-color: #fafafa;
	}

	.footer-left {

		width: 60px;
		height: 70px;

		display: flex;
		justify-content: center;
		align-items: center;
	}

	.footer-right {
		width: 60px;
		height: 70px;
		display: flex;
		justify-content: center;
		align-items: center;
		color: #1482D1;
	}

	.footer-center {
		width: 100%;
		min-height: 70px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* 	.footer-center .input-text {
		height: 52px;
		background: #fff;
		border: solid 1px #ddd;
		padding: 5px;
		font-family: verdana !important;
		overflow: hidden;
		border-radius: 7px;
		font-size: 15px;
	}
 */

	.textarea-container {
		position: relative;
		display: flex;
		flex-direction: row-reverse;
		align-items: center;
		width: 100%;
		height: 100%;
	}

	.textarea-container textarea {
		width: 100%;
		height: 38px;
		min-height: 38px;
		background: #fff;
		border: solid 1px #ddd;
		padding-left: 5px;
		padding-top: 12px;
		padding-bottom: 12px;
		font-family: verdana !important;
		overflow: hidden;
		border-radius: 7px;
		font-size: 15px;

		box-sizing: border-box;
		padding-right: 50px;
		margin-right: 5px;
		margin-left: 5px;
		margin-bottom: 1px;
		line-height: 10px;
	}

	.textarea-container .icon {
		position: absolute;
		top: 50%;
		right: 10px;
		transform: translateY(-50%);
		color: #ccc;
		cursor: pointer;
		margin-right: 10px;
		z-index: 10;
	}

	.textarea-container .icon:hover {
		color: #333;
	}
</style>