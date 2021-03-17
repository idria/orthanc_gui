process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { app, dialog, BrowserWindow } = require('electron');
const fs = require('fs');

// create user data path
let configPath = app.getPath('userData') + '\\config.json';
fs.writeFileSync("./config.path", configPath);

function startApp() {
  // create window
  const win = new BrowserWindow({
    width: 1200,
    height: 1000,
    webPreferences: {
      nodeIntegration: true
    },
    icon: __dirname + '/favicon.ico',
    show: false
  });

  // check if config file exists
  if (!fs.existsSync(configPath)) {
    dialog.showOpenDialog({
      title: 'Choose a file:',
      properties: ['openFile'],
      filters: [ { name: 'JSON', extensions: ['json'] } ]
    }).then((file) => {
      if (file === undefined) {
        app.quit();
      } else {
        let newConfig = JSON.parse(fs.readFileSync(file.filePaths[0]));
        fs.writeFileSync(configPath, JSON.stringify(newConfig));
        win.loadFile('index.html');
        win.maximize();
        win.show();
      }
    }).catch(() => {
      app.quit();
    });
  } else {
    win.loadFile('index.html');
    win.maximize();
    win.show();
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
    startApp();
  }
});