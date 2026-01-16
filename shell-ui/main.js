/**
 * VibeOS Shell UI - Main Process
 * 
 * Electron main process entry point.
 * Orchestrates the various modules for window management, API communication,
 * and IPC handling.
 */

const { app, BrowserWindow, globalShortcut } = require('electron');

// Disable sandbox for container environments
if (process.env.ELECTRON_DISABLE_SANDBOX === '1') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
}

// Import modules
const { safeLog } = require('./src/main/config');
const { 
  setEventCallback, 
  setConnectionStatusCallback,
  getConnectionStatus,
  subscribeToEvents, 
  closeEventSource 
} = require('./src/main/sse-handler');
const { 
  createMainWindow, 
  createIconWindow, 
  toggleMainWindow, 
  showMainWindow,
  getMainWindow,
  isMainWindowValid 
} = require('./src/main/window-manager');
const { 
  startWindowPolling, 
  startCommandPolling, 
  stopAllPolling,
  setCommandCallback 
} = require('./src/main/polling');
const { registerIpcHandlers, resetDesktopSession } = require('./src/main/ipc-handlers');

/**
 * Handle SSE events - forward to renderer
 */
function handleOpencodeEvent(event) {
  const mainWindow = getMainWindow();
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  
  try {
    mainWindow.webContents.send('opencode-event', event);
  } catch (e) {
    // Ignore send errors (window may be closing)
  }
}

/**
 * Handle connection status changes - forward to renderer
 */
function handleConnectionStatus(status) {
  const mainWindow = getMainWindow();
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  
  try {
    mainWindow.webContents.send('connection-status', status);
  } catch (e) {
    // Ignore send errors (window may be closing)
  }
}

/**
 * Handle command signals from external sources (e.g., beta.html)
 */
async function handleCommandSignal(command) {
  switch (command) {
    case 'reset':
      await resetDesktopSession();
      const mainWindow = getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('session-reset');
      }
      safeLog('Session reset via command signal');
      break;
    
    default:
      safeLog('Unknown command signal:', command);
  }
}

/**
 * Initialize the application
 */
function initializeApp() {
  // Set up SSE event forwarding
  setEventCallback(handleOpencodeEvent);
  
  // Set up connection status forwarding
  setConnectionStatusCallback(handleConnectionStatus);
  
  // Set up command signal handling
  setCommandCallback(handleCommandSignal);
  
  // Register IPC handlers
  registerIpcHandlers();
  
  // Create main conversation window
  createMainWindow();
  
  // Create icon window after main window (so it appears on top)
  setTimeout(() => {
    createIconWindow();
    startWindowPolling();
    startCommandPolling();
  }, 500);
  
  // Register global shortcuts
  globalShortcut.register('Super+Space', () => {
    toggleMainWindow();
  });
  
  globalShortcut.register('Escape', () => {
    if (!isMainWindowValid()) return;
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isVisible()) {
      showMainWindow();
    }
  });
}

/**
 * Clean up resources
 */
function cleanup() {
  globalShortcut.unregisterAll();
  stopAllPolling();
  closeEventSource();
}

// ============================================================================
// App Lifecycle
// ============================================================================

app.whenReady().then(() => {
  initializeApp();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      initializeApp();
    }
  });
});

app.on('window-all-closed', () => {
  cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  cleanup();
});
