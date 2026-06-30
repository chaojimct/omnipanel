<template>
	<view style="margin-top: 50px;">
		<view @longpress="copy">
			<text class="qq">QQ(长按复制)：</text>
			<text class="qqNum">{{qqNum}}</text>
		</view>
		<br />
		<view style="margin-top: 20px;">
			<text class="qq">微信(点击图片后长按识别)：</text>
			<image @click="regCode" style="width: 100%;margin-top: 10px;" mode="aspectFit" :src="wxUrl"></image>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				qqNum: '1063883771',
				wxUrl: 'https://cy.wtianyu.com/ai/wtall_ai_user.jpg',
			}
		},
		methods: {
			regCode: function() {
				// 预览图片
				wx.previewImage({
					urls: [this.wxUrl], //当前图片地址
					success: function(res) {
						console.log('预览图片成功！')
					},
					fail: function(res) {
						console.log('预览图片失败！')
					}
				})
			},
			copy: function(msg) {
				const that = this;
				uni.setClipboardData({
					data: that.qqNum
				});
				uni.showToast({
					title: '已复制到剪贴板',
					duration: 2000
				});
			},
			saveImage() {
				const that = this;
				uni.downloadFile({
					url: this.wxUrl,
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
						console.log(err);
					}
				})
			},
		}
	}
</script>

<style>
	.qq {
		margin-left: 20px;
		font-size: 18px;
	}

	.qqNum {
		font-size: 20px;
	}
</style>