# Tailwind CSS Reference

> A utility-first CSS framework for rapid UI development.

**Website:** https://tailwindcss.com  
**Version:** 4.x (latest)

## Overview

Tailwind CSS provides low-level utility classes that let you build designs directly in your HTML/JSX. Instead of writing custom CSS, you compose utilities like `flex`, `pt-4`, `text-center`.

### Key Benefits

- **No context switching** - Style in the same file as markup
- **No naming things** - No more `.card-wrapper-inner`
- **Consistent design** - Built-in design system
- **Smaller bundles** - Unused styles are automatically removed

## Installation (Vite)

```bash
pnpm add tailwindcss @tailwindcss/vite
```

`vite.config.ts`:
```ts
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss()],
})
```

`src/index.css`:
```css
@import "tailwindcss";
```

## Core Concepts

### Utility Classes

```html
<div class="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">
  <img class="w-12 h-12 rounded-full" src="avatar.jpg" />
  <div>
    <h2 class="text-lg font-semibold text-gray-900">Title</h2>
    <p class="text-sm text-gray-500">Description</p>
  </div>
</div>
```

### Responsive Design

Mobile-first breakpoints:

| Prefix | Min-width | Description |
|--------|-----------|-------------|
| (none) | 0px | Mobile (default) |
| `sm:` | 640px | Small devices |
| `md:` | 768px | Medium devices |
| `lg:` | 1024px | Large devices |
| `xl:` | 1280px | Extra large |
| `2xl:` | 1536px | 2x extra large |

```html
<!-- Stack on mobile, row on medium+ -->
<div class="flex flex-col md:flex-row gap-4">
  <div class="w-full md:w-1/2">Left</div>
  <div class="w-full md:w-1/2">Right</div>
</div>
```

### Hover, Focus, and States

```html
<button class="bg-blue-500 hover:bg-blue-700 focus:ring-2 active:bg-blue-800">
  Click me
</button>

<input class="border focus:border-blue-500 focus:ring-1 disabled:opacity-50" />

<div class="group">
  <span class="group-hover:text-blue-500">Hover parent to change me</span>
</div>
```

### Dark Mode

```html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Adapts to dark mode
</div>
```

## Layout

### Flexbox

```html
<!-- Container -->
<div class="flex">              <!-- display: flex -->
<div class="inline-flex">       <!-- display: inline-flex -->

<!-- Direction -->
<div class="flex-row">          <!-- flex-direction: row (default) -->
<div class="flex-col">          <!-- flex-direction: column -->
<div class="flex-row-reverse">  <!-- flex-direction: row-reverse -->
<div class="flex-col-reverse">  <!-- flex-direction: column-reverse -->

<!-- Wrap -->
<div class="flex-wrap">         <!-- flex-wrap: wrap -->
<div class="flex-nowrap">       <!-- flex-wrap: nowrap (default) -->

<!-- Justify Content (main axis) -->
<div class="justify-start">     <!-- justify-content: flex-start -->
<div class="justify-center">    <!-- justify-content: center -->
<div class="justify-end">       <!-- justify-content: flex-end -->
<div class="justify-between">   <!-- justify-content: space-between -->
<div class="justify-around">    <!-- justify-content: space-around -->
<div class="justify-evenly">    <!-- justify-content: space-evenly -->

<!-- Align Items (cross axis) -->
<div class="items-start">       <!-- align-items: flex-start -->
<div class="items-center">      <!-- align-items: center -->
<div class="items-end">         <!-- align-items: flex-end -->
<div class="items-baseline">    <!-- align-items: baseline -->
<div class="items-stretch">     <!-- align-items: stretch (default) -->

<!-- Gap -->
<div class="gap-4">             <!-- gap: 1rem -->
<div class="gap-x-4">           <!-- column-gap: 1rem -->
<div class="gap-y-2">           <!-- row-gap: 0.5rem -->
```

### Grid

```html
<div class="grid grid-cols-3 gap-4">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</div>

<!-- Responsive columns -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

<!-- Column span -->
<div class="col-span-2">        <!-- Spans 2 columns -->
<div class="col-span-full">     <!-- Spans all columns -->
```

### Position

```html
<div class="relative">          <!-- position: relative -->
<div class="absolute">          <!-- position: absolute -->
<div class="fixed">             <!-- position: fixed -->
<div class="sticky top-0">      <!-- position: sticky; top: 0 -->

<!-- Inset -->
<div class="top-0 left-0">      <!-- top: 0; left: 0 -->
<div class="inset-0">           <!-- top/right/bottom/left: 0 -->
<div class="inset-x-0">         <!-- left: 0; right: 0 -->
<div class="inset-y-0">         <!-- top: 0; bottom: 0 -->
```

## Spacing

### Padding

```html
<div class="p-4">               <!-- padding: 1rem -->
<div class="px-4">              <!-- padding-left/right: 1rem -->
<div class="py-2">              <!-- padding-top/bottom: 0.5rem -->
<div class="pt-4 pb-2 pl-6 pr-6">  <!-- individual sides -->
```

### Margin

```html
<div class="m-4">               <!-- margin: 1rem -->
<div class="mx-auto">           <!-- margin-left/right: auto (center) -->
<div class="my-4">              <!-- margin-top/bottom: 1rem -->
<div class="mt-4 mb-2">         <!-- individual sides -->
<div class="-mt-4">             <!-- negative margin: -1rem -->
```

### Spacing Scale

| Class | Size |
|-------|------|
| `*-0` | 0px |
| `*-1` | 0.25rem (4px) |
| `*-2` | 0.5rem (8px) |
| `*-3` | 0.75rem (12px) |
| `*-4` | 1rem (16px) |
| `*-5` | 1.25rem (20px) |
| `*-6` | 1.5rem (24px) |
| `*-8` | 2rem (32px) |
| `*-10` | 2.5rem (40px) |
| `*-12` | 3rem (48px) |
| `*-16` | 4rem (64px) |
| `*-20` | 5rem (80px) |
| `*-24` | 6rem (96px) |

## Sizing

```html
<!-- Width -->
<div class="w-full">            <!-- width: 100% -->
<div class="w-screen">          <!-- width: 100vw -->
<div class="w-1/2">             <!-- width: 50% -->
<div class="w-64">              <!-- width: 16rem -->
<div class="w-fit">             <!-- width: fit-content -->
<div class="min-w-0">           <!-- min-width: 0 -->
<div class="max-w-md">          <!-- max-width: 28rem -->
<div class="max-w-screen-xl">   <!-- max-width: 1280px -->

<!-- Height -->
<div class="h-full">            <!-- height: 100% -->
<div class="h-screen">          <!-- height: 100vh -->
<div class="h-64">              <!-- height: 16rem -->
<div class="min-h-screen">      <!-- min-height: 100vh -->
<div class="max-h-96">          <!-- max-height: 24rem -->
```

## Typography

```html
<!-- Font Size -->
<p class="text-xs">Extra small</p>     <!-- 0.75rem -->
<p class="text-sm">Small</p>           <!-- 0.875rem -->
<p class="text-base">Base</p>          <!-- 1rem -->
<p class="text-lg">Large</p>           <!-- 1.125rem -->
<p class="text-xl">Extra large</p>     <!-- 1.25rem -->
<p class="text-2xl">2XL</p>            <!-- 1.5rem -->
<p class="text-3xl">3XL</p>            <!-- 1.875rem -->

<!-- Font Weight -->
<p class="font-thin">Thin (100)</p>
<p class="font-normal">Normal (400)</p>
<p class="font-medium">Medium (500)</p>
<p class="font-semibold">Semibold (600)</p>
<p class="font-bold">Bold (700)</p>

<!-- Text Color -->
<p class="text-gray-500">Gray text</p>
<p class="text-blue-600">Blue text</p>
<p class="text-white">White text</p>

<!-- Text Alignment -->
<p class="text-left">Left</p>
<p class="text-center">Center</p>
<p class="text-right">Right</p>

<!-- Line Height -->
<p class="leading-none">No leading</p>
<p class="leading-tight">Tight</p>
<p class="leading-normal">Normal</p>
<p class="leading-relaxed">Relaxed</p>

<!-- Other -->
<p class="truncate">Truncate with ellipsis...</p>
<p class="line-clamp-2">Clamp to 2 lines...</p>
<p class="uppercase">UPPERCASE</p>
<p class="lowercase">lowercase</p>
<p class="capitalize">Capitalize</p>
```

## Colors

### Color Scale

Each color has shades from 50 (lightest) to 950 (darkest):

```html
<div class="bg-blue-50">   <!-- Lightest -->
<div class="bg-blue-100">
<div class="bg-blue-200">
<div class="bg-blue-300">
<div class="bg-blue-400">
<div class="bg-blue-500">  <!-- Base -->
<div class="bg-blue-600">
<div class="bg-blue-700">
<div class="bg-blue-800">
<div class="bg-blue-900">
<div class="bg-blue-950">  <!-- Darkest -->
```

### Available Colors

`slate`, `gray`, `zinc`, `neutral`, `stone`, `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`

### Usage

```html
<div class="bg-blue-500">           <!-- Background -->
<div class="text-blue-500">         <!-- Text color -->
<div class="border-blue-500">       <!-- Border color -->
<div class="ring-blue-500">         <!-- Ring color -->
```

## Borders & Effects

```html
<!-- Border Width -->
<div class="border">                <!-- 1px -->
<div class="border-2">              <!-- 2px -->
<div class="border-t">              <!-- top only -->

<!-- Border Radius -->
<div class="rounded">               <!-- 0.25rem -->
<div class="rounded-md">            <!-- 0.375rem -->
<div class="rounded-lg">            <!-- 0.5rem -->
<div class="rounded-xl">            <!-- 0.75rem -->
<div class="rounded-full">          <!-- 9999px (circle) -->

<!-- Shadow -->
<div class="shadow-sm">             <!-- Small shadow -->
<div class="shadow">                <!-- Default shadow -->
<div class="shadow-md">             <!-- Medium shadow -->
<div class="shadow-lg">             <!-- Large shadow -->
<div class="shadow-xl">             <!-- Extra large -->
<div class="shadow-2xl">            <!-- 2XL shadow -->

<!-- Opacity -->
<div class="opacity-50">            <!-- 50% opacity -->
<div class="bg-black/50">           <!-- Background with 50% opacity -->
```

## Transitions & Animation

```html
<!-- Transition -->
<div class="transition">                    <!-- all properties -->
<div class="transition-colors">             <!-- color properties -->
<div class="transition-transform">          <!-- transform -->
<div class="duration-150">                  <!-- 150ms -->
<div class="duration-300">                  <!-- 300ms -->
<div class="ease-in-out">                   <!-- timing function -->

<!-- Transform -->
<div class="scale-105 hover:scale-110">     <!-- Scale on hover -->
<div class="translate-x-2">                 <!-- Translate -->
<div class="rotate-45">                     <!-- Rotate 45deg -->

<!-- Animation -->
<div class="animate-spin">                  <!-- Spinning -->
<div class="animate-ping">                  <!-- Ping effect -->
<div class="animate-pulse">                 <!-- Pulse/fade -->
<div class="animate-bounce">                <!-- Bouncing -->
```

## Common Patterns

### Center Content

```html
<!-- Flex center -->
<div class="flex items-center justify-center h-screen">
  <div>Centered</div>
</div>

<!-- Grid center -->
<div class="grid place-items-center h-screen">
  <div>Centered</div>
</div>
```

### Card

```html
<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
  <h2 class="text-xl font-semibold mb-2">Title</h2>
  <p class="text-gray-600 dark:text-gray-300">Content</p>
</div>
```

### Button

```html
<button class="px-4 py-2 bg-blue-500 text-white rounded-md 
               hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 
               focus:ring-offset-2 transition-colors">
  Click me
</button>
```

### Input

```html
<input class="w-full px-3 py-2 border border-gray-300 rounded-md
              focus:outline-none focus:ring-2 focus:ring-blue-500 
              focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
       placeholder="Enter text..." />
```

## Arbitrary Values

When you need custom values:

```html
<div class="w-[137px]">           <!-- Custom width -->
<div class="bg-[#1da1f2]">        <!-- Custom color -->
<div class="top-[117px]">         <!-- Custom position -->
<div class="grid-cols-[1fr_2fr]"> <!-- Custom grid -->
```

## VibeOS Styling Patterns

```tsx
// Message container
<div className="flex flex-col gap-4 p-4 overflow-y-auto">

// Message bubble
<div className="bg-secondary rounded-lg p-3 max-w-[80%]">

// Input area
<div className="flex gap-2 p-4 border-t border-border">

// Status indicator
<span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
```

## Resources

- [Documentation](https://tailwindcss.com/docs)
- [Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)
- [Tailwind Play](https://play.tailwindcss.com/) - Online playground
- [Heroicons](https://heroicons.com/) - Icons from Tailwind team
- [Headless UI](https://headlessui.com/) - Unstyled accessible components
