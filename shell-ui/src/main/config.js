/**
 * Configuration and constants for VibeOS Shell UI
 */

// File-based command signal for external communication (e.g., from beta.html)
const COMMAND_SIGNAL_FILE = '/tmp/vibeos-command';

// Icon/Taskbar constants
const ICON_SIZE = 56;
const ICON_PADDING = 8;
const TASKBAR_HEIGHT = 64;

// Application configuration
const config = {
  terminal: process.env.VIBEOS_TERMINAL || 'xfce4-terminal',
  opencodeUrl: process.env.OPENCODE_URL || 'http://127.0.0.1:4096',
  showDevTools: process.env.VIBEOS_DEV === '1'
};

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

module.exports = {
  COMMAND_SIGNAL_FILE,
  ICON_SIZE,
  ICON_PADDING,
  TASKBAR_HEIGHT,
  config,
  safeLog,
  safeError
};
