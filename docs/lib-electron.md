# Electron Reference

> Build cross-platform desktop apps with JavaScript, HTML, and CSS.

**Website:** https://www.electronjs.org  
**Version:** Latest stable (check releases.electronjs.org)

## Overview

Electron embeds Chromium and Node.js into a single binary, allowing you to build cross-platform desktop applications using web technologies. It powers VS Code, Slack, Discord, and many other popular apps.

## Architecture

### Process Model

Electron uses a multi-process architecture similar to Chrome:

```
┌─────────────────────────────────────────────────┐
│                 Main Process                     │
│  (Node.js environment, single instance)          │
│  - Window management                             │
│  - System APIs (menus, dialogs, tray)           │
│  - IPC coordination                              │
└─────────────────────────────────────────────────┘
          │                    │
          ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│ Renderer Process │  │ Renderer Process │
│ (Chromium)       │  │ (Chromium)       │
│ - Web content    │  │ - Web content    │
│ - React/Vue/etc  │  │ - React/Vue/etc  │
└──────────────────┘  └──────────────────┘
```

### Main Process

- Single instance per app
- Full Node.js access
- Creates and manages BrowserWindows
- Handles native OS APIs (menus, dialogs, notifications)
- Coordinates IPC between renderers

### Renderer Process

- One per BrowserWindow (or web embed)
- Chromium-based, runs web content
- No direct Node.js access by default (security)
- Communicates with main via IPC

### Preload Scripts

Bridge between main and renderer:

```javascript
// preload.js - runs before renderer content loads
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Expose specific APIs to renderer
  sendMessage: (msg) => ipcRenderer.send('message', msg),
  onResponse: (callback) => ipcRenderer.on('response', callback)
})
```

## BrowserWindow API

### Creating Windows

```javascript
const { BrowserWindow } = require('electron')

const win = new BrowserWindow({
  width: 800,
  height: 600,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,  // Security: isolate preload context
    nodeIntegration: false,  // Security: disable Node in renderer
    sandbox: true            // Security: enable Chromium sandbox
  }
})

win.loadFile('index.html')
// or
win.loadURL('https://example.com')
```

### Key Window Options

| Option | Type | Description |
|--------|------|-------------|
| `width`, `height` | number | Initial window size |
| `x`, `y` | number | Initial position |
| `show` | boolean | Show immediately (default: true) |
| `frame` | boolean | Show window frame (default: true) |
| `transparent` | boolean | Transparent background |
| `resizable` | boolean | Allow resizing |
| `alwaysOnTop` | boolean | Keep above other windows |
| `skipTaskbar` | boolean | Hide from taskbar |
| `focusable` | boolean | Can receive focus |
| `parent` | BrowserWindow | Parent window |
| `modal` | boolean | Modal to parent |

### Window Methods

```javascript
// Visibility
win.show()
win.hide()
win.focus()
win.blur()

// State
win.minimize()
win.maximize()
win.unmaximize()
win.restore()
win.setFullScreen(true)

// Position & Size
win.setBounds({ x: 0, y: 0, width: 800, height: 600 })
win.setPosition(x, y)
win.setSize(width, height)
win.center()

// Content
win.loadFile('index.html')
win.loadURL('https://...')
win.reload()

// Properties
win.setTitle('My App')
win.setBackgroundColor('#2e2c29')
win.setAlwaysOnTop(true)
```

### Window Events

```javascript
win.on('ready-to-show', () => win.show())  // Content loaded
win.on('close', (e) => { /* can prevent */ })
win.on('closed', () => { /* cleanup */ })
win.on('focus', () => { })
win.on('blur', () => { })
win.on('resize', () => { })
win.on('move', () => { })
```

## Inter-Process Communication (IPC)

### Pattern 1: Renderer to Main (One-way)

```javascript
// preload.js
contextBridge.exposeInMainWorld('api', {
  setTitle: (title) => ipcRenderer.send('set-title', title)
})

// main.js
ipcMain.on('set-title', (event, title) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win.setTitle(title)
})

// renderer.js
window.api.setTitle('New Title')
```

### Pattern 2: Renderer to Main (Two-way)

```javascript
// preload.js
contextBridge.exposeInMainWorld('api', {
  openFile: () => ipcRenderer.invoke('dialog:openFile')
})

// main.js
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog()
  if (!canceled) return filePaths[0]
})

// renderer.js
const filePath = await window.api.openFile()
```

### Pattern 3: Main to Renderer

```javascript
// main.js
mainWindow.webContents.send('update-counter', 1)

// preload.js
contextBridge.exposeInMainWorld('api', {
  onUpdateCounter: (callback) => 
    ipcRenderer.on('update-counter', (_event, value) => callback(value))
})

// renderer.js
window.api.onUpdateCounter((value) => {
  console.log('Counter:', value)
})
```

## App Lifecycle

```javascript
const { app } = require('electron')

// App is ready to create windows
app.whenReady().then(() => {
  createWindow()
  
  // macOS: recreate window when dock icon clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// All windows closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

## Native APIs

### Dialog

```javascript
const { dialog } = require('electron')

// Open file
const result = await dialog.showOpenDialog({
  properties: ['openFile', 'multiSelections']
})

// Save file
const result = await dialog.showSaveDialog({
  defaultPath: 'untitled.txt'
})

// Message box
await dialog.showMessageBox({
  type: 'info',
  title: 'Title',
  message: 'Message',
  buttons: ['OK', 'Cancel']
})
```

### Menu

```javascript
const { Menu } = require('electron')

const template = [
  {
    label: 'File',
    submenu: [
      { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => {} },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
```

### Tray

```javascript
const { Tray, nativeImage } = require('electron')

const icon = nativeImage.createFromPath('icon.png')
const tray = new Tray(icon)
tray.setToolTip('My App')
tray.setContextMenu(contextMenu)
```

### Global Shortcuts

```javascript
const { globalShortcut } = require('electron')

app.whenReady().then(() => {
  globalShortcut.register('CommandOrControl+X', () => {
    console.log('Shortcut triggered')
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
```

## Security Best Practices

1. **Enable Context Isolation** - Isolate preload from renderer
2. **Disable Node Integration** - Don't expose Node to web content
3. **Enable Sandbox** - Use Chromium's sandbox
4. **Validate IPC** - Never trust renderer input
5. **Use HTTPS** - For remote content
6. **CSP Headers** - Set Content-Security-Policy

```javascript
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,    // Required
    nodeIntegration: false,    // Required
    sandbox: true,             // Recommended
    preload: path.join(__dirname, 'preload.js')
  }
})
```

## VibeOS Shell UI Architecture

```
shell-ui/
├── main.js          # Main process - window management, IPC handlers
├── preload.js       # IPC bridge - expose window.vibeos API
├── icon.html        # Taskbar icon (separate small window)
├── index.html       # Main conversation UI entry point
└── src/             # React app (renderer process)
    ├── App.tsx
    ├── components/
    └── hooks/
```

### IPC Channels in VibeOS

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `vibeos:message` | renderer → main | Send message to OpenCode |
| `vibeos:abort` | renderer → main | Abort current response |
| `vibeos:reset` | renderer → main | Reset session |
| `vibeos:event` | main → renderer | SSE events from OpenCode |
| `vibeos:status` | main → renderer | Connection status updates |

## Resources

- [Official Documentation](https://www.electronjs.org/docs/latest/)
- [API Reference](https://www.electronjs.org/docs/latest/api/app)
- [Security Checklist](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron Fiddle](https://www.electronjs.org/fiddle) - Playground for experimentation
- [Electron Forge](https://electronforge.io) - Build tooling
