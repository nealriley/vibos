/**
 * Polling Services
 * Handles window list polling and command signal polling
 */

const { execSync } = require('child_process');
const fs = require('fs');
const { COMMAND_SIGNAL_FILE, safeLog, safeError } = require('./config');
const { getIconWindow, resizeTaskbar, toggleMainWindow, showMainWindow, hideMainWindow } = require('./window-manager');

let windowPollInterval = null;
let commandPollInterval = null;
let lastWindowList = [];
let onCommandCallback = null;

/**
 * Set callback for command signals
 * @param {Function} callback - Function to call with command name
 */
function setCommandCallback(callback) {
  onCommandCallback = callback;
}

/**
 * Get list of running X11 windows (excluding Electron windows)
 */
function getRunningWindows() {
  try {
    // Use wmctrl to get window list
    const output = execSync('wmctrl -l -G -p 2>/dev/null || echo ""', {
      encoding: 'utf8',
      env: { ...process.env, DISPLAY: ':0' }
    });
    
    if (!output.trim()) return [];
    
    const windows = [];
    const lines = output.trim().split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.split(/\s+/);
      if (parts.length < 8) continue;
      
      const winId = parts[0];
      const pid = parseInt(parts[2], 10);
      const x = parseInt(parts[3], 10);
      const y = parseInt(parts[4], 10);
      const width = parseInt(parts[5], 10);
      const height = parseInt(parts[6], 10);
      // Title is everything after field 7
      const title = parts.slice(8).join(' ');
      
      // Try to get window class
      let windowClass = 'unknown';
      try {
        windowClass = execSync(`xdotool getwindowclassname ${winId} 2>/dev/null || echo "unknown"`, {
          encoding: 'utf8',
          env: { ...process.env, DISPLAY: ':0' }
        }).trim();
      } catch (e) {
        // ignore
      }
      
      // Skip our own Electron windows
      if (windowClass === 'electron' || windowClass === 'Electron') continue;
      if (title === 'VibeOS' || title === 'VibeOS Icon') continue;
      
      windows.push({
        id: winId,
        pid,
        x, y, width, height,
        class: windowClass,
        title: title || windowClass
      });
    }
    
    return windows;
  } catch (e) {
    safeError('Failed to get window list:', e.message);
    return [];
  }
}

/**
 * Start polling for running windows
 */
function startWindowPolling() {
  if (windowPollInterval) return;
  
  windowPollInterval = setInterval(() => {
    const windows = getRunningWindows();
    
    // Only send update if window list changed
    const windowIds = windows.map(w => w.id).sort().join(',');
    const lastIds = lastWindowList.map(w => w.id).sort().join(',');
    
    if (windowIds !== lastIds) {
      lastWindowList = windows;
      
      // Resize taskbar to fit windows
      resizeTaskbar(windows.length);
      
      // Send to icon window
      const iconWindow = getIconWindow();
      if (iconWindow && !iconWindow.isDestroyed()) {
        iconWindow.webContents.send('windows-update', windows);
      }
      
      safeLog('Windows changed:', windows.length, 'windows');
    }
  }, 1000); // Poll every second
}

/**
 * Stop window polling
 */
function stopWindowPolling() {
  if (windowPollInterval) {
    clearInterval(windowPollInterval);
    windowPollInterval = null;
  }
}

/**
 * Start polling for command signals
 */
function startCommandPolling() {
  if (commandPollInterval) return;
  
  commandPollInterval = setInterval(async () => {
    try {
      if (!fs.existsSync(COMMAND_SIGNAL_FILE)) return;
      
      const command = fs.readFileSync(COMMAND_SIGNAL_FILE, 'utf8').trim();
      
      // Delete the file immediately to prevent re-processing
      fs.unlinkSync(COMMAND_SIGNAL_FILE);
      
      if (!command) return;
      
      safeLog('Received command signal:', command);
      
      // Handle built-in commands
      switch (command) {
        case 'show':
          showMainWindow();
          break;
        
        case 'hide':
          hideMainWindow();
          break;
        
        case 'toggle':
          toggleMainWindow();
          break;
        
        default:
          // Pass to external callback for custom commands (like 'reset')
          if (onCommandCallback) {
            await onCommandCallback(command);
          } else {
            safeLog('Unknown command signal:', command);
          }
      }
    } catch (e) {
      // Ignore errors (file may not exist or be locked)
      if (e.code !== 'ENOENT') {
        safeError('Command polling error:', e.message);
      }
    }
  }, 500); // Poll every 500ms
}

/**
 * Stop command polling
 */
function stopCommandPolling() {
  if (commandPollInterval) {
    clearInterval(commandPollInterval);
    commandPollInterval = null;
  }
}

/**
 * Focus a window by its ID
 */
function focusWindowById(windowId) {
  try {
    execSync(`xdotool windowactivate ${windowId}`, {
      env: { ...process.env, DISPLAY: ':0' }
    });
    return true;
  } catch (e) {
    safeError('Failed to focus window:', e.message);
    return false;
  }
}

/**
 * Close a window by its ID
 */
function closeWindowById(windowId) {
  try {
    execSync(`wmctrl -i -c ${windowId}`, {
      env: { ...process.env, DISPLAY: ':0' }
    });
    return true;
  } catch (e) {
    safeError('Failed to close window:', e.message);
    return false;
  }
}

/**
 * Stop all polling
 */
function stopAllPolling() {
  stopWindowPolling();
  stopCommandPolling();
}

module.exports = {
  setCommandCallback,
  getRunningWindows,
  startWindowPolling,
  stopWindowPolling,
  startCommandPolling,
  stopCommandPolling,
  stopAllPolling,
  focusWindowById,
  closeWindowById
};
