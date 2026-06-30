let rewardedVideoAd = null;
let currentPage = null;

const createRewardedVideoAd = (page) => {
	currentPage = page;
	if (rewardedVideoAd == null) {
		rewardedVideoAd = tt.createRewardedVideoAd({
			"adUnitId": "b0v4flecu2o55i0h38"
		});
		// 调试工具不会生成这个对象,直接返回
		if (rewardedVideoAd == null) {
			return;
		}
		// 再添加本次加载广告失败的回调
		rewardedVideoAd.onError((res) => {
			console.log("onError:", res)
		});
		// 添加本次关闭广告的回调
		rewardedVideoAd.onClose((res) => {
			console.log("onclose:", res)
			if (res.isEnded) {
				currentPage.rewardSuccess()
			} else {
				currentPage.rewardFaile()
			}
		});
	}
}

const showRewardedVideoAd = () => {

	// 调试工具不会生成这个对象,直接返回
	if (rewardedVideoAd == null) {
		currentPage.checkAnswer()
		return
	}

	rewardedVideoAd.show().then(() => {
		console.log("广告显示成功");
	}).catch((err) => {
		console.log("广告组件出现问题", err);
		// 可以手动加载一次
		rewardedVideoAd.load().then(() => {
			console.log("手动加载成功");
			// 加载成功后需要再显示广告
			rewardedVideoAd.show();
		}).catch((err) => {
			console.log("手动加载失败", err);
			currentPage.rewardSuccess()
		});
	});
}

export {
	createRewardedVideoAd,
	showRewardedVideoAd
};