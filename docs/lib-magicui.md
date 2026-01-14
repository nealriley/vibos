# Magic UI Reference

> Beautiful UI components for landing pages and marketing materials. Built on top of shadcn/ui.

**Website:** https://magicui.design  
**GitHub:** https://github.com/magicuidesign/magicui (19.6k+ stars)

## Overview

Magic UI is a collection of re-usable animated components designed for creating beautiful landing pages and user-facing marketing materials. It's heavily inspired by and built on top of shadcn/ui.

### Philosophy

Good design establishes trust between you and users. Magic UI provides polished, animated components that make your app feel professional and well-crafted.

## Installation

Magic UI uses the same installation process as shadcn/ui:

```bash
# Initialize shadcn/ui (if not already done)
pnpm dlx shadcn@latest init

# Add Magic UI components
pnpm dlx shadcn@latest add @magicui/globe
```

## Component Categories

### Core Components

| Component | Description |
|-----------|-------------|
| **Marquee** | Scrolling content strip |
| **Terminal** | Animated terminal display |
| **Hero Video Dialog** | Video modal for hero sections |
| **Bento Grid** | Grid layout for features |
| **Animated List** | List with enter/exit animations |
| **Dock** | macOS-style dock |
| **Globe** | 3D interactive globe |
| **Tweet Card** | Embedded tweet display |
| **Orbiting Circles** | Circular orbiting elements |
| **Avatar Circles** | Stacked avatar display |
| **Icon Cloud** | Animated icon cloud |
| **Lens** | Magnifying lens effect |
| **Pointer** | Custom cursor effects |
| **Smooth Cursor** | Smooth cursor following |
| **Progressive Blur** | Gradient blur effect |
| **Dotted Map** | Interactive dotted world map |

### Special Effects

| Component | Description |
|-----------|-------------|
| **Animated Beam** | Connecting beam animation |
| **Border Beam** | Animated border glow |
| **Shine Border** | Shimmering border effect |
| **Magic Card** | Card with hover effects |
| **Meteors** | Falling meteor animation |
| **Confetti** | Celebration confetti |
| **Particles** | Floating particles background |

### Text Animations

| Component | Description |
|-----------|-------------|
| **Text Animate** | General text animation |
| **Typing Animation** | Typewriter effect |
| **Line Shadow Text** | Text with line shadow |
| **Aurora Text** | Aurora borealis text effect |
| **Video Text** | Text with video fill |
| **Number Ticker** | Animated number counter |
| **Animated Shiny Text** | Shiny/glossy text |
| **Animated Gradient Text** | Gradient text animation |
| **Text Reveal** | Scroll-based text reveal |
| **Hyper Text** | Scrambling text effect |
| **Word Rotate** | Rotating words |
| **Sparkles Text** | Text with sparkle effects |
| **Morphing Text** | Text morphing between words |
| **Spinning Text** | Circular spinning text |

### Buttons

| Component | Description |
|-----------|-------------|
| **Rainbow Button** | Multi-color gradient button |
| **Shimmer Button** | Shimmering hover effect |
| **Ripple Button** | Material-style ripple |
| **Shiny Button** | Glossy button effect |
| **Pulsating Button** | Pulsing animation |
| **Interactive Hover Button** | Complex hover states |

### Backgrounds

| Component | Description |
|-----------|-------------|
| **Flickering Grid** | Animated grid background |
| **Animated Grid Pattern** | Moving grid lines |
| **Retro Grid** | Perspective grid |
| **Ripple** | Water ripple effect |
| **Dot Pattern** | Dot grid pattern |
| **Grid Pattern** | Line grid pattern |
| **Interactive Grid Pattern** | Mouse-reactive grid |
| **Light Rays** | Animated light beams |
| **Warp Background** | Warping space effect |

### Device Mocks

| Component | Description |
|-----------|-------------|
| **Safari** | Safari browser frame |
| **iPhone** | iPhone device frame |
| **Android** | Android device frame |

## Usage Example

```tsx
import { Globe } from "@/components/ui/globe"

export default function Hero() {
  return (
    <div className="relative h-screen">
      <Globe className="absolute inset-0" />
      <div className="relative z-10">
        <h1>Your Product</h1>
      </div>
    </div>
  )
}
```

## Best Practices for VibeOS

1. **Use sparingly** - Animations should enhance, not distract
2. **Performance** - Some components (Globe, Particles) are GPU-intensive
3. **Accessibility** - Provide reduced-motion alternatives
4. **Consistency** - Stick to a few animation patterns throughout the UI

## Recommended Components for VibeOS Shell UI

- **Animated List** - For message feed animations
- **Typing Animation** - For AI response streaming
- **Shimmer Button** - For action buttons
- **Border Beam** - For active/focused states
- **Blur Fade** - For message enter animations

## Resources

- [Documentation](https://magicui.design/docs)
- [Component Showcase](https://magicui.design/components)
- [GitHub Repository](https://github.com/magicuidesign/magicui)
