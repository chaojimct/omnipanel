/**
 * 获取绘画的style信息
 * @param {Object} openId
 * @param {Object} appId
 * @param {Object} callback
 */
function drawQueryStyle(that, callback) {
	const appId = getApp().globalData.appId;
	showLoadingHttp();
	uni.request({
		url: getApp().globalData.url + 'wtall-ai/imageDrawQueryStyle',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {
			openId: uni.getStorageSync(getApp().globalData.openIdCacheName),
			appId
		},
		success: (res) => {
			if (checkHttpOk(res)) {
				callback(res);
			} else {
				popupShow(that, res.data);
			}
		},
		fail: (res) => {
			popupShow(that, res.errMsg);
		},
		complete: (res) => {
			hideLoadingHttp();
		}
	})
}

function drawCreateTask(that, requestData, callback) {
	const appId = getApp().globalData.appId;
	showLoadingHttp();
	uni.request({
		url: getApp().globalData.url + 'wtall-ai/imageDrawCreateTask',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {
			openId: uni.getStorageSync(getApp().globalData.openIdCacheName),
			appId,
			security: getApp().globalData.platform === 'mp-toutiao' ? true : false,
			appType: getApp().globalData.appType,
			...requestData,
		},
		success: (res) => {
			if (checkHttpOk(res)) {
				callback(res);
			} else {
				popupShow(that, res.data);
			}
		},
		fail: (res) => {
			popupShow(that, res.errMsg);
		},
		complete: (res) => {
			hideLoadingHttp();
			that.doubleClick = false;
		}
	})
}

function showLoadingHttp() {
	uni.showLoading({
		title: '加载中',
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

function popupShow(that, msg) {
	that.popupMessage = JSON.stringify(msg);
	that.$refs.message.open();
	setTimeout(() => {
		that.$refs.message.close();
	}, 2000);
}

export {
	drawQueryStyle,
	drawCreateTask
}