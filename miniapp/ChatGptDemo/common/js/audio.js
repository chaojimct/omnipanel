function audioToText(requestData, callBackSuccess, callBackFail) {
	const appId = getApp().globalData.appId;
	showLoadingHttp();
	uni.request({
		url: getApp().globalData.url + 'wtall-ai/audio/audioToText',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {
			openId: uni.getStorageSync(getApp().globalData.openIdCacheName),
			appId,
			...requestData,
		},
		success: (res) => {
			if (checkHttpOk(res)) {
				callBackSuccess(res);
			} else {
				showNetError();
				callBackFail(res);
			}
		},
		fail: (res) => {
			showNetError();
			callBackFail(res);
		},
		complete: () => {
			hideLoadingHttp();
		}
	})
}

function textToAudio(requestData, callBackSuccess, callBackFail) {
	const appId = getApp().globalData.appId;
	uni.request({
		url: getApp().globalData.url + 'wtall-ai/audio/textToAudio',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {
			openId: uni.getStorageSync(getApp().globalData.openIdCacheName),
			appId,
			...requestData,
		},
		success: (res) => {
			if (checkHttpOk(res)) {
				callBackSuccess(res);
			} else {
				showNetError();
				callBackFail(res);
			}
		},
		fail: (res) => {
			showNetError();
			callBackFail(res);
		},
		complete: () => {

		}
	})
}

function showNetError() {
	uni.showModal({
		content: '网络异常请稍后再试',
		showCancel: false
	});
}

function showLoadingHttp() {
	uni.showLoading({
		title: '处理中',
		mask: true
	});
}

function hideLoadingHttp() {
	uni.hideLoading();
}

function checkHttpOk(res) {
	if (res.data.code == '000000') {
		return true;
	}
	return false;
}

export {
	textToAudio,
	audioToText
}