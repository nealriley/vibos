/**
 * API wrapper for window.vibeos
 * Provides typed access to the preload.js exposed API
 */

import type { 
  InitSessionResult, 
  SubmitInputResult, 
  GetMessagesResult,
  ResetSessionResult,
  AbortResult,
  Config 
} from '@/types/vibeos'
import type { OpenCodeEvent } from '@/types/message'

/**
 * Initialize the OpenCode session
 */
export async function initSession(): Promise<InitSessionResult> {
  return window.vibeos.initSession()
}

/**
 * Submit user input (prompt, app launch, or shell command)
 */
export async function submitInput(input: string): Promise<SubmitInputResult> {
  return window.vibeos.submitInput(input)
}

/**
 * Get all messages in the current session
 */
export async function getMessages(): Promise<GetMessagesResult> {
  return window.vibeos.getMessages()
}

/**
 * Abort the current AI response
 */
export async function abort(): Promise<AbortResult> {
  return window.vibeos.abort()
}

/**
 * Reset the session (clear history, start fresh)
 */
export async function resetSession(): Promise<ResetSessionResult> {
  return window.vibeos.resetSession()
}

/**
 * Get application configuration
 */
export async function getConfig(): Promise<Config> {
  return window.vibeos.getConfig()
}

/**
 * Subscribe to OpenCode SSE events
 */
export function onOpencodeEvent(callback: (event: OpenCodeEvent) => void): void {
  window.vibeos.onOpencodeEvent(callback)
}

/**
 * Unsubscribe from OpenCode events
 */
export function removeOpencodeEventListener(): void {
  window.vibeos.removeOpencodeEventListener()
}

/**
 * Subscribe to session reset events (from external triggers)
 */
export function onSessionReset(callback: () => void): void {
  window.vibeos.onSessionReset(callback)
}
