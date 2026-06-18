const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronOverlay", {
  onUpdate: (callback) => {
    ipcRenderer.on("overlay:update", (_event, payload) => callback(payload));
  },
});
