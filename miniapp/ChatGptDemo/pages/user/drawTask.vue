<template>
	<view>
		<uni-section type="line">
			<view class="uni-padding-wrap uni-common-mt">
				<uni-segmented-control :current="current" :values="items" :style-type="styleType"
					:active-color="activeColor" @clickItem="onClickItem" />
			</view>
		</uni-section>
		<view class="content">
			<view v-if="current === 0">
				<draw-record-item :options="imageRecordList" @click="drawImgInfo"></draw-record-item>
			</view>
			<view v-if="current === 1">
				<draw-record-item :options="imageTaskList" @click="drawImgInfo"></draw-record-item>
			</view>
		</view>

		<view @click="popupMaskClick">
			<!-- 提示信息弹窗 -->
			<uni-popup ref="message" type="message" :mask-click="true">
				<uni-popup-message type="error" before-close="false" :message="popupMessage"
					duration="2000"></uni-popup-message>
			</uni-popup>
		</view>

	</view>
</template>

<script>
	import drawRecordItem from '../../components/draw-record-item/draw-record-item.vue';
	export default {
		components: {
			drawRecordItem
		},
		data() {
			return {
				activeColor: '#000000',
				styleType: 'text',
				popupMessage: '',

				items: ['记录', '任务'],
				current: 0,
				imageTaskList: [],
				imageRecordList: [],

				timer: null,
			}
		},
		onShow() {
			const that = this;
			this.drawTask();
			this.drawRecord();
			if (this.timer === null) {
				this.timer = setInterval(() => {
					if (that.imageTaskList.length > 0) {
						that.drawTask();
						that.drawRecord();
					}
				}, 10000);
			}
		},
		onLoad(option) {
			if (option.current) {
				this.current = parseInt(option.current);
			}
		},
		methods: {
			popupMaskClick() {
				console.log("popupMaskClick");
				this.$refs.message.close();
			},
			drawImgInfo(info) {
				console.log("drawImgInfo", info);
				uni.navigateTo({
					url: '/pages/user/drawTaskItem?task=' + JSON.stringify(info)
				});
			},
			onClickItem(e) {
				console.log("onClickItem");
				if (this.current !== e.currentIndex) {
					if (e.currentIndex === 0) {
						this.drawTask();
					} else if (e.currentIndex === 1) {
						this.drawRecord();
					}
					this.current = e.currentIndex;
				}
			},
			drawTask() {
				const req = {
					drawStatus: ['0', '2']
				}
				//获取任务
				uni.draw.drawTaskRecord(this, req, (res) => {
					this.imageTaskList = res.data.data;
				})
			},
			drawRecord() {
				const req = {
					drawStatus: ['1', '3', '4']
				}
				//获取记录
				uni.draw.drawTaskRecord(this, req, (res) => {
					this.imageRecordList = res.data.data;
				})
			}
		}
	}
</script>


<style lang="scss">

</style>