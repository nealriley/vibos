# Electron Global Launcher Research for Linux

## Original Brief

> In Electron (for Linux specifically), what capabilities do we have to make it easy for the Electron app to act as a "global" launcher, something that is 'embedded' into the desktop. My ideal outcome is have a set of windows - one that acts as an always-visible 'icon', probably in the lower-left corner of our window, which when pressed will activate our other window, a full screen experience when any other window is interacted with by the user (non-electron), our main full interface should disappear, only keeping our other window available. How would we accomplish this? what should we be researching?

---

## Executive Summary

Creating a global launcher in Electron for Linux is achievable but comes with significant platform-specific considerations, particularly around the X11 vs Wayland divide. The core requirements can be addressed using Electron's built-in window management APIs, though detecting focus loss to external applications requires additional tooling.

---

## Key Findings

### 1. Window Types on Linux

Electron supports special window types on Linux that map to X11 window hints. These are critical for creating launcher-style behavior:

```javascript
new BrowserWindow({
  type: 'dock',  // or 'desktop', 'toolbar', 'splash', 'notification'
  // ...
})
```

**Available Linux window types:**

| Type | Behavior |
|------|----------|
| `desktop` | Places window at desktop background level. Will NOT receive focus, keyboard, or mouse events. Can still use `globalShortcut` for input. |
| `dock` | Creates dock-like window behavior - ideal for your "always-visible icon" window |
| `toolbar` | Creates a window with toolbar appearance |
| `splash` | Not draggable, commonly used for splash screens |
| `notification` | Behaves like a system notification |

**Recommendation:** Use `type: 'dock'` for your persistent icon window.

---

### 2. Always-On-Top and Visibility

For the icon window to remain always visible:

```javascript
const iconWindow = new BrowserWindow({
  type: 'dock',
  alwaysOnTop: true,
  frame: false,
  transparent: true,
  skipTaskbar: true,
  focusable: false, // Critical for Linux - makes window non-interactive with WM
  width: 64,
  height: 64,
  x: 0,  // Lower-left positioning
  y: screen.getPrimaryDisplay().workAreaSize.height - 64,
})

iconWindow.setVisibleOnAllWorkspaces(true)
iconWindow.setAlwaysOnTop(true, 'screen-saver') // Highest level
```

**Critical Linux behavior:**
- Setting `focusable: false` on Linux makes the window **stop interacting with the window manager entirely**, causing it to stay on top across all workspaces automatically
- The `alwaysOnTop` option has known issues on some Linux distributions/WMs where it may not work reliably

---

### 3. Detecting Focus Loss (The Hard Part)

This is the most challenging aspect. Electron does not natively provide events for when **external** (non-Electron) windows gain focus. You have several options:

#### Option A: Use the `blur` event (Limited)

```javascript
mainWindow.on('blur', () => {
  // Fires when this window loses focus
  // BUT: May not fire reliably with alwaysOnTop on Linux
  // AND: Doesn't tell you if focus went to another app vs another Electron window
  if (!BrowserWindow.getFocusedWindow()) {
    // No Electron window has focus - likely external app
    mainWindow.hide()
  }
})
```

**Known Issue:** The blur event may not fire when `alwaysOnTop: true` on Ubuntu/Linux (GitHub issue #3222).

#### Option B: Use `electron-active-window` (Native Module)

A Node.js N-API native module that can detect the currently focused window across the entire OS:

```javascript
const activeWindows = require('electron-active-window')

setInterval(async () => {
  const result = await activeWindows().getActiveWindow()
  // result contains: windowTitle, windowClass, processId, etc.
  
  if (result.processId !== process.pid) {
    // External application has focus
    mainWindow.hide()
  }
}, 100) // Poll interval
```

**Note:** This module only works on X11 (not Wayland) and requires native compilation.

Repository: https://github.com/nullxx/electron-active-window

#### Option C: Use X11 Directly via `node-x11`

For maximum control, you can communicate directly with the X server:

```javascript
const x11 = require('x11')

x11.createClient((err, display) => {
  const X = display.client
  const root = display.screen[0].root
  
  // Subscribe to focus change events
  X.ChangeWindowAttributes(root, { eventMask: x11.eventMask.PropertyChange })
  
  X.on('event', (ev) => {
    if (ev.name === 'PropertyNotify') {
      // Check _NET_ACTIVE_WINDOW property
      // React to focus changes
    }
  })
})
```

---

### 4. Global Shortcuts for Activation

Use `globalShortcut` to toggle your launcher regardless of which app has focus:

```javascript
const { globalShortcut, app } = require('electron')

// For Wayland support, enable the portal
app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal')

app.whenReady().then(() => {
  globalShortcut.register('Super+Space', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
})
```

---

### 5. X11 vs Wayland Considerations

This is critical for Linux development:

| Feature | X11 | Wayland |
|---------|-----|---------|
| Window positioning | ✅ Full control | ❌ Limited/None |
| Always on top | ✅ Works | ⚠️ Depends on compositor |
| Focus detection | ✅ Via X11 APIs | ❌ Not possible |
| Programmatic focus | ✅ Works | ❌ May show notification instead |
| Global shortcuts | ✅ Works | ⚠️ Via portal only |
| Window types (dock, etc.) | ✅ Works | ⚠️ Limited support |

**Recommendation:** Force X11 mode for launcher functionality:
```bash
# Launch with Xwayland
electron --ozone-platform=x11 your-app
```

Or in code:
```javascript
app.commandLine.appendSwitch('ozone-platform', 'x11')
```

---

### 6. Recommended Architecture

```
┌─────────────────────────────────────────────────┐
│                  Main Process                    │
├─────────────────────────────────────────────────┤
│                                                  │
│   ┌─────────────┐       ┌──────────────────┐   │
│   │ Icon Window │       │   Main Window     │   │
│   │             │       │                   │   │
│   │ type: dock  │──────▶│ Full interface    │   │
│   │ focusable:  │ click │                   │   │
│   │   false     │       │ Hides on external │   │
│   │ alwaysOnTop │       │ focus loss        │   │
│   └─────────────┘       └──────────────────┘   │
│         │                        │              │
│         │                        │              │
│         ▼                        ▼              │
│   ┌──────────────────────────────────────┐     │
│   │         Focus Monitor Service         │     │
│   │  (electron-active-window or X11)      │     │
│   │                                        │     │
│   │  - Polls active window every 100ms    │     │
│   │  - Triggers mainWindow.hide() when    │     │
│   │    external app gets focus            │     │
│   └──────────────────────────────────────┘     │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

### 7. Sample Implementation

```javascript
const { app, BrowserWindow, screen, globalShortcut } = require('electron')
const path = require('path')

// Force X11 for better launcher support
app.commandLine.appendSwitch('ozone-platform', 'x11')

let iconWindow = null
let mainWindow = null

function createIconWindow() {
  const { height } = screen.getPrimaryDisplay().workAreaSize
  
  iconWindow = new BrowserWindow({
    type: 'dock',
    width: 64,
    height: 64,
    x: 10,
    y: height - 74,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'icon-preload.js')
    }
  })
  
  iconWindow.setVisibleOnAllWorkspaces(true)
  iconWindow.loadFile('icon.html')
  
  // Click handling via IPC since focusable: false
  // Use globalShortcut or mouse region detection
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'main-preload.js')
    }
  })
  
  mainWindow.loadFile('main.html')
  
  // Hide on blur (basic approach)
  mainWindow.on('blur', () => {
    if (!BrowserWindow.getFocusedWindow()) {
      mainWindow.hide()
    }
  })
}

function setupFocusMonitor() {
  // Using electron-active-window for robust external focus detection
  try {
    const activeWindows = require('electron-active-window')
    
    setInterval(async () => {
      if (!mainWindow.isVisible()) return
      
      const active = await activeWindows().getActiveWindow()
      if (active && active.processId !== process.pid) {
        mainWindow.hide()
      }
    }, 150)
  } catch (e) {
    console.warn('electron-active-window not available, using blur event only')
  }
}

function toggleMainWindow() {
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.focus()
  }
}

app.whenReady().then(() => {
  createIconWindow()
  createMainWindow()
  setupFocusMonitor()
  
  // Global hotkey to toggle
  globalShortcut.register('Super+Space', toggleMainWindow)
  
  // IPC from icon click
  const { ipcMain } = require('electron')
  ipcMain.on('icon-clicked', toggleMainWindow)
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
```

---

## Research Topics to Explore Further

1. **Desktop Environment Integration**
   - GNOME Shell extensions for better Wayland support
   - KDE Plasma specific APIs
   - Unity launcher integration

2. **Alternative Approaches**
   - System tray (Tray API) instead of dock window
   - D-Bus integration for Linux desktop notifications
   - libappindicator for better tray support on Ubuntu

3. **Native Modules**
   - `node-x11` for direct X11 protocol access
   - `node-gtk` for GTK integration
   - Custom N-API module for window management

4. **Packaging Considerations**
   - AppImage with X11 libraries bundled
   - Flatpak portal permissions
   - Snap confinement and X11 access

5. **Window Manager Compatibility**
   - Testing across GNOME, KDE, XFCE, i3, Sway
   - Handling different compositor behaviors

---

## Known Limitations

1. **Wayland restrictions** - Many features simply don't work on Wayland without falling back to XWayland
2. **`focusable: false` trade-off** - The icon window won't receive mouse events directly; need to use globalShortcut or region detection
3. **WM variability** - Behavior varies significantly across different Linux window managers
4. **Blur event unreliability** - May not fire consistently with `alwaysOnTop` on some systems
5. **Native module requirement** - Robust external focus detection requires `electron-active-window` which needs native compilation

---

## Conclusion

Your requirements are achievable on Linux with Electron, but require:

1. **Icon Window**: Use `type: 'dock'`, `focusable: false`, `alwaysOnTop: true`
2. **Main Window**: Standard window with `skipTaskbar: true`
3. **Focus Detection**: Use `electron-active-window` native module for reliable external focus detection
4. **Platform**: Target X11, either natively or via XWayland
5. **Activation**: Use `globalShortcut` and/or IPC from icon window

The biggest challenge is detecting when external applications gain focus, which requires either polling with a native module or accepting the limitations of the built-in `blur` event.