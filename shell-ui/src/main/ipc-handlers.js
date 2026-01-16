/**
 * IPC Handlers
 * Registers all IPC handlers for communication with renderer processes
 */

const { ipcMain } = require('electron');
const { config, safeLog, safeError } = require('./config');
const { 
  waitForServer, 
  getOrCreateSession, 
  getSessionMessages, 
  abortSession,
  deleteSession,
  createSession,
  opencodeRequest
} = require('./api-client');
const { subscribeToEvents, setExpectingLocalResponse, getConnectionStatus } = require('./sse-handler');
const { getMainWindow, toggleMainWindow } = require('./window-manager');
const { launchApp, launchTerminal, parseInput } = require('./launcher');
const { focusWindowById, closeWindowById } = require('./polling');

let currentSessionId = null;

/**
 * Get the current session ID
 */
function getCurrentSessionId() {
  return currentSessionId;
}

/**
 * Set the current session ID
 */
function setCurrentSessionId(id) {
  currentSessionId = id;
}

/**
 * Reset the desktop session
 */
async function resetDesktopSession() {
  const { closeEventSource } = require('./sse-handler');
  
  safeLog('Resetting desktop session...');
  
  // 1. Close existing SSE connection
  closeEventSource();
  
  // 2. Try to delete existing desktop session
  if (currentSessionId) {
    await abortSession(currentSessionId).catch(() => {});
    await deleteSession(currentSessionId);
  }
  
  // 3. Find and delete any other "desktop" sessions
  try {
    const sessions = await opencodeRequest('GET', '/session');
    for (const session of sessions) {
      if (session.title === 'desktop') {
        await deleteSession(session.id);
      }
    }
  } catch (e) {
    safeLog('Error cleaning up sessions:', e.message);
  }
  
  // 4. Create a fresh desktop session
  const newSession = await createSession('desktop');
  currentSessionId = newSession.id;
  safeLog(`Created fresh desktop session: ${newSession.id}`);
  
  // 5. Re-subscribe to events
  subscribeToEvents();
  
  return { success: true, session: newSession, messages: [] };
}

/**
 * Register all IPC handlers
 */
function registerIpcHandlers() {
  // Initialize session on app start
  ipcMain.handle('init-session', async () => {
    try {
      const ready = await waitForServer();
      if (!ready) {
        return { success: false, error: 'OpenCode server not available' };
      }
      
      const session = await getOrCreateSession('desktop');
      currentSessionId = session.id;
      
      subscribeToEvents();
      
      const messages = await getSessionMessages(currentSessionId);
      
      return { success: true, session, messages };
    } catch (e) {
      safeError('Failed to initialize session:', e);
      return { success: false, error: e.message };
    }
  });

  // Submit user input
  ipcMain.handle('submit-input', async (event, input) => {
    const parsed = parseInput(input);
    
    switch (parsed.type) {
      case 'app':
        return { ...launchApp(parsed.app), type: 'app' };
      
      case 'shell':
        return { ...launchTerminal(parsed.command), type: 'shell' };
      
      case 'opencode':
        if (!currentSessionId) {
          return { success: false, error: 'No active session' };
        }
        try {
          // Mark that we're expecting a local response
          setExpectingLocalResponse(true);
          
          const response = await fetch(`${config.opencodeUrl}/session/${currentSessionId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              parts: [{ type: 'text', text: parsed.prompt }]
            })
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const result = await response.json();
          return { success: true, type: 'opencode', prompt: parsed.prompt, response: result };
        } catch (e) {
          safeError('Failed to send message:', e);
          return { success: false, error: e.message };
        }
      
      default:
        return { success: false, error: 'Empty input' };
    }
  });

  // Get conversation history
  ipcMain.handle('get-messages', async () => {
    safeLog('get-messages called, sessionId:', currentSessionId);
    if (!currentSessionId) {
      return { success: false, error: 'No active session' };
    }
    try {
      const messages = await getSessionMessages(currentSessionId);
      safeLog('get-messages returning', messages.length, 'messages');
      return { success: true, messages };
    } catch (e) {
      safeError('get-messages error:', e);
      return { success: false, error: e.message };
    }
  });

  // Abort current response
  ipcMain.handle('abort', async () => {
    if (!currentSessionId) {
      return { success: false, error: 'No active session' };
    }
    try {
      await abortSession(currentSessionId);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // Reset session
  ipcMain.handle('reset-session', async () => {
    try {
      const result = await resetDesktopSession();
      const mainWindow = getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('session-reset');
      }
      return result;
    } catch (e) {
      safeError('Failed to reset session:', e);
      return { success: false, error: e.message };
    }
  });

  // Get config for renderer
  ipcMain.handle('get-config', async () => {
    return config;
  });

  // Get current connection status
  ipcMain.handle('get-connection-status', () => {
    return getConnectionStatus();
  });

  // Toggle main window (from icon click)
  ipcMain.on('toggle-main-window', () => {
    toggleMainWindow();
  });

  // Focus window (from taskbar click)
  ipcMain.on('focus-window', (event, windowId) => {
    focusWindowById(windowId);
  });

  // Close window (from taskbar right-click or close button)
  ipcMain.on('close-window', (event, windowId) => {
    closeWindowById(windowId);
  });

  // Template Management
  // Note: Template list and selection is managed in renderer via localStorage
  // Main process just provides reload capability
  
  ipcMain.handle('get-templates', async () => {
    // This is handled client-side, but we can provide server-side templates too
    // For now, return empty - the renderer has the full list
    return [];
  });

  ipcMain.handle('get-selected-template', async () => {
    // Client-side localStorage handles this
    return 'default';
  });

  ipcMain.handle('set-template', async (event, templateId) => {
    try {
      // Reload the main window to apply new template
      const mainWindow = getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.reload();
      }
      return { success: true };
    } catch (e) {
      safeError('Failed to set template:', e);
      return { success: false, error: e.message };
    }
  });
}

module.exports = {
  registerIpcHandlers,
  getCurrentSessionId,
  setCurrentSessionId,
  resetDesktopSession
};
