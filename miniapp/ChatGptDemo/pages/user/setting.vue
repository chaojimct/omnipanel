<template>
	<view>
		<view class="uni-title uni-common-pl">模型选择</view>
		<view class="uni-list">
			<view class="uni-list-cell">
				<view class="uni-list-cell-left">
					当前选择
				</view>
				<view class="uni-list-cell-db">
					<picker @change="bindModelChange" :value="currentModeIndex" :range="modeArray" range-key="name">
						<view class="uni-input">{{currentMode}}</view>
					</picker>
				</view>
			</view>
		</view>

		<view class="uni-title uni-common-pl">对话大师</view>
		<view class="uni-list">
			<view class="uni-list-cell">
				<view class="uni-list-cell-left">
					当前选择
				</view>
				<view class="uni-list-cell-db">
					<picker @change="bindTemperatureChange" :value="currentTemperatureIndex" :range="temperatureArray"
						range-key="name">
						<view class="uni-input">{{currentTemperature}}</view>
					</picker>
				</view>
			</view>
		</view>

		<view class="uni-title uni-common-pl">语音助手</view>
		<view class="uni-list">
			<view class="uni-list-cell uni-list-cell-pd">
				<view class="uni-list-cell-db">{{audioOpenText}}</view>
				<switch :checked="currentAudio" @change="audioChange" />
			</view>
		</view>
		<view class="uni-list">
			<view class="uni-list-cell uni-list-cell-pd">
				<view class="uni-list-cell-db">助手性别</view>
				<view style="display: flex;justify-content:flex-end">
					<uni-data-checkbox @change="audioSexChange" v-model="sexChecked"
						:localdata="sexArray"></uni-data-checkbox>
				</view>
			</view>
		</view>
	</view>
</template>
<script>
	export default {
		data() {
			return {
				modeArray: [{
					index: 0,
					name: '3.5基础模型',
					model: 'base',
				}, {
					index: 1,
					name: '4.0plus模型',
					model: 'plus'
				}],
				currentMode: getApp().globalData.isBlank(uni.getStorageSync(getApp().globalData.modeNameCacheName)) ?
					'3.5基础模型' : uni.getStorageSync(getApp().globalData.modeNameCacheName).name,
				currentModeIndex: getApp().globalData.isBlank(uni.getStorageSync(getApp().globalData.modeNameCacheName)) ?
					0 : uni.getStorageSync(getApp().globalData.modeNameCacheName).index,
				currentAudio: getApp().globalData.isBlank(uni.getStorageSync(getApp().globalData.audioSwitchName)) ?
					false : uni.getStorageSync(getApp().globalData.audioSwitchName),
				sexChecked: getApp().globalData.isBlank(uni.getStorageSync(getApp().globalData.audioSexName)) ?
					'M' : uni.getStorageSync(getApp().globalData.audioSexName),
				sexArray: [{
						text: '男',
						value: 'M'
					},
					{
						text: '女',
						value: 'FM'
					}
				],
				//对话大师
				temperatureArray: [{
					index: 0,
					name: '专业',
					value: '0.1',
				}, {
					index: 1,
					name: '平衡',
					value: '0.7'
				}, {
					index: 2,
					name: '荒诞',
					value: '1.3'
				}],
				currentTemperature: getApp().globalData.isBlank(uni.getStorageSync(getApp().globalData
						.temperatureNameCacheName)) ?
					'平衡' : uni.getStorageSync(getApp().globalData.temperatureNameCacheName).name,
				currentTemperatureIndex: getApp().globalData.isBlank(uni.getStorageSync(getApp().globalData
						.temperatureNameCacheName)) ?
					1 : uni.getStorageSync(getApp().globalData.temperatureNameCacheName).index,
			}
		},
		computed: {
			audioOpenText() {
				return this.currentAudio ? '开启中' : '已关闭';
			}
		},
		onLoad() {
			console.log("onLoad");
		},
		methods: {
			audioSexChange: function(e) {
				uni.setStorageSync(getApp().globalData.audioSexName, e.detail.value)
				this.sexChecked = e.detail.value;
			},
			audioChange: function(e) {
				uni.setStorageSync(getApp().globalData.audioSwitchName, e.detail.value)
				this.currentAudio = e.detail.value;
			},
			bindModelChange: function(e) {
				console.log('picker发送选择改变，携带值为：', e)
				uni.setStorageSync(getApp().globalData.modeNameCacheName, this.modeArray[e.detail.value])
				this.currentMode = this.modeArray[e.detail.value].name;
			},
			bindTemperatureChange: function(e) {
				console.log('picker发送选择改变，携带值为：', e)
				uni.setStorageSync(getApp().globalData.temperatureNameCacheName, this.temperatureArray[e.detail.value])
				this.currentTemperature = this.temperatureArray[e.detail.value].name;
			}
		}
	}
</script>

<style>

</style>