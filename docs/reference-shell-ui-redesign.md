# Shell UI Redesign: Technical Reference

This document provides technical reference for the planned Shell UI redesign, migrating from vanilla JavaScript to React with Motion animations.

> **Status**: Investigation Complete, Implementation Pending  
> **See**: [TASKS.md](../TASKS.md) for the full implementation plan

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Electron + React Integration](#electron--react-integration)
4. [Motion (Framer Motion) Reference](#motion-framer-motion-reference)
5. [Tailwind CSS Integration](#tailwind-css-integration)
6. [OpenCode API Integration](#opencode-api-integration)
7. [Message Types and Animations](#message-types-and-animations)
8. [Migration Strategy](#migration-strategy)

---

## Overview

### Current Architecture

The existing shell-ui is a vanilla JavaScript Electron app:

```
shell-ui/
├── main.js         # Electron main process
├── preload.js      # IPC bridge (window.vibeos)
├── index.html      # Monolithic UI + CSS + JS
├── icon.html       # Dock icon window
└── package.json    # electron, eventsource, marked
```

### Target Architecture

React + Motion + Tailwind with Vite bundling:

```
shell-ui/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities
│   ├── styles/         # Global CSS
│   ├── types/          # TypeScript types
│   ├── App.tsx         # Root component
│   └── main.tsx        # Entry point
├── main.js             # Electron main (unchanged)
├── preload.js          # IPC bridge (unchanged)
├── index.html          # Vite entry
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Newest-first (top)** | Notification-style, watch actions fly by |
| **Auto-fade messages** | Keep interface clean over time |
| **Type-specific animations** | Visual distinction for `$`, `!`, AI, external |
| **External API classifier** | Badge/border for API-triggered messages |
| **Preserve IPC bridge** | `window.vibeos` API stays the same |

---

## Technology Stack

### Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "motion": "^12.0.0",
    "sonner": "^1.7.0",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0",
    "eventsource": "^2.0.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.6.0",
    "tailwindcss": "^4.0.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "electron": "^33.0.0",
    "electron-builder": "^25.0.0"
  }
}
```

### Bundle Size Estimates

| Library | Size (gzipped) | Purpose |
|---------|----------------|---------|
| React + ReactDOM | ~42KB | UI framework |
| Motion | ~24KB | Animations |
| Tailwind CSS | ~10KB | Styling (purged) |
| Sonner | ~7KB | Toast notifications |
| Radix ScrollArea | ~5KB | Accessible scroll |
| **Total** | ~88KB | Acceptable for Electron |

---

## Electron + React Integration

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',  // Required for Electron file:// protocol
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Main Process (main.js)

The main process remains largely unchanged. Key integration points:

```javascript
// Load the built React app instead of raw index.html
mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

// IPC handlers remain the same
ipcMain.handle('init-session', async () => { /* ... */ });
ipcMain.handle('submit-input', async (event, input) => { /* ... */ });
ipcMain.handle('get-messages', async () => { /* ... */ });
ipcMain.handle('abort', async () => { /* ... */ });
ipcMain.handle('reset-session', async () => { /* ... */ });
```

### Preload Bridge (preload.js)

The `window.vibeos` API stays the same:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vibeos', {
  initSession: () => ipcRenderer.invoke('init-session'),
  submitInput: (input) => ipcRenderer.invoke('submit-input', input),
  getMessages: () => ipcRenderer.invoke('get-messages'),
  abort: () => ipcRenderer.invoke('abort'),
  resetSession: () => ipcRenderer.invoke('reset-session'),
  
  onOpencodeEvent: (callback) => {
    ipcRenderer.on('opencode-event', (event, data) => callback(data));
  },
  
  onSessionReset: (callback) => {
    ipcRenderer.on('session-reset', () => callback());
  },
});
```

### TypeScript Types for IPC

```typescript
// src/types/vibeos.d.ts
interface Message {
  info: {
    id: string;
    sessionID: string;
    role: 'user' | 'assistant';
    time: { created: number };
  };
  parts: MessagePart[];
}

interface MessagePart {
  type: 'text' | 'tool';
  text?: string;
  tool?: string;
  state?: ToolState;
}

interface VibeOS {
  initSession(): Promise<{ success: boolean; session?: any; messages?: Message[]; error?: string }>;
  submitInput(input: string): Promise<{ success: boolean; type?: string; error?: string }>;
  getMessages(): Promise<{ success: boolean; messages?: Message[] }>;
  abort(): Promise<void>;
  resetSession(): Promise<void>;
  onOpencodeEvent(callback: (event: any) => void): void;
  onSessionReset(callback: () => void): void;
}

declare global {
  interface Window {
    vibeos: VibeOS;
  }
}
```

---

## Motion (Framer Motion) Reference

### Core Concepts

**Motion Component**: The base animated element.

```tsx
import { motion } from 'motion/react';

<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  Content
</motion.div>
```

**AnimatePresence**: Enables exit animations when elements are removed.

```tsx
import { AnimatePresence } from 'motion/react';

<AnimatePresence mode="popLayout" initial={false}>
  {messages.map((msg) => (
    <motion.div key={msg.id} exit={{ opacity: 0 }}>
      <Message {...msg} />
    </motion.div>
  ))}
</AnimatePresence>
```

**Layout Animations**: Automatic animation when element position/size changes.

```tsx
<motion.div layout layoutId={msg.id}>
  {/* Content that may change size */}
</motion.div>
```

### Animation Variants

Reusable animation configurations:

```typescript
// src/components/Message/variants.ts
export const messageVariants = {
  ai: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  user: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.1 }
  },
  shell: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 }
  },
  app: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  external: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
    transition: { type: 'spring', stiffness: 200, damping: 20 }
  }
};
```

### AnimatePresence Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `sync` | Enter/exit simultaneously | Default, fast |
| `wait` | Exit completes before enter | Sequential content |
| `popLayout` | Exiting elements "pop" out, siblings reflow | Lists with layout animations |

For the message feed, `popLayout` is recommended:

```tsx
<AnimatePresence mode="popLayout">
  {messages.map((msg) => (
    <motion.div key={msg.id} layout exit={{ opacity: 0 }}>
      <Message {...msg} />
    </motion.div>
  ))}
</AnimatePresence>
```

### Scrollable Containers

When animating within a scrollable container, add `layoutScroll`:

```tsx
<motion.div 
  layoutScroll 
  style={{ overflow: 'auto', height: '100%' }}
>
  <AnimatePresence mode="popLayout">
    {/* messages */}
  </AnimatePresence>
</motion.div>
```

### Spring Physics

Motion uses spring physics for natural-feeling animations:

```typescript
transition: {
  type: 'spring',
  stiffness: 300,  // Higher = faster/snappier
  damping: 30,     // Higher = less bouncy
  mass: 1          // Higher = more momentum
}
```

Common presets:
- **Snappy**: `{ stiffness: 400, damping: 30 }`
- **Bouncy**: `{ stiffness: 300, damping: 10 }`
- **Smooth**: `{ stiffness: 200, damping: 25 }`

---

## Tailwind CSS Integration

### Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Preserve existing VibeOS theme
        bg: '#0a0a0a',
        surface: '#1a1a1a',
        'surface-hover': '#252525',
        border: '#333',
        text: '#e0e0e0',
        'text-muted': '#888',
        'text-dim': '#666',
        accent: '#7c3aed',
        'accent-glow': 'rgba(124, 58, 237, 0.3)',
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
```

### CSS Variables Bridge

To maintain compatibility with existing CSS:

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-color: theme('colors.bg');
  --surface-color: theme('colors.surface');
  --border-color: theme('colors.border');
  --text-color: theme('colors.text');
  --accent-color: theme('colors.accent');
  --accent-glow: theme('colors.accent-glow');
  --success-color: theme('colors.success');
  --error-color: theme('colors.error');
  --warning-color: theme('colors.warning');
}
```

### Utility Function

```typescript
// src/lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Usage:

```tsx
<div className={cn(
  'rounded-lg p-4',
  'bg-surface border border-border',
  isActive && 'border-accent'
)}>
```

---

## OpenCode API Integration

### Existing IPC Flow

```
React Component
      │
      ▼
window.vibeos.submitInput(text)
      │
      ▼
preload.js (IPC invoke)
      │
      ▼
main.js (HTTP to OpenCode)
      │
      ▼
OpenCode Server (:4096)
      │
      ▼
SSE Events (back to main.js)
      │
      ▼
ipcRenderer.send('opencode-event', data)
      │
      ▼
React State Update
```

### React Hook for Session

```typescript
// src/hooks/useSession.ts
import { useState, useEffect, useCallback } from 'react';

interface UseSessionReturn {
  messages: Message[];
  isLoading: boolean;
  isWaiting: boolean;
  error: string | null;
  sendMessage: (input: string) => Promise<void>;
  abort: () => Promise<void>;
  reset: () => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize session
    window.vibeos.initSession().then((result) => {
      if (result.success) {
        setMessages(result.messages || []);
      } else {
        setError(result.error || 'Failed to connect');
      }
      setIsLoading(false);
    });

    // Subscribe to SSE events
    window.vibeos.onOpencodeEvent((event) => {
      handleEvent(event);
    });

    // Subscribe to reset events
    window.vibeos.onSessionReset(() => {
      setMessages([]);
    });
  }, []);

  const handleEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'session.status':
        setIsWaiting(event.properties?.status?.type === 'busy');
        break;
      case 'session.idle':
        refreshMessages();
        break;
      case 'message.part.updated':
        // Handle streaming updates
        break;
    }
  }, []);

  const refreshMessages = async () => {
    const result = await window.vibeos.getMessages();
    if (result.success) {
      setMessages(result.messages || []);
    }
  };

  const sendMessage = async (input: string) => {
    setIsWaiting(true);
    const result = await window.vibeos.submitInput(input);
    if (!result.success) {
      setError(result.error || 'Failed to send');
      setIsWaiting(false);
    }
  };

  const abort = async () => {
    await window.vibeos.abort();
    setIsWaiting(false);
  };

  const reset = async () => {
    await window.vibeos.resetSession();
    setMessages([]);
  };

  return { messages, isLoading, isWaiting, error, sendMessage, abort, reset };
}
```

### Detecting External API Messages

Messages triggered via the external API (e.g., `vibeos-send`) can be detected by checking:

1. **Session origin tracking** (if implemented in main.js)
2. **Time-based heuristics** (message appeared without local input)
3. **Explicit flag** (add to message metadata)

Proposed approach - add to main.js:

```javascript
// Track if we're expecting a local response
let expectingLocalResponse = false;

ipcMain.handle('submit-input', async (event, input) => {
  expectingLocalResponse = true;
  // ... send message
});

function handleServerEvent(event) {
  if (event.type === 'message.created' && event.properties?.info?.role === 'user') {
    // Check if this was triggered locally
    const isExternal = !expectingLocalResponse;
    expectingLocalResponse = false;
    
    mainWindow.webContents.send('opencode-event', {
      ...event,
      isExternal
    });
  }
}
```

---

## Message Types and Animations

### Message Type Detection

```typescript
// src/lib/parseCommand.ts
export type MessageType = 'ai' | 'user' | 'shell' | 'app' | 'external';

export interface ParsedInput {
  type: 'opencode' | 'shell' | 'app';
  value: string;
  app?: string;
}

export function parseInput(input: string): ParsedInput {
  if (input.startsWith('$')) {
    return { type: 'shell', value: input.slice(1).trim() };
  }
  if (input.startsWith('!')) {
    const app = input.slice(1).trim().split(' ')[0];
    return { type: 'app', value: input.slice(1).trim(), app };
  }
  return { type: 'opencode', value: input };
}

export function getMessageType(message: Message, isExternal?: boolean): MessageType {
  if (message.info.role === 'user') {
    if (isExternal) return 'external';
    
    const textPart = message.parts.find(p => p.type === 'text');
    const text = textPart?.text || '';
    
    if (text.startsWith('$')) return 'shell';
    if (text.startsWith('!')) return 'app';
    return 'user';
  }
  return 'ai';
}
```

### Visual Treatment by Type

| Type | Background | Border | Icon | Animation |
|------|------------|--------|------|-----------|
| AI | `bg-surface` | `border-border` | None | Slide from top |
| User | `bg-accent/20` | `border-accent/30` | None | Quick scale |
| Shell | `bg-emerald-950/30` | `border-emerald-800/30` | Terminal | Snap from left |
| App | `bg-surface` | `border-border` | App icon | Scale in |
| External | `bg-amber-950/20` | `border-amber-600/50` + pulse | API badge | Slide from right |

---

## Migration Strategy

### Phase 1: Setup (No Breaking Changes)

1. Add Vite, React, TypeScript, Tailwind to shell-ui
2. Create `src/` directory with React structure
3. Keep existing `index.html` working
4. Build React app to `dist/`
5. Update main.js to load from `dist/index.html`

### Phase 2: Component Migration

1. Create React components matching existing functionality
2. Port state management to React hooks
3. Port SSE handling to useEffect
4. Verify IPC bridge works with React

### Phase 3: Animation Enhancement

1. Add Motion animations to components
2. Implement type-specific variants
3. Add auto-fade system
4. Polish transitions

### Phase 4: Testing

1. Verify all existing functionality works
2. Test external API message handling
3. Test session reset
4. Test stop button
5. Performance testing

### Rollback Plan

If issues arise, the migration can be rolled back by:

1. Keeping original `index.html` as `index.vanilla.html`
2. Changing main.js `loadFile` path back to original
3. No changes to main.js IPC handlers required

---

## Related Documentation

- [COMPONENTS.md](./COMPONENTS.md) - Current shell-ui implementation details
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development environment setup
- [reference-api.md](./reference-api.md) - OpenCode API reference
- [TASKS.md](../TASKS.md) - Full implementation plan with phases
