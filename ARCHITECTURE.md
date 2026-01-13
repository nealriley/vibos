# VibeOS Architecture

This document describes the system architecture, component interactions, data flow, and key design decisions of VibeOS.

## Overview

VibeOS is a containerized Linux desktop environment with an embedded AI conversation interface. It combines:

1. **OpenCode Server**: Headless AI backend exposing HTTP API and SSE events
2. **Electron Shell UI**: Conversation interface connected via HTTP/SSE
3. **X11 Display Stack**: Virtual display accessible via VNC/browser
4. **Remote Control**: HTTP API for external automation

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                              │
│                     http://localhost:6080/vnc.html                   │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │ WebSocket (VNC protocol)
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DOCKER CONTAINER                              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                        SUPERVISOR (PID 1)                       │ │
│  │                     Process Manager                             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│         │              │              │              │               │
│         ▼              ▼              ▼              ▼               │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │
│  │  OpenCode │  │   Xvfb    │  │  x11vnc   │  │   noVNC   │        │
│  │  Server   │  │ (Display) │  │  (VNC)    │  │ (Web UI)  │        │
│  │  :4096    │  │   :0      │  │  :5900    │  │  :6080    │        │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘        │
│        │              │              │              │                │
│        │              └──────────────┴──────────────┘                │
│        │                             │                               │
│        │  HTTP/SSE                   ▼                               │
│        │              ┌───────────────────────────────────┐         │
│        └─────────────►│     OPENBOX + ELECTRON SHELL      │         │
│                       │                                   │         │
│                       │  ┌─────────────────────────────┐ │         │
│                       │  │      Conversation UI        │ │         │
│                       │  │  - Prompt input             │ │         │
│                       │  │  - Message history          │ │         │
│                       │  │  - Streaming responses      │ │         │
│                       │  │  - Tool call display        │ │         │
│                       │  └─────────────────────────────┘ │         │
│                       └───────────────────────────────────┘         │
│                                      │                               │
│                                      ▼                               │
│                       ┌───────────────────────────────────┐         │
│                       │        DESKTOP APPS               │         │
│                       │  Chrome, Terminal, File Manager   │         │
│                       └───────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
        ▲                              ▲
        │ HTTP API (:4096)             │ VNC (:6080/:5900)
        │                              │
┌───────┴───────┐              ┌───────┴───────┐
│  Remote API   │              │    Browser    │
│    Client     │              │   (noVNC)     │
└───────────────┘              └───────────────┘
```

## Technology Stack

### Core Services

| Component | Technology | Port | Purpose |
|-----------|------------|------|---------|
| AI Backend | OpenCode Server | 4096 | Handles AI conversations, tool execution |
| Display | Xvfb | :0 | Virtual X11 framebuffer |
| Window Manager | Openbox | - | Minimal window management |
| VNC Server | x11vnc | 5900 | Exposes display over VNC |
| Web Client | noVNC 1.4.0 | 6080 | Browser-based VNC access |
| Process Manager | Supervisor | - | Service management (PID 1) |

### Application Layer

| Component | Technology | Purpose |
|-----------|------------|---------|
| Shell UI | Electron | Conversation interface |
| Browser | Google Chrome | Web browsing |
| Terminal | xfce4-terminal | Shell access |
| Screenshot | scrot | Desktop capture |

### Runtime

| Component | Version | Purpose |
|-----------|---------|---------|
| Base OS | Ubuntu 22.04 | Stable Linux distribution |
| Node.js | 22.x LTS | JavaScript runtime |
| Python | 3.10+ | websockify, system scripts |

## Component Details

### 1. OpenCode Server

The AI backend runs as a headless server, exposing:

- **HTTP API** (`/session`, `/session/:id/message`, etc.)
- **SSE Events** (`/event`) for real-time updates

**Configuration**: `/home/vibe/.opencode/opencode.json`
```json
{
  "permission": "allow"
}
```

This enables auto-approval of tool calls (bash, file edits, etc.) without user confirmation.

**Supervisor Config**:
```ini
[program:opencode]
command=opencode serve --port 4096 --hostname 0.0.0.0
user=vibe
directory=/home/vibe
environment=HOME="/home/vibe",USER="vibe"
priority=50
```

### 2. Electron Shell UI (Two-Window Architecture)

The conversation interface uses two windows to coexist with external applications:

**Location**: `/home/vibe/shell-ui/`

**Two-Window System**:
```
┌─────────────────────────────────────────────────────────┐
│                    main.js (Main Process)                │
│  - OpenCode HTTP client                                  │
│  - SSE event subscription (via 'eventsource' package)    │
│  - IPC handlers for renderer                             │
│  - Two-window management:                                │
│    • createIconWindow() - dock-style toggle button       │
│    • createWindow() - fullscreen conversation UI         │
│    • toggleMainWindow() - show/hide main window          │
└─────────────────────────────────────────────────────────┘
           │                              │
           │ IPC                          │ IPC
           ▼                              ▼
┌──────────────────────┐    ┌──────────────────────────────┐
│   icon.html          │    │      index.html              │
│   (Icon Window)      │    │      (Main Window)           │
│                      │    │                              │
│   64x64 pixels       │    │   Fullscreen                 │
│   Bottom-left        │    │   Conversation UI            │
│   Always on top      │    │   - Prompt input             │
│   Non-focusable      │    │   - Message history          │
│   Click → toggle     │    │   - Streaming responses      │
│                      │    │   - Tool call display        │
│   ┌────────────┐    │    │                              │
│   │     V      │    │    │   Can be hidden when         │
│   │            │    │    │   external apps are in use   │
│   └────────────┘    │    │                              │
└──────────────────────┘    └──────────────────────────────┘
```

**Icon Window Properties**:
- `width: 64, height: 64` - Small dock button
- `alwaysOnTop: true, level: 'screen-saver'` - Stays above all windows
- `focusable: false` - Never steals focus from other apps
- `skipTaskbar: true` - Doesn't appear in taskbar
- Position: Bottom-left corner (x: 10, y: screenHeight - 74)

**Behavior**:
| Action | Result |
|--------|--------|
| Click icon | Toggle main window visibility |
| `Super+Space` | Toggle main window visibility |
| `Escape` | Show main window if hidden |
| `!chrome` | Launch Chrome AND auto-hide main window |

**Why Two Windows?**
The main fullscreen window would cover external apps when clicked. By using a separate non-focusable icon window, users can:
1. Interact with external apps (Chrome, terminal, etc.) without the AI UI getting in the way
2. Click the icon to bring back the AI conversation whenever needed
3. The icon never steals focus, so external apps stay in front

### 3. Display Stack

**Xvfb** creates a virtual display:
```bash
/usr/bin/Xvfb :0 -screen 0 1920x1080x24
```

**x11vnc** exposes it over VNC:
```bash
/usr/bin/x11vnc -display :0 -nopw -forever -shared -rfbport 5900 -noshm
```

**noVNC** provides browser access via WebSocket:
```bash
websockify --web=/opt/novnc/ 6080 localhost:5900
```

### 4. Shared Folder

Data exchange between container and host:

| Location | Purpose |
|----------|---------|
| Host: `./shared/` | Mounted volume |
| Container: `/home/vibe/shared/` | Screenshots, exports |

## Data Flow

### Local User Input

```
1. User types in prompt input
2. submitPrompt() shows thinking indicator
3. POST /session/:id/message to OpenCode
4. SSE events stream back:
   - session.status: busy → show thinking
   - message.part.updated → stream text to UI
   - session.idle → refreshFromServer()
5. renderConversation() displays final state
```

### Remote API Call

```
1. External client POSTs to /session/:id/message
2. OpenCode processes request
3. SSE events broadcast to all subscribers
4. Shell UI receives events via EventSource
5. UI updates in real-time (same as local)
```

### Screenshot Flow

```
1. User/script calls /home/vibe/scripts/screenshot.sh
2. scrot captures display :0
3. Image saved to /home/vibe/shared/
4. Host accesses via mounted ./shared/ folder
```

## UI State Management

### Single Source of Truth

The conversation UI uses a simplified state model:

```javascript
// Server state is authoritative
let allMessages = [];        // Cached from server
let displayedCount = 10;     // Show last N messages

// On any state change
async function refreshFromServer() {
  const result = await window.vibeos.getMessages();
  allMessages = result.messages;
  renderConversation();  // Full re-render
}
```

### Streaming Updates

During active responses, SSE events update the UI in real-time:

```javascript
case 'message.part.updated':
  // Create/update streaming message element
  if (!currentStreamingMessage) {
    currentStreamingMessage = createMessageElement();
  }
  // Update text content
  textEl.innerHTML = parseMarkdown(part.text);
  break;

case 'session.idle':
  // Conversation complete - refresh from server
  refreshFromServer();
  break;
```

### Event Types

| Event | Purpose |
|-------|---------|
| `session.status` | busy/idle state changes |
| `session.idle` | Conversation complete, trigger refresh |
| `message.part.updated` | Streaming text/tool updates |
| `message.updated` | Message metadata changes |

## Security Considerations

### Container Isolation

- **Electron sandbox disabled**: Container provides isolation
- **seccomp unconfined**: Required for Electron syscalls
- **No VNC password**: Designed for local development

### API Security

- **OpenCode server**: Binds to 0.0.0.0:4096 (accessible from host)
- **Auto-approve**: All tool calls approved without confirmation
- **No authentication**: Add OPENCODE_SERVER_PASSWORD for production

### Recommendations for Production

1. Set VNC password: Add `-passwd` flag to x11vnc
2. Enable OpenCode auth: Set OPENCODE_SERVER_PASSWORD
3. Restrict network: Use Docker network isolation
4. Read-only mounts: Use `:ro` for shell-ui volume

## Resource Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 2GB | 4GB+ |
| Shared Memory | 2GB | 2GB |
| CPU | 2 cores | 4 cores |
| Disk | 4GB | 8GB+ |

## File System Layout

```
/
├── opt/novnc/                    # noVNC 1.4.0 installation
├── home/vibe/
│   ├── .config/
│   │   ├── openbox/              # Window manager config
│   │   └── xfce4/terminal/       # Terminal theme
│   ├── .opencode/
│   │   └── opencode.json         # Auto-approve config
│   ├── shell-ui/                 # Electron app
│   ├── scripts/                  # Tools (screenshot.sh)
│   ├── shared/                   # Data exchange (mounted)
│   └── projects/                 # User projects (mounted)
├── etc/supervisor/conf.d/
│   └── supervisord.conf          # Service definitions
└── var/log/supervisor/           # Service logs
```

## Logging

| Log File | Content |
|----------|---------|
| `/var/log/supervisor/opencode.log` | AI server output |
| `/var/log/supervisor/openbox.log` | Shell UI (Electron) stdout |
| `/var/log/supervisor/openbox.err` | Shell UI stderr |
| `/var/log/supervisor/x11vnc.log` | VNC server |
| `/var/log/supervisor/novnc.log` | WebSocket proxy |

**View logs**:
```bash
docker exec vibeos-dev tail -f /var/log/supervisor/opencode.log
docker exec vibeos-dev tail -f /var/log/supervisor/openbox.log
```

## Future Considerations

### Planned Improvements

1. **Authentication**: Add proper auth for remote API access
2. **Session persistence**: Save/restore conversation history
3. **Multi-session**: Support multiple concurrent sessions
4. **Wayland**: Replace X11 with Wayland for modern display protocol

### Extension Points

- **Custom tools**: Add scripts to `/home/vibe/scripts/`
- **MCP servers**: Install additional MCP tool servers
- **UI themes**: Modify CSS in index.html
- **Keyboard shortcuts**: Edit openbox/rc.xml
