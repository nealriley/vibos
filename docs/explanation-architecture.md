# Understanding VibeOS Architecture

This document explains the design decisions, component interactions, and underlying concepts that make VibeOS work.

## The Core Idea

VibeOS combines three traditionally separate concepts:

1. **AI Assistant**: An intelligent coding helper (OpenCode)
2. **Desktop Environment**: A graphical Linux workspace
3. **Remote Access**: Web-based interaction via VNC

The key insight is that by running everything in a container with remote access, we get:

- **Isolation**: The AI can safely execute code without affecting your host system
- **Reproducibility**: Every session starts from a known state
- **Accessibility**: Access from any device with a browser
- **Automation**: Both human and programmatic control

---

## Why a Two-Window Architecture?

The Electron shell UI uses two separate windows: an icon window and a main window. This wasn't the obvious choice.

### The Problem

Early versions used a single fullscreen window. This created a conflict:

- Users want to see the AI conversation
- Users also want to use external applications (Chrome, terminal)
- A fullscreen window covers everything

We tried several approaches:

1. **Minimizing the main window** - Lost context, hard to bring back
2. **Tiling the windows** - Complex layout management
3. **Overlay mode** - Still blocked input to other apps

### The Solution

Two windows with different behaviors:

| Window | Size | Behavior |
|--------|------|----------|
| Icon Window | 64x64 | Always visible, non-focusable |
| Main Window | Fullscreen | Can be hidden, takes focus |

**Icon Window Properties**:
- `alwaysOnTop: true, level: 'screen-saver'` - Stays above everything
- `focusable: false` - Never steals focus
- `skipTaskbar: true` - Doesn't appear in taskbar

This means:
- The icon is always visible for quick access
- External apps get full focus when working with them
- Clicking the icon toggles the conversation view
- Keyboard shortcut (Super+Space) provides fast access

### Why Not a System Tray?

We considered using Openbox's system tray, but:
- Requires additional panel software
- Less discoverable for users
- Can't show dynamic content
- The dock-style icon is more intuitive

---

## Why OpenCode Server Mode?

OpenCode normally runs as a CLI tool. VibeOS uses its server mode (`opencode serve`), which exposes:

- **REST API**: Session and message management
- **SSE Events**: Real-time streaming updates

### Benefits of Server Mode

1. **Multiple Clients**: The shell UI and external scripts can interact simultaneously
2. **Event Streaming**: Real-time response updates without polling
3. **Stateless Clients**: The server maintains conversation state
4. **Separation**: UI can crash without losing conversation history

### Auto-Approve Mode

OpenCode's `opencode.json` configuration:

```json
{
  "permission": "allow"
}
```

This automatically approves tool calls (bash, file writes, etc.) without user confirmation.

**Why auto-approve?**
- The container provides isolation - damage is contained
- Manual approval interrupts the AI's workflow
- For development tasks, you want the AI to "just do it"

**Trade-off**: Less control, more risk of unintended actions. The container isolation makes this acceptable for development use.

---

## The Display Stack

VibeOS uses a layered approach to create a virtual desktop accessible via browser:

```
┌─────────────────────────────────────────────────────┐
│                Browser (your computer)               │
│                                                     │
│            noVNC JavaScript Client                  │
└─────────────────────────┬───────────────────────────┘
                          │ WebSocket
┌─────────────────────────▼───────────────────────────┐
│                    websockify                        │
│             (WebSocket → TCP bridge)                 │
│                      :6080                           │
└─────────────────────────┬───────────────────────────┘
                          │ TCP (VNC Protocol)
┌─────────────────────────▼───────────────────────────┐
│                     x11vnc                           │
│              (X11 → VNC server)                      │
│                      :5900                           │
└─────────────────────────┬───────────────────────────┘
                          │ X11 Protocol
┌─────────────────────────▼───────────────────────────┐
│                      Xvfb                            │
│             (Virtual X11 Framebuffer)               │
│                       :0                             │
└─────────────────────────────────────────────────────┘
```

### Why This Stack?

**Xvfb (X Virtual Framebuffer)**
- Creates a virtual display without physical hardware
- Standard X11 - all Linux apps work unmodified
- Lighter than running a full GPU-accelerated display

**x11vnc**
- Captures the X11 display and serves it via VNC protocol
- Efficient: Only sends changed regions
- Well-established, stable technology

**websockify**
- Bridges WebSocket (browser) to TCP (VNC)
- Allows VNC access from any browser
- No browser plugins required

**noVNC**
- Pure JavaScript VNC client
- Works in any modern browser
- Handles scaling, clipboard, keyboard translation

### Alternative Approaches

We considered:

**Wayland instead of X11**
- More modern, better security
- Less application compatibility
- VNC support is immature
- May revisit for future versions

**xrdp (RDP protocol)**
- Better compression
- Requires different client
- More complex setup

**In-browser rendering (like code-server)**
- Would lose the "full desktop" concept
- Electron works well for our needs

---

## SSE vs Polling

For real-time updates, we use Server-Sent Events (SSE) instead of polling.

### Why SSE?

| Approach | Pros | Cons |
|----------|------|------|
| **Polling** | Simple, works everywhere | Wasteful, delayed updates |
| **WebSocket** | Real-time, bidirectional | Complex, connection management |
| **SSE** | Real-time, simple, HTTP-based | Unidirectional only |

For our use case:
- We only need server→client updates (responses streaming)
- Client→server is handled by regular HTTP POST
- SSE reconnects automatically on disconnect
- Works through standard HTTP infrastructure

### Event Flow

```
User types message
        │
        ▼
Electron sends HTTP POST
        │
        ▼
OpenCode processes, executes tools
        │
        ▼
SSE sends message.part.updated events
        │
        ▼
Electron updates UI in real-time
        │
        ▼
SSE sends session.idle when complete
        │
        ▼
Electron refreshes full state from server
```

This hybrid approach (POST for commands, SSE for updates) gives us:
- Reliable message delivery (HTTP POST)
- Real-time streaming (SSE)
- Simple reconnection (just reconnect SSE)

---

## Supervisor as Init

The container uses Supervisor as PID 1 (init system).

### Why Supervisor?

1. **Process Management**: Starts, stops, restarts services
2. **Dependencies**: Priority system ensures correct startup order
3. **Logging**: Captures stdout/stderr to files
4. **Simple Configuration**: INI-based config files
5. **Docker-Friendly**: Designed for containers

### Startup Order

```
Priority 50:  opencode    (AI server - needs to be ready first)
Priority 100: xvfb        (Virtual display - foundation for GUI)
Priority 150: openbox     (Window manager - launches shell-ui)
Priority 200: x11vnc      (VNC server - needs display running)
Priority 300: novnc       (Web access - needs VNC running)
```

Lower priority = starts first.

### Alternative: Multiple Containers

We could use Docker Compose with separate containers:
- Cleaner separation of concerns
- More complex networking
- More resource overhead
- Harder to coordinate startup

For VibeOS, a single container is simpler and more portable.

---

## Security Model

VibeOS makes deliberate security trade-offs for developer experience.

### Container as Sandbox

The Docker container provides isolation:
- AI actions can't affect your host system
- Network access is controlled via port mapping
- Filesystem access is limited to mounted volumes

### What's NOT Secure

1. **No VNC password by default** - Anyone on your network could connect
2. **No API authentication** - Anyone can send messages to the AI
3. **Auto-approve enabled** - AI executes any tool without confirmation
4. **Electron sandbox disabled** - Container provides isolation instead

### Production Hardening

For production use:
1. Add VNC password to x11vnc
2. Set `OPENCODE_SERVER_PASSWORD`
3. Use Docker network isolation
4. Put nginx/traefik in front for TLS
5. Consider removing auto-approve

---

## State Management Philosophy

The shell UI follows a "server as source of truth" pattern.

### How It Works

```javascript
// Single source of truth
let allMessages = [];  // Cached from server

// On any state change
async function refreshFromServer() {
  const result = await window.vibeos.getMessages();
  allMessages = result.messages;
  renderConversation();  // Full re-render
}
```

### Benefits

1. **No Sync Issues**: Server state is authoritative
2. **Simple Logic**: No local state management
3. **Reliable**: Works even after disconnections
4. **Multiple Clients**: All clients see same state

### The Streaming Exception

During active responses, we update the UI directly from SSE events for real-time feedback. When the response completes (`session.idle`), we refresh from server to ensure accuracy.

This hybrid approach gives:
- Fast feedback during generation
- Correct final state after completion

---

## File Exchange Design

The `shared/` volume mount enables bidirectional file exchange.

### Host → Container

```
Host: ./shared/input.txt
  ↓ (mounted at runtime)
Container: /home/vibe/shared/input.txt
```

Use cases:
- Providing input files for AI processing
- Sharing project files
- Passing configuration

### Container → Host

```
Container: /home/vibe/shared/output.png
  ↓ (visible on host immediately)
Host: ./shared/output.png
```

Use cases:
- Screenshots
- Generated files
- Build artifacts
- Logs and reports

### Why Not More Mounts?

We could mount the entire home directory, but:
- Breaks container isolation
- AI could modify host files
- Harder to reset to clean state

The `shared/` directory is an explicit interface, making data flow clear.

---

## Future Directions

### Wayland Migration

X11 is mature but dated. Future versions may use:
- **labwc** or **cage** as Wayland compositor
- **wayvnc** for VNC-over-Wayland
- Better security (per-window permissions)

### Bare Metal OS

The long-term vision includes:
- Bootable ISO/USB images
- Raspberry Pi support
- Direct hardware access
- VibeOS as your primary development environment

### Multi-Session Support

Currently single-session. Future possibilities:
- Multiple concurrent AI sessions
- Session persistence across restarts
- Session sharing/collaboration
