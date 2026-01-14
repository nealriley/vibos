# shadcn/ui Reference

> Beautifully designed, accessible components you own and control.

**Website:** https://ui.shadcn.com  
**GitHub:** https://github.com/shadcn-ui/ui (105k+ stars)

## Overview

shadcn/ui is NOT a traditional component library. Instead of installing a package, you copy the component source code into your project. This gives you:

- **Full control** over the code
- **No external dependencies** to update
- **Easy customization** without workarounds
- **AI-friendly** code that LLMs can understand and modify

### Philosophy

- **Open Code** - You own the component code
- **Composition** - Consistent, composable APIs
- **Distribution** - CLI for easy installation
- **Beautiful Defaults** - Great design out of the box

## Installation (Vite + React)

### 1. Setup Tailwind CSS

```bash
pnpm add tailwindcss @tailwindcss/vite
```

Add to `src/index.css`:
```css
@import "tailwindcss";
```

### 2. Configure Path Aliases

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

`vite.config.ts`:
```ts
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

### 3. Initialize shadcn/ui

```bash
pnpm dlx shadcn@latest init
```

### 4. Add Components

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card input
```

## Component Catalog

### Layout & Structure

| Component | Description |
|-----------|-------------|
| **Card** | Container with header, content, footer |
| **Separator** | Visual divider |
| **Aspect Ratio** | Maintain aspect ratios |
| **Scroll Area** | Custom scrollbar |
| **Resizable** | Resizable panels |

### Forms & Input

| Component | Description |
|-----------|-------------|
| **Button** | Clickable button with variants |
| **Input** | Text input field |
| **Textarea** | Multi-line text input |
| **Checkbox** | Checkbox with label |
| **Radio Group** | Radio button group |
| **Switch** | Toggle switch |
| **Slider** | Range slider |
| **Select** | Dropdown select |
| **Combobox** | Searchable select |
| **Date Picker** | Date selection |
| **Form** | Form with validation (React Hook Form) |

### Feedback & Status

| Component | Description |
|-----------|-------------|
| **Alert** | Informational message |
| **Badge** | Status indicator |
| **Progress** | Progress bar |
| **Skeleton** | Loading placeholder |
| **Spinner** | Loading spinner |
| **Toast / Sonner** | Notification toasts |

### Overlays & Dialogs

| Component | Description |
|-----------|-------------|
| **Dialog** | Modal dialog |
| **Sheet** | Slide-out panel |
| **Drawer** | Bottom/side drawer |
| **Popover** | Floating content |
| **Tooltip** | Hover hints |
| **Hover Card** | Rich hover preview |
| **Alert Dialog** | Confirmation dialog |
| **Context Menu** | Right-click menu |
| **Dropdown Menu** | Click menu |

### Navigation

| Component | Description |
|-----------|-------------|
| **Tabs** | Tab navigation |
| **Accordion** | Collapsible sections |
| **Collapsible** | Single collapse |
| **Navigation Menu** | Site navigation |
| **Breadcrumb** | Path navigation |
| **Pagination** | Page navigation |
| **Menubar** | Application menu bar |

### Data Display

| Component | Description |
|-----------|-------------|
| **Table** | Data table |
| **Data Table** | Advanced table with sorting/filtering |
| **Avatar** | User avatar |
| **Calendar** | Month calendar view |
| **Chart** | Data visualization |

## Button Component

The most commonly used component:

```tsx
import { Button } from "@/components/ui/button"

// Variants
<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button variant="destructive">Destructive</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>

// With Icon
<Button>
  <IconGitBranch /> New Branch
</Button>

// Loading state
<Button disabled>
  <Spinner /> Loading...
</Button>

// As different element
<Button asChild>
  <a href="/login">Login</a>
</Button>
```

## Card Component

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description here.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content goes here.</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

## Dialog Component

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description goes here.
      </DialogDescription>
    </DialogHeader>
    <div>Main content</div>
    <DialogFooter>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Input Component

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="grid gap-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="Enter email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>
```

## Tabs Component

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="account" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Make changes to your account here.</CardDescription>
      </CardHeader>
      <CardContent>
        <Input placeholder="Name" />
      </CardContent>
      <CardFooter>
        <Button>Save changes</Button>
      </CardFooter>
    </Card>
  </TabsContent>
  <TabsContent value="password">
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
      </CardHeader>
      <CardContent>
        <Input type="password" placeholder="Current password" />
        <Input type="password" placeholder="New password" />
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>
```

## Select Component

```tsx
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Fruits</SelectLabel>
      <SelectItem value="apple">Apple</SelectItem>
      <SelectItem value="banana">Banana</SelectItem>
      <SelectItem value="orange">Orange</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>

// Controlled
const [value, setValue] = useState("")
<Select value={value} onValueChange={setValue}>
  ...
</Select>
```

## Accordion Component

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Is it styled?</AccordionTrigger>
    <AccordionContent>
      Yes. It comes with default styles that match your theme.
    </AccordionContent>
  </AccordionItem>
</Accordion>

// Allow multiple open
<Accordion type="multiple">
  ...
</Accordion>
```

## Dropdown Menu Component

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-56">
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      Profile
      <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Log out</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// With checkboxes
<DropdownMenuCheckboxItem
  checked={showStatus}
  onCheckedChange={setShowStatus}
>
  Status Bar
</DropdownMenuCheckboxItem>

// With radio group
<DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
  <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
  <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
</DropdownMenuRadioGroup>
```

## Scroll Area Component

```tsx
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

// Vertical scroll
<ScrollArea className="h-72 w-48 rounded-md border">
  <div className="p-4">
    {items.map((item) => (
      <div key={item} className="text-sm">{item}</div>
    ))}
  </div>
</ScrollArea>

// Horizontal scroll
<ScrollArea className="w-96 whitespace-nowrap rounded-md border">
  <div className="flex w-max space-x-4 p-4">
    {images.map((img) => (
      <img key={img.src} src={img.src} className="h-48 w-48" />
    ))}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>
```

## Sonner (Toast) Component

Sonner is the recommended toast library (replaces the old Toast component):

```tsx
// 1. Add Toaster to your root layout
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

// 2. Use toast anywhere
import { toast } from "sonner"

// Basic
toast("Event has been created")

// With description
toast("Event created", {
  description: "Sunday, December 03, 2023 at 9:00 AM",
})

// Types
toast.success("Success!")
toast.error("Something went wrong")
toast.info("Information")
toast.warning("Warning!")

// With action
toast("Event created", {
  action: {
    label: "Undo",
    onClick: () => console.log("Undo"),
  },
})

// Promise (loading -> success/error)
toast.promise(saveData(), {
  loading: "Saving...",
  success: "Saved!",
  error: "Error saving",
})
```

## Theming

### CSS Variables

shadcn/ui uses CSS variables for theming in `globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    /* ... dark mode values */
  }
}
```

### Dark Mode

Components automatically support dark mode via the `.dark` class on `<html>`:

```tsx
// Toggle dark mode
document.documentElement.classList.toggle('dark')
```

## cn() Utility

Merge class names with tailwind-merge:

```tsx
import { cn } from "@/lib/utils"

// Merge classes, later values override
<div className={cn(
  "base-class",
  isActive && "active-class",
  className  // Allow prop override
)} />
```

## components.json

Configuration file in project root:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

## VibeOS Component Usage

The shell UI uses several shadcn components:

```tsx
// Message bubbles
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"

// Input area
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" // or custom ChatInput

// Tool execution display
import { Collapsible } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
```

## Best Practices

1. **Don't modify node_modules** - Components are in your `src/components/ui`
2. **Customize freely** - You own the code, change what you need
3. **Use cn() for class merging** - Properly handles Tailwind conflicts
4. **Follow the patterns** - Consistent APIs make code predictable
5. **Keep components updated** - Manually sync with upstream when needed

## Motion (Framer Motion) Integration

Motion (formerly Framer Motion) pairs excellently with shadcn/ui for adding fluid animations.

### Installation

```bash
npm install motion
```

### Basic Usage with shadcn Components

```tsx
import { motion } from "motion/react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Wrap any component with motion
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <Card>
    <CardHeader>
      <CardTitle>Animated Card</CardTitle>
    </CardHeader>
    <CardContent>Content fades in smoothly</CardContent>
  </Card>
</motion.div>

// Or create motion variants of shadcn components
const MotionCard = motion.create(Card)

<MotionCard
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  <CardContent>Hover and tap me!</CardContent>
</MotionCard>
```

### AnimatePresence for Enter/Exit

Essential for animating elements that are added/removed from the DOM:

```tsx
import { AnimatePresence, motion } from "motion/react"

function MessageList({ messages }) {
  return (
    <AnimatePresence mode="popLayout">
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="mb-2">
            <CardContent>{msg.text}</CardContent>
          </Card>
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
```

### Gesture Animations

```tsx
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"

// Using motion.create for shadcn components
const MotionButton = motion.create(Button)

<MotionButton
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Click Me
</MotionButton>

// Interactive card
<motion.div
  whileHover={{ 
    scale: 1.02,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
  }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 300 }}
>
  <Card>Interactive Card</Card>
</motion.div>
```

### Layout Animations

Automatically animate layout changes:

```tsx
import { motion, LayoutGroup } from "motion/react"

function ExpandableList({ items, expandedId, setExpandedId }) {
  return (
    <LayoutGroup>
      {items.map((item) => (
        <motion.div
          key={item.id}
          layout
          onClick={() => setExpandedId(item.id)}
          className="cursor-pointer"
        >
          <Card>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            {expandedId === item.id && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CardContent>{item.details}</CardContent>
              </motion.div>
            )}
          </Card>
        </motion.div>
      ))}
    </LayoutGroup>
  )
}
```

### Staggered Children

Animate list items with stagger effect:

```tsx
import { motion } from "motion/react"

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

function StaggeredList({ items }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {items.map((item) => (
        <motion.div key={item.id} variants={itemVariants}>
          <Card className="mb-2">
            <CardContent>{item.text}</CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
```

### Scroll-Triggered Animations

```tsx
import { motion, useInView } from "motion/react"
import { useRef } from "react"

function ScrollRevealCard({ children }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
    >
      <Card>{children}</Card>
    </motion.div>
  )
}
```

### Animated Dialog/Sheet

```tsx
import { motion, AnimatePresence } from "motion/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Custom animated dialog content
function AnimatedDialog({ open, onOpenChange, children }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogContent forceMount asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
```

### Chat Message Animation (VibeOS Pattern)

Complete example for animated chat messages:

```tsx
import { AnimatePresence, motion } from "motion/react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user"
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 30 
      }}
      className={cn(
        "flex gap-3",
        isUser && "flex-row-reverse"
      )}
    >
      <Avatar>
        <AvatarFallback>{isUser ? "U" : "AI"}</AvatarFallback>
      </Avatar>
      <Card className={cn(
        "max-w-[80%] p-3",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {message.content}
      </Card>
    </motion.div>
  )
}

function ChatFeed({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <AnimatePresence mode="popLayout" initial={false}>
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </AnimatePresence>
    </div>
  )
}
```

### Typing Indicator

```tsx
import { motion } from "motion/react"

function TypingIndicator() {
  return (
    <div className="flex gap-1 p-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-muted-foreground rounded-full"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  )
}
```

### Performance Tips

1. **Use `layout` sparingly** - Can be expensive for complex layouts
2. **Prefer `transform` properties** - `x`, `y`, `scale`, `rotate` are GPU-accelerated
3. **Use `will-change` for heavy animations** - Add via className if needed
4. **Set `layoutId` for shared element transitions** - Enables magic animations
5. **Use `AnimatePresence mode="wait"`** - When you need exit before enter

```tsx
// GPU-accelerated (fast)
<motion.div animate={{ x: 100, scale: 1.1 }} />

// Triggers layout (slower)
<motion.div animate={{ width: "200px", marginLeft: 100 }} />
```

## Resources

- [Documentation](https://ui.shadcn.com/docs)
- [Component Examples](https://ui.shadcn.com/docs/components)
- [Themes](https://ui.shadcn.com/themes)
- [Blocks](https://ui.shadcn.com/blocks) - Pre-built page sections
- [GitHub](https://github.com/shadcn-ui/ui)
- [Motion Documentation](https://motion.dev/docs) - Animation library
