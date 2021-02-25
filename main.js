process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { app, BrowserWindow, dialog } = require('electron');
const updateApp = require('update-electron-app');
const fs = require('fs');

function startApp() {
  // updater
  updateApp({
      updateInterval: '1 hour',
      notifyUser: true
  });

  // create window
  const win = new BrowserWindow({
    width: 1200,
    height: 1000,
    webPreferences: {
      nodeIntegration: true
    },
    icon: __dirname + '/icon.jpg',
    show: false
  });

  function startWindow() {
    win.loadFile('index.html');
    win.maximize();
    win.show();
  }

  // check if config file exists
  if (!fs.existsSync('./config.json')) {
    dialog.showOpenDialog({
      title: 'Choose a file:',
      properties: ['openFile'],
      filters: [ { name: 'JSON', extensions: ['json'] } ]
    }).then((file) => {
      if (file === undefined) {
        app.quit();
      } else {
        let newConfig = JSON.parse(fs.readFileSync(file.filePaths[0]));
        fs.writeFileSync('./config.json', JSON.stringify(newConfig));
        startWindow();
      }
    }).catch(() => {
      app.quit();
    });
  } else {
    startWindow();
  }
}

app.commandLine.appendSwitch('ignore-certificate-errors');
app.whenReady().then(startApp);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    appReady();
  }
});