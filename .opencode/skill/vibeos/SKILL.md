---
name: vibeos
description: Interact with a running VibeOS container - AI-powered Linux desktop with OpenCode agent accessible via HTTP API and web VNC
license: MIT
compatibility: opencode
metadata:
  category: integration
  requires: docker
---

# VibeOS Integration Skill

Use this skill when you need to interact with a running VibeOS container, send prompts to its embedded AI agent, take screenshots, automate the desktop, or understand the VibeOS architecture.

## What is VibeOS

VibeOS is a containerized AI-powered Linux desktop environment accessible via web browser. It combines:

- **OpenCode Server** (:4096) - AI coding assistant with HTTP API and SSE streaming
- **Xvfb** (:0) - Virtual X11 display
- **Openbox** - Minimal window manager
- **x11vnc** (:5900) - VNC server
- **noVNC/websockify** (:6080) - Web-based VNC access

The desktop runs inside a Docker container based on Ubuntu 22.04 with Node.js 22, Google Chrome, and automation tools (xdotool, wmctrl, scrot).

## Checking if VibeOS is Running

Before interacting with VibeOS, verify the container is running and healthy:

```bash
# Check container status
docker ps | grep vibeos

# Check API health
curl -s http://localhost:4096/global/health
# Expected: {"status":"ok"}

# Check all services
docker exec vibeos-dev supervisorctl status
```

## Access Points

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| OpenCode API | 4096 | http://localhost:4096 | AI control, automation |
| VNC (direct) | 5900 | vnc://localhost:5900 | Native VNC clients |
| WebSocket VNC | 6080 | http://localhost:6080/beta.html | Browser-based desktop access |

## Sending Prompts to VibeOS

### Using the Host Helper Script

The simplest way to send a message to the VibeOS AI agent:

```bash
# From the vibeos project directory
./scripts/vibeos-send "Your message here"

# Pipe from stdin
echo "Create a hello.txt file" | ./scripts/vibeos-send

# Use environment variables for non-default config
VIBEOS_HOST=192.168.1.100 VIBEOS_PORT=4096 ./scripts/vibeos-send "message"
```

### Using curl Directly

```bash
# Get the session ID (default session is named "desktop")
SESSION_ID=$(curl -s http://localhost:4096/session | jq -r '.[] | select(.title == "desktop") | .id')

# Send a message
curl -X POST "http://localhost:4096/session/$SESSION_ID/message" \
  -H "Content-Type: application/json" \
  -d '{"parts": [{"type": "text", "text": "Your message here"}]}'
```

## OpenCode API Reference

For complete API documentation, see @docs/reference-api.md

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/global/health` | GET | Health check |
| `/session` | GET | List all sessions |
| `/session` | POST | Create new session |
| `/session/:id/message` | GET | Get messages in session |
| `/session/:id/message` | POST | Send message to AI |
| `/session/:id/abort` | POST | Abort current response |
| `/event` | GET | SSE event stream |

### SSE Event Types

Subscribe to real-time events via `GET /event`:

- `session.status` - Session busy/idle state changes
- `session.idle` - Response complete, ready for next input
- `message.created` - New message created
- `message.part.updated` - Streaming content update (text or tool progress)

## Taking Screenshots

```bash
# From host (saves to ./shared/)
./scripts/vibeos-screenshot                    # Auto-named
./scripts/vibeos-screenshot my-capture.png     # Custom name

# Inside container
/home/vibe/scripts/screenshot.sh [filename]
```

## Desktop Automation Tools

For complete automation reference, see @docs/reference-automation-tools.md

The container includes automation scripts at `/home/vibe/scripts/`:

### window.sh - Unified Window Management

```bash
# List windows
docker exec vibeos-dev /home/vibe/scripts/window.sh list --json

# Focus a window by class
docker exec vibeos-dev /home/vibe/scripts/window.sh focus firefox

# Type text into active window
docker exec vibeos-dev /home/vibe/scripts/window.sh type "Hello World"

# Send keystrokes
docker exec vibeos-dev /home/vibe/scripts/window.sh key "ctrl+s"

# Mouse operations
docker exec vibeos-dev /home/vibe/scripts/window.sh mouse-move 500 300
docker exec vibeos-dev /home/vibe/scripts/window.sh mouse-click left
```

### Window Targeting

Windows can be targeted by:
- Window ID: `0x12345678`
- Window class: `firefox`, `google-chrome`, `xfce4-terminal`
- Window title: `"My Document"` (partial match)

## File Exchange

The `shared/` directory is mounted between host and container:

- **Host path**: `./shared/`
- **Container path**: `/home/vibe/shared/`

```bash
# Copy file to container
cp myfile.txt shared/

# Have AI create a file accessible on host
./scripts/vibeos-send "Create a report.txt in ~/shared"

# Screenshots automatically save to shared/
./scripts/vibeos-screenshot
ls shared/*.png
```

## Container Details

| Property | Value |
|----------|-------|
| User | `vibe` (UID 1000, has sudo NOPASSWD) |
| Home | `/home/vibe` |
| Projects | `/home/vibe/projects` |
| Shared | `/home/vibe/shared` |
| Scripts | `/home/vibe/scripts` |
| Display | `:0` |
| Resolution | `$RESOLUTION` (default: 1920x1080) |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VIBEOS_HOST` | `localhost` | API server host |
| `VIBEOS_PORT` | `4096` | API server port |
| `VIBEOS_SESSION` | `desktop` | Session name |
| `VIBEOS_CONTAINER` | `vibeos-dev` | Container name |
| `RESOLUTION` | `1920x1080` | Display resolution |

## Web VNC Interface

For VNC interface details, see @docs/guide-vnc-interfaces.md

### beta.html (Recommended)

```
http://localhost:6080/beta.html
```

Features:
- Auto-connect on page load
- Dark theme matching shell-ui
- Auto-reconnect on disconnect
- Connection status indicator

URL parameters:
- `?view_only=true` - Disable input
- `?resize=true` - Request server resize to viewport
- `?host=192.168.1.100` - Connect to different host

## Integration Patterns

For complete integration guide, see @docs/guide-integration.md

### Pattern 1: Fire and Forget

```bash
./scripts/vibeos-send "Run npm test in ~/projects/myapp"
```

### Pattern 2: Request-Response with Polling

```bash
# Send message
./scripts/vibeos-send "Create a file called test.txt"

# Wait and check result
sleep 5
./scripts/vibeos-send "What files are in the current directory?"
```

### Pattern 3: SSE Event Streaming

```bash
# Monitor events in one terminal
curl -N http://localhost:4096/event

# Send messages in another terminal
./scripts/vibeos-send "Build the project"
```

## Troubleshooting

### Container Not Running

```bash
# Start VibeOS
cd /path/to/vibeos && ./start.sh

# Or with docker-compose
docker-compose up -d
```

### API Connection Refused

```bash
# Check OpenCode service status
docker exec vibeos-dev supervisorctl status opencode

# View logs
docker exec vibeos-dev cat /var/log/supervisor/opencode.log
```

### Session Not Found

```bash
# List available sessions
curl -s http://localhost:4096/session | jq '.[].title'

# The default session is named "desktop"
```

## Architecture Reference

For complete architecture details, see @AGENTS.md

### Service Stack (Supervisor)

```
Priority 50:  OpenCode Server (:4096)
Priority 100: Xvfb (:0)
Priority 150: Openbox (launches shell-ui)
Priority 200: x11vnc (:5900)
Priority 300: noVNC/websockify (:6080)
```

### Docker Image

- Base: Ubuntu 22.04
- Node.js: 22.x LTS
- Browser: Google Chrome
- Window Manager: Openbox
- Automation: xdotool, wmctrl, scrot
- AI: OpenCode (opencode-ai npm package)
