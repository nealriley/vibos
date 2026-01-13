# VibeOS Components

Detailed documentation for each component in the VibeOS system.

## Table of Contents

1. [Shell UI (Electron App)](#shell-ui-electron-app)
2. [OpenCode Server](#opencode-server)
3. [Supervisor Configuration](#supervisor-configuration)
4. [Openbox Window Manager](#openbox-window-manager)
5. [Screenshot Tool](#screenshot-tool)
6. [Helper Scripts](#helper-scripts)

---

## Shell UI (Electron App)

The shell UI is an Electron application that provides a conversation interface connected to the OpenCode server.

### Location

```
/home/vibe/shell-ui/
├── main.js         # Main process - OpenCode client, SSE, IPC
├── index.html      # Renderer - Conversation UI
├── preload.js      # IPC bridge
└── package.json    # Dependencies
```

### main.js - Main Process

The main process handles:

1. **OpenCode HTTP Client**: Sends messages, fetches history
2. **SSE Subscription**: Real-time event streaming via `eventsource` package
3. **Session Management**: Creates/reuses "desktop" session
4. **IPC Handlers**: Bridge between renderer and OpenCode API

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
  const url = `${config.opencodeUrl}/event`;
  eventSource = new EventSource(url);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleServerEvent(data);
  };
}

function handleServerEvent(event) {
  // Forward to renderer
  mainWindow.webContents.send('opencode-event', event);
}
```

**IPC Handlers**:
```javascript
ipcMain.handle('init-session', async () => {
  await waitForServer();
  const session = await getOrCreateSession('desktop');
  currentSessionId = session.id;
  subscribeToEvents();
  const messages = await getSessionMessages(currentSessionId);
  return { success: true, session, messages };
});

ipcMain.handle('submit-input', async (event, input) => {
  // Handle !app, $shell, or opencode prompts
  const parsed = parseInput(input);
  // ...
});

ipcMain.handle('get-messages', async () => {
  const messages = await getSessionMessages(currentSessionId);
  return { success: true, messages };
});
```

### index.html - Renderer

Single-page UI with embedded CSS and JavaScript.

#### State Management

```javascript
// Single source of truth
const MESSAGE_LIMIT = 10;
let allMessages = [];           // Server state cache
let displayedCount = MESSAGE_LIMIT;
let currentStreamingMessage = null;
let isWaitingForResponse = false;
```

#### Core Functions

**renderConversation()** - Renders conversation from server state:
```javascript
function renderConversation() {
  conversation.innerHTML = '';
  
  const startIndex = Math.max(0, allMessages.length - displayedCount);
  const messagesToShow = allMessages.slice(startIndex);
  
  // Add "Load more" button if needed
  if (startIndex > 0) {
    // ... add button
  }
  
  for (const msg of messagesToShow) {
    if (msg.info.role === 'user') {
      renderUserMessage(msg);
    } else if (msg.info.role === 'assistant') {
      renderAssistantMessage(msg);
    }
  }
}
```

**handleOpencodeEvent()** - Processes SSE events:
```javascript
function handleOpencodeEvent(event) {
  switch (event.type) {
    case 'session.status':
      // Handle busy/idle state
      break;
      
    case 'session.idle':
      // Refresh from server
      refreshFromServer();
      break;
      
    case 'message.part.updated':
      // Stream text updates
      updateStreamingMessage(event.properties.part);
      break;
  }
}
```

**refreshFromServer()** - Fetches and re-renders:
```javascript
async function refreshFromServer() {
  const result = await window.vibeos.getMessages();
  allMessages = result.messages;
  renderConversation();
}
```

#### Theme Colors

```css
:root {
  --bg-color: #0a0a0a;
  --surface-color: #1a1a1a;
  --border-color: #333;
  --text-color: #e0e0e0;
  --accent-color: #7c3aed;
  --success-color: #22c55e;
  --error-color: #ef4444;
}
```

### preload.js - IPC Bridge

Secure bridge between renderer and main process:

```javascript
contextBridge.exposeInMainWorld('vibeos', {
  initSession: () => ipcRenderer.invoke('init-session'),
  submitInput: (input) => ipcRenderer.invoke('submit-input', input),
  getMessages: () => ipcRenderer.invoke('get-messages'),
  abort: () => ipcRenderer.invoke('abort'),
  
  onOpencodeEvent: (callback) => {
    ipcRenderer.on('opencode-event', (event, data) => callback(data));
  }
});
```

---

## OpenCode Server

Headless AI backend providing HTTP API and SSE events.

### Configuration

**Location**: `/home/vibe/.opencode/opencode.json`

```json
{
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
| `message.updated` | `{info: {id, role, ...}}` | Message metadata |
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

#### OpenCode Server (Priority 50)

```ini
[program:opencode]
command=opencode serve --port 4096 --hostname 0.0.0.0
user=vibe
directory=/home/vibe
autostart=true
autorestart=true
priority=50
environment=HOME="/home/vibe",USER="vibe"
```

#### Xvfb (Priority 100)

```ini
[program:xvfb]
command=/usr/bin/Xvfb :0 -screen 0 %(ENV_RESOLUTION)sx24
user=root
autostart=true
autorestart=true
priority=100
```

#### Openbox (Priority 150)

```ini
[program:openbox]
command=/usr/bin/openbox-session
user=vibe
autostart=true
autorestart=true
priority=150
environment=HOME="/home/vibe",USER="vibe",DISPLAY=":0"
```

#### x11vnc (Priority 200)

```ini
[program:x11vnc]
command=/usr/bin/x11vnc -display :0 -nopw -forever -shared -rfbport 5900 -noshm
user=root
autostart=true
autorestart=true
priority=200
```

#### noVNC (Priority 300)

```ini
[program:novnc]
command=websockify --web=/opt/novnc/ 6080 localhost:5900
user=vibe
autostart=true
autorestart=true
priority=300
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
| Super+Return | Open terminal |
| Super+B | Open browser |
| Super+Space | Toggle shell (if registered) |
| Alt+F4 | Close window |
| Alt+Tab | Cycle windows |

---

## Screenshot Tool

Desktop capture utility.

### Location

```
/home/vibe/scripts/screenshot.sh
```

### Usage

```bash
# Auto-named with timestamp
/home/vibe/scripts/screenshot.sh

# Custom filename
/home/vibe/scripts/screenshot.sh myshot.png
```

### Implementation

```bash
#!/bin/bash
set -euo pipefail

SHARED_DIR="/home/vibe/shared"
FILENAME="${1:-screenshot-$(date +%Y%m%d-%H%M%S).png}"

# Ensure .png extension
if [[ "$FILENAME" != *.png ]]; then
    FILENAME="${FILENAME}.png"
fi

OUTPUT="$SHARED_DIR/$FILENAME"
mkdir -p "$SHARED_DIR"
export DISPLAY=:0

scrot "$OUTPUT"
echo "$OUTPUT"
```

---

## Helper Scripts

Host-side utilities for interacting with VibeOS.

### vibeos-send

Send messages to the desktop session:

```bash
./scripts/vibeos-send "What is 2+2?"
./scripts/vibeos-send "Open Chrome and go to github.com"
```

**Implementation**:
```bash
#!/bin/bash
HOST="${VIBEOS_HOST:-localhost}"
PORT="${VIBEOS_PORT:-4096}"
SESSION_NAME="${VIBEOS_SESSION:-desktop}"

# Find session by name
SESSION_ID=$(curl -s "http://${HOST}:${PORT}/session" | \
  jq -r ".[] | select(.title == \"${SESSION_NAME}\") | .id")

# Send message
curl -X POST "http://${HOST}:${PORT}/session/${SESSION_ID}/message" \
  -H "Content-Type: application/json" \
  -d "{\"parts\": [{\"type\": \"text\", \"text\": \"$MESSAGE\"}]}"
```

### vibeos-screenshot

Capture desktop from host:

```bash
./scripts/vibeos-screenshot                    # Auto-named
./scripts/vibeos-screenshot custom-name.png   # Custom name
```

**Implementation**:
```bash
#!/bin/bash
CONTAINER="${VIBEOS_CONTAINER:-vibeos-dev}"
FILENAME="${1:-}"

if [ -n "$FILENAME" ]; then
    OUTPUT=$(docker exec "$CONTAINER" /home/vibe/scripts/screenshot.sh "$FILENAME")
else
    OUTPUT=$(docker exec "$CONTAINER" /home/vibe/scripts/screenshot.sh)
fi

echo "Screenshot saved: ./shared/$(basename $OUTPUT)"
```
