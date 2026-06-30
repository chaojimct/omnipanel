/**
 * 获取可购买产品信息
 * @param {Object} callBackSuccess
 * @param {Object} callBackFail
 */
function queryProductList(callBackSuccess) {
	const appId = getApp().globalData.appId;
	showLoadingHttp();
	uni.request({
		url: getApp().globalData.url + 'wtall-ai/pay/queryProductList',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {},
		success: (res) => {
			if (checkHttpOk(res)) {
				callBackSuccess(res);
			} else {
				uni.showModal({
					content: res.data.msg,
					showCancel: false
				});
			}
		},
		fail: (res) => {
			showNetError()
		},
		complete: () => {
			hideLoadingHttp();
		}
	})
}

/**
 * 生成支付订单
 * @param {Object} callBackSuccess
 */
function createPayOrder(requestData, callBackSuccess) {

	const appId = getApp().globalData.appId;
	showLoadingHttp();
	uni.request({
		url: getApp().globalData.url + 'wtall-ai/pay/createOrder',
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
				uni.showModal({
					content: res.data.msg,
					showCancel: false
				});
			}

		},
		fail: (res) => {
			showNetError()
		},
		complete: () => {
			hideLoadingHttp();
		}
	})
}

/**
 * 取消订单
 * @param {Object} callBackSuccess
 */
function cancelOrder(orderNo, callBackSuccess) {
	const appId = getApp().globalData.appId;
	uni.request({
		url: getApp().globalData.url + 'wtall-ai/pay/cancelOrder',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {
			openId: uni.getStorageSync(getApp().globalData.openIdCacheName),
			appId,
			orderNo,
		},
		success: (res) => {
			if (checkHttpOk(res)) {
				callBackSuccess(res);
			}
		},
		fail: (res) => {

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

/**
 * 查询订单记录
 * @param {Object} requestData
 * @param {Object} callBackSuccess
 */
function orderRecord(requestData, callBackSuccess, callBackFail) {
	const appId = getApp().globalData.appId;
	uni.request({
		url: getApp().globalData.url + 'wtall-ai/pay/orderRecord',
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
				uni.showModal({
					content: res.data.msg,
					showCancel: false
				});
			}
		},
		fail: (res) => {
			callBackFail(res);
		},
		complete: () => {

		}
	})
}

function queryOrder(requestData, callBackSuccess) {
	const appId = getApp().globalData.appId;
	uni.request({
		url: getApp().globalData.url + 'wtall-ai/pay/queryOrder',
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
			}
		},
		fail: (res) => {

		},
		complete: () => {

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

export {
	createPayOrder,
	queryProductList,
	cancelOrder,
	queryOrder,
	orderRecord,
}