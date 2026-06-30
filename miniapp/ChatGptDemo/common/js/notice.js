function mainNotice(sucessCallBack) {
	const appId = getApp().globalData.appId;
	uni.request({
		url: 'https://cy.wtianyu.com/notice.json',
		method: 'GET',
		success: (res) => {
			console.log(8888);
			if (checkTimeWithNow(res.data.showTime.split(';')[0]) <= 0 &&
				checkTimeWithNow(res.data.showTime.split(';')[1]) >= 0) {
				sucessCallBack(res.data.content);
			}
		},
		fail: (res) => {}
	})
}

/**
 * 和当前时间比较大小
 * @param {Object} dateString yyyyMMddHHmmss
 */
function checkTimeWithNow(dateString) {
	// 获取当前时间的日期对象和时间戳
	const currentDate = new Date();
	const currentTimestamp = currentDate.getTime();

	// 提取年、月、日、时、分、秒的部分
	const year = parseInt(dateString.substring(0, 4), 10);
	const month = parseInt(dateString.substring(4, 6), 10) - 1; // 月份是从 0 开始的，所以要减去 1
	const day = parseInt(dateString.substring(6, 8), 10);
	const hour = parseInt(dateString.substring(8, 10), 10);
	const minute = parseInt(dateString.substring(10, 12), 10);
	const second = parseInt(dateString.substring(12, 14), 10);

	// 创建日期对象并获取时间戳
	const dateObject = new Date(year, month, day, hour, minute, second);
	const dateTimestamp = dateObject.getTime();

	// 比较时间戳
	if (dateTimestamp > currentTimestamp) {
		return 1;
	} else if (dateTimestamp < currentTimestamp) {
		return -1;
	} else {
		return 0;
	}
}

export {
	mainNotice,
}