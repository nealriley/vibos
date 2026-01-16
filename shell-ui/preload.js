/**
 * VibeOS Shell UI - Preload Script
 * 
 * This script runs in a privileged context and exposes a safe API
 * to the renderer process via contextBridge. It acts as the bridge
 * between the Electron main process and the web-based UI.
 * 
 * API exposed on window.vibeos:
 * 
 * Main Window API (index.html):
 *   - initSession()        Initialize OpenCode session on startup
 *   - submitInput(text)    Send user input (!app, $shell, or prompt)
 *   - getMessages()        Fetch conversation history
 *   - abort()              Stop current AI response generation
 *   - resetSession()       Clear session history and start fresh
 *   - getConfig()          Get application configuration
 *   - onOpencodeEvent(cb)  Subscribe to SSE events for streaming
 *   - onSessionReset(cb)   Subscribe to session reset events
 * 
 * Icon/Taskbar API (icon.html):
 *   - toggleMainWindow()   Show/hide the main conversation window
 *   - onWindowsUpdate(cb)  Subscribe to running window list changes
 *   - focusWindow(id)      Bring a window to front by wmctrl ID
 *   - closeWindow(id)      Close a window by wmctrl ID
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vibeos', {
  // ============================================================================
  // Main Window API - Used by index.html
  // ============================================================================
  
  /**
   * Initialize the OpenCode session
   * Waits for server to be ready, creates/resumes 'desktop' session
   * @returns {Promise<{success: boolean, session?: object, messages?: array, error?: string}>}
   */
  initSession: () => ipcRenderer.invoke('init-session'),
  
  /**
   * Submit user input for processing
   * Handles three input types:
   *   - !app     - Launch application (e.g., !firefox, !terminal)
   *   - $cmd     - Run shell command in new terminal window
   *   - text     - Send prompt to OpenCode AI
   * @param {string} input - User input string
   * @returns {Promise<{success: boolean, type: string, ...}>}
   */
  submitInput: (input) => ipcRenderer.invoke('submit-input', input),
  
  /**
   * Fetch all messages in the current session
   * @returns {Promise<{success: boolean, messages?: array, error?: string}>}
   */
  getMessages: () => ipcRenderer.invoke('get-messages'),
  
  /**
   * Abort the current AI response generation
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  abort: () => ipcRenderer.invoke('abort'),
  
  /**
   * Reset the session - clears all messages and starts fresh
   * @returns {Promise<{success: boolean, session?: object, messages?: array, error?: string}>}
   */
  resetSession: () => ipcRenderer.invoke('reset-session'),
  
  /**
   * Get application configuration
   * @returns {Promise<{terminal: string, opencodeUrl: string, showDevTools: boolean}>}
   */
  getConfig: () => ipcRenderer.invoke('get-config'),
  
  /**
   * Subscribe to OpenCode SSE events for real-time streaming
   * Events include: session.status, message.part.updated, session.idle
   * @param {function} callback - Called with event data object
   */
  onOpencodeEvent: (callback) => {
    ipcRenderer.on('opencode-event', (event, data) => callback(data));
  },
  
  /**
   * Remove all SSE event listeners (cleanup)
   */
  removeOpencodeEventListener: () => {
    ipcRenderer.removeAllListeners('opencode-event');
  },
  
  /**
   * Subscribe to session reset events (triggered by external commands)
   * @param {function} callback - Called when session is reset externally
   */
  onSessionReset: (callback) => {
    ipcRenderer.on('session-reset', () => callback());
  },
  
  // ============================================================================
  // Icon/Taskbar Window API - Used by icon.html
  // ============================================================================
  
  /**
   * Toggle main window visibility
   * Called when user clicks the V icon in the taskbar
   */
  toggleMainWindow: () => ipcRenderer.send('toggle-main-window'),
  
  /**
   * Subscribe to running window list updates
   * Main process polls wmctrl every second and sends updates
   * @param {function} callback - Called with array of window objects
   *   Each window: {id, pid, x, y, width, height, class, title}
   */
  onWindowsUpdate: (callback) => {
    ipcRenderer.on('windows-update', (event, data) => callback(data));
  },
  
  /**
   * Focus (activate) a window by its wmctrl ID
   * @param {string} windowId - Hex window ID (e.g., "0x04000007")
   */
  focusWindow: (windowId) => ipcRenderer.send('focus-window', windowId),
  
  /**
   * Close a window gracefully by its wmctrl ID
   * @param {string} windowId - Hex window ID (e.g., "0x04000007")
   */
  closeWindow: (windowId) => ipcRenderer.send('close-window', windowId)
});
