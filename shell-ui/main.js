const { app, BrowserWindow, ipcMain, globalShortcut, screen } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const EventSource = require('eventsource');

// Disable sandbox for container environments
if (process.env.ELECTRON_DISABLE_SANDBOX === '1') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
}

let mainWindow = null;
let iconWindow = null;
let currentSessionId = null;
let eventSource = null;
let windowPollInterval = null;
let commandPollInterval = null;
let lastWindowList = [];

// Track whether we're expecting a local response (for external message detection)
let expectingLocalResponse = false;

// Safe logging that won't crash on EPIPE errors
function safeLog(...args) {
  try {
    console.log(...args);
  } catch (e) {
    // Ignore EPIPE and other write errors
  }
}

function safeError(...args) {
  try {
    console.error(...args);
  } catch (e) {
    // Ignore EPIPE and other write errors
  }
}

// File-based command signal for external communication (e.g., from beta.html)
const COMMAND_SIGNAL_FILE = '/tmp/vibeos-command';

// Configuration
const config = {
  terminal: process.env.VIBEOS_TERMINAL || 'xfce4-terminal',
  opencodeUrl: process.env.OPENCODE_URL || 'http://127.0.0.1:4096',
  showDevTools: process.env.VIBEOS_DEV === '1'
};

// ============================================================================
// OpenCode API Client
// ============================================================================

async function opencodeRequest(method, endpoint, body = null) {
  const url = `${config.opencodeUrl}${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`OpenCode API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function checkServerHealth() {
  try {
    const health = await opencodeRequest('GET', '/global/health');
    return health.healthy === true;
  } catch (e) {
    return false;
  }
}

async function waitForServer(maxAttempts = 30, intervalMs = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkServerHealth()) {
      safeLog('OpenCode server is ready');
      return true;
    }
    safeLog(`Waiting for OpenCode server... (${i + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  safeError('OpenCode server did not become ready');
  return false;
}

async function createSession(title = 'desktop') {
  const session = await opencodeRequest('POST', '/session', { title });
  return session;
}

async function findSessionByTitle(title) {
  const sessions = await opencodeRequest('GET', '/session');
  return sessions.find(s => s.title === title);
}

async function getOrCreateSession(title = 'desktop') {
  // Check if a session with this title already exists
  const existing = await findSessionByTitle(title);
  if (existing) {
    safeLog(`Found existing session: ${existing.id} (${title})`);
    return existing;
  }
  // Create a new session
  const session = await createSession(title);
  safeLog(`Created new session: ${session.id} (${title})`);
  return session;
}

async function sendMessage(sessionId, text, options = {}) {
  const body = {
    parts: [{ type: 'text', text }],
    ...options
  };
  
  const response = await opencodeRequest('POST', `/session/${sessionId}/message`, body);
  return response;
}

async function getSessionMessages(sessionId) {
  return await opencodeRequest('GET', `/session/${sessionId}/message`);
}

async function abortSession(sessionId) {
  return await opencodeRequest('POST', `/session/${sessionId}/abort`);
}

async function deleteSession(sessionId) {
  // OpenCode may not have a DELETE endpoint, so we'll handle gracefully
  try {
    const url = `${config.opencodeUrl}/session/${sessionId}`;
    const response = await fetch(url, { method: 'DELETE' });
    // Accept 200, 204, or 404 (already deleted) as success
    return response.ok || response.status === 404;
  } catch (e) {
    safeLog('Delete session failed (may not be supported):', e.message);
    return false;
  }
}

async function resetDesktopSession() {
  safeLog('Resetting desktop session...');
  
  // 1. Close existing SSE connection
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  
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

// ============================================================================
// Server-Sent Events for streaming
// ============================================================================

function subscribeToEvents() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  
  const url = `${config.opencodeUrl}/event`;
  safeLog('Subscribing to OpenCode events:', url);
  
  // Use EventSource for SSE (more reliable than fetch-based approach)
  eventSource = new EventSource(url);
  
  eventSource.onopen = () => {
    safeLog('SSE connection opened');
  };
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleServerEvent(data);
    } catch (e) {
      // Silently ignore parse errors
    }
  };
  
  eventSource.onerror = () => {
    eventSource.close();
    eventSource = null;
    // Reconnect after a delay
    setTimeout(() => subscribeToEvents(), 3000);
  };
}

function handleServerEvent(event) {
  if (!mainWindow) {
    return;
  }
  
  // Check if this is a user message creation event
  // If we weren't expecting a local response, it's an external message
  if (event.type === 'message.created' && event.properties?.info?.role === 'user') {
    const isExternal = !expectingLocalResponse;
    expectingLocalResponse = false; // Reset the flag
    
    // Add isExternal flag to the event
    const enrichedEvent = {
      ...event,
      isExternal
    };
    
    try {
      mainWindow.webContents.send('opencode-event', enrichedEvent);
    } catch (e) {
      // Ignore send errors
    }
    return;
  }
  
  // Forward all other events to the renderer unchanged
  try {
    mainWindow.webContents.send('opencode-event', event);
  } catch (e) {
    // Ignore send errors (window may be closing)
  }
}

// ============================================================================
// Window List Polling (for taskbar)
// ============================================================================

const { execSync } = require('child_process');

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
      if (iconWindow && !iconWindow.isDestroyed()) {
        iconWindow.webContents.send('windows-update', windows);
      }
      
      safeLog('Windows changed:', windows.length, 'windows');
    }
  }, 1000); // Poll every second
}

function stopWindowPolling() {
  if (windowPollInterval) {
    clearInterval(windowPollInterval);
    windowPollInterval = null;
  }
}

// ============================================================================
// Command Signal Polling (for external communication from beta.html)
// ============================================================================

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
      
      // Handle commands
      switch (command) {
        case 'reset':
          await resetDesktopSession();
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('session-reset');
          }
          safeLog('Session reset via command signal');
          break;
        
        case 'show':
          if (mainWindow && !mainWindow.isVisible()) {
            mainWindow.show();
            mainWindow.focus();
          }
          break;
        
        case 'hide':
          if (mainWindow && mainWindow.isVisible()) {
            mainWindow.hide();
          }
          break;
        
        case 'toggle':
          toggleMainWindow();
          break;
        
        default:
          safeLog('Unknown command signal:', command);
      }
    } catch (e) {
      // Ignore errors (file may not exist or be locked)
      if (e.code !== 'ENOENT') {
        safeError('Command polling error:', e.message);
      }
    }
  }, 500); // Poll every 500ms
}

function stopCommandPolling() {
  if (commandPollInterval) {
    clearInterval(commandPollInterval);
    commandPollInterval = null;
  }
}

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

// ============================================================================
// Legacy App Launcher (for !app commands)
// ============================================================================

function launchApp(appName) {
  const apps = {
    'firefox': 'firefox',
    'ff': 'firefox',
    'chrome': 'google-chrome',
    'chromium': 'chromium',
    'browser': 'google-chrome',
    'files': 'pcmanfm',
    'filemanager': 'pcmanfm',
    'fm': 'pcmanfm',
    'editor': 'mousepad',
    'edit': 'mousepad',
    'text': 'mousepad',
    'notepad': 'mousepad',
    'terminal': config.terminal,
    'term': config.terminal,
    'code': 'code',
    'vscode': 'code'
  };

  const executable = apps[appName] || appName;
  
  safeLog(`Launching app: ${executable}`);
  
  const proc = spawn(executable, [], {
    detached: true,
    stdio: 'ignore'
  });
  
  proc.unref();
  
  // AUTO-HIDE: Hide main window when launching external app
  // This allows the user to interact with the launched app without
  // the main window getting in the way
  if (mainWindow && mainWindow.isVisible()) {
    // Small delay to let the app start before hiding
    setTimeout(() => {
      if (mainWindow && mainWindow.isVisible()) {
        mainWindow.hide();
        safeLog('Main window auto-hidden after app launch');
      }
    }, 300);
  }
  
  return { success: true, app: executable };
}

// Legacy terminal launcher (for $shell commands)
function launchTerminal(command) {
  const escapedCmd = command.replace(/'/g, "'\\''");
  let args;
  
  switch (config.terminal) {
    case 'xfce4-terminal':
      args = ['-e', `bash -c '${escapedCmd}; exec bash'`];
      break;
    case 'alacritty':
      args = ['-e', 'bash', '-c', `${escapedCmd}; exec bash`];
      break;
    case 'foot':
      args = ['-e', 'bash', '-c', `${escapedCmd}; exec bash`];
      break;
    default:
      args = ['-e', command];
  }
  
  safeLog(`Launching terminal: ${config.terminal} ${args.join(' ')}`);
  
  const proc = spawn(config.terminal, args, {
    detached: true,
    stdio: 'ignore'
  });
  
  proc.unref();
  return { success: true, command };
}

// ============================================================================
// Input Parsing
// ============================================================================

function parseInput(input) {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { type: 'none' };
  }

  // App launcher (! prefix)
  if (trimmed.startsWith('!')) {
    const appName = trimmed.slice(1).trim().toLowerCase();
    return { type: 'app', app: appName };
  }

  // Shell command ($ prefix)
  if (trimmed.startsWith('$')) {
    const cmd = trimmed.slice(1).trim();
    return { type: 'shell', command: cmd };
  }

  // Default: Send to OpenCode
  return { type: 'opencode', prompt: trimmed };
}

// ============================================================================
// Window Management
// ============================================================================

// Create the icon window (dock-style, always visible)
// Icon size constants
const ICON_SIZE = 56;  // Size of each icon
const ICON_PADDING = 8;  // Padding between icons
const TASKBAR_HEIGHT = 64;

function createIconWindow() {
  const { height } = screen.getPrimaryDisplay().size;  // Use size, not workAreaSize
  
  iconWindow = new BrowserWindow({
    // Note: type 'dock' may not work on all Linux WMs, using standard window with alwaysOnTop
    width: ICON_SIZE + ICON_PADDING * 2,  // Start with just the V icon
    height: TASKBAR_HEIGHT,
    x: 10,
    y: height - TASKBAR_HEIGHT - 10,
    frame: false,
    transparent: false,  // Disable transparency for better compatibility
    backgroundColor: '#1a1a2e',  // Dark background
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,  // Don't steal focus - critical for dock behavior
    resizable: false,
    hasShadow: false,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  iconWindow.setVisibleOnAllWorkspaces(true);
  iconWindow.setAlwaysOnTop(true, 'screen-saver');  // Highest priority level
  iconWindow.loadFile('icon.html');
  
  // Ensure icon is visible and positioned correctly after loading
  iconWindow.webContents.on('did-finish-load', () => {
    // Force position to bottom-left after load
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
}

// Resize the taskbar based on number of windows
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

// Toggle main window visibility
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

// Create the main conversation window
function createWindow() {
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
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.setMenuBarVisibility(false);

  // Load the built React app from dist/, fallback to index.html for dev
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(distIndex)) {
    mainWindow.loadFile(distIndex);
  } else {
    mainWindow.loadFile('index.html');
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
}

// ============================================================================
// IPC Handlers
// ============================================================================

// Initialize session on app start
ipcMain.handle('init-session', async () => {
  try {
    // Wait for server to be ready
    const ready = await waitForServer();
    if (!ready) {
      return { success: false, error: 'OpenCode server not available' };
    }
    
    // Get or create the "desktop" session
    const session = await getOrCreateSession('desktop');
    currentSessionId = session.id;
    
    // Subscribe to events for real-time updates
    subscribeToEvents();
    
    // Load existing messages if any
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
        // Mark that we're expecting a local response (for external message detection)
        expectingLocalResponse = true;
        
        // Send message to OpenCode synchronously and get response
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

// Reset session - clears history and starts fresh
ipcMain.handle('reset-session', async () => {
  try {
    const result = await resetDesktopSession();
    // Notify renderer to refresh
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

// ============================================================================
// App Lifecycle
// ============================================================================

app.whenReady().then(() => {
  // Create main conversation window first
  createWindow();
  
  // Create icon window after (so it appears on top)
  // Small delay to ensure main window is fully rendered
  setTimeout(() => {
    createIconWindow();
    // Start polling for running windows (for taskbar)
    startWindowPolling();
    // Start polling for external command signals
    startCommandPolling();
  }, 500);

  // Register global shortcut to toggle main window
  globalShortcut.register('Super+Space', () => {
    toggleMainWindow();
  });

  // Escape to show main window from anywhere
  globalShortcut.register('Escape', () => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      setTimeout(() => {
        createIconWindow();
        startWindowPolling();
        startCommandPolling();
      }, 500);
    }
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  stopWindowPolling();
  stopCommandPolling();
  if (eventSource) {
    eventSource.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  stopWindowPolling();
  stopCommandPolling();
  if (eventSource) {
    eventSource.close();
  }
});
