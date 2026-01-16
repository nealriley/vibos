# VibeOS Changelog

All notable changes to VibeOS are documented here.

---

## [Cleanup Branch] - January 16, 2026

Major cleanup and enhancement release completing Phases 1-4, 6-7 of the roadmap.

### Phase 1: Code Organization

**Shell UI Main Process Modularization**
- Refactored `main.js` from 900 lines to ~140 lines
- Extracted 7 focused modules to `shell-ui/src/main/`:
  - `config.js` - Configuration constants and safe logging
  - `api-client.js` - OpenCode HTTP client functions
  - `sse-handler.js` - SSE subscription and event handling
  - `window-manager.js` - Icon and main window management
  - `polling.js` - Window list and command signal polling
  - `launcher.js` - App and terminal launching
  - `ipc-handlers.js` - IPC handler registration

**Removed Unused Code**
- Deleted `useAutoFade.ts` hook (unused)
- Deleted `parseCommand.ts` (duplicated main.js logic)
- Removed unused config directories: `labwc/`, `foot/`, `alacritty/`

**Shared Automation Library**
- Created `scripts/tools/lib/window-utils.sh` with shared functions
- Refactored 9 window scripts to use the shared library
- Added error handling and logging utilities

### Phase 2: Architecture Improvements

**Error Handling**
- Added `ErrorBoundary` component for graceful React error handling
- Added `ErrorFallback` UI with retry functionality

**Connection Status**
- Added `ConnectionStatus` indicator component
- Created `useConnectionStatus` hook
- Visual feedback for API/SSE connection state

**SSE Consolidation**
- Merged SSE handling into `useSession` hook
- Removed redundant `useSSE` hook
- Cleaner event subscription model

### Phase 3: Testing

**Unit Test Infrastructure**
- Set up Vitest + React Testing Library
- Added `vitest.config.ts` and test setup
- Added test scripts to `package.json`

**Test Coverage (43 tests)**
- 9 tests for ErrorBoundary component
- 6 tests for useConnectionStatus hook
- 15 tests for useSession hook
- 13 tests for Message components

### Phase 4: noVNC Web Interface

**New Toolbar Buttons**
- **Screenshot**: Captures VNC canvas as PNG download
- **Record**: Toggle screen recording, saves WebM video
- **Alt+Tab**: Sends Alt+Tab key combination
- **Super**: Sends Super/Windows key
- **Run Cmd**: Execute commands via OpenCode API with copyable output

**UI Improvements**
- Removed non-functioning Reset button
- Added tooltips to all buttons
- Recording button pulses red while active
- Command modal with monospace output display

**Deferred**
- Clipboard button (noVNC clipboard event not firing reliably with x11vnc)

### Phase 6: OpenCode Agent Improvements

**Application Registry**
- Created `config/vibeos/applications.json`
- Maps friendly names to commands (e.g., "chrome" → "google-chrome")
- Includes browsers, terminals, editors, media tools, system utilities

**Agent Context**
- Created `/home/vibe/AGENTS.md` for OpenCode context
- Documents available applications and how to launch them
- Lists automation scripts in `/home/vibe/scripts/`
- Best practices (run GUI apps in background with `&`)

### Phase 7: Operating System Enhancements

**Media Tools Added**
- `ffmpeg` - Video/audio processing
- `feh` - Lightweight image viewer
- `evince` - PDF/document viewer

**System Utilities Added**
- `htop` - Interactive process viewer
- `tree` - Directory tree visualization
- `ripgrep` - Fast recursive search

**Desktop Accessories Added**
- `xarchiver` - Archive manager (zip, tar, 7z)
- `xpad` - Sticky notes
- `unzip`, `p7zip-full` - Archive format support

**Clipboard CLI Tools**
- `clipboard-read.sh` - Read X11 clipboard contents
- `clipboard-write.sh` - Write text to clipboard

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Commits | 23 |
| Files Changed | 50+ |
| Lines Added | ~2,500 |
| Lines Removed | ~1,200 |
| Unit Tests | 43 |
| New Toolbar Buttons | 5 |
| New Packages | 8 |

---

## Upgrade Notes

After pulling this branch:

```bash
# Rebuild the container to get new packages
docker compose down
docker compose up -d --build

# Run tests
cd shell-ui && npm test
```

### New Environment

The container now includes:
- Screen recording capability (browser-side)
- Command execution from web toolbar
- Sticky notes and archive manager
- Media viewing (images, PDFs, video)
- Enhanced CLI tools

### Breaking Changes

None - all changes are additive or internal refactoring.
