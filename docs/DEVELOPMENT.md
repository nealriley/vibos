# VibeOS Development Guide

Guide for developing, debugging, and extending VibeOS.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Building](#building)
3. [Running](#running)
4. [Using the Makefile](#using-the-makefile)
5. [Debugging](#debugging)
6. [Shell UI Development](#shell-ui-development)
7. [Adding Features](#adding-features)
8. [Troubleshooting](#troubleshooting)
9. [Testing](#testing)

---

## Development Setup

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Docker | 20.10+ | Container runtime |
| Node.js | 18+ | Local shell-ui development |
| Git | 2.x | Version control |
| jq | 1.6+ | JSON processing (for scripts) |
| Make | 3.x+ | Build automation (optional) |

### Clone and Build

```bash
git clone <repository-url>
cd vibeos

# Build Docker image
docker build -t vibeos .

# Or use make
make build
```

### Directory Structure

```
vibeos/
├── shell-ui/           # Electron app (main focus for UI dev)
│   ├── main.js         # Two-window management, OpenCode client, SSE
│   ├── index.html      # Main conversation UI
│   ├── icon.html       # Dock icon window
│   ├── preload.js      # IPC bridge
│   └── package.json
├── novnc/              # Custom VNC interface
│   └── beta.html       # VibeOS-branded VNC client
├── config/
│   ├── openbox/        # Window manager config
│   │   ├── rc.xml      # Keybindings
│   │   └── autostart   # Startup script
│   ├── supervisord.conf
│   └── opencode/       # Auto-approve settings
├── scripts/
│   ├── tools/          # In-container automation tools
│   ├── vibeos-send     # Remote message helper
│   └── vibeos-screenshot
├── shared/             # Data exchange (mounted volume)
└── Dockerfile
```

---

## Building

### Standard Build

```bash
docker build -t vibeos .
```

### Clean Build (No Cache)

```bash
docker build --no-cache -t vibeos .
```

### Quick Rebuild (After shell-ui changes)

If only shell-ui changed, Docker layer caching makes rebuilds fast:

```bash
docker build -t vibeos .  # ~30 seconds if base layers cached
```

### Build Arguments

```bash
# Custom resolution
docker build --build-arg RESOLUTION=1280x720 -t vibeos .
```

---

## Running

### Quick Start Script

```bash
./start.sh              # Build and run
./start.sh --build      # Force rebuild
./start.sh --stop       # Stop container
```

### Basic Run

```bash
docker run -d \
  --name vibeos-dev \
  -p 4096:4096 \
  -p 6080:6080 \
  -p 5900:5900 \
  -e RESOLUTION=1920x1080 \
  -v $(pwd)/shared:/home/vibe/shared \
  --shm-size=2g \
  --security-opt seccomp=unconfined \
  vibeos
```

### With API Key

```bash
docker run -d \
  --name vibeos-dev \
  -p 4096:4096 \
  -p 6080:6080 \
  -e ANTHROPIC_API_KEY=sk-ant-xxx \
  -v $(pwd)/shared:/home/vibe/shared \
  --shm-size=2g \
  --security-opt seccomp=unconfined \
  vibeos
```

### With DevTools Enabled

```bash
docker run -d \
  --name vibeos-dev \
  -e VIBEOS_DEV=1 \
  # ... other options
  vibeos
```

### Using Docker Compose

```bash
# Create .env file with API key
echo "ANTHROPIC_API_KEY=your-key" > .env

# Start
docker compose up -d

# Start with rebuild
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down
```

---

## Using the Makefile

The Makefile provides convenient shortcuts:

```bash
make help           # Show all available commands
make build          # Build the Docker image
make run            # Run the container
make dev            # Run with docker compose
make logs           # View container logs
make shell          # Root shell in container
make shell-user     # Shell as vibe user
make status         # Check service status
make restart        # Restart all services
make stop           # Stop and remove container
make clean          # Remove container and image
```

### Hot Reload Development

```bash
# Start with shell-ui mounted for live editing
make dev

# Edit shell-ui files locally
# Then restart the UI:
make restart-ui
```

---

## Debugging

### View Service Status

```bash
docker exec vibeos-dev supervisorctl status
```

Expected output:

```
novnc                            RUNNING   pid 20, uptime 0:05:23
openbox                          RUNNING   pid 18, uptime 0:05:24
opencode                         RUNNING   pid 15, uptime 0:05:25
x11vnc                           RUNNING   pid 19, uptime 0:05:24
xvfb                             RUNNING   pid 16, uptime 0:05:25
```

### View Logs

```bash
# OpenCode server
docker exec vibeos-dev tail -f /var/log/supervisor/opencode.log

# Shell UI (Electron main process)
docker exec vibeos-dev tail -f /var/log/supervisor/openbox.log

# Shell UI errors
docker exec vibeos-dev tail -f /var/log/supervisor/openbox.err

# VNC server
docker exec vibeos-dev tail -f /var/log/supervisor/x11vnc.log

# All logs
docker exec vibeos-dev tail -f /var/log/supervisor/*.log
```

### Check OpenCode API

```bash
# Health check
curl http://localhost:4096/global/health

# List sessions
curl http://localhost:4096/session | jq

# Get messages
SESSION_ID=$(curl -s http://localhost:4096/session | jq -r '.[0].id')
curl "http://localhost:4096/session/$SESSION_ID/message" | jq
```

### Test SSE Events

```bash
# Watch events for 10 seconds
timeout 10 curl -N http://localhost:4096/event
```

### Shell Access

```bash
# As root
docker exec -it vibeos-dev bash

# As vibe user
docker exec -it -u vibe vibeos-dev bash
```

### Take Screenshots for Debugging

```bash
./scripts/vibeos-screenshot debug.png
open shared/debug.png  # or: xdg-open shared/debug.png
```

---

## Shell UI Development

### Architecture Overview

```
main.js (Main Process)
    │
    ├── createWindow()          # Main conversation window
    ├── createIconWindow()      # Dock toggle button
    ├── OpenCode HTTP Client
    │   └── Fetch sessions, messages, send prompts
    ├── SSE Event Subscription
    │   └── EventSource connection to /event
    └── IPC Handlers
        └── init-session, submit-input, get-messages, abort

preload.js (Bridge)
    └── Exposes window.vibeos API

index.html (Main Renderer)
    ├── State: allMessages[], displayedCount, isWaitingForResponse
    ├── renderConversation() - Full re-render from state
    ├── handleOpencodeEvent() - Process SSE events
    └── Streaming updates for message.part.updated

icon.html (Icon Renderer)
    └── Click handler to toggle main window
```

### Key Design Decisions

1. **Two-Window Architecture**: Separate icon and main windows for dock-style UX
2. **Single Source of Truth**: Server state (`allMessages`) is authoritative
3. **Full Re-render**: On `session.idle`, fetch all messages and re-render
4. **Streaming During Activity**: `message.part.updated` updates DOM directly
5. **Non-focusable Icon**: Icon window never steals focus from other apps

### Hot Reload Development

Mount shell-ui for live editing:

```yaml
# docker-compose.yml
volumes:
  - ./shell-ui:/home/vibe/shell-ui:ro
```

Then restart after changes:

```bash
docker exec vibeos-dev supervisorctl restart openbox
```

### Adding New IPC Handlers

In `main.js`:

```javascript
ipcMain.handle('my-new-handler', async (event, arg) => {
  // Implementation
  return { success: true, data: result };
});
```

In `preload.js`:

```javascript
contextBridge.exposeInMainWorld('vibeos', {
  // ... existing
  myNewMethod: (arg) => ipcRenderer.invoke('my-new-handler', arg)
});
```

In `index.html`:

```javascript
const result = await window.vibeos.myNewMethod('arg');
```

### Modifying the Conversation UI

Key functions to modify:

| Function | Purpose |
|----------|---------|
| `renderConversation()` | Full render from allMessages |
| `renderUserMessage(msg)` | Render single user message |
| `renderAssistantMessage(msg)` | Render assistant + tool calls |
| `handleOpencodeEvent(event)` | Process SSE events |
| `parseMarkdown(text)` | Convert markdown to HTML |

### Theme Colors

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

---

## Adding Features

### Add a New Tool Script

1. Create script in `scripts/tools/`:

```bash
#!/bin/bash
# scripts/tools/my-tool.sh
set -euo pipefail
echo "Hello from my tool"
```

2. Update Dockerfile to copy:

```dockerfile
COPY --chown=vibe:vibe scripts/tools /home/vibe/scripts
RUN chmod +x /home/vibe/scripts/*.sh
```

3. Use via OpenCode:

```
Run /home/vibe/scripts/my-tool.sh
```

### Add a New App Alias

In `shell-ui/main.js`, find the `apps` object:

```javascript
const apps = {
  'firefox': 'firefox',
  'chrome': 'google-chrome',
  'terminal': process.env.VIBEOS_TERMINAL || 'xfce4-terminal',
  'files': 'pcmanfm',
  'editor': 'mousepad',
  'myapp': '/path/to/myapp',  // Add here
};
```

Usage: `!myapp`

### Add Keyboard Shortcut

In `config/openbox/rc.xml`:

```xml
<keybind key="Super-m">
  <action name="Execute">
    <command>my-command</command>
  </action>
</keybind>
```

### Add New Environment Variable

1. Use in supervisor config (`config/supervisord.conf`):

```ini
environment=MY_VAR="%(ENV_MY_VAR)s"
```

2. Pass when running:

```bash
docker run -e MY_VAR=value ...
```

---

## Troubleshooting

### Shell UI Not Appearing

**Check logs**:

```bash
docker exec vibeos-dev cat /var/log/supervisor/openbox.err
```

**Common causes**:
- Missing `ELECTRON_DISABLE_SANDBOX=1`
- Missing `--security-opt seccomp=unconfined`
- npm install failed during build

### OpenCode API Not Responding

**Check health**:

```bash
curl http://localhost:4096/global/health
```

**Check logs**:

```bash
docker exec vibeos-dev cat /var/log/supervisor/opencode.log
```

**Common causes**:
- Port 4096 not exposed
- Service crashed (check supervisorctl status)
- Missing API key

### SSE Events Not Received

**Test directly**:

```bash
timeout 5 curl -N http://localhost:4096/event
```

**Check main.js logs**:

```bash
docker exec vibeos-dev grep -i "SSE" /var/log/supervisor/openbox.log
```

### VNC Black Screen

**Check services**:

```bash
docker exec vibeos-dev supervisorctl status
```

**Check x11vnc**:

```bash
docker exec vibeos-dev cat /var/log/supervisor/x11vnc.err
```

### beta.html Not Loading

**Common causes**:
- File not copied to `/opt/novnc/`
- Check Dockerfile COPY command
- Verify file exists:

```bash
docker exec vibeos-dev ls -la /opt/novnc/beta.html
```

### Screenshot Not Working

**Test directly**:

```bash
docker exec vibeos-dev /home/vibe/scripts/screenshot.sh test.png
docker exec vibeos-dev ls -la /home/vibe/shared/
```

**Check DISPLAY**:

```bash
docker exec vibeos-dev bash -c 'echo $DISPLAY'  # Should be :0
```

---

## Testing

### Manual Testing Checklist

1. **Container Starts**

   ```bash
   docker run -d --name test -p 4096:4096 -p 6080:6080 \
     -v $(pwd)/shared:/home/vibe/shared \
     --shm-size=2g --security-opt seccomp=unconfined vibeos
   ```

2. **VNC Accessible**
   - Open http://localhost:6080/beta.html
   - Should see VibeOS conversation UI

3. **Local Prompt Works**
   - Type in prompt bar: "What is 2+2?"
   - Should see response stream in

4. **Remote API Works**

   ```bash
   ./scripts/vibeos-send "Say hello"
   ```

   - Should see message appear in VNC UI

5. **Screenshot Works**

   ```bash
   ./scripts/vibeos-screenshot test.png
   ls shared/test.png
   ```

6. **App Launcher Works**
   - Type: `!chrome`
   - Chrome should open

7. **Shell Commands Work**
   - Type: `$ls -la`
   - Terminal should open with listing

### API Testing

```bash
# Health check
curl http://localhost:4096/global/health | jq

# Create message and check response
SESSION_ID=$(curl -s http://localhost:4096/session | jq -r '.[0].id')
curl -X POST "http://localhost:4096/session/$SESSION_ID/message" \
  -H "Content-Type: application/json" \
  -d '{"parts": [{"type": "text", "text": "What is 1+1?"}]}' | jq

# Verify message appears
curl "http://localhost:4096/session/$SESSION_ID/message" | jq
```

### Performance Check

```bash
docker stats vibeos-dev
```

Expected idle usage:
- CPU: < 5%
- Memory: 500MB - 1GB
- With browser: 1-2GB

---

## Related Documentation

- [Architecture Explanation](explanation-architecture.md) - Why things are designed this way
- [API Reference](reference-api.md) - Complete API documentation
- [Integration Guide](guide-integration.md) - External system integration
- [Automation Tools](reference-automation-tools.md) - Window/mouse automation
