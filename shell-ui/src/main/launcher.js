/**
 * Application Launcher
 * Handles launching applications and terminal commands
 */

const { spawn } = require('child_process');
const { config, safeLog } = require('./config');
const { getMainWindow, hideMainWindow } = require('./window-manager');

// Application aliases mapping
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

/**
 * Get the executable name for an app alias
 */
function getAppExecutable(appName) {
  return apps[appName.toLowerCase()] || appName;
}

/**
 * Launch an application by name or alias
 */
function launchApp(appName) {
  const executable = getAppExecutable(appName);
  
  safeLog(`Launching app: ${executable}`);
  
  const proc = spawn(executable, [], {
    detached: true,
    stdio: 'ignore'
  });
  
  proc.unref();
  
  // AUTO-HIDE: Hide main window when launching external app
  const mainWindow = getMainWindow();
  if (mainWindow && mainWindow.isVisible()) {
    setTimeout(() => {
      const currentMainWindow = getMainWindow();
      if (currentMainWindow && currentMainWindow.isVisible()) {
        hideMainWindow();
        safeLog('Main window auto-hidden after app launch');
      }
    }, 300);
  }
  
  return { success: true, app: executable };
}

/**
 * Launch a terminal with a command
 */
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

/**
 * Parse user input and determine command type
 */
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

module.exports = {
  apps,
  getAppExecutable,
  launchApp,
  launchTerminal,
  parseInput
};
