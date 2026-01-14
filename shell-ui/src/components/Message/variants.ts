import type { Variants } from 'motion/react'
import type { MessageType } from '@/types/message'

/**
 * Animation variants for different message types
 * Each type has a unique entrance animation to help users
 * quickly distinguish between message sources
 */
export const messageVariants: Record<MessageType, Variants> = {
  // AI responses - spring slide from top
  ai: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },

  // User input - quick fade-in with subtle scale
  user: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0 },
  },

  // Shell commands ($) - terminal-style snap from left
  shell: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0 },
  },

  // App launches (!) - scale-in like an icon
  app: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },

  // External API messages - slide from right with pulse
  external: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  },
}

/**
 * Transition configs for each message type
 */
export const messageTransitions: Record<MessageType, object> = {
  ai: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },

  user: {
    duration: 0.1,
  },

  shell: {
    duration: 0.15,
  },

  app: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
  },

  external: {
    type: 'spring',
    stiffness: 200,
    damping: 20,
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
