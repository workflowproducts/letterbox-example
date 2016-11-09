const letterbox = require('letterbox');
const postcard = require('postcard');
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindows = [];

app.on('ready', function () {
	postcard.init('letterbox-example', function (postgresPort) {
		var curWindow = new BrowserWindow({
			'width': 1024,
			'height': 768
		});
		mainWindows.push(curWindow);
		letterbox.init('letterbox-example',
				(process.platform == 'win32' ? '127.0.0.1' : '/tmp'), postgresPort,
				function (envelopePort) {

			curWindow.loadURL('http://127.0.0.1:' + envelopePort, {
				'extraHeaders': 'pragma: no-cache\n'
			});
		});

		// Emitted when the window is closed.
		curWindow.on('closed', function() {
			mainWindows.splice(mainWindows.indexOf(curWindow), 1);
		});
	});
});

app.on('quit', function() {
	letterbox.quit();
	postcard.quit();
});


// Quit when all windows are closed.
app.on('window-all-closed', function () {
	app.quit();
});

