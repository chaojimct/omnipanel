<template>
	<view>
		<view class="m-item m-item_flag" ref="nessageChild" :id="'message'+id">
			<view class="m-left" :style="`width: ${leftWidthReal}`">
				<image class="head_icon" src="../static/img/leiyunAI.jpeg" v-if="message.user=='home'"></image>
			</view>
			<view class="m-content" v-if="!message.loading"
				:style="`padding-bottom: ${currentMax<id+1&&message.user=='home'?'0px':'0px'}`">
				<view class="m-content-head" :class="{'m-content-head-right':message.user=='customer'}">
					<view v-if="message.user=='customer'" :class="'m-content-head-'+message.user"
						@longpress="copy(message.user)">{{message.content}}
					</view>
					<view v-if="message.user=='home'" :class="'m-content-head-'+message.user"
						@longpress="copy(message.user)" :style="`padding-bottom: ${voiceOpen?'10px':''}`">
						<ua-markdown :source="message.content" :width="calculatedWidth" :showLine="false" />
						<view v-if="voiceOpen" style="display: flex; align-items: center;">
							<br />
							<uni-icons style="margin-top: 5px;" :type="`${play?'sound-filled':'sound'}`"
								@click="playVoice" size="30"></uni-icons>
							<wave-animation-up style="margin-left: 10px;" :play="play"
								:getVoiceData="getVoiceData"></wave-animation-up>
						</view>
					</view>
				</view>
			</view>
			<view class="m-right" v-if="!message.loading" :style="`width: ${rightWidthReal}`">
				<image class="head_icon" :src="myIcon" v-if="message.user=='customer'"></image>
				<view class="copy-parent" v-if="message.user=='home'">
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
	} from 'vuex';
	export default {
		data() {
			return {
				robatIcon: "",
				myIcon: getApp().globalData.isBlank(uni.getStorageSync(getApp().globalData.avatarUrlCacheName)) ?
					'../static/img/my_ask.jpg' : uni.getStorageSync(getApp().globalData.avatarUrlCacheName),
				guideInfo: null,
				voiceOpen: getApp().globalData.isBlank(uni.getStorageSync(getApp().globalData.audioSwitchName)) ?
					false : uni.getStorageSync(getApp().globalData.audioSwitchName),
				play: false,
				getVoiceData: false,
				messageContentOrigin: "",
				audioContext: null,
				//https://cy.wtianyu.com/ai/voice/hahah.mp3
				audioSrc: null,
				audioPlayTimer: null,
				audioTextTimeList: null,
				audioTextTimeListCurrent: 0,
				voiceType: null,
				//禁止语音播放快速切换，间隔1秒
				banDoubleClickPlay: false,
			}
		},
		props: ['message', 'id', 'currentMax'],
		// computed: mapState(['user']),
		beforeUpdate() {
			this.initGuideInfo();
		},
		computed: {
			calculatedWidth() {
				return `calc(100vw - 120px)`;
			},
			leftWidthReal() {
				if (this.message.user === 'customer') {
					return "50px";
				} else {
					return '60px';
				}
			},
			rightWidthReal() {
				if (this.message.user === 'home') {
					return "50px";
				} else {
					return '60px';
				}
			}
		},
		created() {
			console.log("beforeUpdate_created");
			this.messageContentOrigin = this.message.content;
			this.initGuideInfo();
		},
		updated() {},
		methods: {
			updateUi: function() {
				this.voiceOpen = getApp().globalData.isBlank(uni.getStorageSync(getApp().globalData.audioSwitchName)) ?
					false : uni.getStorageSync(getApp().globalData.audioSwitchName);
			},
			playVoice: function() {
				console.log("playVoice", this.play);
				const that = this;
				//禁止快速切换导致播放器负载
				if (!this.banDoubleClickPlay) {
					this.banDoubleClickPlay = true;
					setTimeout(() => {
						that.banDoubleClickPlay = false;
					}, 1000);
				} else {
					return;
				}
				this.audioTextTimeListCurrent = 0;
				if (that.message.content.indexOf("```") > -1) {
					uni.showModal({
						content: '文本中包含代码信息，不支持语音播报',
						showCancel: false
					});
					return;
				}
				if (this.messageContentOrigin === '') {
					this.messageContentOrigin = this.message.content;
				}
				//调整助理性别之后，重新获取声音来源
				const newVoiceType = getApp().globalData.isBlank(uni.getStorageSync(getApp().globalData
						.audioSexName)) ?
					'M' : uni.getStorageSync(getApp().globalData.audioSexName);
				if (this.voiceType === null) {
					this.voiceType = newVoiceType;
				} else if (this.voiceType !== newVoiceType) {
					this.voiceType = newVoiceType;
					uni.audioContextMap.delete(this.audioSrc + "_" + this.id);
					this.audioSrc = null;
				}
				if (this.play) {
					//关闭当前播放器
					const audioContext = uni.audioContextMap.get(this.audioSrc + "_" + this.id);
					if (audioContext === null || audioContext === undefined) return;
					audioContext.stop();
					this.play = false;
				} else {
					//关闭所有播放器
					uni.audioContextMap.forEach((value, key) => {
						if (key !== (that.audioSrc + "_" + that.id)) {
							value.stop();
						}
					});
					this.play = true;
					this.getVoiceData = false;
					if (this.audioSrc === null) {
						const requestData = {
							text: this.messageContentOrigin,
							voiceType: this.voiceType,
						};
						uni.audio.textToAudio(requestData, (res) => {
							that.audioSrc = res.data.data.audioUrl;
							that.audioTextTimeList = res.data.data.audioTextTimeList;
							uni.audioContextMap.set(that.audioSrc + "_" + that.id, uni.createInnerAudioContext());
							const audioContext = uni.audioContextMap.get(that.audioSrc + "_" + that.id);
							audioContext.src = that.audioSrc;
							that.getVoiceData = true;
							audioContext.play();
							// audioContext.onCanplay(() => {
							// 	if (that.play && that.getVoiceData) {
							// 		audioContext.play();
							// 	}
							// })
							//增加监听器
							audioContext.onEnded((res) => {
								console.log("onEnded")
								that.play = false;
								this.message.content = this.messageContentOrigin;
							});
							audioContext.onTimeUpdate(() => {
								const audioContext = uni.audioContextMap.get(that.audioSrc + "_" + that.id);
								console.log("onTimeUpdate", audioContext.currentTime);
								that.getVoiceData = true;
								that.play = true;
								if (this.audioTextTimeList === null || this.audioTextTimeListCurrent >=
									this.audioTextTimeList.length) {
									return;
								}
								let objA = this.audioTextTimeList[this.audioTextTimeListCurrent];
								console.log(audioContext.currentTime * 1000, objA.timeStart)
								if (audioContext.currentTime * 1000 > objA.timeStart) {
									//	将颜色调整为4fbbbf
									this.message.content = this.messageContentOrigin.replace(objA.text,
										"<span style='color: #4fbbbf;'>" + objA
										.text + "</span>")
									this.audioTextTimeListCurrent++;
								}
							});
							audioContext.onStop((res) => {
								console.log("onStop")
								that.play = false;
								this.message.content = this.messageContentOrigin;
							});
							audioContext.onError((res) => {
								console.log("audio_error", res);
								that.getVoiceData = false;
								that.play = false;
								that.audioSrc = null;
								uni.showModal({
									content: '语音播放异常，请稍后再试',
									showCancel: false
								});
							});
						}, (error) => {
							that.play = false;
						})
					} else {
						const audioContext = uni.audioContextMap.get(that.audioSrc + "_" + that.id);
						audioContext.src = that.audioSrc;
						that.getVoiceData = true;
						audioContext.play();
						// audioContext.onCanplay(() => {
						// 	if (that.play && that.getVoiceData) {
						// 		audioContext.play();
						// 	}
						// })
					}
				}
			},
			initGuideInfo: function() {
				if (this.id + 1 === this.currentMax && this.guideInfo === null) {
					//最后显示，可以添加引导元素
					uni.http.guide(null, (res) => {
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
				if (this.messageContentOrigin === '') {
					this.messageContentOrigin = this.message.content;
				}
				uni.setClipboardData({
					data: this.messageContentOrigin
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



	.m-item {
		display: flex;
		flex-direction: row;
		/* padding-top: 20px; */
		padding-top: 10px;
		padding-bottom: 10px;
	}

	.m-item_flag {}

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
		color: #383b9a;
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