/**
 * Cherry Template
 * 
 * A premium, modern chat interface inspired by Cherry Studio with:
 * - Glass-morphism effects
 * - Smooth Motion animations
 * - Avatar-based message layout
 * - Elegant gradients and shadows
 * - Responsive sidebar (collapsible)
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Toaster, toast } from 'sonner'
import {
  Send,
  Square,
  Loader2,
  Bot,
  User,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Trash2,
  ExternalLink,
  Settings,
  Moon,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { parseMarkdown } from '@/lib/markdown'
import * as api from '@/lib/api'
import type { TemplateProps, TemplateInfo } from '../types'
import type { Message as MessageType } from '@/types/message'

export const info: TemplateInfo = {
  id: 'cherry',
  name: 'Cherry',
  description: 'Premium interface with glass effects, avatars, and elegant animations',
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
  reset,
  isExternalMessage,
}: TemplateProps) {
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)

  // Auto-focus input
  useEffect(() => {
    if (status === 'ready' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [status])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        handleReset()
      }
      // Toggle sidebar with Cmd/Ctrl + B
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Listen for external session reset
  useEffect(() => {
    api.onSessionReset(() => {
      toast.success('Session cleared')
    })
  }, [])

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || status !== 'ready') return

    setInput('')
    const result = await sendMessage(trimmed)

    if (result.success) {
      if (result.type === 'app') toast.success('Launching application...')
      else if (result.type === 'shell') toast.success('Executing command...')
    } else {
      toast.error(result.error || 'Failed to send message')
    }
  }, [input, status, sendMessage])

  const handleAbort = useCallback(async () => {
    await abort()
    toast.info('Generation stopped')
  }, [abort])

  const handleReset = useCallback(async () => {
    await reset()
    toast.success('Conversation cleared')
  }, [reset])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape' && isBusy) {
      e.preventDefault()
      handleAbort()
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 160)}px`
    }
  }, [input])

  const isLoading = status === 'loading'
  const isBusy = status === 'busy' || isStreaming
  const isDisabled = isLoading || status === 'error'

  // Keep the feed pinned to the bottom
  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, isStreaming])

  return (
    <div className="h-full w-full flex bg-[#0c0c0f] text-zinc-100 overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute -top-1/2 -left-1/2 w-full h-full opacity-30"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
          }}
        />
        <div 
          className="absolute -bottom-1/2 -right-1/2 w-full h-full opacity-30"
          style={{
            background: 'radial-gradient(circle at 70% 70%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative shrink-0 h-full border-r border-white/5 bg-black/20 backdrop-blur-xl overflow-hidden"
          >
            <div className="flex flex-col h-full p-4">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight">VibeOS</h1>
                  <p className="text-xs text-zinc-500">AI Assistant</p>
                </div>
              </div>

              {/* New Chat Button */}
              <button
                onClick={handleReset}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-3 rounded-xl',
                  'bg-gradient-to-r from-pink-500/10 to-violet-500/10',
                  'border border-white/10 hover:border-white/20',
                  'text-sm font-medium transition-all duration-200',
                  'hover:from-pink-500/20 hover:to-violet-500/20'
                )}
              >
                <MessageSquare className="w-4 h-4" />
                New Conversation
              </button>

              {/* Conversation info */}
              <div className="mt-6 flex-1 overflow-y-auto">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3 px-1">Current Session</p>
                <div className={cn(
                  'px-4 py-3 rounded-xl',
                  'bg-white/5 border border-white/10',
                  'text-sm'
                )}>
                  <div className="flex items-center justify-between">
                    <span className="truncate">{messages.length} messages</span>
                    {messages.length > 0 && (
                      <button
                        onClick={handleReset}
                        className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Clear conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom section */}
              <div className="mt-auto pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-400 transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Settings
                  </button>
                  <button
                    className="flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors"
                    title="Toggle theme"
                  >
                    <Moon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="shrink-0 h-14 flex items-center px-4 border-b border-white/5 bg-black/20 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title={sidebarOpen ? 'Hide sidebar (Ctrl+B)' : 'Show sidebar (Ctrl+B)'}
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          
          <div className="ml-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-zinc-400">
              {isBusy ? 'Generating...' : 'Ready'}
            </span>
          </div>
        </header>

        {/* Loading overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0c0c0f]"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 animate-ping opacity-20" />
              </div>
              <p className="mt-6 text-sm text-zinc-400">
                {error || 'Connecting to AI...'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message feed */}
        <div ref={feedRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 && !isBusy ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="max-w-md text-center">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center mb-6">
                  <Bot className="w-10 h-10 text-pink-400" />
                </div>
                <h2 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
                  How can I help you today?
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  I can write code, answer questions, analyze files, run commands, and much more.
                  Type a message below to get started.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {['Write code', 'Explain concept', 'Debug issue', 'Create file'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion + ' ')}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs',
                        'bg-white/5 border border-white/10',
                        'hover:bg-white/10 hover:border-white/20',
                        'transition-all duration-200'
                      )}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-6 px-4 space-y-1">
              <AnimatePresence mode="popLayout" initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.info.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <CherryMessage
                      message={msg}
                      isExternal={isExternalMessage?.(msg.info.id) ?? false}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Thinking indicator */}
              <AnimatePresence>
                {isBusy && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex gap-4 py-4"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-sm text-zinc-400">Thinking</span>
                      <span className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-pink-400"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="shrink-0 p-4 bg-gradient-to-t from-[#0c0c0f] via-[#0c0c0f]/80 to-transparent">
          <div className="max-w-4xl mx-auto">
            <div
              className={cn(
                'relative rounded-2xl overflow-hidden',
                'bg-white/5 backdrop-blur-xl',
                'border transition-all duration-300',
                isBusy
                  ? 'border-pink-500/50 shadow-lg shadow-pink-500/10'
                  : 'border-white/10 focus-within:border-pink-500/50 focus-within:shadow-lg focus-within:shadow-pink-500/10'
              )}
            >
              {/* Gradient border effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/20 to-violet-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
              
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={isDisabled}
                rows={1}
                className={cn(
                  'w-full min-h-[52px] max-h-[160px] px-5 py-4 pr-14',
                  'bg-transparent text-[15px] text-zinc-100 leading-6',
                  'placeholder:text-zinc-500',
                  'resize-none outline-none',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              />
              
              {/* Send/Stop button */}
              <div className="absolute right-3 bottom-3">
                {isBusy ? (
                  <motion.button
                    onClick={handleAbort}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500 hover:bg-red-400 text-white transition-colors"
                    title="Stop (Esc)"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Square className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handleSubmit}
                    disabled={!input.trim() || isDisabled}
                    className={cn(
                      'h-10 w-10 flex items-center justify-center rounded-xl',
                      'bg-gradient-to-r from-pink-500 to-violet-500',
                      'hover:from-pink-400 hover:to-violet-400',
                      'text-white transition-all',
                      'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-pink-500 disabled:hover:to-violet-500'
                    )}
                    title="Send (Enter)"
                    whileHover={{ scale: input.trim() && !isDisabled ? 1.05 : 1 }}
                    whileTap={{ scale: input.trim() && !isDisabled ? 0.95 : 1 }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Hints */}
            <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-500 mt-3">
              <span><Kbd>Enter</Kbd> send</span>
              <span><Kbd>Shift+Enter</Kbd> new line</span>
              <span><Kbd>!</Kbd> launch app</span>
              <span><Kbd>$</Kbd> run command</span>
              <span><Kbd>Ctrl+B</Kbd> toggle sidebar</span>
            </div>
          </div>
        </div>
      </main>

      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(24, 24, 27, 0.9)',
            color: '#fafafa',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
          },
        }}
      />
    </div>
  )
}

/**
 * Message component with avatar and glass styling
 */
function CherryMessage({
  message,
  isExternal,
}: {
  message: MessageType
  isExternal: boolean
}) {
  const isUser = message.info.role === 'user'

  // Extract text and tool parts
  const parts = message.parts
  const textParts = parts.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
  const toolParts = parts.filter((p) => p.type === 'tool')

  const textContent = textParts.map((p) => p.text).join('')

  return (
    <div className={cn('flex gap-4 py-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className="shrink-0">
        {isUser ? (
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center">
            <User className="w-5 h-5 text-zinc-400" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 min-w-0', isUser ? 'text-right' : 'text-left')}>
        {/* Header */}
        <div className={cn('flex items-center gap-2 mb-1', isUser ? 'justify-end' : 'justify-start')}>
          <span className="text-xs font-medium text-zinc-400">
            {isUser ? 'You' : 'VibeOS'}
          </span>
          {isExternal && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded">
              <ExternalLink className="w-2.5 h-2.5" />
              API
            </span>
          )}
        </div>

        {/* Message bubble */}
        <div
          className={cn(
            'inline-block max-w-full rounded-2xl px-4 py-3',
            isUser
              ? 'bg-gradient-to-r from-pink-500/20 to-violet-500/20 border border-white/10 text-left'
              : 'bg-white/5 border border-white/5'
          )}
        >
          {textContent ? (
            <div
              className="prose-content text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(textContent) }}
            />
          ) : toolParts.length > 0 ? (
            <div className="text-sm text-zinc-400 italic">Using tools...</div>
          ) : (
            <div className="text-sm text-zinc-500">...</div>
          )}
        </div>

        {/* Tool uses - collapsed by default */}
        {toolParts.length > 0 && (
          <div className="mt-2 space-y-1">
            {toolParts.slice(0, 3).map((part, i: number) => (
              <div
                key={i}
                className={cn(
                  'inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs',
                  'bg-white/5 border border-white/5 text-zinc-400',
                  isUser ? 'ml-auto' : ''
                )}
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                {part.type === 'tool' && 'tool' in part ? part.tool : 'Tool'}
              </div>
            ))}
            {toolParts.length > 3 && (
              <span className="text-xs text-zinc-500">
                +{toolParts.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-medium bg-white/5 border border-white/10 rounded text-zinc-400">
      {children}
    </kbd>
  )
}

export default Template
