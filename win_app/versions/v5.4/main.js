const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function getInstallerLanguage() {
  const possiblePaths = [
    path.join(process.resourcesPath || '', '..', 'lang.txt'),
    path.join(__dirname, '..', 'lang.txt'),
    path.join(__dirname, 'lang.txt'),
    path.join(process.cwd(), 'lang.txt')
  ];
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8').trim().toLowerCase();
        if (content.startsWith('en')) return 'en';
        if (content.startsWith('fr')) return 'fr';
      }
    } catch (e) {}
  }
  return null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1040,
    height: 780,
    minWidth: 480,
    minHeight: 560,
    backgroundColor: '#080808',
    title: 'To-Do List',
    icon: path.join(__dirname, 'assets', 'icons', 'icon-512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    autoHideMenuBar: true
  });

  Menu.setApplicationMenu(null);

  const initialLang = getInstallerLanguage();

  mainWindow.webContents.on('did-finish-load', () => {
    if (initialLang) {
      mainWindow.webContents.executeJavaScript(`
        (function() {
          try {
            if (!localStorage.getItem('installer_lang_initialized')) {
              localStorage.setItem('installer_lang_initialized', 'true');
              localStorage.setItem('lang', '${initialLang}');
              if (typeof setLanguage === 'function') {
                setLanguage('${initialLang}');
              }
            }
          } catch(e) {}
        })();
      `).catch(() => {});
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'login.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
