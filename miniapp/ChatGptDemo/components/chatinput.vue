<template>
	<view :class="`${voiceOpen?'footer':'footer1'}`" style="margin-top: 30rpx;">
		<view class="footer-left" v-if="voiceOpen" @click="voiceOpenIngChange">
			<uni-icons type="mic" size="32"></uni-icons>
		</view>
		<!-- <view class="footer-center"> -->

		<!-- <input maxlength="500" class="input-text" type="text" v-model="inputValue" /> -->
		<!-- <textarea always-embed="true" adjust-position="true" cursor-spacing="30" maxlength="1000" class="input-text"
				type="text" v-model="inputValue"></textarea> -->
		<!-- <uni-easyinput class="input-text"type="textarea" autoHeight v-model="inputValue" placeholder="请输入内容"></uni-easyinput> -->


		<div style="width: 100%;" v-if="voiceOpen&&voiceOpenIng">
			<nb-voice-record @startRecord="audioToTextStart" @endRecord="audioToTextStop"
				@cancelRecord="audioToTextCancel" @frameRecorded="audioToTextFrame"></nb-voice-record>
		</div>

		<div class="textarea-container" v-if="!voiceOpenIng">
			<textarea :style="'height:'+textAreaMinHeight" placeholder="有问题尽管问我" @linechange="inputHeightChange"
				always-embed="true" adjust-position="true" cursor-spacing="30" maxlength="500" type="text"
				v-model="inputValue" confirm-type="send" @confirm="sendMessge"></textarea>
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
				textAreaMinHeight: '34px',
				voiceOpen: getApp().globalData.isBlank(uni.getStorageSync(getApp().globalData.audioSwitchName)) ?
					false : uni.getStorageSync(getApp().globalData.audioSwitchName),
				voiceOpenIng: false,
				//传输给后端的录音base64信息
				audioBase64Array: [],
			}
		},
		methods: {
			voiceOpenIngChange: function(res) {
				this.voiceOpenIng = !this.voiceOpenIng;
			},
			audioToTextFrame: function(res) {
				console.log("audioToTextFrame", res);
				//请求后端，获取一次识别后的结果
			},
			audioToTextCancel: function() {
				console.log("audioToTextCancel");
			},
			audioToTextStop: function(res) {
				console.log("audioToTextStop", res)
				if (res.duration < 1000) {
					uni.showModal({
						content: '录制时间太短，请重试',
						showCancel: false
					});
					return;
				}
				const that = this;
				const audioBase64Com = uni.getFileSystemManager().readFileSync(res.tempFilePath, "base64");
				// const base64 = audioBase64Array.push(uni.arrayBufferToBase64(res.tempFilePath));
				//请求后端进行语音智能转换
				uni.audio.audioToText({
					audioBase64Com
				}, (res) => {
					console.log("audioToText", res);
					if (res.data.data.audioText === '') {
						uni.showModal({
							content: '未识别出语音内容，请重试',
							showCancel: false
						});
						return;
					}
					//智能识别完成时，通知父组件用户录音识别的结果
					this.$emit('send-message', {
						type: 'text',
						content: res.data.data.audioText,
					});
				}, () => {});
			},
			audioToTextStart: function() {
				//重置
				this.audioBase64Array = [];
				console.log("audioToTextStart")
			},
			updateUi: function() {
				this.voiceOpen = getApp().globalData.isBlank(uni.getStorageSync(getApp().globalData.audioSwitchName)) ?
					false : uni.getStorageSync(getApp().globalData.audioSwitchName);
			},
			inputHeightChange: function(e) {
				console.log(e)
				this.textAreaMinHeight = (e.detail.height + 18) + 'px';
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

	.footer {
		display: flex;
		flex-direction: row;
		width: 100%;
		height: auto;
		overflow: hidden;
		padding: 3px;
		background-color: #fafafa;
		align-items: center;
	}

	.footer-left {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-left: 3px;
		margin-right: 3px;
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

	.textarea-container {
		position: relative;
		display: flex;
		flex-direction: row-reverse;
		align-items: center;
		width: 100%;
		height: 100%;
		padding: 3px;
		padding-right: 10px;
	}

	.textarea-container textarea {
		width: 100%;
		height: 38px;
		min-height: 38px;
		background: #fff;
		border: solid 1px #ddd;
		padding-left: 5px;
		padding-top: 8px;
		padding-bottom: 8px;
		font-family: verdana !important;
		overflow: hidden;
		border-radius: 20px;
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
		right: 16px;
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