/**
 * Message types for VibeOS Shell
 * Based on OpenCode API message format
 */

export type MessageRole = 'user' | 'assistant'

export interface MessageTime {
  created?: string
  updated?: string
}

export interface MessageInfo {
  id: string
  role: MessageRole
  time?: MessageTime
}

export interface TextPart {
  type: 'text'
  text: string
}

export interface ToolState {
  status?: 'pending' | 'running' | 'completed' | 'error'
  title?: string
  input?: Record<string, unknown> | string
  output?: string
}

export interface ToolPart {
  type: 'tool'
  id?: string
  tool: string
  name?: string
  state?: ToolState
  input?: Record<string, unknown> | string
  output?: string
  messageID?: string
}

export type MessagePart = TextPart | ToolPart

export interface Message {
  info: MessageInfo
  parts: MessagePart[]
}

/**
 * UI-specific message type with display metadata
 */
export type MessageType = 'ai' | 'user' | 'shell' | 'app' | 'external'

export interface DisplayMessage extends Message {
  displayType: MessageType
  isExternal?: boolean
  fadeOpacity?: number
}

/**
 * SSE Event types from OpenCode
 */
export interface SessionStatusEvent {
  type: 'session.status'
  properties: {
    status: {
      type: 'idle' | 'busy'
    } | 'idle' | 'busy'
  }
}

export interface SessionIdleEvent {
  type: 'session.idle'
}

export interface MessageCreatedEvent {
  type: 'message.created'
  properties: {
    info: MessageInfo
  }
}

export interface MessagePartUpdatedEvent {
  type: 'message.part.updated'
  properties: {
    part: MessagePart & { messageID?: string }
  }
}

export type OpenCodeEvent = 
  | SessionStatusEvent 
  | SessionIdleEvent 
  | MessageCreatedEvent 
  | MessagePartUpdatedEvent
  | { type: string; properties?: Record<string, unknown> }
