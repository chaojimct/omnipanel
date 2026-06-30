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
		url: getApp().globalData.url + 'wtall-ai/drawQueryStyle',
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

function showLoadingHttp() {
	uni.showLoading({
		title: '加载中',
		mask: true
	});
}

function hideLoadingHttp() {
	uni.hideLoading();
}

/**
 * @param {Object} callback
 */
function drawCreateTask(that, requestData, callback) {
	const appId = getApp().globalData.appId;
	showLoadingHttp();
	uni.request({
		url: getApp().globalData.url + 'wtall-ai/drawCreateTask',
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
			...requestData
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

function deleteDrawTask(that, requestData, callback) {
	const appId = getApp().globalData.appId;
	showLoadingHttp();
	uni.request({
		url: getApp().globalData.url + 'wtall-ai/deleteDrawTask',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {
			openId: uni.getStorageSync(getApp().globalData.openIdCacheName),
			appId,
			...requestData
		},
		success: (res) => {
			hideLoadingHttp();
			if (checkHttpOk(res)) {
				callback(res);
			} else {
				popupShow(that, res.data);
			}
		},
		fail: (res) => {
			hideLoadingHttp();

			popupShow(that, res.errMsg);
		},
		complete: (res) => {}
	})
}

/**
 * 查询绘画进度
 * @param {Object} that
 * @param {Object} requestData
 * @param {Object} callback
 */
function drawQueryTask(that, requestData, callback) {
	const appId = getApp().globalData.appId;
	// showLoadingHttp();
	uni.request({
		url: getApp().globalData.url + 'wtall-ai/drawQueryTask',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {
			openId: uni.getStorageSync(getApp().globalData.openIdCacheName),
			appId,
			...requestData
		},
		success: (res) => {
			if (checkHttpOk(res)) {
				callback(res);
			} else {
				// that.popupMessage = JSON.stringify(res.data);
				// that.$refs.message.open();
			}
		},
		fail: (res) => {
			// that.popupMessage = JSON.stringify(res.errMsg);
			// that.$refs.message.open();
		},
		complete: (res) => {
			// hideLoadingHttp();
		}
	})
}

/**
 * 查询绘画操作记录
 * @param {Object} that
 * @param {Object} requestData
 * @param {Object} callback
 */
function drawTaskRecord(that, requestData, callback) {
	const appId = getApp().globalData.appId;
	// showLoadingHttp();
	uni.request({
		url: getApp().globalData.url + 'wtall-ai/wtallDrawRecord',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {
			openId: uni.getStorageSync(getApp().globalData.openIdCacheName),
			appId,
			...requestData
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
			// hideLoadingHttp();
		}
	})
}

function popupShow(that, msg) {
	that.popupMessage = JSON.stringify(msg);
	that.$refs.message.open();
	setTimeout(() => {
		that.$refs.message.close();
	}, 2000);
}

function checkHttpOk(res) {
	if (res.data.code == '000000') {
		return true;
	}
	return false;
}

export {
	drawQueryStyle,
	drawCreateTask,
	drawTaskRecord,
	drawQueryTask,
	deleteDrawTask
}