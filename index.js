const letterbox = require('letterbox');
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindows = [];

app.on('ready', function () {
	letterbox.init('letterbox-example', function (envelopePort) {
		var curWindow = new BrowserWindow({
			'width': 1024,
			'height': 768
		});
		mainWindows.push(curWindow);

		curWindow.loadURL('http://127.0.0.1:' + envelopePort, {
			'extraHeaders': 'pragma: no-cache\n'
		});

		// Emitted when the window is closed.
		curWindow.on('closed', function() {
			mainWindows.splice(mainWindows.indexOf(curWindow), 1);
		});
	});
});

app.on('quit', function() {
	letterbox.quit();
});
