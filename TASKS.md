# VibeOS Active Tasks

> **Last Updated**: January 16, 2026  
> **Current Phase**: Phase 2 - Architecture Improvements

## Overview

This file tracks active development tasks for VibeOS. For the full development plan, see [docs/ROADMAP.md](docs/ROADMAP.md).

---

## Completed: Phase 1 - Code Organization

### 1.1 Main Process Modularization
- [x] Extract OpenCode API client to `api-client.js`
- [x] Extract SSE handling to `sse-handler.js`
- [x] Extract window management to `window-manager.js`
- [x] Extract IPC handlers to `ipc-handlers.js`
- [x] Extract polling logic to `polling.js`
- [x] Create centralized config module
- [x] Update main.js to orchestrate modules (~140 lines)

### 1.2 Code Cleanup
- [x] Remove `useAutoFade` hook (unused)
- [x] Remove `lib/parseCommand.ts` (duplicated main.js)
- [ ] Remove unused CSS classes
- [x] Remove unused configs (labwc, foot, alacritty)

### 1.3 Shared Automation Library
- [x] Create `scripts/tools/lib/window-utils.sh`
- [x] Update window scripts to use shared library
- [x] Add common error handling utilities

---

## Current: Phase 2 - Architecture Improvements

- [ ] Add React Error Boundary component
- [ ] Add Connection Status indicator
- [ ] Consolidate SSE handling (useSession/useSSE overlap)
- [ ] Create unified event bus (optional)

---

The tasks are layed out with separate epic-level concepts to be delivered, with context and specific tasks entailed. 

<htmlframe>

The HTML site used to interact with our noVNC session (currently beta.html), needs some improvement: 

- I want to be able to take a screenshot of the canvas element, or dump it to an object and export it as an image. I'm not sure if this is possible, but if we are able to do that from the html frame itself it would be a huge help. 
- I want to remove our 'reset' option, it is not currently functioning.
- I want to have a button which can pull out the current clipboard from our noVNC session (and automatically copy to current clipboard)
- I want to be able to send key commands etc. into vibeOS, specifically Alt-Tab, Ctrl-Alt-Delete, and any other useful key combination for our current operating system would be useful. 

</htmlframe>

<electronapp>

We are having a siginficant amount of trouble with our Electron application, not with the interface with opencode (that seems alright!), but with creating a useful, simple, beautiful design. For this task I want to make it easier for us to: 
- Try out more than one electron app as a 'default' interface that we can cycle through. 
- Allow the user to change which electron app they want to run from a list, so we can try out multiple example apps while we are trying to get the interface right
- I want to take an existing Electron/React/etc. template that is designed for chat interfaces (bonus if they are AI-related chat interfaces!) and try to get it running alongside our current default. 
- When we are able to get a working design from a template tha tthe user likes, we should be able to swap out the functionality of our current app into this new, more beautiful design. 

</electronapp>

<opencodeagent>

We should improve our opencode agent, make the system prompt/instructions more clear about: 
- Always running applications in the background and returning to the user once its done
- Having a predefined file (which is copied/checked in from source?) which has the list of applications available, the names that they go by (e.g. Chrome == google-chrome, Text Editor == mousepad), based on the applications we actually install in our Dockerfile. 
- We should adjust the tone of our agent to be one of helpful, service-focused language trying to encourage the user to find ways to use the product. 

</opencodeagent>

<operatingsystem>

Our desktop environment at the moment is useful, but we don't have a lot of applications that would be helpful to use on a desktop, we should install some applications that are useful! 
- ffmpeg
- a pdf viewer
- an image viewer (if none available already)
- common cli tools that are helpful (htop, rg, git, ssh-client)
- nodejs and python, in case we find them useful

</operatingsystem>

<deploymenttypes>

While this is a very useful tool when running in docker, we should ideally be able to turn this operating system into an installable OS. I'd like to start with a Raspberry Pi as the output, as it lends itself quite easily to this kind of setup. 

- We should try where possible not to duplicate our projects, building from a common core
- We should try and get a rasperry pi build up and running
- stretch goal would be an ISO-installer for installing this OS as a whole. 

</deploymenttypes>

<onboarding>

Depends on <electronapp>

Once we have the ability to have multiple running applications, one electron application i would like to build is a chat interface like our default, who on start has a process which "chats" with the user giving them guidance on how to use the product. 
- This needs some fleshing out, do this last. 

</onboarding>

---

---

## Notes

### Known Issues
1. `useSession` and `useSSE` both subscribe to SSE events (duplicate handling)
2. ~~`main.js` at 900 lines needs modularization~~ (FIXED - now ~140 lines)
3. ~~No error boundary - unhandled errors crash UI~~ (IN PROGRESS)
4. ~~`useAutoFade` hook exists but isn't used~~ (REMOVED)

### Architecture Notes
- Two-window system allows dock icon without stealing focus
- Icon window dynamically resizes for taskbar
- Command signal file (`/tmp/vibeos-command`) enables external control
- Window polling (1s) for taskbar, command polling (500ms) for signals
- Main process split into 7 modules in `shell-ui/src/main/`
