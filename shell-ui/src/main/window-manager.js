/**
 * Window Manager
 * Handles creation and management of main and icon windows
 */

const { BrowserWindow, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { ICON_SIZE, ICON_PADDING, TASKBAR_HEIGHT, config, safeLog } = require('./config');

let mainWindow = null;
let iconWindow = null;

/**
 * Get the main window instance
 */
function getMainWindow() {
  return mainWindow;
}

/**
 * Get the icon window instance
 */
function getIconWindow() {
  return iconWindow;
}

/**
 * Create the main conversation window
 */
function createMainWindow() {
  const { bounds } = screen.getPrimaryDisplay();

  mainWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    transparent: false,
    alwaysOnTop: false,
    fullscreen: true,
    backgroundColor: '#09090b',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', '..', 'preload.js')
    }
  });

  mainWindow.setMenuBarVisibility(false);

  // Load the built React app from dist/, fallback to index.html for dev
  const distIndex = path.join(__dirname, '..', '..', 'dist', 'index.html');
  if (fs.existsSync(distIndex)) {
    mainWindow.loadFile(distIndex);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', '..', 'index.html'));
  }

  // Some Linux WMs ignore fullscreen hints on first map; enforce it after paint.
  mainWindow.once('ready-to-show', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.setBounds(bounds);
    mainWindow.setFullScreen(true);
    mainWindow.show();
  });
  
  if (config.showDevTools) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

/**
 * Create the icon window (dock-style, always visible)
 */
function createIconWindow() {
  const { height } = screen.getPrimaryDisplay().size;
  
  iconWindow = new BrowserWindow({
    width: ICON_SIZE + ICON_PADDING * 2,
    height: TASKBAR_HEIGHT,
    x: 10,
    y: height - TASKBAR_HEIGHT - 10,
    frame: false,
    transparent: false,
    backgroundColor: '#1a1a2e',
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    resizable: false,
    hasShadow: false,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', '..', 'preload.js')
    }
  });
  
  iconWindow.setVisibleOnAllWorkspaces(true);
  iconWindow.setAlwaysOnTop(true, 'screen-saver');
  iconWindow.loadFile(path.join(__dirname, '..', '..', 'icon.html'));
  
  // Ensure icon is visible and positioned correctly after loading
  iconWindow.webContents.on('did-finish-load', () => {
    const yPos = height - TASKBAR_HEIGHT - 10;
    iconWindow.setPosition(10, yPos);
    iconWindow.show();
    iconWindow.setAlwaysOnTop(true, 'screen-saver');
    safeLog('Icon window loaded, positioned at:', 10, yPos);
    
    // Send initial empty window list
    iconWindow.webContents.send('windows-update', []);
  });
  
  iconWindow.on('closed', () => {
    iconWindow = null;
  });
  
  safeLog('Icon window created, target position:', 10, height - TASKBAR_HEIGHT - 10);
  return iconWindow;
}

/**
 * Toggle main window visibility
 */
function toggleMainWindow() {
  if (!mainWindow) return;
  
  if (mainWindow.isVisible()) {
    mainWindow.hide();
    safeLog('Main window hidden');
  } else {
    mainWindow.show();
    mainWindow.focus();
    safeLog('Main window shown');
  }
  
  // Always ensure icon stays on top after any toggle
  if (iconWindow && !iconWindow.isDestroyed()) {
    iconWindow.setAlwaysOnTop(true, 'screen-saver');
  }
}

/**
 * Show the main window
 */
function showMainWindow() {
  if (mainWindow && !mainWindow.isVisible()) {
    mainWindow.show();
    mainWindow.focus();
  }
}

/**
 * Hide the main window
 */
function hideMainWindow() {
  if (mainWindow && mainWindow.isVisible()) {
    mainWindow.hide();
  }
}

/**
 * Resize the taskbar based on number of windows
 */
function resizeTaskbar(windowCount) {
  if (!iconWindow || iconWindow.isDestroyed()) return;
  
  // V icon + app icons
  const totalIcons = 1 + windowCount;
  const newWidth = (ICON_SIZE * totalIcons) + (ICON_PADDING * (totalIcons + 1));
  
  const currentBounds = iconWindow.getBounds();
  if (currentBounds.width !== newWidth) {
    iconWindow.setBounds({
      x: currentBounds.x,
      y: currentBounds.y,
      width: newWidth,
      height: TASKBAR_HEIGHT
    });
    safeLog('Taskbar resized to:', newWidth, 'for', windowCount, 'windows');
  }
}

/**
 * Check if main window exists and is not destroyed
 */
function isMainWindowValid() {
  return mainWindow && !mainWindow.isDestroyed();
}

/**
 * Check if icon window exists and is not destroyed
 */
function isIconWindowValid() {
  return iconWindow && !iconWindow.isDestroyed();
}

module.exports = {
  getMainWindow,
  getIconWindow,
  createMainWindow,
  createIconWindow,
  toggleMainWindow,
  showMainWindow,
  hideMainWindow,
  resizeTaskbar,
  isMainWindowValid,
  isIconWindowValid
};
