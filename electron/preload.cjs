const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('electronAPI', {
  getHistory:           () => ipcRenderer.invoke('hallow:getHistory'),
  saveHistory:          (url, title) => ipcRenderer.invoke('hallow:saveHistory', url, title),
  updateHistoryTitle:   (url, title) => ipcRenderer.invoke('hallow:updateHistoryTitle', url, title),
  getPasswords:         () => ipcRenderer.invoke('hallow:getPasswords'),
  savePassword:         (pwd) => ipcRenderer.invoke('hallow:savePassword', pwd),
  deletePassword:       (id) => ipcRenderer.invoke('hallow:deletePassword', id),
  getDirectory:         () => ipcRenderer.invoke('hallow:getDirectory'),
  saveDirectory:        (dir) => ipcRenderer.invoke('hallow:saveDirectory', dir),
  loadExtension:        () => ipcRenderer.invoke('load-extension'),
  getWebviewPreloadPath: () => {
    const path = require('path');
    // In production, webview-preload.cjs is unpacked from asar into resources/
    if (process.resourcesPath) {
      const prod = path.join(process.resourcesPath, 'webview-preload.cjs');
      const fs = require('fs');
      if (fs.existsSync(prod)) {
        return `file:///${prod.replace(/\\/g, '/')}`;
      }
    }
    // Dev fallback
    return `file:///${path.join(__dirname, 'webview-preload.cjs').replace(/\\/g, '/')}`;
  },
  getGargoyleStats:    () => ipcRenderer.invoke('gargoyle:get-stats'),
  toggleGargoyle:      () => ipcRenderer.invoke('gargoyle:toggle'),
  // Installer routines
  isInstallerMode:      () => ipcRenderer.invoke('hallow:isInstallerMode'),
  checkExistingInstall: () => ipcRenderer.invoke('hallow:checkExistingInstall'),
  getDefaultInstallPath: () => ipcRenderer.invoke('hallow:getDefaultInstallPath'),
  selectInstallPath:    () => ipcRenderer.invoke('hallow:selectInstallPath'),
  startInstall:         (targetPath, options) => ipcRenderer.invoke('hallow:startInstall', targetPath, options),
  startUninstall:       () => ipcRenderer.invoke('hallow:startUninstall'),
  finishInstall:        (targetPath, shouldLaunch) => ipcRenderer.invoke('hallow:finishInstall', targetPath, shouldLaunch),
  // Window controls
  minimizeWindow:       () => ipcRenderer.send('hallow:minimize'),
  maximizeWindow:       () => ipcRenderer.send('hallow:maximize'),
  closeWindow:          () => ipcRenderer.send('hallow:close'),
  isMaximized:          () => ipcRenderer.invoke('hallow:isMaximized'),
  
  // Downloads Manager
  downloads: {
    onStarted: (callback) => {
      ipcRenderer.removeAllListeners('download-started');
      ipcRenderer.on('download-started', (_e, data) => callback(data));
    },
    onUpdated: (callback) => {
      ipcRenderer.removeAllListeners('download-updated');
      ipcRenderer.on('download-updated', (_e, data) => callback(data));
    },
    onDone: (callback) => {
      ipcRenderer.removeAllListeners('download-done');
      ipcRenderer.on('download-done', (_e, data) => callback(data));
    },
    pause:     (id) => ipcRenderer.invoke('download-pause', id),
    resume:    (id) => ipcRenderer.invoke('download-resume', id),
    cancel:    (id) => ipcRenderer.invoke('download-cancel', id),
    showInFolder: (savePath) => ipcRenderer.invoke('download-show', savePath),
  },
  
  // Tabs
  // Auto-Updater
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('hallow:checkForUpdates'),
    installUpdate: (url) => ipcRenderer.invoke('hallow:installUpdate', url),
    onProgress: (callback) => {
      ipcRenderer.removeAllListeners('updater:progress');
      ipcRenderer.on('updater:progress', (_e, data) => callback(data));
    }
  },
  showTabContextMenu: (tabId) => ipcRenderer.send('show-tab-context-menu', tabId),
  onTabMenuAction: (callback) => {
    ipcRenderer.removeAllListeners('tab-menu-action');
    ipcRenderer.on('tab-menu-action', (_e, action, tabId) => callback(action, tabId));
  },
  onAddNewTab: (callback) => {
    ipcRenderer.removeAllListeners('add-new-tab');
    ipcRenderer.on('add-new-tab', (_e, url) => callback(url));
  }
});
