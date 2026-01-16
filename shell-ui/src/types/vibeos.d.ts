/**
 * Type declarations for the window.vibeos API exposed by preload.js
 */

import type { Message, OpenCodeEvent } from './message'

export interface Session {
  id: string
  title: string
}

export interface InitSessionResult {
  success: boolean
  session?: Session
  messages?: Message[]
  error?: string
}

export interface SubmitInputResult {
  success: boolean
  type?: 'app' | 'shell' | 'opencode'
  app?: string
  command?: string
  prompt?: string
  response?: unknown
  error?: string
}

export interface GetMessagesResult {
  success: boolean
  messages?: Message[]
  error?: string
}

export interface ResetSessionResult {
  success: boolean
  session?: Session
  messages?: Message[]
  error?: string
}

export interface AbortResult {
  success: boolean
  error?: string
}

export interface Config {
  terminal: string
  opencodeUrl: string
  showDevTools: boolean
}

export interface RunningWindow {
  id: string
  pid: number
  x: number
  y: number
  width: number
  height: number
  class: string
  title: string
}

export interface VibeOSAPI {
  // Main Window API
  initSession: () => Promise<InitSessionResult>
  submitInput: (input: string) => Promise<SubmitInputResult>
  getMessages: () => Promise<GetMessagesResult>
  abort: () => Promise<AbortResult>
  resetSession: () => Promise<ResetSessionResult>
  getConfig: () => Promise<Config>
  onOpencodeEvent: (callback: (event: OpenCodeEvent) => void) => void
  removeOpencodeEventListener: () => void
  onSessionReset: (callback: () => void) => void

  // Icon/Taskbar API
  toggleMainWindow: () => void
  onWindowsUpdate: (callback: (windows: RunningWindow[]) => void) => void
  focusWindow: (windowId: string) => void
  closeWindow: (windowId: string) => void
}

declare global {
  interface Window {
    vibeos: VibeOSAPI
  }
}

export {}
