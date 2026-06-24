const { app, BrowserWindow, ipcMain, dialog, session, shell, Menu, protocol } = require('electron');
const path = require('path');
const { initGargoyle } = require('./gargoyle.cjs');
const { checkForUpdates, downloadAndInstallUpdate } = require('./updater.cjs');

// Register the Void Protocol before app boots to grant it root-level CSP bypass privileges
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'gargoyle',
    privileges: {
      standard: true,
      secure: true,
      bypassCSP: true,
      supportFetchAPI: true,
      corsEnabled: true,
      allowServiceWorkers: true
    }
  }
]);

const isDev = process.env.NODE_ENV === 'development';

const originalExe = process.env.PORTABLE_EXECUTABLE_FILE || '';
const isInstallerMode = originalExe.toLowerCase().includes('setup') || originalExe.toLowerCase().includes('install');

// Suppress dev-mode CSP warnings in the console (Vite requires unsafe-eval for hot-reloading)
if (isDev) {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
}

// CRITICAL: The installer itself is an Electron app. If it runs under the name "HallowNet", 
// it locks the %APPDATA%/HallowNet folder, making it impossible to wipe during a Fresh Install.
// We MUST isolate the installer's AppData directory before the app boots.
if (isInstallerMode) {
  app.setPath('userData', path.join(app.getPath('appData'), 'HallowNetInstaller'));
}

let mainWindow;

function createWindow() {
  const appRoot = app.getAppPath();

  mainWindow = new BrowserWindow({
    show: false,
    width: isInstallerMode ? 800 : 1280,
    height: isInstallerMode ? 600 : 800,
    minWidth: 800,
    minHeight: 600,
    resizable: !isInstallerMode,
    title: isInstallerMode ? 'HallowNet Installer' : 'HallowNet',
    frame: false,
    thickFrame: true,
    roundedCorners: false,
    transparent: isInstallerMode,
    backgroundColor: isInstallerMode ? undefined : '#000000',
    minimizable: true,
    maximizable: !isInstallerMode,
    closable: true,
    icon: path.join(appRoot, 'public/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webviewTag: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173' + (isInstallerMode ? '#/installer' : ''));
  } else {
    mainWindow.loadFile(path.join(appRoot, 'dist/index.html'), { hash: isInstallerMode ? '/installer' : '' });
  }

  mainWindow.setMenuBarVisibility(false);
  
  // Anti-FOW (Flash of White) optimization
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  // Implement the Void Protocol handler
  protocol.handle('gargoyle', (request) => {
    const url = request.url;
    let mime = 'text/plain';
    if (url.endsWith('.js')) mime = 'application/javascript';
    else if (url.endsWith('.html')) mime = 'text/html';
    else if (url.endsWith('.css')) mime = 'text/css';
    else if (url.endsWith('.gif')) mime = 'image/gif';
    
    if (mime === 'image/gif') {
      const buffer = Buffer.from('R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', 'base64');
      return new Response(buffer, {
         headers: { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response('', {
      headers: { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' }
    });
  });

  const blockNotifications = (sess) => {
    sess.setPermissionRequestHandler((webContents, permission, callback) => {
      if (permission === 'notifications') return callback(false); // Silently block ALL web notifications
      callback(true);
    });
  };

  initGargoyle(session.defaultSession);
  blockNotifications(session.defaultSession);
  
  initGargoyle(session.fromPartition('persist:ghost'));
  blockNotifications(session.fromPartition('persist:ghost'));
  
  app.on('session-created', (sess) => {
    initGargoyle(sess);
    blockNotifications(sess);
  });

  // Domains that employ aggressive anti-adblock or cyber-warfare tactics.
  // Must match gargoyle.cjs and webview-preload.cjs
  const EXTREME_DOMAINS = [
    'kisscartoon.sh'
  ];

  // Ultimate Chromium-Level Clickjacking and Popup Annihilator
  app.on('web-contents-created', (event, contents) => {
    
    // Prevent the React UI itself from being hijacked by rogue window.top.location ad redirects
    // which unloads the browser and causes the "black screen of death".
    if (contents === mainWindow?.webContents) {
      contents.on('will-navigate', (e, url) => {
        if (!url.includes('localhost') && !url.includes('index.html')) {
          e.preventDefault();
          console.log(`[Core] Annihilated main window hijack attempt to: ${url}`);
        }
      });
    }

    // 1. Intercept ALL native popup window creation requests. 
    // Instead of spawning a rogue OS window, we elegantly route the request 
    // to the React frontend to spawn a native HallowNet tab!
    contents.setWindowOpenHandler(({ url }) => {
      if (mainWindow && url && !url.startsWith('about:blank') && url !== 'about:srcdoc') {
        mainWindow.webContents.send('add-new-tab', url);
      }
      return { action: 'deny' };
    });

    // 2. Intercept all frame and sub-frame navigations (defeats iframe clickjacking) on EXTREME_DOMAINS
    contents.on('will-frame-navigate', (event) => {
      try {
        const currentUrl = new URL(contents.getURL());
        if (!EXTREME_DOMAINS.some(d => currentUrl.hostname.includes(d))) return;

        const url = event.url;
        const targetUrl = new URL(url);
        // If the click attempts to suddenly redirect a frame to a completely external domain
        if (currentUrl.hostname && targetUrl.hostname !== currentUrl.hostname && !targetUrl.hostname.includes('google.com') && !targetUrl.hostname.includes('youtube.com')) {
           event.preventDefault();
           console.log(`[Gargoyle] Core OS clickjacking subframe redirect destroyed: ${url}`);
        }
      } catch(e) {}
    });
  });

  if (process.argv.includes('--silent-update') && isInstallerMode) {
    console.log('Silent Update Mode Detected: Bypassing UI and overwriting files...');
    const rawLocalAppData = process.env.LOCALAPPDATA || path.join(require('os').homedir(), 'AppData', 'Local');
    const targetPath = path.join(rawLocalAppData, 'Programs', 'HallowNet');
    const { executeInstall, finishInstall } = require('./installerLogic.cjs');
    
    executeInstall(targetPath, { desktopShortcut: false, startMenuShortcut: false })
      .then(() => {
        console.log('Silent update complete, launching new version.');
        finishInstall(targetPath, true);
      })
      .catch((err) => {
        console.error('Silent update failed:', err);
        app.quit();
      });
  } else {
    createWindow();
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Suppress annoying harmless ERR_ABORTED terminal spam from webview redirects
// Electron logs these internally via console.error, bypassing unhandledRejection.
const originalConsoleError = console.error;
console.error = (...args) => {
  const logStr = args.map(a => (a instanceof Error ? a.message + ' ' + a.stack : String(a))).join(' ');
  if (logStr.includes('GUEST_VIEW_MANAGER_CALL') && (logStr.includes('ERR_ABORTED') || logStr.includes('(-3)'))) {
    return; // Silently swallow
  }
  originalConsoleError(...args);
};

const SecureStorage = require('./storage.cjs');

ipcMain.handle('hallow:getHistory', () => SecureStorage.getHistory());
ipcMain.handle('hallow:saveHistory', (e, url, title) => SecureStorage.saveHistoryItem(url, title));
ipcMain.handle('hallow:updateHistoryTitle', (e, url, title) => SecureStorage.updateHistoryTitle(url, title));
ipcMain.handle('hallow:getPasswords', () => SecureStorage.getPasswords());
ipcMain.handle('hallow:savePassword', (e, pwd) => SecureStorage.savePassword(pwd));
ipcMain.handle('hallow:deletePassword', (e, id) => SecureStorage.deletePassword(id));
ipcMain.handle('hallow:getDirectory', () => SecureStorage.getDirectory());
ipcMain.handle('hallow:saveDirectory', (e, dir) => SecureStorage.saveDirectory(dir));

// Window control handlers
ipcMain.on('hallow:minimize',  () => {
  BrowserWindow.getAllWindows().forEach(win => win.minimize());
});
ipcMain.on('hallow:maximize',  () => {
  BrowserWindow.getAllWindows().forEach(win => {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
});
ipcMain.on('hallow:close',     () => {
  BrowserWindow.getAllWindows().forEach(win => win.close());
});
ipcMain.handle('hallow:isMaximized', () => {
  const wins = BrowserWindow.getAllWindows();
  return wins.length > 0 ? wins[0].isMaximized() : false;
});

// ── Installer IPCs ──
ipcMain.handle('hallow:isInstallerMode', () => isInstallerMode);

ipcMain.handle('hallow:checkExistingInstall', () => {
  const rawLocalAppData = process.env.LOCALAPPDATA || path.join(require('os').homedir(), 'AppData', 'Local');
  const targetPath = path.join(rawLocalAppData, 'Programs', 'HallowNet');
  const exePath = path.join(targetPath, 'HallowNet.exe');
  return require('fs').existsSync(exePath);
});

ipcMain.handle('hallow:getDefaultInstallPath', () => {
  // CRITICAL: We cannot use app.getPath('localAppData') here because in Portable mode,
  // electron-builder silently overrides it to point to the temporary extraction directory.
  // We must bypass it and query the raw OS environment directly.
  const rawLocalAppData = process.env.LOCALAPPDATA || path.join(require('os').homedir(), 'AppData', 'Local');
  return path.join(rawLocalAppData, 'Programs', 'HallowNet');
});

ipcMain.handle('hallow:selectInstallPath', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Installation Folder',
    properties: ['openDirectory']
  });
  if (canceled || filePaths.length === 0) return null;
  return filePaths[0];
});

const { executeInstall, executeUninstall, finishInstall } = require('./installerLogic.cjs');
ipcMain.handle('hallow:startInstall', async (event, targetPath, options) => {
  return await executeInstall(targetPath, options);
});

ipcMain.handle('hallow:startUninstall', async (event) => {
  return await executeUninstall();
});

ipcMain.handle('hallow:finishInstall', (event, targetPath, shouldLaunch) => {
  finishInstall(targetPath, shouldLaunch);
});

ipcMain.handle('load-extension', async () => {
  if (!mainWindow) return { success: false, error: 'No window' };
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Unpacked Extension Directory',
      properties: ['openDirectory']
    });
    
    if (canceled || filePaths.length === 0) {
      return { success: false, error: 'Canceled by user' };
    }
    
    const extPath = filePaths[0];
    const ext = await session.defaultSession.loadExtension(extPath, { allowFileAccess: true });
    return { success: true, name: ext.name, version: ext.version };
  } catch (error) {
    console.error('Extension load failed:', error);
    return { success: false, error: error.message };
  }
});

// ─── Native Tab Context Menu ──────────────────────────────────────────────────
ipcMain.on('show-tab-context-menu', (event, tabId) => {
  const template = [
    {
      label: 'Close Tab',
      click: () => event.sender.send('tab-menu-action', 'close', tabId)
    },
    {
      label: 'Close Other Tabs',
      click: () => event.sender.send('tab-menu-action', 'close-other', tabId)
    },
    { type: 'separator' },
    {
      label: 'Close All Tabs',
      click: () => event.sender.send('tab-menu-action', 'close-all', tabId)
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) menu.popup({ window: win });
});

// ─── Context Menu & Global Session Handlers ─────────────────────────────────────
// We attach this at the app level because <webview> tags do not bubble their
// internal context-menu DOM events out to the React wrapper.
app.on('web-contents-created', (e, contents) => {
  
  // 1) Bind Download Manager to this specific session (so it catches webview & ghost tabs)
  if (!contents.session._hasDownloadHandler) {
    contents.session._hasDownloadHandler = true;
    contents.session.on('will-download', (event, item, webContents) => {
      // Generate a simple unique ID for this download
      const id = Date.now().toString() + Math.floor(Math.random() * 1000);
      activeDownloads.set(id, item);

      // ALWAYS use the persistent global mainWindow reference! 
      // Using getAllWindows()[0] fails if a transient ad popup momentarily steals index 0!
      if (!mainWindow) return;

      mainWindow.webContents.send('download-started', {
        id,
        filename: item.getFilename(),
        totalBytes: item.getTotalBytes(),
        url: item.getURL()
      });

      item.on('updated', (ev, state) => {
        if (state === 'interrupted') {
          mainWindow.webContents.send('download-updated', { id, state: 'interrupted' });
        } else if (state === 'progressing') {
          if (item.isPaused()) {
            mainWindow.webContents.send('download-updated', { id, state: 'paused' });
          } else {
            mainWindow.webContents.send('download-updated', {
              id,
              state: 'progressing',
              receivedBytes: item.getReceivedBytes(),
              totalBytes: item.getTotalBytes()
            });
          }
        }
      });

      item.once('done', (ev, state) => {
        activeDownloads.delete(id);
        mainWindow.webContents.send('download-done', {
          id,
          state,
          savePath: item.getSavePath()
        });
      });
    });
  }

  // 2) Bind Context Menu
  contents.on('context-menu', (event, params) => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    const menuTemplate = [];

    // Links
    if (params.linkURL) {
      menuTemplate.push({
        label: 'Open Link in New Tab',
        click: () => mainWindow?.webContents.send('add-new-tab', params.linkURL)
      });
      menuTemplate.push({
        label: 'Open Link in New Window',
        click: () => shell.openExternal(params.linkURL)
      });
      menuTemplate.push({
        label: 'Copy Link Address',
        click: () => require('electron').clipboard.writeText(params.linkURL)
      });
      menuTemplate.push({ type: 'separator' });
    }

    // Images
    if (params.mediaType === 'image' && params.srcURL) {
      menuTemplate.push({
        label: 'Save Image As...',
        click: () => contents.downloadURL(params.srcURL)
      });
      menuTemplate.push({
        label: 'Copy Image',
        click: () => contents.copyImageAt(params.x, params.y)
      });
      menuTemplate.push({
        label: 'Open Image in New Tab',
        click: () => mainWindow?.webContents.send('add-new-tab', params.srcURL)
      });
      menuTemplate.push({
        label: 'Copy Image Address',
        click: () => require('electron').clipboard.writeText(params.srcURL)
      });
      menuTemplate.push({ type: 'separator' });
    }

    // Video
    if (params.mediaType === 'video' && params.srcURL) {
      menuTemplate.push({
        label: 'Save Video As...',
        click: () => contents.downloadURL(params.srcURL)
      });
      menuTemplate.push({
        label: 'Copy Video Address',
        click: () => require('electron').clipboard.writeText(params.srcURL)
      });
      menuTemplate.push({ type: 'separator' });
    }

    // Audio
    if (params.mediaType === 'audio' && params.srcURL) {
      menuTemplate.push({
        label: 'Save Audio As...',
        click: () => contents.downloadURL(params.srcURL)
      });
      menuTemplate.push({
        label: 'Copy Audio Address',
        click: () => require('electron').clipboard.writeText(params.srcURL)
      });
      menuTemplate.push({ type: 'separator' });
    }

    // Text / Editing
    if (params.isEditable) {
      menuTemplate.push({ role: 'undo', label: 'Undo' });
      menuTemplate.push({ role: 'redo', label: 'Redo' });
      menuTemplate.push({ type: 'separator' });
      menuTemplate.push({ role: 'cut', label: 'Cut' });
      menuTemplate.push({ role: 'copy', label: 'Copy' });
      menuTemplate.push({ role: 'paste', label: 'Paste' });
      menuTemplate.push({ role: 'selectAll', label: 'Select All' });
      menuTemplate.push({ type: 'separator' });
    } else if (params.selectionText && params.selectionText.trim()) {
      menuTemplate.push({
        label: 'Copy',
        click: () => require('electron').clipboard.writeText(params.selectionText)
      });
      menuTemplate.push({
        label: `Search Google for "${params.selectionText.substring(0, 30)}${params.selectionText.length > 30 ? '...' : ''}"`,
        click: () => mainWindow?.webContents.send('add-new-tab', `https://www.google.com/search?q=${encodeURIComponent(params.selectionText)}`)
      });
      menuTemplate.push({ type: 'separator' });
    }

    // Default page actions (empty area right-click)
    if (params.mediaType === 'none' && !params.linkURL && !params.isEditable && !params.selectionText?.trim()) {
      menuTemplate.push({
        label: 'Back',
        enabled: contents.navigationHistory ? contents.navigationHistory.canGoBack() : contents.canGoBack(),
        click: () => contents.goBack()
      });
      menuTemplate.push({
        label: 'Forward',
        enabled: contents.navigationHistory ? contents.navigationHistory.canGoForward() : contents.canGoForward(),
        click: () => contents.goForward()
      });
      menuTemplate.push({
        label: 'Reload',
        click: () => contents.reload()
      });
      menuTemplate.push({
        label: 'Save Page As...',
        click: () => contents.downloadURL(contents.getURL())
      });
      menuTemplate.push({ type: 'separator' });
    }

    // Always show inspect element
    menuTemplate.push({
      label: 'Inspect Element',
      click: () => contents.inspectElement(params.x, params.y)
    });

    if (menuTemplate.length > 0) {
      const menu = Menu.buildFromTemplate(menuTemplate);
      // We anchor the popup to the main browser window so it doesn't get lost
      if (mainWindow) {
        menu.popup({ window: mainWindow });
      } else {
        menu.popup();
      }
    }
  });
});

// ─── Downloads Manager IPC ───────────────────────────────────────────────────
const activeDownloads = new Map();

ipcMain.handle('download-pause', (e, id) => {
  const item = activeDownloads.get(id);
  if (item && !item.isPaused()) item.pause();
});

ipcMain.handle('download-resume', (e, id) => {
  const item = activeDownloads.get(id);
  if (item && item.canResume()) item.resume();
});

ipcMain.handle('download-cancel', (e, id) => {
  const item = activeDownloads.get(id);
  if (item) {
    item.cancel();
    activeDownloads.delete(id);
  }
});

ipcMain.handle('download-show', (e, savePath) => {
  if (savePath) shell.showItemInFolder(savePath);
});

// ── Auto-Updater IPCs ──
ipcMain.handle('hallow:checkForUpdates', async () => {
  return await checkForUpdates();
});

ipcMain.handle('hallow:installUpdate', async (event, downloadUrl) => {
  return await downloadAndInstallUpdate(downloadUrl, mainWindow);
});
