# Shell UI Design Schematic

> Design document for the VibeOS Shell UI redesign  
> Status: In Progress  
> Last Updated: January 14, 2026

## Table of Contents

1. [Design Overview](#design-overview)
2. [Layout Architecture](#layout-architecture)
3. [Component Specifications](#component-specifications)
4. [Animation System](#animation-system)
5. [Color & Typography](#color--typography)
6. [Interaction Patterns](#interaction-patterns)
7. [Accessibility](#accessibility)

---

## Design Overview

### Core Concept

The VibeOS Shell UI is a **stream-style chat interface** where:

- **Input lives at the TOP** of the window
- **New messages appear immediately below the input**
- **Older messages stack downward** and fade as they scroll away
- **The interface feels like a live activity feed**, not a traditional chat

### Design Principles

1. **Lean for performance** - Minimal assets, efficient rendering
2. **Explicit and obvious** - Icons with labels, clear affordances  
3. **Accessible** - WCAG 2.0 AA compliant
4. **Minimal design** - Only essential elements
5. **Consistent** - Unified visual language throughout

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Message order | Newest at top | Activity feed pattern, watch actions flow by |
| Input position | Top of window | Natural reading flow: input -> immediate response |
| Auto-fade | Scroll-based | Older = further down = more faded |
| External messages | Badge + amber border | Clear distinction from local input |
| Layout | Centered column | Clean, focused reading experience |

---

## Layout Architecture

### Window Structure

```
+------------------------------------------------------------------+
|                        [Window Frame]                              |
|  +--------------------------------------------------------------+  |
|  |                      HEADER (optional)                        |  |
|  |  Status indicators, session info                              |  |
|  +--------------------------------------------------------------+  |
|  |                                                                |  |
|  |  +----------------------------------------------------------+  |  |
|  |  |                    PROMPT INPUT                           |  |  |
|  |  |  [Icon] Type a message...              [Stop] [Settings]  |  |  |
|  |  +----------------------------------------------------------+  |  |
|  |                                                                |  |
|  |  +----------------------------------------------------------+  |  |
|  |  |                   MESSAGE FEED                            |  |  |
|  |  |                                                           |  |  |
|  |  |  [Newest Message - Full Opacity]                          |  |  |
|  |  |  +------------------------------------------------------+ |  |  |
|  |  |  | AI Response with tool calls...                        | |  |  |
|  |  |  +------------------------------------------------------+ |  |  |
|  |  |                                                           |  |  |
|  |  |  [Older Message - Slightly Faded]                         |  |  |
|  |  |  +------------------------------------------------------+ |  |  |
|  |  |  | User: Previous prompt                                 | |  |  |
|  |  |  +------------------------------------------------------+ |  |  |
|  |  |                                                           |  |  |
|  |  |  [Even Older - More Faded]                                |  |  |
|  |  |  +------------------------------------------------------+ |  |  |
|  |  |  | AI: Earlier response...                               | |  |  |
|  |  |  +------------------------------------------------------+ |  |  |
|  |  |                                                           |  |  |
|  |  |           ... fades to ~20% opacity ...                   |  |  |
|  |  |                                                           |  |  |
|  |  +----------------------------------------------------------+  |  |
|  |                                                                |  |
|  +--------------------------------------------------------------+  |
|  |                      STATUS BAR                               |  |
|  |  [Connection] [Session: desktop]              [Ctrl+Shift+R]  |  |
|  +--------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

### Dimensions & Spacing

| Element | Specification |
|---------|---------------|
| Max content width | `max-w-3xl` (768px) |
| Horizontal padding | `px-4` (16px) |
| Message gap | `gap-3` (12px) |
| Input height | ~56px (auto-growing textarea) |
| Border radius | `rounded-xl` for containers, `rounded-lg` for messages |

### CSS Grid/Flex Structure

```tsx
// Root container - full viewport
<div className="h-screen w-screen flex flex-col bg-zinc-950">
  
  // Centered content column
  <main className="flex-1 flex flex-col items-center overflow-hidden">
    <div className="w-full max-w-3xl h-full flex flex-col">
      
      // Input area (top, fixed height)
      <section className="shrink-0 p-4">
        <PromptInput />
      </section>
      
      // Message feed (grows, scrollable)
      <section className="flex-1 overflow-y-auto px-4 pb-4">
        <MessageFeed />
      </section>
      
    </div>
  </main>
  
  // Status bar (bottom, fixed)
  <StatusBar />
  
</div>
```

---

## Component Specifications

### 1. PromptInput

**Purpose**: Primary user input for sending messages to OpenCode

**Visual Design**:
```
+------------------------------------------------------------------+
|  +--  ----------------------------------------------------+  [S]  |
|  | >_ | Type a message, $command, or !app...              |  [X]  |
|  +----+---------------------------------------------------+       |
+------------------------------------------------------------------+
     ^              ^                                          ^
   Icon         Textarea                               Action buttons
```

**States**:
| State | Visual Treatment |
|-------|------------------|
| Idle | Muted border, placeholder text |
| Focused | Accent border glow, brighter background |
| Loading | Pulsing border, "Stop" button visible |
| Disabled | Reduced opacity, no interaction |

**Props**:
```typescript
interface PromptInputProps {
  onSubmit: (input: string) => void
  onAbort: () => void
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
}
```

---

### 2. MessageFeed

**Purpose**: Scrollable container for all messages with scroll-based fade

**Visual Design**:
- Messages stack vertically with `gap-3`
- Newest message at top (full opacity)
- Opacity decreases as messages scroll down
- Minimum opacity: 20%
- Hover reveals full opacity on any message

**Scroll Fade Algorithm**:
```typescript
// Calculate opacity based on distance from top of scroll container
function getScrollFadeOpacity(
  elementTop: number,
  scrollTop: number,
  containerHeight: number
): number {
  const distanceFromTop = elementTop - scrollTop
  const fadeStart = 100  // px before fade begins
  const fadeEnd = containerHeight * 0.8  // 80% of container height
  
  if (distanceFromTop < fadeStart) return 1
  if (distanceFromTop > fadeEnd) return 0.2
  
  const fadeProgress = (distanceFromTop - fadeStart) / (fadeEnd - fadeStart)
  return 1 - (fadeProgress * 0.8)  // 1.0 -> 0.2
}
```

---

### 3. Message Types

#### 3.1 User Message

**Visual Design**:
```
+------------------------------------------------------------------+
|  [Avatar]  User                                         12:34 PM  |
|  +--------------------------------------------------------------+ |
|  |  The message content goes here...                             | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

**Styling**:
- Background: `bg-zinc-900/50`
- Border: `border border-zinc-800`
- Text: `text-zinc-100`

#### 3.2 AI Message

**Visual Design**:
```
+------------------------------------------------------------------+
|  [V Logo]  VibeOS                                       12:34 PM  |
|  +--------------------------------------------------------------+ |
|  |  AI response with **markdown** support                        | |
|  |                                                                | |
|  |  - Bullet points                                               | |
|  |  - Code blocks with syntax highlighting                        | |
|  |                                                                | |
|  |  +----------------------------------------------------------+  | |
|  |  | [Tool] bash                                    [Expand]  |  | |
|  |  | $ ls -la                                                 |  | |
|  |  +----------------------------------------------------------+  | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

**Styling**:
- Background: `bg-zinc-900/30`
- Border: `border border-zinc-800/50`
- Accent: Subtle violet glow on left edge

#### 3.3 Shell Command ($)

**Visual Design**:
```
+------------------------------------------------------------------+
|  [Terminal]  Shell Command                              12:34 PM  |
|  +--------------------------------------------------------------+ |
|  |  $ npm install                                                | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

**Styling**:
- Background: `bg-emerald-950/20`
- Border: `border border-emerald-800/30`
- Icon: Terminal icon (Lucide)
- Font: Monospace for command text

#### 3.4 App Launch (!)

**Visual Design**:
```
+------------------------------------------------------------------+
|  [App Icon]  Launched: chrome                           12:34 PM  |
+------------------------------------------------------------------+
```

**Styling**:
- Background: `bg-blue-950/20`
- Border: `border border-blue-800/30`
- Compact: Single line, no expanded content

#### 3.5 External API Message

**Visual Design**:
```
+------------------------------------------------------------------+
|  [API Badge]  External                                  12:34 PM  |
|  +--------------------------------------------------------------+ |
|  |  Message from vibeos-send or external API                     | |
|  +--------------------------------------------------------------+ |
|  [Pulsing amber border]                                           |
+------------------------------------------------------------------+
```

**Styling**:
- Background: `bg-amber-950/20`
- Border: `border-2 border-amber-600/50` with pulse animation
- Badge: "API" label in amber
- Animation: Slides in from right

---

### 4. Tool Execution

**Purpose**: Display tool calls (bash, file writes, etc.) within AI messages

**Visual Design (Collapsed)**:
```
+--------------------------------------------------------------+
|  [Wrench]  bash                              [v Expand]       |
+--------------------------------------------------------------+
```

**Visual Design (Expanded)**:
```
+--------------------------------------------------------------+
|  [Wrench]  bash                              [^ Collapse]     |
|  +----------------------------------------------------------+ |
|  |  $ cat package.json                                       | |
|  +----------------------------------------------------------+ |
|  |  Output:                                                  | |
|  |  {                                                        | |
|  |    "name": "vibeos-shell",                                | |
|  |    ...                                                    | |
|  |  }                                                        | |
|  +----------------------------------------------------------+ |
+--------------------------------------------------------------+
```

**States**:
| State | Icon | Color |
|-------|------|-------|
| Running | Spinner | Amber |
| Success | Check | Green |
| Error | X | Red |

---

### 5. ThinkingIndicator

**Purpose**: Show AI is processing/generating response

**Visual Design**:
```
+--------------------------------------------------------------+
|  [V Logo]  VibeOS is thinking...                              |
|            [o] [o] [o]  <- animated dots                      |
+--------------------------------------------------------------+
```

**Animation**: Three dots with staggered bounce animation

---

### 6. StatusBar

**Purpose**: Show connection status, session info, keyboard shortcuts

**Visual Design**:
```
+------------------------------------------------------------------+
|  [Green dot] Connected  |  Session: desktop  |  Ctrl+Shift+R Reset |
+------------------------------------------------------------------+
```

**Styling**:
- Background: `bg-zinc-900/80` with backdrop blur
- Text: `text-zinc-500` (muted)
- Height: 32px

---

## Animation System

### Animation Variants by Message Type

```typescript
const messageAnimations = {
  // AI responses - spring slide down from top
  ai: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  
  // User input - quick fade-scale
  user: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 }
  },
  
  // Shell commands - snap from left
  shell: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 }
  },
  
  // App launches - icon-style scale
  app: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  
  // External API - slide from right with attention
  external: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
    transition: { type: 'spring', stiffness: 250, damping: 25 }
  }
}
```

### AnimatePresence Configuration

```tsx
<AnimatePresence mode="popLayout" initial={false}>
  {messages.map((msg) => (
    <motion.div
      key={msg.info.id}
      layout
      {...messageAnimations[getMessageType(msg)]}
      style={{ opacity: getScrollFadeOpacity(msg) }}
    >
      <Message message={msg} />
    </motion.div>
  ))}
</AnimatePresence>
```

### Scroll Fade Implementation

Messages fade based on their distance from the input area:

```
Input Area (top)
     |
     v
[Message 1] opacity: 1.0    <- Newest, full visibility
[Message 2] opacity: 0.85
[Message 3] opacity: 0.7
[Message 4] opacity: 0.55
[Message 5] opacity: 0.4
[Message 6] opacity: 0.25
[Message 7] opacity: 0.2    <- Oldest visible, minimum opacity
     |
     v
(scroll to see more)
```

---

## Color & Typography

### Color Palette

```css
:root {
  /* Backgrounds */
  --bg-primary: #09090b;      /* zinc-950 */
  --bg-surface: #18181b;      /* zinc-900 */
  --bg-elevated: #27272a;     /* zinc-800 */
  
  /* Borders */
  --border-default: #27272a;  /* zinc-800 */
  --border-muted: #3f3f46;    /* zinc-700 */
  
  /* Text */
  --text-primary: #fafafa;    /* zinc-50 */
  --text-secondary: #a1a1aa;  /* zinc-400 */
  --text-muted: #71717a;      /* zinc-500 */
  
  /* Accent */
  --accent-primary: #8b5cf6;  /* violet-500 */
  --accent-glow: rgba(139, 92, 246, 0.15);
  
  /* Status */
  --status-success: #22c55e;  /* green-500 */
  --status-warning: #f59e0b;  /* amber-500 */
  --status-error: #ef4444;    /* red-500 */
  
  /* Message Types */
  --msg-shell-bg: rgba(6, 78, 59, 0.2);     /* emerald tint */
  --msg-shell-border: rgba(5, 150, 105, 0.3);
  --msg-app-bg: rgba(30, 58, 138, 0.2);     /* blue tint */
  --msg-app-border: rgba(59, 130, 246, 0.3);
  --msg-external-bg: rgba(120, 53, 15, 0.2); /* amber tint */
  --msg-external-border: rgba(217, 119, 6, 0.5);
}
```

### Typography Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Message text | 14px (text-sm) | 400 | 1.6 |
| Code blocks | 13px | 400 (mono) | 1.5 |
| Timestamps | 12px (text-xs) | 400 | 1.4 |
| Labels | 12px (text-xs) | 500 | 1.4 |
| Headings | 16px (text-base) | 600 | 1.4 |

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", 
             Helvetica, Arial, sans-serif;

font-family-mono: "JetBrains Mono", "Fira Code", "SF Mono", Monaco, 
                  Consolas, monospace;
```

---

## Interaction Patterns

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Submit message |
| `Shift+Enter` | New line in input |
| `Escape` | Clear input / Close expanded tools |
| `Ctrl+Shift+R` | Reset session |
| `Super+Space` | Toggle window visibility |

### Input Prefixes

| Prefix | Action | Example |
|--------|--------|---------|
| (none) | Send to OpenCode AI | "Write a function..." |
| `$` | Execute shell command | "$ls -la" |
| `!` | Launch application | "!chrome" |

### Hover States

- **Messages**: Fade to full opacity on hover (overrides scroll fade)
- **Tool calls**: Show expand/collapse button
- **Timestamps**: Show full date/time tooltip

---

## Accessibility

### WCAG 2.0 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | All text meets 4.5:1 ratio |
| Focus indicators | Visible focus rings on all interactive elements |
| Screen readers | Proper ARIA labels and landmarks |
| Keyboard nav | Full keyboard accessibility |
| Reduced motion | Respects `prefers-reduced-motion` |

### ARIA Landmarks

```tsx
<main role="main" aria-label="VibeOS Chat Interface">
  <section aria-label="Message Input">
    <textarea aria-label="Type your message" />
  </section>
  <section aria-label="Message History" role="log" aria-live="polite">
    {/* Messages */}
  </section>
</main>
```

### Reduced Motion Support

```tsx
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

const animationConfig = prefersReducedMotion
  ? { duration: 0 }
  : { type: 'spring', stiffness: 300, damping: 30 }
```

---

## Component File Structure

```
shell-ui/src/
├── App.tsx                      # Root layout
├── main.tsx                     # Entry point
├── components/
│   ├── ui/                      # shadcn base components
│   │   ├── button.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── avatar.tsx
│   │   └── collapsible.tsx
│   ├── Layout/
│   │   ├── index.ts
│   │   ├── Header.tsx           # Optional header
│   │   ├── StatusBar.tsx        # Bottom status bar
│   │   └── LoadingOverlay.tsx   # Initial loading state
│   ├── Input/
│   │   ├── index.ts
│   │   └── PromptInput.tsx      # Main input component
│   ├── Feed/
│   │   ├── index.ts
│   │   └── MessageFeed.tsx      # Scrollable message list
│   ├── Message/
│   │   ├── index.ts
│   │   ├── Message.tsx          # Polymorphic router
│   │   ├── UserMessage.tsx      # User input display
│   │   ├── AIMessage.tsx        # AI response display
│   │   ├── ShellMessage.tsx     # $ command display
│   │   ├── AppMessage.tsx       # ! app launch display
│   │   ├── ExternalMessage.tsx  # External API display
│   │   └── variants.ts          # Animation definitions
│   ├── Tool/
│   │   ├── index.ts
│   │   └── ToolExecution.tsx    # Tool call display
│   └── Status/
│       ├── index.ts
│       └── ThinkingIndicator.tsx
├── hooks/
│   ├── useSession.ts            # Session state management
│   ├── useSSE.ts                # Server-sent events
│   └── useScrollFade.ts         # Scroll-based opacity
├── lib/
│   ├── api.ts                   # IPC bridge
│   ├── cn.ts                    # Class name utility
│   ├── markdown.ts              # Markdown rendering
│   └── parseCommand.ts          # Input prefix parsing
├── types/
│   ├── message.ts               # Message types
│   └── vibeos.d.ts              # Window.vibeos types
└── styles/
    └── globals.css              # Global styles
```

---

## Next Steps

1. **Implement Layout Rebuild** - Fix centering, move input to top
2. **Create useScrollFade hook** - Scroll-based opacity calculation
3. **Update MessageFeed** - Reverse order, integrate scroll fade
4. **Add External Message Detection** - main.js + component
5. **Polish Animations** - Refine variants for top-down flow
