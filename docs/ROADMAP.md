# VibeOS Development Roadmap

> **Version**: 2.1  
> **Updated**: January 16, 2026  
> **Status**: Active Development

## Overview

This roadmap outlines **future development phases** for VibeOS. For completed work, see [CHANGELOG.md](CHANGELOG.md).

**Completed phases**: 1-4, 6-7 (Code organization, architecture, testing, noVNC improvements, agent context, OS enhancements)

**Remaining phases**: 5, 8-11 (Templates, deployment, onboarding, security, additional features)

---

## Phase 5: Shell UI Templates

**Timeline**: 2-3 weeks  
**Priority**: Medium

### 5.1 Multi-Template Architecture (DONE)

Allow cycling through different UI templates:

- [x] Design template switching mechanism
- [x] Create template configuration file (`templates/types.ts`, `templates/index.ts`)
- [x] Add runtime template selection (localStorage persistence)
- [x] Preserve API integration across templates (TemplateProps interface)

### 5.2 Template Selection UI (DONE)

Let users choose their preferred interface:

- [x] Add template selector modal (`Ctrl+Shift+T`)
- [x] Show template list with descriptions
- [x] Remember user's template preference (localStorage)
- [x] Reload on template switch

### 5.3 External Template Integration

Integrate existing chat UI templates:

- [ ] Research open-source chat UI templates (React/Electron)
- [ ] Evaluate AI-focused chat templates
- [ ] Port one template as proof-of-concept
- [ ] Document template integration process

### 5.4 Template API Adapter (DONE)

Enable swapping UI while preserving functionality:

- [x] Define template interface contract (`TemplateProps`)
- [x] Create adapter layer for OpenCode API (`App.tsx` passes useSession to templates)
- [x] Document required hooks/methods for templates
- [ ] Create template starter kit (documentation)

---

## Phase 8: Deployment Options

**Timeline**: 3-4 weeks  
**Priority**: Low

### 8.1 Common Core Architecture

Ensure builds share common foundation:

- [ ] Identify Docker-specific code to abstract
- [ ] Create shared configuration layer
- [ ] Document architecture for multi-target builds
- [ ] Create build system for different targets

### 8.2 Raspberry Pi Build

Create ARM64 build for Raspberry Pi:

- [ ] Research Pi-specific requirements
- [ ] Create ARM64 Dockerfile or build script
- [ ] Test on Raspberry Pi 4/5
- [ ] Document Pi-specific setup instructions
- [ ] Handle GPU/display differences

### 8.3 ISO Installer (Stretch Goal)

Create installable OS image:

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

- [ ] Design onboarding conversation flow
- [ ] Create onboarding-specific shell template
- [ ] Script welcome messages and guidance
- [ ] Include product feature highlights

### 9.2 Interactive Tutorial

Guide users through key features:

- [ ] Create tutorial prompts (try !chrome, try $ls)
- [ ] Show keyboard shortcut hints
- [ ] Demonstrate AI capabilities
- [ ] Track onboarding completion

### 9.3 First-Run Detection

Show onboarding only for new users:

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

```bash
# Environment variables
OPENCODE_AUTH_ENABLED=true
OPENCODE_AUTH_TOKEN=your-secret-token
```

- [ ] Add auth middleware option to OpenCode server
- [ ] Update shell-ui to include auth header
- [ ] Update vibeos-send script for auth
- [ ] Document auth configuration

### 10.2 VNC Security

Improve VNC security options:

- [ ] Add VNC password support via environment variable
- [ ] Document security best practices
- [ ] Add TLS/SSL option for VNC

### 10.3 Container Hardening

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

- [ ] Design session storage format
- [ ] Implement save on session.idle
- [ ] Implement restore on startup
- [ ] Add clear history option

### 11.2 Multi-Session Support

Support multiple concurrent AI sessions:

- [ ] Add session selector UI
- [ ] Update state management for multiple sessions
- [ ] Add session switching keyboard shortcuts

### 11.3 Message Pagination

- [ ] Complete MESSAGE_LIMIT implementation
- [ ] Add "Load more" button
- [ ] Virtual scrolling for large histories

### 11.4 Desktop Icons

Show icons when main window hidden:

- [ ] Research PCManFM desktop mode
- [ ] Create desktop shortcut for shell toggle
- [ ] Add desktop icons for common apps

### 11.5 VNC Clipboard Integration

Complete the deferred clipboard feature:

- [ ] Investigate x11vnc CLIPBOARD/PRIMARY selection sync
- [ ] Test alternative clipboard sync methods
- [ ] Add "Copy from VNC" button to toolbar

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

## Quick Reference

| Phase | Focus | Priority | Status |
|-------|-------|----------|--------|
| 5 | Shell UI templates | Medium | 5.1-5.2, 5.4 done |
| 8 | Deployment (Pi, ISO) | Low | Not started |
| 9 | Onboarding | Low | Not started |
| 10 | Security | Medium | Not started |
| 11 | Additional features | Low-Medium | Not started |

---

## Related Documentation

- [CHANGELOG.md](CHANGELOG.md) - Completed work history
- [AGENTS.md](../AGENTS.md) - AI agent instructions
- [COMPONENTS.md](COMPONENTS.md) - Component documentation
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development guide
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Current feature status
