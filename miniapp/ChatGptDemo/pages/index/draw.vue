<template>
	<view>

		<view v-for="(tab,index) in items" class="uni-tab-item" :data-current="index" @click="ontabtap">
			<text class="uni-tab-item-title" :class="current==index ? 'uni-tab-item-title-active' : ''">{{tab}}</text>
		</view>

		<!-- <swiper disable-touch="true" :style="'height: '+swiperHeight" :current="current" class="swiper-box" style="flex: 1;" :duration="300"
			@change="ontabchange">
			<swiper-item class="swiper-item" v-for="(tab,index1) in items" :key="index1"> -->
		<scroll-view class="scroll-v list" enableBackToTop="true" scroll-y @scroll="scroll">
			<view class="content">

				<!-- 文生图样式 -->
				<view v-if="current === 0" style="width: 100%;">
					<view class="item">
						<text class="text-title">描述想画的内容</text>

						<div class="textarea-container">
							<textarea :placeholder="'请输入画面关键字，尽量使用词组，用逗号分隔，例如：'+defaultMsg" always-embed="true"
								adjust-position="true" cursor-spacing="30" maxlength="1000" type="text"
								v-model="prompt"></textarea>
							<uni-icons class="icon fas fa-search" @tap="clearPrompt" type="clear" size="24"
								color="#757575"></uni-icons>
						</div>
						<view style="display: flex;justify-content: space-between;">
							<text style="margin-top: 5px;font-size: 12px;" @click="intputSData" type="trash-filled"
								size="12">简单示例</text>
							<text style="margin-top: 5px;margin-right: 20px; font-size: 12px;" @click="intputFData"
								type="trash-filled" size="12">精致示例</text>
						</view>
					</view>

					<view class="item">
						<text class="text-title">风格设置</text>
						<draw-style-item ref="drawStyleItemType" v-if="typeInfoList.length>0" :options="typeInfoList"
							:showItem="true" :defaultSelect="typeInfoSelect" @click="selectTypeInfo"></draw-style-item>
					</view>
					<!-- 
							<view class="item">
								<text class="text-title">风格设置</text>
								<view v-for="(itemType ,indexType) in typeInfoList">
									<draw-style-item :ref="'drawStyleItemInfo'+indexType" :options="itemType.data"
										:showItem="itemType.active" :defaultSelect="typeDetailSelect"
										@click="selectTypeDetail"></draw-style-item>
								</view>
							</view>
 -->
					<view class="item" style="margin-bottom: 80px;">
						<text class="text-title">图片尺寸</text>
						<draw-style-item ref="drawStyleItemImage" v-if="imageList.length>0" :options="imageList"
							:showItem="true" :defaultSelect="imageSizeSelect"
							@click="selectImageSize"></draw-style-item>
					</view>

				</view>

				<!-- 图生图样式 -->
				<view v-if="current === 1" style="width: 100%;">
					<view class="item">
						<draw-style-bigItem ref="imageDrawStyleItemType" v-if="image.typeInfoList.length>0"
							:columnCount="2" :options="image.typeInfoList" :showItem="true"
							:defaultSelect="image.typeInfoSelect" @click="imageSelectTypeInfo"></draw-style-bigItem>
					</view>

					<view class="item">
						<text class="text-title">上传参考图</text>
						<div class="upload-container">
							<div v-show="image.tmpImgUrl==''" class="upload-icon" @click="chooseImage">➕</div>
							<uni-icons v-show="image.tmpImgUrl!=''" type="clear" size="30" class="delete-icon"
								@click="clearImage" color="#757575"></uni-icons>
							<image v-show="image.tmpImgUrl!=''" class="image" :src="image.tmpImgUrl" mode="aspectFit" />
							<div v-show="image.tmpImgUrl==''" class="upload-text">点击上传参考图</div>
						</div>
					</view>

					<!-- 		<view class="item">
						<text class="text-title">绘画描述</text>
						<div class="textarea-container">
							<textarea placeholder="请输入绘画描述" style="min-height: auto;height: 80px;" always-embed="true"
								adjust-position="true" cursor-spacing="30" maxlength="1000" type="text"
								v-model="image.prompt"></textarea>
							<uni-icons class="icon fas fa-search" @tap="clearImagePrompt" type="clear" size="20"
								color="#757575"></uni-icons>
						</div>
					</view> -->

					<view class="item" style="margin-bottom: 120px;">
						<text class="text-title">相似度:
						</text>
						<text style="font-size: 11px;">越高越接近原图</text>
						<my-progress style="margin-top: 10px;" @change="changeProgress"></my-progress>
					</view>

					<!-- <view class="item" style="margin-bottom: 120px;">
						<text class="text-title">图片尺寸</text>
						<draw-style-item ref="drawStyleItemImage" v-if="image.imageList.length>0" :options="imageList"
							:showItem="true" :defaultSelect="image.imageSizeSelect"
							@click="imageSelectImageSize"></draw-style-item>
					</view> -->
				</view>

			</view>
		</scroll-view>
		<!-- </swiper-item>
		</swiper> -->

		<button type="primary" v-show="current==0" @click="drawStart()" class="float-container">开始绘画</button>
		<button type="primary" v-show="current==1" @click="imageDrawStart()" class="float-container">开始绘画</button>
		<view @click="popupMaskClick">
			<!-- 提示信息弹窗 -->
			<uni-popup ref="message" type="message" :mask-click="true">
				<uni-popup-message type="error" before-close="false" :message="popupMessage"
					duration="2000"></uni-popup-message>
			</uni-popup>
		</view>
		<view v-show="myCanvasShow"><canvas canvas-id="myCanvas"></canvas></view>
	</view>
</template>

<script>
	import drawStyleItem from '../../components/draw-style-item/draw-style-item.vue';
	import drawStyleBigItem from '../../components/draw-style-bigItem/draw-style-bigItem.vue';
	import myProgress from '../../components/my-progress/my-progress.vue';
	export default {
		components: {
			drawStyleItem
		},
		data() {
			return {
				swiperHeight: "120vh",
				defaultMsg: "1个美女,黑头发,穿着白裙子,大眼睛,上身特写,蓝天白云,青山绿水",
				items: ['文字绘图', '一键二次元'],
				imageList: [],
				imageSizeSelect: null,
				typeInfoList: [],
				typeInfoSelect: null,
				current: 0,
				activeColor: '#000000',
				styleType: 'text',
				paramsMap: null,
				prompt: '',
				popupMessage: '',
				image: {
					prompt: '超清,轮廓分明,极其详细的CG,人物动漫化,背景动漫化,极致细节,最好的质量,动态角度',
					tmpImgUrl: '',
					imageList: [],
					paramsMap: null,
					imageSizeSelect: null,
					typeInfoList: [],
					typeInfoSelect: null,
					//和原图的相似度
					similarity: 0.35,
				},
				doubleClick: false,
				myCanvas: null,
				myCanvasShow: false,
			}
		},
		onShow() {
			const task = getApp().globalData.reDrawTask;
			console.log(111);
			//处理文生图的重绘功能
			if (task !== null) {
				this.imageSizeSelect = task.imageSizeSelect;
				this.typeInfoSelect = task.typeInfoSelect;
				if (task.drawType === 'TEXT_TO_IMAGE') {
					this.prompt = task.prompt;
					this.current = 0;
				} else {
					this.current = 1;
				}
				this.$nextTick(() => {
					// 使用 $refs 获取所有子组件实例
					const childInstances = this.$refs;
					console.log("childInstances", childInstances);
					// 遍历子组件实例并调用各自的方法
					console.log("drawStyleItemType", childInstances.drawStyleItemType);
					if (childInstances.drawStyleItemType === undefined) {
						return;
					}
					childInstances.drawStyleItemType.forEach(item => {
						item.updateDefaultSelect(this.typeInfoSelect);
					})
					childInstances.drawStyleItemImage.forEach(item => {
						item.updateDefaultSelect(this.imageSizeSelect);
					})
				});
				getApp().globalData.reDrawTask = null;
			}

			//获取文生图的参数信息
			if (this.imageList.length <= 0) {
				uni.draw.drawQueryStyle(this, (res) => {
					this.imageList = res.data.data.styleResp.imageList;
					this.typeInfoList = res.data.data.styleResp.typeInfoList;
				});
			}
			//获取图生图的参数信息
			if (this.image.imageList.length <= 0) {
				uni.imageDraw.drawQueryStyle(this, (res) => {
					this.image.imageList = res.data.data.styleResp.imageList;
					this.image.typeInfoList = res.data.data.styleResp.typeInfoList;
				});
			}

		},
		onLoad() {
			// 获取canvas对象
			this.myCanvas = uni.createCanvasContext('myCanvas', this);
		},
		methods: {
			scroll() {
				console.log("scroll");
			},
			clearImage() {
				this.image.tmpImgUrl = '';
			},
			chooseImage() {
				const that = this;
				console.log("chooseImage");
				uni.chooseImage({
					count: 1, //默认9
					sizeType: ['compressed'], //可以指定是原图还是压缩图，默认二者都有
					// sourceType: ['album'], //从相册选择
					success: function(res) {
						console.log("chooseImage", res.tempFilePaths[0]);
						that.image.tmpImgUrl = res.tempFilePaths[0];
						uni.getImageInfo({
							src: that.image.tmpImgUrl,
							success: function(image) {
								console.log("image", image)
								if (image.height / image.width >= 1.33) {
									that.image.imageSizeSelect = 'vertical'
								} else if (image.height / image.width <= 0.75) {
									that.image.imageSizeSelect = 'horizontal'
								} else {
									that.image.imageSizeSelect = 'square'
								}
							}
						});
					}
				});
			},
			ontabtap(e) {
				let index = e.target.dataset.current || e.currentTarget.dataset.current;
				this.current = index;
			},
			ontabchange(e) {
				let index = e.target.current || e.detail.current;
				this.current = index;
			},
			popupMaskClick() {
				console.log("popupMaskClick");
				this.$refs.message.close();
			},
			intputSData() {
				this.prompt = this.defaultMsg;
			},
			intputFData() {
				this.prompt =
					'最好的质量，超细节，插图，极其详细的CG，晶体纹理头发，玻璃头发，晶体纹理身体，身体的宝石，晶体纹理皮肤，晶体衣服，闪光，镜头光晕，光漏，细节长裙，仙女，凌乱的头发，动态角度，美丽的宝石天空，美丽细致的眼睛，过度曝光，水晶质地的花';
			},
			clearImagePrompt() {
				this.image.prompt = '';
			},
			clearPrompt() {
				this.prompt = '';
			},
			onClickItem(e) {
				if (this.current !== e.currentIndex) {
					this.current = e.currentIndex
				}
			},
			selectImageSize(item) {
				if (item.code) {
					console.log("selectImageSize", item);
					this.imageSizeSelect = item.code;
				}
			},
			imageSelectImageSize(item) {
				if (item.code) {
					console.log("imageSelectImageSize", item);
					this.image.imageSizeSelect = item.code;
				}
			},
			changeProgress(progress) {
				// console.log("changeProgress", progress);
				this.image.similarity = progress / 100;
			},
			imageSelectTypeInfo(item) {
				if (item.code) {
					console.log("imageSelectTypeInfo", item);
					this.image.typeInfoSelect = item.code;
				}
			},
			selectTypeInfo(item) {
				if (item.code) {
					console.log("selectTypeInfo", item);
					this.typeInfoSelect = item.code;
				}
			},
			imageDrawStart() {
				const that = this;
				setTimeout(() => {
					this.doubleClick = false;
				}, 1000);
				if (this.doubleClick) {
					return;
				}
				this.doubleClick = true;
				if (that.image.tmpImgUrl == '') {
					this.popupMessage = '请先上传图片';
					this.$refs.message.open();
					this.closepopupMessage();
					return;
				}
				const res = uni.getFileSystemManager().readFileSync(that.image.tmpImgUrl, 'base64');

				const requestData = {
					"imageSizeSelect": this.image.imageSizeSelect,
					"typeInfoSelect": this.image.typeInfoSelect,
					"paramsMap": this.image.paramsMap,
					"prompt": this.image.prompt,
					"imgBase64": res,
					"similarity": this.image.similarity,
				}
				uni.imageDraw.drawCreateTask(that, requestData, (res) => {
					uni.navigateTo({
						url: '/pages/user/drawTask?current=1'
					});
				});

			},
			drawStart() {
				setTimeout(() => {
					this.doubleClick = false;
				}, 1000);
				if (this.doubleClick) {
					return;
				}
				this.doubleClick = true;
				const requestData = {
					"imageSizeSelect": this.imageSizeSelect,
					"typeInfoSelect": this.typeInfoSelect,
					"paramsMap": this.paramsMap,
					"prompt": this.prompt,
				};
				if (this.prompt == '') {
					this.popupMessage = '请输入描述内容';
					this.$refs.message.open();
					this.closepopupMessage();
					return;
				}
				uni.draw.drawCreateTask(this, requestData, (res) => {
					uni.navigateTo({
						url: '/pages/user/drawTask?current=1'
					});
				});
			},
			closepopupMessage() {
				setTimeout(() => {
					this.$refs.message.close();
				}, 2000)
			},
		}
	}
</script>


<style lang="scss">
	.swiper-box {
		flex: 1;
	}

	.swiper-item {
		flex: 1;
		flex-direction: row;
	}

	.scroll-v {
		flex: 1;
		/* #ifndef MP-ALIPAY */
		flex-direction: column;
		/* #endif */
		width: 100%;
		width: 100%;
	}

	.uni-tab-item {
		/* #ifndef APP-PLUS */
		display: inline-block;
		/* #endif */
		flex-wrap: nowrap;
		padding-left: 34rpx;
		padding-right: 34rpx;
	}

	.uni-tab-item-title {
		font-weight: bold;
		color: #555;
		font-size: 36rpx;
		height: 80rpx;
		line-height: 80rpx;
		flex-wrap: nowrap;
		/* #ifndef APP-PLUS */
		white-space: nowrap;
		/* #endif */
	}

	.uni-tab-item-title-active {
		color: #007AFF;
	}




	.float-container {
		left: 30px;
		right: 30px;
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 999;
		background: linear-gradient(270deg, #FF5CE4 0%, #36C2FF 100%);
		/* 将容器置于最顶层 */
	}

	.example-body {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		padding: 0;
	}

	.uni-common-mt {
		margin-top: 10px;
	}

	.uni-padding-wrap {
		// width: 750rpx;
		padding: 0px 10px;
	}

	.content {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		height: 100%;
		width: 100%;
	}

	.content .item {
		padding: 20px;
		padding-top: 5px;
	}

	.content .text-title {
		font-size: 15px;
	}


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
		min-height: 152px;
		background: #fff;
		border: solid 1px #ddd;
		padding: 5px;
		font-family: verdana !important;
		overflow: hidden;
		border-radius: 7px;
		font-size: 15px;

		box-sizing: border-box;
		padding-right: 50px;
		margin-right: 10px;

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



	//上传图片样式

	.upload-container {
		border: 2px dashed #ccc;
		border-radius: 8px;
		padding: 10px;
		background-color: #fff;
		text-align: center;
	}

	.upload-icon {
		font-size: 40px;
		color: #ccc;
		margin-bottom: 10px;
	}

	.upload-text {
		color: #777;
		margin-bottom: 20px;
	}

	.file-input {
		display: none;
	}

	.file-label {
		display: inline-block;
		padding: 10px 20px;
		background-color: #007bff;
		color: #fff;
		border-radius: 5px;
		cursor: pointer;
		transition: background-color 0.3s;
	}

	.file-label:hover {
		background-color: #0056b3;
	}

	.delete-icon {
		position: absolute;
		// top: 40px;
		right: 40px;
		cursor: pointer;
	}
</style>