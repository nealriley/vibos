# VibeOS

A containerized AI-powered Linux desktop environment accessible via web browser. VibeOS combines an intelligent coding assistant with a full graphical desktop, enabling AI-assisted development and automation.

![VibeOS Desktop](docs/vibeos-screenshot.png)

## Features

- **AI-Powered Desktop**: Embedded OpenCode assistant for coding, automation, and system control
- **Web-Based Access**: Access the full Linux desktop via any browser using noVNC
- **Remote API Control**: HTTP API for external automation and integration
- **Window Automation**: Built-in tools for programmatic window and mouse control
- **Container-Based**: Fully isolated, reproducible environment

## Quick Start

### Prerequisites

- Docker (Docker Desktop, Rancher Desktop, or similar)
- 4GB+ RAM available for the container
- Ports 4096, 5900, 6080 available
- An API key from Anthropic, OpenAI, or OpenCode Zen

### Run VibeOS

```bash
# Clone and enter the directory
cd vibeos

# Start with the quick-start script
export ANTHROPIC_API_KEY=your-key-here
./start.sh

# Access in browser
open http://localhost:6080/beta.html
```

Or run directly with Docker:

```bash
docker build -t vibeos .

docker run -d \
  --name vibeos-dev \
  -p 4096:4096 \
  -p 6080:6080 \
  -p 5900:5900 \
  -e RESOLUTION=1920x1080 \
  -e ANTHROPIC_API_KEY=your-key-here \
  -v $(pwd)/shared:/home/vibe/shared \
  --shm-size=2g \
  --security-opt seccomp=unconfined \
  vibeos
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **VibeOS Web** | http://localhost:6080/beta.html | Recommended - Custom branded interface |
| **noVNC Standard** | http://localhost:6080/vnc.html | Standard noVNC interface |
| **VNC Direct** | vnc://localhost:5900 | For native VNC clients |
| **OpenCode API** | http://localhost:4096 | HTTP API for automation |

## Usage

### Interacting with the AI

The conversation interface supports multiple input types:

| Input | Action |
|-------|--------|
| `Build a todo app in React` | AI prompt - creates files, runs commands |
| `Fix the bug in src/app.js` | AI analyzes and fixes code |
| `!chrome` | Launch Google Chrome browser |
| `!terminal` | Open a terminal window |
| `$ls -la` | Run shell command in a new terminal |

### Remote Control

Send messages to VibeOS from your host machine:

```bash
# Using the helper script
./scripts/vibeos-send "Create a new React project"

# Or via HTTP API
SESSION_ID=$(curl -s http://localhost:4096/session | jq -r '.[0].id')
curl -X POST "http://localhost:4096/session/$SESSION_ID/message" \
  -H "Content-Type: application/json" \
  -d '{"parts": [{"type": "text", "text": "Open Chrome and go to github.com"}]}'
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Escape` | Abort current response |
| `Super+Space` | Toggle shell visibility |
| `Super+Return` | Open terminal |
| `Super+B` | Open browser |

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started Tutorial](docs/tutorial-getting-started.md) | Step-by-step guide to your first VibeOS session |
| [API Reference](docs/reference-api.md) | Complete OpenCode API documentation |
| [VNC Interface Guide](docs/guide-vnc-interfaces.md) | How to use vnc.html and beta.html |
| [Automation Scripts](docs/reference-automation-tools.md) | Window and mouse automation reference |
| [Integration Guide](docs/guide-integration.md) | How to integrate VibeOS with external systems |
| [Architecture](ARCHITECTURE.md) | System design and component details |
| [Development Guide](docs/DEVELOPMENT.md) | Guide for contributors |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RESOLUTION` | `1920x1080` | Display resolution (WxH) |
| `ANTHROPIC_API_KEY` | - | Anthropic API key for Claude |
| `OPENAI_API_KEY` | - | OpenAI API key |
| `OPENCODE_API_KEY` | - | OpenCode Zen API key |
| `VIBEOS_DEV` | `0` | Set to `1` to enable DevTools |

### Volume Mounts

| Host Path | Container Path | Purpose |
|-----------|----------------|---------|
| `./shared` | `/home/vibe/shared` | Screenshots, data exchange |
| `./projects` | `/home/vibe/projects` | Project files |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       DOCKER CONTAINER                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      SUPERVISOR                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│       │           │           │           │           │          │
│       ▼           ▼           ▼           ▼           ▼          │
│  ┌────────┐ ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │OpenCode│ │  Xvfb   │ │Openbox │ │ x11vnc │ │ noVNC  │       │
│  │ :4096  │ │  :0     │ │  (WM)  │ │ :5900  │ │ :6080  │       │
│  │ (API)  │ │(display)│ │        │ │        │ │        │       │
│  └────────┘ └─────────┘ └────────┘ └────────┘ └────────┘       │
│       │          │           │          │          │            │
│       │          └───────────┴──────────┘          │            │
│       │                      │                     │            │
│       │    HTTP/SSE          ▼            WebSocket│            │
│       │    ┌─────────────────────────────────────┐ │            │
│       └───►│          ELECTRON SHELL UI          │◄┘            │
│            │  - Conversation interface            │              │
│            │  - Two-window architecture           │              │
│            │  - App launcher                      │              │
│            └─────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
           ▲                                    ▲
           │ HTTP API (:4096)                   │ VNC (:6080)
           │                                    │
    ┌──────┴──────┐                     ┌──────┴──────┐
    │ Remote API  │                     │   Browser   │
    │   Client    │                     │  (noVNC)    │
    └─────────────┘                     └─────────────┘
```

## Project Structure

```
vibeos/
├── README.md                 # This file
├── ARCHITECTURE.md           # Detailed system architecture
├── Dockerfile                # Container definition
├── docker-compose.yml        # Easy dev setup
├── start.sh                  # Quick start script
├── docs/                     # Documentation
│   ├── tutorial-getting-started.md
│   ├── reference-api.md
│   ├── reference-automation-tools.md
│   ├── guide-vnc-interfaces.md
│   ├── guide-integration.md
│   ├── DEVELOPMENT.md
│   ├── COMPONENTS.md
│   └── PROJECT_STATUS.md
├── shell-ui/                 # Electron conversation UI
├── novnc/                    # Custom VNC interface
│   └── beta.html
├── config/                   # Configuration files
│   ├── openbox/
│   ├── opencode/
│   └── supervisord.conf
├── scripts/                  # Helper scripts
│   ├── vibeos-send
│   ├── vibeos-screenshot
│   └── tools/                # Window automation
└── shared/                   # Data exchange folder
```

## License

MIT
