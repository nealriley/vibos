# AGENTS.md - AI Agent Instructions for VibeOS

> **CRITICAL**: You MUST update this file when making significant changes to the codebase. See [Mandatory Update Requirements](#mandatory-update-requirements) at the end.

## Project Overview

**VibeOS** is a containerized AI-powered Linux desktop environment accessible via web browser. It combines:
- An embedded AI coding assistant (OpenCode) with HTTP API and SSE streaming
- A full graphical Linux desktop (Xvfb + Openbox window manager)
- Web-based VNC access via noVNC
- An Electron-based shell UI for conversation interface
- Window and mouse automation tools for programmatic desktop control

## Quick Start

```bash
# Set API key
export ANTHROPIC_API_KEY=your-key-here

# Start VibeOS
./start.sh

# Access in browser
open http://localhost:6080/beta.html
```

### Alternative Methods

**Docker Compose:**
```bash
echo "ANTHROPIC_API_KEY=your-key" > .env
docker compose up -d
```

**Makefile:**
```bash
make build    # Build Docker image
make run      # Run container
make dev      # docker compose up
make logs     # View logs
make shell    # Root shell into container
make status   # Check supervisorctl status
```

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `/` (root) | Project configuration, Docker files, entry scripts |
| `shell-ui/` | Electron application - main conversation UI |
| `novnc/` | Custom VNC web interface (`beta.html`) |
| `config/` | Configuration for openbox, opencode, supervisor, terminal |
| `config/openbox/` | Window manager config (rc.xml, autostart) |
| `config/opencode/` | OpenCode configuration (permission policy) |
| `scripts/` | Host-side helpers (vibeos-send, vibeos-screenshot) |
| `scripts/tools/` | In-container automation scripts (window.sh, screenshot.sh, etc.) |
| `tests/` | Test suite (remote API tests, automation tests) |
| `tests/remote/` | Tests that run from host against container API |
| `tests/automation/` | Tests that run inside container (window, keyboard, mouse) |
| `docs/` | Comprehensive documentation |
| `shared/` | Mounted volume for data exchange with host |
| `projects/` | Mounted volume for project files |

## Key Files

### Entry Points
- `Dockerfile` - Container definition (Ubuntu 22.04 base)
- `docker-compose.yml` - Easy deployment configuration
- `start.sh` - Quick start script (build, run, wait for ready)
- `Makefile` - Build automation commands
- `scripts/entrypoint.sh` - Container initialization script

### Shell UI (Electron App - React + TypeScript)
- `shell-ui/main.js` - Main process entry point (orchestration only, ~140 lines)
- `shell-ui/src/main/` - Main process modules:
  - `config.js` - Configuration constants and safe logging
  - `api-client.js` - OpenCode HTTP client functions
  - `sse-handler.js` - SSE subscription and event handling
  - `window-manager.js` - Icon and main window management
  - `polling.js` - Window list and command signal polling
  - `launcher.js` - App and terminal launching
  - `ipc-handlers.js` - IPC handler registration
- `shell-ui/preload.js` - IPC bridge (exposes `window.vibeos` API)
- `shell-ui/icon.html` - Taskbar/dock icon UI (vanilla JS)
- `shell-ui/index.html` - Vite entry point for React app
- `shell-ui/src/` - React source code:
  - `src/App.tsx` - Root component
  - `src/main.tsx` - React entry point
  - `src/components/` - UI components (Message, Feed, Input, Tool, Status, Layout)
  - `src/hooks/` - Custom hooks (useSession, useSSE)
  - `src/lib/` - Utilities (api, cn, markdown)
  - `src/types/` - TypeScript types (message, vibeos.d.ts)
  - `src/styles/globals.css` - Tailwind CSS + theme variables
- `shell-ui/dist/` - Built React app (loaded by Electron)
- `shell-ui/package.json` - Dependencies (react, motion, tailwindcss, vite, electron)

### Configuration
- `config/supervisord.conf` - Service definitions (opencode, xvfb, openbox, x11vnc, novnc)
- `config/openbox/rc.xml` - Keyboard shortcuts, window rules
- `config/openbox/autostart` - Startup script (launches shell-ui)
- `config/opencode/opencode.json` - OpenCode auto-approve settings (no repo-local agents/skills)

### Custom noVNC
- `novnc/beta.html` - VibeOS-branded VNC web client with auto-connect

## Architecture

### Service Stack (via Supervisor)
```
Priority 50:  OpenCode Server (:4096) - AI backend
Priority 100: Xvfb (:0) - Virtual display
Priority 150: Openbox - Window manager (launches shell-ui)
Priority 200: x11vnc (:5900) - VNC server
Priority 300: noVNC/websockify (:6080) - Web access
```

### Shell UI Two-Window Architecture
- **Icon Window**: 64x64 dock button, always on top, non-focusable
- **Main Window**: Fullscreen conversation UI, hides when external apps launched

### Data Flow
1. User types in shell-ui prompt
2. POST to OpenCode `/session/:id/message`
3. SSE events stream back (session.status, message.part.updated)
4. UI updates in real-time
5. On session.idle, refresh from server

## OpenCode API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/session` | GET | List sessions |
| `/session` | POST | Create session |
| `/session/:id/message` | GET | Get messages |
| `/session/:id/message` | POST | Send message |
| `/session/:id/abort` | POST | Abort current response |
| `/event` | GET | SSE event stream |
| `/global/health` | GET | Health check |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RESOLUTION` | `1920x1080` | Display resolution |
| `ANTHROPIC_API_KEY` | - | Anthropic API key |
| `OPENAI_API_KEY` | - | OpenAI API key |
| `OPENCODE_API_KEY` | - | OpenCode Zen API key |
| `VIBEOS_DEV` | `0` | Enable DevTools when `1` |
| `VIBEOS_TERMINAL` | `xfce4-terminal` | Default terminal |
| `OPENCODE_URL` | `http://127.0.0.1:4096` | OpenCode server URL |

## Access Points

| Service | Port | URL |
|---------|------|-----|
| VibeOS Web (recommended) | 6080 | http://localhost:6080/beta.html |
| Standard noVNC | 6080 | http://localhost:6080/vnc.html |
| Direct VNC | 5900 | vnc://localhost:5900 |
| OpenCode API | 4096 | http://localhost:4096 |

## Special Shell Commands

The shell UI supports special prefixes:
- `!app` - Launch application (e.g., `!chrome`, `!terminal`, `!firefox`)
- `$command` - Run shell command in new terminal
- Plain text - Send to OpenCode AI

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Super+Space` | Toggle shell visibility |
| `Super+Return` | Open terminal |
| `Super+B` | Open browser |
| `Super+Shift+R` | Reset desktop session |
| `Alt+F4` | Close window |
| `Alt+Tab` | Cycle windows |
| `Super+F` | Toggle fullscreen |
| `Super+M` | Toggle maximize |
| `Escape` | Show main window (global) |

## Container Details

- **User**: `vibe` (has sudo NOPASSWD)
- **Home**: `/home/vibe`
- **Projects**: `/home/vibe/projects`
- **Shared**: `/home/vibe/shared`
- **Scripts**: `/home/vibe/scripts`

## Log Locations

| Log | Path |
|-----|------|
| OpenCode | `/var/log/supervisor/opencode.log` |
| Shell UI | `/var/log/supervisor/openbox.log` |
| Shell UI errors | `/var/log/supervisor/openbox.err` |
| VNC | `/var/log/supervisor/x11vnc.log` |
| noVNC | `/var/log/supervisor/novnc.log` |
| Supervisor | `/var/log/supervisor/supervisord.log` |

## Development Workflow

1. **Edit shell-ui**: Changes require container rebuild or manual restart of Openbox
2. **Edit config files**: Most require service restart via `supervisorctl`
3. **Edit novnc/beta.html**: Refresh browser to see changes (mounted volume)
4. **Test locally**: Use `make logs` to monitor all services

### Rebuilding After Changes
```bash
make stop && make build && make run
# or
docker compose down && docker compose up --build -d
```

## Testing

### Automated Tests
```bash
make test              # Run all tests
make test-remote       # Run remote API tests (from host)
make test-automation   # Run in-container automation tests
```

### Manual Testing Checklist

Before committing changes, verify:
1. Container starts: `docker compose up -d`
2. VNC accessible: http://localhost:6080/beta.html
3. Local prompt works: Type in conversation UI
4. Remote API works: `./scripts/vibeos-send "Say hello"`
5. Screenshot works: `./scripts/vibeos-screenshot test.png`
6. App launcher: Type `!chrome`
7. Shell commands: Type `$ls -la`
8. Stop button: Send a long message, verify stop button appears and works
9. Reset session: Press `Super+Shift+R` or click Reset in beta.html toolbar

---

## Mandatory Update Requirements

**You MUST update this file when any of the following changes occur:**

### 1. Structural Changes
- [ ] New directories added to the project
- [ ] Existing directories renamed or removed
- [ ] Major file reorganization

### 2. API Changes
- [ ] New API endpoints added
- [ ] Existing endpoints modified or removed
- [ ] Changes to request/response formats

### 3. Configuration Changes
- [ ] New environment variables
- [ ] Changes to supervisor services
- [ ] New keyboard shortcuts
- [ ] Changes to openbox configuration

### 4. Shell UI Changes
- [ ] New IPC channels or messages
- [ ] New special commands (!, $, etc.)
- [ ] Changes to window management behavior

### 5. New Features
- [ ] Any user-facing feature additions
- [ ] New automation tools
- [ ] Integration changes

### 6. Breaking Changes
- [ ] Any change that affects how users interact with VibeOS
- [ ] Changes to build/run commands
- [ ] Port changes

### Update Format

When updating, add a dated entry in this section:

**Change Log:**
- *2026-01-13*: Initial AGENTS.md created with comprehensive documentation
- *2026-01-13*: Added test infrastructure (tests/ directory), stop button verification, reset session feature with `Super+Shift+R` shortcut and beta.html Reset button
- *2026-01-13*: **Shell UI Migration to React + Motion** - Complete rewrite of shell-ui from vanilla JS to React 18 + TypeScript + Vite + Tailwind CSS + Motion (Framer Motion). New structure under `shell-ui/src/` with components, hooks, and types. Build command: `npm run build:renderer`. Legacy index.html preserved as `index.html.legacy`.
- *2026-01-14*: Removed repo-local OpenCode agents/skills (`.opencode/`) and reverted `config/opencode/opencode.json` to auto-approve-only config.
- *2026-01-14*: Fixed shell UI window/background and layout: enforce fullscreen opaque window, center the chat column, and place input at the bottom with messages above.
- *2026-01-16*: **Comprehensive Architecture Audit** - Full codebase audit covering infrastructure, shell-ui, and documentation. Updated `docs/COMPONENTS.md` for React architecture, updated `docs/PROJECT_STATUS.md` marking React migration complete, created `docs/ROADMAP.md` with phased development plan. Key findings: main.js needs modularization (900 lines), duplicate SSE handling in hooks, missing error boundary, unused code (useAutoFade, parseCommand).
- *2026-01-16*: **Phase 1 Cleanup Complete** - Modularized `main.js` from 900 to 140 lines by extracting 7 focused modules (config, api-client, sse-handler, window-manager, polling, launcher, ipc-handlers). Removed unused TypeScript files (useAutoFade, parseCommand). Removed unused config directories (labwc, foot, alacritty). Created shared shell library (`scripts/tools/lib/window-utils.sh`) and refactored 9 window scripts to use it.

---

**Remember**: Keeping this file current ensures all AI agents working on this codebase have accurate, up-to-date information. Outdated documentation leads to bugs, wasted time, and frustrated users.
