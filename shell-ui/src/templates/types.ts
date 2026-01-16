/**
 * Template System Types
 * 
 * Templates are React components that provide the chat UI.
 * They receive session state and callbacks, and can render however they want.
 */

import type { Message as MessageType } from '@/types/message'

/**
 * Session state passed to templates
 */
export interface TemplateSessionState {
  /** Current session status */
  status: 'loading' | 'ready' | 'busy' | 'error'
  /** All messages in the conversation */
  messages: MessageType[]
  /** Error message if status is 'error' */
  error: string | null
  /** Whether the AI is currently streaming a response */
  isStreaming: boolean
}

/**
 * Callbacks passed to templates
 */
export interface TemplateCallbacks {
  /** Send a message to the AI */
  sendMessage: (text: string) => Promise<{ 
    success: boolean
    type?: 'message' | 'app' | 'shell'
    error?: string 
  }>
  /** Abort the current AI response */
  abort: () => Promise<void>
  /** Reset/clear the session */
  reset: () => Promise<void>
  /** Check if a message was sent externally (via API) */
  isExternalMessage: (messageId: string) => boolean
}

/**
 * Props passed to every template component
 */
export interface TemplateProps extends TemplateSessionState, TemplateCallbacks {}

/**
 * Template component type
 */
export type TemplateComponent = React.ComponentType<TemplateProps>

/**
 * Template metadata for the template registry
 */
export interface TemplateInfo {
  /** Unique template identifier */
  id: string
  /** Display name */
  name: string
  /** Short description */
  description: string
  /** Author/source */
  author?: string
  /** Template version */
  version?: string
}

/**
 * Full template definition including component
 */
export interface Template extends TemplateInfo {
  /** The React component to render */
  component: TemplateComponent
}
