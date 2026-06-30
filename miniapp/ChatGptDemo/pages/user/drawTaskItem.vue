<template>
	<view class="content">
		<view style="position: relative;">
			<image :src="imgUrl" mode="aspectFit"></image>
			<view v-if="drawStatus=='2'" class="progress">进度{{progress}}%</view>
		</view>
		<view class="content-text" style="overflow-x:hidden">
			<view style="display: flex;justify-content: space-between;">
				<uni-icons @tap="deleteTask" style="margin-left: auto;margin-right: 20px;" type="trash-filled" size="24"
					color="#757575"></uni-icons>
			</view>

			<view v-if="task.errorMsg!==''&&task.errorMsg!==null" class="item-box">
				<view class="left">
					<text>失败原因：</text>
				</view>
				<view class="right">
					<text>{{task.errorMsg}}{{task.drawStatus==='4'?'(已自动退回绘画次数)':''}}</text>
				</view>
			</view>

			<view v-if="task.drawType==='TEXT_TO_IMAGE'" class="item-box">
				<view class="left">
					<text>描述内容：</text>
				</view>
				<view class="right">
					<text>{{task.prompt===''?'&nbsp;&nbsp;&nbsp;':task.prompt}}</text>
				</view>
			</view>

			<view class="item-box">
				<view class="left">
					<text>绘画风格：</text>
				</view>
				<view class="right">
					<text>{{task.imageSizeSelectName}},{{task.typeInfoSelectName}}</text>
				</view>
			</view>

			<view class="item-box">
				<view class="left">
					<text>绘画时间：</text>
				</view>
				<view class="right">
					<text>{{task.createTimeStr}}</text>
				</view>
			</view>
		</view>

		<view style="display: flex;margin-bottom: 50px;">
			<button class="btn" @click="reDraw">重新绘画</button>
			<button class="btn" @click="saveImage">下载图片</button>
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
	import {
		drawTaskRecord
	} from '../../common/js/draw';
	export default {
		data() {
			return {
				popupMessage: '',
				imgUrl: '',
				task: {},
				timer: null,
				drawStatus: '',
				drawType: '',
				progress: 0,
			}
		},
		onShow() {
			const that = this;
			if (this.timer !== null) {
				this.timer.clearInterval();
			}
			this.timer = setInterval(() => {
				that.queryDrawTask(that);
			}, 2000);
		},
		onHide() {
			this.timer.clearInterval();
		},
		onLoad(option) {
			this.task = JSON.parse(option.task);
			console.log("option.task", this.task);
			this.imgUrl = this.task.imageUrl;
			this.drawStatus = this.task.drawStatus;
			this.drawType = this.task.drawType;
		},
		methods: {
			popupMaskClick() {
				console.log("popupMaskClick");
				this.$refs.message.close();
			},
			deleteTask() {
				const that = this;
				uni.showModal({
					title: '提示',
					content: '删除后不可恢复，确定要删除图片吗？',
					success: function(res) {
						if (res.confirm) {
							const req = {
								uuid: that.task.uuid
							}

							uni.draw.deleteDrawTask(that, req, (res) => {
								console.log(123)
								uni.showToast({
									title: "操作成功",
									duration: 1500,
									mask: false,
									success() {
										setTimeout(() => {
											//返回上级页面
											uni.navigateBack({
												delta: 1
											});
										}, 1500);
									}
								});
							})
						} else if (res.cancel) {
							console.log('用户点击取消');
						}
					}
				});
			},
			saveImage() {
				const that = this;
				uni.downloadFile({
					url: this.imgUrl,
					success(res) {
						if (res.statusCode === 200) { // 下载成功
							uni.saveImageToPhotosAlbum({
								filePath: res.tempFilePath,
								success() {
									uni.showToast({
										title: '已保存到相册'
									})
								},
								fail() {
									uni.showToast({
										title: '保存失败'
									})
								}
							})
						} else { // 下载失败
							uni.showToast({
								title: '下载失败'
							})
						}
					},
					fail(err) { // 下载失败
						that.popupMessage = JSON.stringify(err);
						that.$refs.message.open();
					}
				})
			},
			reDraw() {
				console.log("reDraw")
				getApp().globalData.reDrawTask = this.task;
				uni.switchTab({
					url: '../index/draw'
				});
			},
			queryDrawTask(that) {
				if (that.drawStatus !== '0' && that.drawStatus !== '2') {
					clearInterval(that.timer);
					return;
				}
				const req = {
					uuid: that.task.uuid
				}
				//获取任务
				uni.draw.drawQueryTask(that, req, (res) => {
					that.imgUrl = res.data.data.taskInfo.imgUrl;
					that.drawStatus = res.data.data.taskInfo.drawStatus;
					that.progress = res.data.data.taskInfo.progress;
					that.task.errorMsg = res.data.data.taskInfo.errorMsg;
					that.task.drawStatus = res.data.data.taskInfo.drawStatus;
				})
			}
		}
	}
</script>

<style>

	.content {
		position: relative;
		height: 100vh;
		overflow-y: scroll;
	}

	.progress {
		position: absolute;
		bottom: 10%;
		left: 40%;
		font-size: 22px;
		font-weight: bold;
	}

	image {
		width: 100%;
		height: 90vh;
	}

	.content-text {
		position: relative;
		width: 100%;
		overflow-y: scroll;
	}

	.item-box {
		min-height: 20px;
	}

	.item-box .left {
		width: 30vw;
		height: 100%;
		text-align: left;
		height: 100%;
		float: left;
		padding-left: 5px;
		padding-top: 15px;
	}

	.item-box .right {
		width: 60vw;
		text-align: left;
		height: 100%;
		float: left;
		padding-left: 5px;
		padding-top: 15px;
	}

	.btn {
		flex: 1;
		margin: 30px;
		background: linear-gradient(270deg, #FF5CE4 0%, #36C2FF 100%);
	}
</style>