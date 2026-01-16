# VibeOS Development Roadmap

> **Version**: 2.0 Planning  
> **Created**: January 16, 2026  
> **Status**: Active Planning

## Executive Summary

This roadmap outlines the development phases for VibeOS, covering:

- **Phases 1-3**: Code organization, architecture improvements, and testing
- **Phases 4-5**: noVNC web interface and shell UI template system
- **Phases 6-7**: OpenCode agent improvements and OS enhancements
- **Phases 8-9**: Deployment options (Raspberry Pi, ISO) and onboarding
- **Phases 10-11**: Security, production readiness, and additional features

The goal is to prepare the codebase for scaling, improve user experience, expand deployment options, and enable easier maintenance.

---

## Current State Assessment

### Strengths

1. **Functional Core**: Container, display stack, AI integration all working
2. **Modern UI**: React + TypeScript + Motion animation system
3. **Good Documentation**: Diataxis-structured docs, AGENTS.md for AI
4. **Automation Tools**: Comprehensive window/mouse control scripts
5. **Test Infrastructure**: Framework in place for remote and automation tests

### Areas for Improvement

1. **Monolithic Main Process**: `main.js` (900 lines) handles too many concerns
2. **Tight Coupling**: Shell UI tightly coupled to specific API implementation
3. **Code Duplication**: Window scripts share logic but don't share code
4. **Missing Abstractions**: No unified client library, event bus, or state machine
5. **Limited Testing**: Unit tests for hooks/components not implemented
6. **Security**: No authentication, auto-approve everything

---

## Phase 1: Code Organization & Cleanup

**Timeline**: 1-2 weeks  
**Priority**: High

### 1.1 Shell UI Main Process Modularization

Split `shell-ui/main.js` into focused modules:

```
shell-ui/
├── main.js                 # Entry point, orchestration only
├── src/
│   └── main/               # Main process modules
│       ├── api-client.js   # OpenCode HTTP client
│       ├── sse-handler.js  # SSE subscription & event handling
│       ├── window-manager.js # Icon/main window management
│       ├── ipc-handlers.js # IPC handler registration
│       ├── polling.js      # Window & command polling
│       └── config.js       # Configuration management
```

**Tasks**:
- [ ] Extract OpenCode API client to `api-client.js`
- [ ] Extract SSE handling to `sse-handler.js`
- [ ] Extract window creation/management to `window-manager.js`
- [ ] Extract IPC handlers to `ipc-handlers.js`
- [ ] Extract polling logic to `polling.js`
- [ ] Create config module with centralized constants
- [ ] Update main.js to orchestrate modules

### 1.2 Remove Unused Code

- [ ] Remove or integrate `useAutoFade` hook
- [ ] Remove `lib/parseCommand.ts` (duplicates main.js logic)
- [ ] Audit and remove unused CSS classes
- [ ] Remove or document unused config directories (labwc, foot, alacritty)

### 1.3 Create Shared Automation Library

Extract common window-finding logic:

```
scripts/tools/
├── lib/
│   └── window-utils.sh    # Shared functions
├── window.sh              # Uses lib/window-utils.sh
├── window-focus.sh        # Uses lib/window-utils.sh
└── ...
```

**Tasks**:
- [ ] Create `lib/window-utils.sh` with `find_window()` function
- [ ] Update all window scripts to source the library
- [ ] Add error handling and logging utilities

---

## Phase 2: Architecture Improvements

**Timeline**: 2-3 weeks  
**Priority**: High

### 2.1 Unified Event Bus

Create a centralized event system for the React app:

```typescript
// src/lib/event-bus.ts
type EventMap = {
  'session:status': { type: 'busy' | 'idle' }
  'message:created': Message
  'message:updated': { messageId: string; part: MessagePart }
  'connection:status': 'connected' | 'disconnected' | 'reconnecting'
}

const eventBus = createEventBus<EventMap>()
```

**Benefits**:
- Single subscription point
- Type-safe event handling
- Eliminates useSession/useSSE overlap
- Easier testing with mock bus

**Tasks**:
- [ ] Design event bus API
- [ ] Implement event bus with TypeScript generics
- [ ] Migrate useSession to use event bus
- [ ] Migrate useSSE to use event bus
- [ ] Add connection status events

### 2.2 OpenCode Client Library

Create a reusable, testable API client:

```typescript
// src/lib/opencode-client.ts
class OpenCodeClient {
  constructor(config: OpenCodeConfig)
  
  // Session management
  async createSession(title: string): Promise<Session>
  async getSession(id: string): Promise<Session>
  async listSessions(): Promise<Session[]>
  
  // Messages
  async sendMessage(sessionId: string, text: string): Promise<void>
  async getMessages(sessionId: string): Promise<Message[]>
  async abort(sessionId: string): Promise<void>
  
  // Events
  subscribeToEvents(handler: EventHandler): () => void
}
```

**Benefits**:
- Reusable in main process and tests
- Mockable for unit tests
- Clear API contract

**Tasks**:
- [ ] Design OpenCodeClient interface
- [ ] Implement client class
- [ ] Add retry logic and error handling
- [ ] Create mock client for testing
- [ ] Migrate main.js to use client
- [ ] Migrate tests to use client

### 2.3 React Error Boundary

Add error boundary for graceful failure:

```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={...} />
    }
    return this.props.children
  }
}
```

**Tasks**:
- [ ] Create ErrorBoundary component
- [ ] Create ErrorFallback UI
- [ ] Wrap App with ErrorBoundary
- [ ] Add error reporting/logging

### 2.4 Connection Status Indicator

Add visual indicator for API/SSE connection:

```typescript
// src/components/ConnectionStatus.tsx
function ConnectionStatus() {
  const { status } = useConnectionStatus()
  
  return (
    <div className={cn(
      'w-2 h-2 rounded-full',
      status === 'connected' && 'bg-green-500',
      status === 'reconnecting' && 'bg-yellow-500 animate-pulse',
      status === 'disconnected' && 'bg-red-500'
    )} />
  )
}
```

**Tasks**:
- [ ] Create useConnectionStatus hook
- [ ] Track SSE connection state in main.js
- [ ] Forward connection events via IPC
- [ ] Create ConnectionStatus component
- [ ] Add to App UI

---

## Phase 3: Testing & Quality

**Timeline**: 1-2 weeks  
**Priority**: Medium

### 3.1 Unit Tests for Hooks

Add test coverage for custom hooks:

```typescript
// src/hooks/__tests__/useSession.test.ts
describe('useSession', () => {
  it('initializes session on mount')
  it('handles optimistic message rendering')
  it('detects external messages')
  it('handles streaming updates')
  it('rolls back on error')
})
```

**Tasks**:
- [ ] Set up testing environment (Vitest + React Testing Library)
- [ ] Write tests for useSession
- [ ] Write tests for useSSE
- [ ] Write tests for useAutoFade (if kept)
- [ ] Add test scripts to package.json

### 3.2 Component Tests

Test React components:

```typescript
// src/components/__tests__/Message.test.tsx
describe('Message', () => {
  it('renders user message correctly')
  it('renders AI message with tool calls')
  it('renders external message with badge')
  it('renders shell command message')
})
```

**Tasks**:
- [ ] Write tests for Message components
- [ ] Write tests for App component
- [ ] Write tests for input handling
- [ ] Set up visual regression testing (optional)

### 3.3 Integration Tests

Expand test coverage:

**Tasks**:
- [ ] Add IPC communication tests
- [ ] Add main process unit tests
- [ ] Improve remote API test coverage
- [ ] Add CI/CD pipeline configuration

---

## Phase 4: noVNC & Web Interface

**Timeline**: 1 week  
**Priority**: Medium

### 4.1 Screenshot Capability

Add ability to capture canvas element as image:

**Tasks**:
- [ ] Research canvas-to-image export methods
- [ ] Add screenshot button to beta.html toolbar
- [ ] Implement download or copy-to-clipboard functionality
- [ ] Test across browsers

### 4.2 Clipboard Integration

Pull clipboard contents from VNC session:

**Tasks**:
- [ ] Research noVNC clipboard API
- [ ] Add "Copy from VNC" button to toolbar
- [ ] Auto-copy to host clipboard on click
- [ ] Show toast notification on success

### 4.3 Key Command Buttons

Send special key combinations to VNC:

**Tasks**:
- [ ] Add Alt+Tab button
- [ ] Add Ctrl+Alt+Delete button
- [ ] Add Super (Windows) key button
- [ ] Add other useful shortcuts (Ctrl+C, Ctrl+V, Escape)

### 4.4 UI Cleanup

- [ ] Remove non-functioning 'Reset' button
- [ ] Clean up toolbar layout
- [ ] Add tooltips to buttons

---

## Phase 5: Shell UI Templates

**Timeline**: 2-3 weeks  
**Priority**: Medium

### 5.1 Multi-Template Architecture

Allow cycling through different UI templates:

**Tasks**:
- [ ] Design template switching mechanism
- [ ] Create template configuration file
- [ ] Add runtime template selection
- [ ] Preserve API integration across templates

### 5.2 Template Selection UI

Let users choose their preferred interface:

**Tasks**:
- [ ] Add template selector to settings/menu
- [ ] Show template previews
- [ ] Remember user's template preference
- [ ] Hot-reload on template switch

### 5.3 External Template Integration

Integrate existing chat UI templates:

**Tasks**:
- [ ] Research open-source chat UI templates (React/Electron)
- [ ] Evaluate AI-focused chat templates
- [ ] Port one template as proof-of-concept
- [ ] Document template integration process

### 5.4 Template API Adapter

Enable swapping UI while preserving functionality:

**Tasks**:
- [ ] Define template interface contract
- [ ] Create adapter layer for OpenCode API
- [ ] Document required hooks/methods for templates
- [ ] Create template starter kit

---

## Phase 6: OpenCode Agent Improvements

**Timeline**: 1 week  
**Priority**: Medium

### 6.1 System Prompt Enhancement

Improve agent behavior and tone:

**Tasks**:
- [ ] Update system prompt for background app execution
- [ ] Add service-focused, encouraging tone
- [ ] Include guidance on product usage
- [ ] Test prompt changes with various queries

### 6.2 Application Registry

Create predefined list of available applications:

**Tasks**:
- [ ] Create `/home/vibe/.config/vibeos/applications.json`
- [ ] Map friendly names to commands (Chrome → google-chrome)
- [ ] Auto-generate from Dockerfile installed packages
- [ ] Include in system prompt context
- [ ] Copy from source on container build

### 6.3 Agent Context

Provide agent with environment awareness:

**Tasks**:
- [ ] Include available applications in context
- [ ] Add current working directory info
- [ ] Include open windows list
- [ ] Provide system capabilities summary

---

## Phase 7: Operating System Enhancements

**Timeline**: 1 week  
**Priority**: Low-Medium

### 7.1 Media Tools

Install media handling applications:

**Tasks**:
- [ ] Add ffmpeg to Dockerfile
- [ ] Add a PDF viewer (evince or similar)
- [ ] Add an image viewer (feh, eog, or similar)
- [ ] Test all tools work in container

### 7.2 CLI Tools

Install useful command-line utilities:

**Tasks**:
- [ ] Add htop for system monitoring
- [ ] Add ripgrep (rg) for fast searching
- [ ] Verify git is installed and configured
- [ ] Add ssh-client for remote connections
- [ ] Add common utilities (tree, jq, curl, wget)

### 7.3 Development Environment

Ensure development tools are available:

**Tasks**:
- [ ] Verify Node.js is installed (already present)
- [ ] Add Python 3 with pip (already present)
- [ ] Add common Python packages (requests, etc.)
- [ ] Document available development tools

### 7.4 Clipboard CLI Tools

Enable OpenCode/CLI to read and write the X11 clipboard:

**Tasks**:
- [ ] Install xclip or xsel in Dockerfile
- [ ] Create `scripts/tools/clipboard-read.sh` - read current clipboard contents
- [ ] Create `scripts/tools/clipboard-write.sh` - write text to clipboard
- [ ] Test clipboard tools work with X11 display
- [ ] Document clipboard usage for AI agent

**Usage Examples**:
```bash
# Read clipboard
clipboard-read.sh

# Write to clipboard
echo "text to copy" | clipboard-write.sh
# or
clipboard-write.sh "text to copy"
```

---

## Phase 8: Deployment Options

**Timeline**: 3-4 weeks  
**Priority**: Low

### 8.1 Common Core Architecture

Ensure builds share common foundation:

**Tasks**:
- [ ] Identify Docker-specific code to abstract
- [ ] Create shared configuration layer
- [ ] Document architecture for multi-target builds
- [ ] Create build system for different targets

### 8.2 Raspberry Pi Build

Create ARM64 build for Raspberry Pi:

**Tasks**:
- [ ] Research Pi-specific requirements
- [ ] Create ARM64 Dockerfile or build script
- [ ] Test on Raspberry Pi 4/5
- [ ] Document Pi-specific setup instructions
- [ ] Handle GPU/display differences

### 8.3 ISO Installer (Stretch Goal)

Create installable OS image:

**Tasks**:
- [ ] Research Linux live CD/installer creation
- [ ] Evaluate tools (Ubuntu Customization Kit, etc.)
- [ ] Create minimal base system specification
- [ ] Build proof-of-concept ISO
- [ ] Document installation process

---

## Phase 9: Onboarding Experience

**Timeline**: 2 weeks  
**Priority**: Low  
**Depends on**: Phase 5 (Shell UI Templates)

### 9.1 Guided Onboarding Chat

Create onboarding assistant interface:

**Tasks**:
- [ ] Design onboarding conversation flow
- [ ] Create onboarding-specific shell template
- [ ] Script welcome messages and guidance
- [ ] Include product feature highlights

### 9.2 Interactive Tutorial

Guide users through key features:

**Tasks**:
- [ ] Create tutorial prompts (try !chrome, try $ls)
- [ ] Show keyboard shortcut hints
- [ ] Demonstrate AI capabilities
- [ ] Track onboarding completion

### 9.3 First-Run Detection

Show onboarding only for new users:

**Tasks**:
- [ ] Detect first-run state
- [ ] Store onboarding completion flag
- [ ] Allow re-running onboarding from settings
- [ ] Skip for returning users

---

## Phase 10: Security & Production Readiness

**Timeline**: 2-3 weeks  
**Priority**: Medium

### 10.1 API Authentication

Add optional authentication for OpenCode API:

```typescript
// Environment variables
OPENCODE_AUTH_ENABLED=true
OPENCODE_AUTH_TOKEN=your-secret-token

// Request header
Authorization: Bearer your-secret-token
```

**Tasks**:
- [ ] Add auth middleware option to OpenCode server
- [ ] Update shell-ui to include auth header
- [ ] Update vibeos-send script for auth
- [ ] Document auth configuration

### 10.2 VNC Security

Improve VNC security options:

**Tasks**:
- [ ] Add VNC password support via environment variable
- [ ] Document security best practices
- [ ] Add TLS/SSL option for VNC

### 10.3 Container Hardening

**Tasks**:
- [ ] Research alternatives to seccomp:unconfined
- [ ] Add read-only root filesystem option
- [ ] Implement log rotation
- [ ] Add resource limits documentation

---

## Phase 11: Additional Features

**Timeline**: Ongoing  
**Priority**: Low-Medium

### 11.1 Session Persistence

Save and restore conversation history:

**Tasks**:
- [ ] Design session storage format
- [ ] Implement save on session.idle
- [ ] Implement restore on startup
- [ ] Add clear history option

### 11.2 Multi-Session Support

Support multiple concurrent AI sessions:

**Tasks**:
- [ ] Add session selector UI
- [ ] Update state management for multiple sessions
- [ ] Add session switching keyboard shortcuts

### 11.3 Message Pagination

Implement message pagination:

**Tasks**:
- [ ] Complete MESSAGE_LIMIT implementation
- [ ] Add "Load more" button
- [ ] Virtual scrolling for large histories

### 11.4 Desktop Icons

Show icons when main window hidden:

**Tasks**:
- [ ] Research PCManFM desktop mode
- [ ] Create desktop shortcut for shell toggle
- [ ] Add desktop icons for common apps

---

## Future Vision

### Long-term Goals

1. **Bare-Metal Support**: VibeOS as a standalone Linux distribution
2. **ARM64 Support**: Raspberry Pi and other ARM devices
3. **Wayland Migration**: Replace X11 with Wayland compositor
4. **Plugin System**: Extensible tool and MCP server integration
5. **Multi-User**: Support multiple concurrent users

### Research Areas

1. **Voice Interface**: Speech-to-text input, text-to-speech output
2. **Screen Understanding**: AI vision for desktop automation
3. **Collaborative Sessions**: Shared AI sessions between users
4. **Persistent Agents**: Long-running background AI tasks

---

## Success Metrics

### Phase 1-2 Completion Criteria (Code Organization & Architecture)

- [x] `main.js` under 200 lines (achieved: ~140 lines)
- [x] All modules have single responsibility
- [ ] Event bus handling all SSE events
- [ ] OpenCode client used throughout
- [x] No duplicate code in window scripts (shared library created)

### Phase 3 Completion Criteria (Testing)

- [ ] 80%+ test coverage for hooks
- [ ] All components have basic tests
- [ ] CI pipeline runs tests on PR

### Phase 4-5 Completion Criteria (noVNC & Shell UI)

- [ ] Screenshot button works in beta.html
- [ ] Clipboard copy from VNC works
- [ ] At least 2 shell UI templates available
- [ ] Template switching works at runtime

### Phase 6-7 Completion Criteria (Agent & OS)

- [ ] Agent runs apps in background by default
- [ ] Application registry file exists and is used
- [ ] All media tools installed and functional
- [ ] CLI tools available (htop, rg, etc.)

### Phase 8 Completion Criteria (Deployment)

- [ ] Raspberry Pi build runs successfully
- [ ] Common core shared between Docker and Pi builds

### Phase 10 Completion Criteria (Security)

- [ ] Auth works end-to-end
- [ ] Security documentation complete
- [ ] Production deployment guide

---

## Getting Started

**Phase 1 is complete.** To continue development:

1. Review this roadmap and AGENTS.md
2. Pick a phase/task that matches your goals
3. Create feature branches for changes
4. Update documentation as you go

```bash
# Development workflow
make dev            # Start container
make logs           # Monitor logs
make restart-shell  # After UI changes
make test           # Run tests
```

### Quick Reference

| Phase | Focus | Priority |
|-------|-------|----------|
| 1-2 | Code organization (DONE) | High |
| 3 | Testing | Medium |
| 4 | noVNC improvements | Medium |
| 5 | Shell UI templates | Medium |
| 6 | Agent improvements | Medium |
| 7 | OS enhancements | Low-Medium |
| 8 | Deployment (Pi, ISO) | Low |
| 9 | Onboarding | Low |
| 10 | Security | Medium |
| 11 | Additional features | Low-Medium |

---

## Related Documentation

- [AGENTS.md](../AGENTS.md) - AI agent instructions
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture
- [COMPONENTS.md](COMPONENTS.md) - Component documentation
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development guide
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Current feature status
