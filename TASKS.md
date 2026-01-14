<tasks>
- Create an AGENTS.md file, which understands this repo, how to run it, and gives strict instructions to update itself as new major changes occur. 
- We need a basic test strategy - one for performing remote actions that can determine whether our agent and its scripts are working correctly. the other is taking actions within the OS, using mouse and keyboard automation.
- There should be a 'stop' button which kills (in the opencode 'desktop' session) the current request to the LLM. Write the test, implement any fixes you find are necessary. 
- We should add a 'reset' configuration to our desktop manager, and we should expose that key command in our beta.html interface. Let's actually use this is as an opportunity to "reset" the current desktop session. this should clear the session entirely and start fresh. Add tests. 
- we should create an agent descriptor (or Claude skill?) which can interact easily with our running vibos instance. We should provide information about system requirements and other reference to our local documentation. I guess we should also include a local opencode agent which can perform remote actions on behafl of the user and have all the relevant details when it comes to how you develop/enhance this system.
<investigations>
- i want to investigate a better UI for our desktop chat. We should research animation libraries and design systems that make a beautiful message/notification interface so we can watch actions fly by!

<investigation-plan id="desktop-chat-ui">
## Shell UI Redesign: React + Motion Animation System

### Research Summary (Completed 2026-01-13)
Investigated design systems, animation libraries, and frameworks for building a beautiful 
notification/chat hybrid interface for VibeOS desktop. Decision: React + Motion (Framer Motion)
with Tailwind CSS for a smooth, professional animation system.

### Selected Stack
| Layer | Library | Purpose | Size |
|-------|---------|---------|------|
| Framework | React 18 + TypeScript | Component architecture | ~42KB |
| Animation | Motion (Framer Motion) | Smooth transitions, AnimatePresence, layout | ~24KB |
| Styling | Tailwind CSS v4 | Utility-first, CSS variables | ~10KB |
| Notifications | Sonner | Toast notifications for system events | ~7KB |
| UI Primitives | Radix UI | Accessible unstyled components | varies |
| Build | Vite | Fast HMR, ESM bundling | dev only |

### Key Design Decisions

#### Message Display: Newest-First (Top)
- Messages appear at TOP of feed, pushing older messages down
- This notification-style layout matches quick-action watching use case
- External API messages appear in main feed with visual "external" classifier
- Layout animations ensure smooth reflow when messages are added

#### Message Auto-Fade
- Messages slowly fade/shrink over time (long timeout ~5-10 minutes)
- Keeps interface clean for action-watching
- Faded messages still visible/expandable on hover
- Preserves full history in state for scroll-back

#### Animation Patterns by Message Type
| Type | Animation | Visual Treatment |
|------|-----------|------------------|
| AI Response | Spring slide-in from top | Standard bubble |
| User Input | Quick fade-in | Right-aligned, accent bg |
| Shell `$` | Terminal-style snap | Monospace, green tint |
| App Launch `!` | Scale-in like icon | Icon-prefixed card |
| External API | Slide from right + pulse | "External" badge, distinct border |
| Tool Execution | Layout accordion | Collapsible with progress |

### Implementation Phases

#### Phase 1: Migration Setup (COMPLETED 2026-01-13)
- [x] Add React 18 + TypeScript to shell-ui
- [x] Configure Vite for Electron renderer  
- [x] Set up Tailwind CSS with existing CSS variables (preserve dark theme)
- [x] Install Motion and Sonner
- [x] Create IPC bridge compatibility layer (preserve window.vibeos API)
- [x] Verify preload.js integration works with React

#### Phase 2: Core Components (COMPLETED 2026-01-13)
- [x] `<App />` - Root with providers
- [x] `<MessageFeed />` - Scrollable container with `layoutScroll`
- [x] `<AnimatedMessage />` - Wrapper with AnimatePresence
- [x] `<Message />` - Polymorphic component (type-based variants)
  - [x] `<AIMessage />` - Standard assistant response
  - [x] `<UserMessage />` - User input display
  - [ ] `<ShellCommand />` - Terminal-style `$` commands
  - [ ] `<AppLaunch />` - Icon-prefixed `!` commands
  - [ ] `<ExternalMessage />` - API-triggered with badge
- [x] `<PromptInput />` - Input with command detection
- [x] `<ToolExecution />` - Collapsible accordion with status
- [x] `<ThinkingIndicator />` - Animated dots

#### Phase 3: Animation System (PARTIAL - 2026-01-13)
- [x] Message entrance animations (type-specific variants)
- [ ] Message exit animations (fade-out on scroll/time)
- [x] Layout animations for sibling reflow
- [ ] Streaming content height animation
- [x] Tool execution progress states
- [x] Auto-fade system (opacity reduces over time) - hook implemented

#### Phase 4: Integration (COMPLETED 2026-01-13)
- [x] SSE event handling with React state
- [ ] External API message detection + classifier
- [x] Session management (reset, abort)
- [x] Keyboard shortcuts (Ctrl+Shift+R for reset)
- [x] Stop button functionality

#### Phase 5: Polish (PARTIAL - 2026-01-13)
- [x] Scroll position management (newest at top)
- [x] "Load more" for older messages
- [x] Hover-to-reveal for faded messages (via useAutoFade hook)
- [ ] Smooth scroll behavior
- [ ] Performance optimization (virtualization if needed)

### File Structure
```
shell-ui/
├── src/
│   ├── components/
│   │   ├── Message/
│   │   │   ├── index.ts              # Exports
│   │   │   ├── Message.tsx           # Polymorphic wrapper
│   │   │   ├── AIMessage.tsx
│   │   │   ├── UserMessage.tsx  
│   │   │   ├── ShellCommand.tsx
│   │   │   ├── AppLaunch.tsx
│   │   │   ├── ExternalMessage.tsx
│   │   │   └── variants.ts           # Animation variants
│   │   ├── Feed/
│   │   │   ├── MessageFeed.tsx
│   │   │   └── AnimatedMessage.tsx
│   │   ├── Input/
│   │   │   └── PromptInput.tsx
│   │   ├── Tool/
│   │   │   └── ToolExecution.tsx
│   │   ├── Status/
│   │   │   └── ThinkingIndicator.tsx
│   │   └── Layout/
│   │       └── Header.tsx
│   ├── hooks/
│   │   ├── useSession.ts
│   │   ├── useSSE.ts
│   │   └── useAutoFade.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── parseCommand.ts
│   │   └── cn.ts                     # clsx + tailwind-merge
│   ├── styles/
│   │   └── globals.css
│   ├── types/
│   │   └── message.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

### Animation Variants (Reference)
```typescript
// src/components/Message/variants.ts
export const messageVariants = {
  ai: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { type: "spring", stiffness: 300, damping: 30 }
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
    transition: { type: "spring", stiffness: 400, damping: 25 }
  },
  external: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
    transition: { type: "spring", stiffness: 200, damping: 20 }
  },
  user: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.1 }
  }
}
```

### New Dependencies
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "motion": "^12.0.0",
    "sonner": "^1.7.0",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.6.0",
    "tailwindcss": "^4.0.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.3.0"
  }
}
```

### Open Questions (To Resolve During Implementation)
1. Icon window (`icon.html`) - keep vanilla or migrate?
2. TypeScript strict mode from start?
3. Virtual scrolling needed for very long conversations?

### References
- Motion AnimatePresence: https://motion.dev/docs/react-animate-presence
- Motion Layout Animations: https://motion.dev/docs/react-layout-animations
- Sonner: https://sonner.emilkowal.ski/
- Radix ScrollArea: https://www.radix-ui.com/primitives/docs/components/scroll-area
- Tailwind CSS: https://tailwindcss.com/

</investigation-plan> 
 