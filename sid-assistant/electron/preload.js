const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sidDesktop", {
  isDesktopShell: true,
  runAction(payload) {
    return ipcRenderer.invoke("sid:desktop-action", payload);
  },
});
