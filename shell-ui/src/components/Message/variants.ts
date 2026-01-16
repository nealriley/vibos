import type { Variants, Transition } from 'motion/react'
import type { MessageType } from '@/types/message'

/**
 * Animation variants for different message types (top-down flow)
 * 
 * With input at TOP and messages flowing DOWN:
 * - New messages appear at top, slide down into view
 * - Each type has unique animation for quick visual distinction
 */
export const messageVariants: Record<MessageType, Variants> = {
  // AI responses - spring slide down from top
  ai: {
    initial: { opacity: 0, y: -20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.98 },
  },

  // User input - quick fade-in with subtle scale from right
  user: {
    initial: { opacity: 0, scale: 0.95, x: 10 },
    animate: { opacity: 1, scale: 1, x: 0 },
    exit: { opacity: 0, scale: 0.95 },
  },

  // Shell commands ($) - terminal-style snap from left
  shell: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 },
  },

  // App launches (!) - bounce-in like launching an app
  app: {
    initial: { opacity: 0, scale: 0.7, y: -10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8 },
  },

  // External API messages - attention-grabbing slide from right
  external: {
    initial: { opacity: 0, x: 60, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -30 },
  },
}

/**
 * Transition configs for each message type
 */
export const messageTransitions: Record<MessageType, Transition> = {
  ai: {
    type: 'spring',
    stiffness: 350,
    damping: 30,
  },

  user: {
    type: 'spring',
    stiffness: 500,
    damping: 35,
  },

  shell: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  },

  app: {
    type: 'spring',
    stiffness: 450,
    damping: 25,
  },

  external: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
  },
}

/**
 * Tool execution animation variants
 */
export const toolVariants: Variants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
}

/**
 * Thinking indicator variants
 */
export const thinkingVariants: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

/**
 * Dot animation for thinking indicator
 */
export const dotVariants: Variants = {
  initial: { scale: 0.8, opacity: 0.3 },
  animate: { 
    scale: [0.8, 1, 0.8], 
    opacity: [0.3, 1, 0.3] 
  },
}
