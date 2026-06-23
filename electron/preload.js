const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getHistory: () => ipcRenderer.invoke('get-history'),
  
  downloads: {
    onStarted: (callback) => ipcRenderer.on('download-started', (_e, data) => callback(data)),
    onUpdated: (callback) => ipcRenderer.on('download-updated', (_e, data) => callback(data)),
    onDone: (callback) => ipcRenderer.on('download-done', (_e, data) => callback(data)),
    pause: (id) => ipcRenderer.invoke('download-pause', id),
    resume: (id) => ipcRenderer.invoke('download-resume', id),
    cancel: (id) => ipcRenderer.invoke('download-cancel', id),
    showInFolder: (savePath) => ipcRenderer.invoke('download-show', savePath)
  },
  
  showContextMenu: (webviewId, params) => ipcRenderer.send('show-context-menu', webviewId, params),
  
  onAddNewTab: (callback) => ipcRenderer.on('add-new-tab', (_e, url) => callback(url)),

  getGargoyleStats: () => ipcRenderer.invoke('get-gargoyle-stats'),
  incrementGargoyleBlock: () => ipcRenderer.invoke('increment-gargoyle-block'),
  toggleGargoyle: () => ipcRenderer.invoke('toggle-gargoyle'),

  getPasswords: () => ipcRenderer.invoke('get-passwords'),
  savePassword: (pwdEntry) => ipcRenderer.invoke('save-password', pwdEntry),
  deletePassword: (id) => ipcRenderer.invoke('delete-password', id)
});
