const { app, BrowserWindow, ipcMain, session, shell, Menu, webContents, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'HallowNet',
    icon: path.join(__dirname, '../public/vite.svg'), // we'll use a better icon later
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // Essential for rendering browser tabs
    },
  });

  // Load React app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools by default in dev
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Hide the default menu bar for a cleaner "browser" look
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Example IPC handlers for future (History, Bookmarks, etc.)
ipcMain.handle('get-history', async () => {
  return []; // Mock
});

// ─── Context Menu ─────────────────────────────────────────────────────────────
// We must attach this at the app level because <webview> tags do not bubble their
// internal context-menu DOM events out to the React wrapper.
app.on('web-contents-created', (e, contents) => {
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
      if (params.hasImageContents && params.srcURL) {
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
      if (!params.hasImageContents && !params.linkURL && !params.isEditable && !params.selectionText?.trim()) {
        menuTemplate.push({
          label: 'Back',
          enabled: contents.canGoBack(),
          click: () => contents.goBack()
        });
        menuTemplate.push({
          label: 'Forward',
          enabled: contents.canGoForward(),
          click: () => contents.goForward()
        });
        menuTemplate.push({
          label: 'Reload',
          click: () => contents.reload()
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

// ─── Downloads Manager ────────────────────────────────────────────────────────
const activeDownloads = new Map();

app.whenReady().then(() => {
  session.defaultSession.on('will-download', (event, item, webContents) => {
    // Generate a simple unique ID for this download
    const id = Date.now().toString() + Math.floor(Math.random() * 1000);
    activeDownloads.set(id, item);

    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    mainWindow.webContents.send('download-started', {
      id,
      filename: item.getFilename(),
      totalBytes: item.getTotalBytes(),
      url: item.getURL()
    });

    item.on('updated', (event, state) => {
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

    item.once('done', (event, state) => {
      // state can be 'completed', 'cancelled', 'interrupted'
      activeDownloads.delete(id);
      mainWindow.webContents.send('download-done', {
        id,
        state,
        savePath: item.getSavePath()
      });
    });
  });
});

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

// ─── Gargoyle Telemetry Backend ───────────────────────────────────────────────
const gargoyleStorePath = path.join(app.getPath('userData'), 'hwn-gargoyle.json');
let sessionBlockedCount = 0;

function getGargoyleData() {
  try {
    if (fs.existsSync(gargoyleStorePath)) {
      return JSON.parse(fs.readFileSync(gargoyleStorePath, 'utf8'));
    }
  } catch (err) {}
  return { totalBlocked: 0, enabled: true };
}

function saveGargoyleData(data) {
  try {
    fs.writeFileSync(gargoyleStorePath, JSON.stringify(data));
  } catch (err) {}
}

ipcMain.handle('get-gargoyle-stats', () => {
  const data = getGargoyleData();
  return { ...data, sessionBlocked: sessionBlockedCount, blocklistSize: 42189 };
});

ipcMain.handle('increment-gargoyle-block', () => {
  const data = getGargoyleData();
  data.totalBlocked += 1;
  sessionBlockedCount += 1;
  saveGargoyleData(data);
});

ipcMain.handle('toggle-gargoyle', () => {
  const data = getGargoyleData();
  data.enabled = !data.enabled;
  saveGargoyleData(data);
  return data.enabled;
});

// ─── The Crypt: High-Security Vault ───────────────────────────────────────────
const vaultStorePath = path.join(app.getPath('userData'), 'hwn-vault.json');

function getVaultData() {
  try {
    if (fs.existsSync(vaultStorePath)) {
      return JSON.parse(fs.readFileSync(vaultStorePath, 'utf8'));
    }
  } catch (err) {}
  return [];
}

function saveVaultData(data) {
  try {
    fs.writeFileSync(vaultStorePath, JSON.stringify(data));
  } catch (err) {}
}

ipcMain.handle('get-passwords', () => {
  const encryptedPasswords = getVaultData();
  if (!safeStorage.isEncryptionAvailable()) return encryptedPasswords; // Fallback to plaintext if DPAPI fails
  
  return encryptedPasswords.map(p => {
    try {
      const buffer = Buffer.from(p.encryptedPassword, 'base64');
      return { ...p, password: safeStorage.decryptString(buffer) };
    } catch (e) {
      return { ...p, password: 'ERROR_DECRYPTING' };
    }
  });
});

ipcMain.handle('save-password', (e, pwdEntry) => {
  const vault = getVaultData();
  let entryToSave = { ...pwdEntry, id: Date.now().toString() };
  
  if (safeStorage.isEncryptionAvailable()) {
    const encryptedBuffer = safeStorage.encryptString(pwdEntry.password);
    entryToSave.encryptedPassword = encryptedBuffer.toString('base64');
    delete entryToSave.password; // Never save plaintext to disk
  } else {
    entryToSave.encryptedPassword = pwdEntry.password; // Fallback
  }
  
  vault.push(entryToSave);
  saveVaultData(vault);
  return entryToSave;
});

ipcMain.handle('delete-password', (e, id) => {
  let vault = getVaultData();
  vault = vault.filter(p => p.id !== id);
  saveVaultData(vault);
});
