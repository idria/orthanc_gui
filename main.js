process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { app, BrowserWindow } = require('electron');

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 1000,
    webPreferences: {
      nodeIntegration: true
    },
    icon: __dirname + '/icon.jpg',
    show: false
  });

  win.loadFile('index.html');

  win.maximize();
  win.show();
}

app.commandLine.appendSwitch('ignore-certificate-errors');
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
