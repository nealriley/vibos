# VibeOS Components

Detailed documentation for each component in the VibeOS system.

## Table of Contents

1. [Shell UI (Electron + React App)](#shell-ui-electron--react-app)
2. [OpenCode Server](#opencode-server)
3. [Supervisor Configuration](#supervisor-configuration)
4. [Openbox Window Manager](#openbox-window-manager)
5. [Automation Tools](#automation-tools)
6. [Helper Scripts](#helper-scripts)

---

## Shell UI (Electron + React App)

The shell UI is an Electron application with a React + TypeScript frontend that provides a conversation interface connected to the OpenCode server.

### Location

```
/home/vibe/shell-ui/
├── main.js              # Electron main process
├── preload.js           # IPC bridge (contextBridge)
├── icon.html            # Taskbar dock UI (vanilla JS)
├── index.html           # Vite entry point
├── dist/                # Built React app
│   ├── index.html
│   └── assets/
├── src/                 # React source code
│   ├── main.tsx         # React entry point
│   ├── App.tsx          # Root component
│   ├── components/      # UI components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities
│   ├── types/           # TypeScript definitions
│   └── styles/          # CSS
├── package.json         # Dependencies
├── vite.config.ts       # Vite build config
└── tsconfig.json        # TypeScript config
```

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Electron | 33.x | Desktop framework |
| React | 18.3.x | UI framework |
| TypeScript | 5.6.x | Type safety |
| Vite | 6.x | Build tool |
| Tailwind CSS | 4.x | Styling |
| Motion | 12.x | Animations (Framer Motion) |
| Radix UI | Various | Accessible primitives |

### Two-Window Architecture

The shell UI uses two windows to coexist with external applications:

```
┌─────────────────────────────────────────────────────────┐
│                    main.js (Main Process)                │
│  - OpenCode HTTP client                                  │
│  - SSE event subscription                                │
│  - IPC handlers                                          │
│  - Window management                                     │
│  - Window/command polling                                │
└─────────────────────────────────────────────────────────┘
           │                              │
           │ IPC                          │ IPC
           ▼                              ▼
┌──────────────────────┐    ┌──────────────────────────────┐
│   icon.html          │    │      React App (dist/)       │
│   (Icon Window)      │    │      (Main Window)           │
│                      │    │                              │
│   64x64 pixels       │    │   Fullscreen                 │
│   Bottom-left        │    │   Conversation UI            │
│   Always on top      │    │   - Message feed             │
│   Non-focusable      │    │   - Streaming responses      │
│   Shows running apps │    │   - Tool call display        │
└──────────────────────┘    └──────────────────────────────┘
```

**Icon Window Properties**:
- `width: 64, height: 64` - Small dock button
- `alwaysOnTop: true` - Stays above all windows
- `focusable: false` - Never steals focus
- `skipTaskbar: true` - Doesn't appear in taskbar
- Dynamically resizes to show running application icons

**Main Window Properties**:
- `fullscreen: true, frame: false` - Borderless fullscreen
- `backgroundColor: '#09090b'` - Dark background
- Toggle visibility with `Super+Space` or clicking icon

### main.js - Main Process

The main process (~900 lines) handles:

1. **Window Management**: Creates and manages icon/main windows
2. **OpenCode HTTP Client**: Session management, message sending
3. **SSE Subscription**: Real-time event streaming via `eventsource` package
4. **IPC Handlers**: Bridge between renderer and OpenCode API
5. **Window Polling**: Monitors X11 windows for taskbar updates
6. **Command Polling**: Watches `/tmp/vibeos-command` for external signals

#### Key Functions

**OpenCode API Client**:
```javascript
const config = {
  opencodeUrl: process.env.OPENCODE_URL || 'http://127.0.0.1:4096'
};

async function opencodeRequest(method, endpoint, body = null) {
  const url = `${config.opencodeUrl}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null
  });
  return response.json();
}
```

**Session Management**:
```javascript
async function getOrCreateSession(title = 'desktop') {
  const existing = await findSessionByTitle(title);
  if (existing) return existing;
  return await createSession(title);
}
```

**SSE Event Subscription**:
```javascript
const EventSource = require('eventsource');

function subscribeToEvents() {
  eventSource = new EventSource(`${config.opencodeUrl}/event`);
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleServerEvent(data);
  };
  eventSource.onerror = () => setTimeout(subscribeToEvents, 3000);
}
```

**External Message Detection**:
```javascript
// Detects messages from API (not local UI) by tracking expected responses
let expectingLocalResponse = false;

function handleServerEvent(event) {
  if (event.type === 'message.created' && event.properties?.info?.role === 'user') {
    event.isExternal = !expectingLocalResponse;
  }
  mainWindow.webContents.send('opencode-event', event);
}
```

### preload.js - IPC Bridge

Secure bridge between renderer and main process using `contextBridge`:

```javascript
contextBridge.exposeInMainWorld('vibeos', {
  // Session management
  initSession: () => ipcRenderer.invoke('init-session'),
  submitInput: (input) => ipcRenderer.invoke('submit-input', input),
  getMessages: () => ipcRenderer.invoke('get-messages'),
  abort: () => ipcRenderer.invoke('abort'),
  resetSession: () => ipcRenderer.invoke('reset-session'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  
  // Event subscriptions
  onOpencodeEvent: (callback) => {
    ipcRenderer.on('opencode-event', (event, data) => callback(data));
  },
  removeOpencodeEventListener: () => {
    ipcRenderer.removeAllListeners('opencode-event');
  },
  onSessionReset: (callback) => {
    ipcRenderer.on('session-reset', callback);
  },
  
  // Window control (for icon.html)
  toggleMainWindow: () => ipcRenderer.send('toggle-main-window'),
  onWindowsUpdate: (callback) => {
    ipcRenderer.on('windows-update', (event, windows) => callback(windows));
  },
  focusWindow: (windowId) => ipcRenderer.send('focus-window', windowId),
  closeWindow: (windowId) => ipcRenderer.send('close-window', windowId)
});
```

### React Application (src/)

#### Component Hierarchy

```
App.tsx (Root)
├── Loading Overlay (AnimatePresence)
├── Welcome Screen (empty state)
├── Message Feed
│   └── Message.tsx (Polymorphic dispatcher)
│       ├── AIMessage.tsx
│       │   └── ToolCallDisplay (collapsible)
│       └── UserMessage.tsx
│           ├── RegularUserMessage
│           ├── ShellMessage ($)
│           ├── AppMessage (!)
│           └── ExternalMessage (API)
├── Thinking Indicator
├── Input Area
│   ├── Auto-resizing Textarea
│   └── Send/Stop Button
└── Toaster (sonner)
```

#### Custom Hooks

**useSession** (`src/hooks/useSession.ts`):
Central state management for the conversation:
```typescript
interface UseSessionReturn {
  status: 'loading' | 'ready' | 'busy' | 'error'
  messages: Message[]
  error: string | null
  isStreaming: boolean
  streamingMessageId: string | null
  sendMessage: (input: string) => Promise<Result>
  abort: () => Promise<void>
  reset: () => Promise<void>
  updateStreamingPart: (part: MessagePart) => void
  isExternalMessage: (messageId: string) => boolean
}
```

**useSSE** (`src/hooks/useSSE.ts`):
Handles SSE event subscriptions with callbacks for different event types.

**useAutoFade** (`src/hooks/useAutoFade.ts`):
Time-based opacity fading for old messages (currently unused).

#### Message Types

The UI renders different styles based on message origin:

| Type | Prefix | Style |
|------|--------|-------|
| Regular | (none) | Right-aligned, violet accent |
| Shell | `$` | Left-aligned, terminal icon, emerald accent |
| App | `!` | Badge showing launched app, sky accent |
| External | API | Yellow accent, "API" badge, pulsing border |
| AI | - | Left-aligned, emerald accent, tool calls |

#### Utilities

**lib/api.ts**: Typed wrapper around `window.vibeos` IPC calls
**lib/cn.ts**: Class name utility (clsx + tailwind-merge)
**lib/markdown.ts**: Simple markdown-to-HTML parser
**lib/parseCommand.ts**: Input prefix parser (`!`, `$`)

### Build Process

```bash
# Install dependencies
cd shell-ui && npm install

# Build React app
npm run build:renderer  # Outputs to dist/

# Run in development
npm run dev:vite  # Vite dev server (standalone)
npm run dev       # Build + launch Electron

# Type checking
npm run typecheck
```

---

## OpenCode Server

Headless AI backend providing HTTP API and SSE events.

### Configuration

**Location**: `/home/vibe/.opencode/opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": "allow"
}
```

This enables auto-approval of all tool calls without user confirmation.

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/global/health` | Server health check |
| GET | `/session` | List all sessions |
| POST | `/session` | Create new session |
| GET | `/session/:id/message` | Get message history |
| POST | `/session/:id/message` | Send message |
| POST | `/session/:id/abort` | Abort current response |
| GET | `/event` | SSE event stream |

### SSE Events

| Event Type | Properties | Purpose |
|------------|------------|---------|
| `server.connected` | - | Initial connection |
| `session.status` | `{status: {type: "busy"/"idle"}}` | Session state |
| `session.idle` | `{sessionID}` | Conversation complete |
| `message.created` | `{info: {id, role, ...}}` | New message |
| `message.part.updated` | `{part: {type, text, ...}}` | Content streaming |

### Message Structure

```json
{
  "info": {
    "id": "msg_xxx",
    "sessionID": "ses_xxx",
    "role": "user" | "assistant",
    "time": {"created": 1234567890}
  },
  "parts": [
    {"type": "text", "text": "Hello"},
    {"type": "tool", "tool": "bash", "state": {...}}
  ]
}
```

---

## Supervisor Configuration

Process manager running as PID 1.

### Location

```
/etc/supervisor/conf.d/supervisord.conf
```

### Services

| Service | Priority | Port | User | Description |
|---------|----------|------|------|-------------|
| opencode | 50 | 4096 | vibe | AI backend (starts first) |
| xvfb | 100 | :0 | root | Virtual display |
| openbox | 150 | - | vibe | Window manager + shell-ui |
| x11vnc | 200 | 5900 | root | VNC server |
| novnc | 300 | 6080 | vibe | WebSocket proxy |

### Service Dependencies

```
Priority Order (lower = starts first):
50:  opencode  → Independent, starts early
100: xvfb      → Must be ready before WM
150: openbox   → Needs display, launches shell-ui via autostart
200: x11vnc    → Needs display and WM
300: novnc     → Needs VNC server
```

---

## Openbox Window Manager

Minimal window manager with keyboard shortcuts.

### Configuration Files

```
/home/vibe/.config/openbox/
├── rc.xml      # Keybindings, window rules
└── autostart   # Startup script
```

### Autostart Script

```bash
#!/bin/bash

# Set black background
xsetroot -solid '#0a0a0a' 2>/dev/null || true

# Disable screensaver
xset s off 2>/dev/null || true
xset -dpms 2>/dev/null || true

# Wait for display
sleep 2

# Launch Shell UI
cd /home/vibe/shell-ui
ELECTRON_DISABLE_SANDBOX=1 npm start &
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Super+Space | Toggle shell visibility |
| Super+Return | Open terminal |
| Super+B | Open Firefox |
| Super+Shift+R | Reset session (writes to /tmp/vibeos-command) |
| Alt+F4 | Close window |
| Alt+Tab | Cycle windows |
| Super+F | Toggle fullscreen |
| Super+M | Toggle maximize |
| Escape | Show main window (global) |

### Window Rules

| Application | Decorations | Behavior |
|-------------|-------------|----------|
| vibeos-shell | No | Fullscreen |
| Electron | No | Fullscreen |
| xfce4-terminal | Yes | Normal |
| Firefox/Chrome | Yes | Maximized |

---

## Automation Tools

Located in `/home/vibe/scripts/`.

### Master Tool

**window.sh** - Unified interface for all window operations:

```bash
/home/vibe/scripts/window.sh <command> [args...]
```

Commands: `list`, `focus`, `move`, `resize`, `close`, `maximize`, `minimize`, `screenshot`, `type`, `key`

### Individual Tools

| Script | Purpose | Example |
|--------|---------|---------|
| `windows-list.sh` | List windows (JSON) | `./windows-list.sh` |
| `window-focus.sh` | Focus by ID/class/title | `./window-focus.sh Firefox` |
| `window-move.sh` | Move to position | `./window-move.sh 0x123 100 100` |
| `window-resize.sh` | Resize window | `./window-resize.sh 0x123 800 600` |
| `window-close.sh` | Close gracefully | `./window-close.sh 0x123` |
| `window-maximize.sh` | Maximize/restore | `./window-maximize.sh 0x123` |
| `window-minimize.sh` | Minimize | `./window-minimize.sh 0x123` |
| `window-screenshot.sh` | Capture window | `./window-screenshot.sh 0x123 out.png` |
| `window-type.sh` | Type text | `./window-type.sh "Hello"` |
| `window-key.sh` | Send keystroke | `./window-key.sh Return` |
| `mouse-move.sh` | Move cursor | `./mouse-move.sh 500 300` |
| `mouse-click.sh` | Click | `./mouse-click.sh 500 300` |
| `mouse-location.sh` | Get position | `./mouse-location.sh` |
| `screen-info.sh` | Get dimensions | `./screen-info.sh` |
| `screenshot.sh` | Full desktop | `./screenshot.sh output.png` |
| `apps-list.sh` | List GUI apps | `./apps-list.sh` |

---

## Helper Scripts

Host-side utilities for interacting with VibeOS.

### vibeos-send

Send messages to the desktop session:

```bash
./scripts/vibeos-send "What is 2+2?"
./scripts/vibeos-send "Open Chrome and go to github.com"
echo "Hello" | ./scripts/vibeos-send
```

**Environment Variables**:
- `VIBEOS_HOST` - API host (default: localhost)
- `VIBEOS_PORT` - API port (default: 4096)
- `VIBEOS_SESSION` - Session name (default: desktop)

### vibeos-screenshot

Capture desktop from host:

```bash
./scripts/vibeos-screenshot                    # Auto-named
./scripts/vibeos-screenshot custom-name.png   # Custom name
```

**Environment Variables**:
- `VIBEOS_CONTAINER` - Container name (default: vibeos-dev)
