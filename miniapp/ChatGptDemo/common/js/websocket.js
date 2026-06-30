let socketConnectTimer = null;
let socketConnectCount = 1;
let socketTask;
let socketStatus;
let receiveMessageCallBack;
let flag = 0;

function initSocket(flagTmp) {
	if (flag === flagTmp && flag === 1) {
		return;
	}
	socketConnectTimer = null;
	socketConnectCount = 1;
	socketStatus = null;
	socketTask = null;
	receiveMessageCallBack = null;
	flag = flagTmp;
}

function openSocket(appId, openId, flag) {
	if (!getApp().globalData.isNotBlank(openId)) {
		console.log("openSocket_openId is null");
		return;
	}
	if (socketConnectCount < 20) {
		socketConnectCount++;
	} else {
		uni.showModal({
			content: "AI对话连接失败，请重新进入小程序",
			showCancel: false
		});
		socketConnectCount = 1;
		return;
	}
	let url = getApp().globalData.webSocketUrl + "websocket/" + appId + "/" + openId + "/" + flag;
	socketTask = uni.connectSocket({
		url,
		header: {
			'content-type': 'application/json'
		},
		success() {
			console.log('建立WebSocket对话任务成功');
			clearInterval(socketConnectTimer);
			setTimeout(() => {
				addSocketListener();
			}, 0);
		},
		fail(err) {
			console.error('建立WebSocket对话任务失败', err);
		},
		complete: res => {
			console.log(res);
		}
	});
}

function createSocket(flag, callBack) {
	if (socketStatus === 'connected') {
		return;
	}
	receiveMessageCallBack = callBack;
	const appId = getApp().globalData.appId;
	const openId = uni.getStorageSync(getApp().globalData.openIdCacheName);

	socketConnectCount = 0;
	socketConnectTimer = setInterval(openSocket(appId, openId, flag), 3000);
}



function addSocketListener() {
	console.log('启动WebSocket连接！！！');
	socketTask.onOpen(() => {
		console.log('WebSocket连接成功');
		socketStatus = 'connected';
		setTimeout(() => {
			socketStatus = 'connected';
		}, 1000);
	});
	socketTask.onClose(() => {
		socketStatus = 'closed';
	});
	socketTask.onError(error => {
		console.error('WebSocket发生错误:', error);
		socketStatus = 'errored';
	});
	// 监听服务器推送消息
	socketTask.onMessage(message => {
		// console.log('WebSocket收到信道消息', message);
		receiveMessageCallBack(message);
	});
}


function sendMessage(flag, msg, receiveCallBack, sendSCallBack, sendFCallBack) {
	if (socketStatus !== 'connected') {
		sendFCallBack();
		createSocket(flag, receiveCallBack);
		return;
	}
	socketTask.send({
		data: msg,
		success() {
			sendSCallBack();
		},
		fail() {
			sendFCallBack();
		}
	});
}

export {
	createSocket,
	sendMessage,
	initSocket,
}