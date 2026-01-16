/**
 * Minimal Template
 * 
 * A clean, distraction-free chat interface with:
 * - Light/dark support via system preference
 * - No animations
 * - Simple message bubbles
 * - Compact layout
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Send, Square, Loader2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { TemplateProps, TemplateInfo } from '../types'
import type { Message as MessageType } from '@/types/message'

export const info: TemplateInfo = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Clean, distraction-free interface with simple styling',
  author: 'VibeOS',
  version: '1.0.0',
}

export function Template({
  status,
  messages,
  error,
  isStreaming,
  sendMessage,
  abort,
  isExternalMessage,
}: TemplateProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)

  // Auto-focus input
  useEffect(() => {
    if (status === 'ready' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [status])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || status !== 'ready') return

    setInput('')
    await sendMessage(trimmed)
  }, [input, status, sendMessage])

  const handleAbort = useCallback(async () => {
    await abort()
  }, [abort])

  // Keep feed scrolled to bottom
  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, isStreaming])

  const isLoading = status === 'loading'
  const isBusy = status === 'busy' || isStreaming
  const isDisabled = isLoading || status === 'error'

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          <p className="text-sm text-zinc-500">{error || 'Connecting...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <header className="shrink-0 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-sm font-medium">VibeOS</h1>
      </header>

      {/* Messages */}
      <div ref={feedRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-zinc-400">Start a conversation...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MinimalMessage
              key={msg.info.id}
              message={msg}
              isExternal={isExternalMessage(msg.info.id)}
            />
          ))
        )}
        
        {isBusy && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isDisabled}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg',
              'bg-zinc-100 dark:bg-zinc-800',
              'border border-zinc-200 dark:border-zinc-700',
              'text-sm placeholder:text-zinc-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
              'disabled:opacity-50'
            )}
          />
          {isBusy ? (
            <button
              type="button"
              onClick={handleAbort}
              className="px-3 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || isDisabled}
              className={cn(
                'px-3 py-2 rounded-lg bg-blue-500 text-white text-sm',
                'hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

function MinimalMessage({ 
  message, 
  isExternal 
}: { 
  message: MessageType
  isExternal: boolean 
}) {
  const isUser = message.info.role === 'user'
  
  // Extract text content
  let text = ''
  for (const part of message.parts) {
    if (part.type === 'text') {
      text += part.text
    }
  }

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] px-3 py-2 rounded-lg text-sm',
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
        )}
      >
        {isExternal && (
          <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
            <ExternalLink className="w-3 h-3" />
            <span>External</span>
          </div>
        )}
        <p className="whitespace-pre-wrap">{text || '...'}</p>
      </div>
    </div>
  )
}

export default Template
