import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Toaster, toast } from 'sonner'
import { useSession } from '@/hooks/useSession'
import * as api from '@/lib/api'
import { Send, Square, Sparkles, Loader2 } from 'lucide-react'
import { Message } from '@/components/Message'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { cn } from '@/lib/cn'

export function App() {
  const {
    status,
    messages,
    error,
    isStreaming,
    sendMessage,
    abort,
    reset,
    isExternalMessage,
  } = useSession()

  const [input, setInput] = useState('')
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
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Listen for external session reset
  useEffect(() => {
    api.onSessionReset(() => {
      toast.success('Session reset')
    })
  }, [])

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || status !== 'ready') return

    setInput('')
    const result = await sendMessage(trimmed)

    if (result.success) {
      if (result.type === 'app') toast.success('Launched app')
      else if (result.type === 'shell') toast.success('Running command')
    } else {
      toast.error(result.error || 'Failed to send')
    }
  }, [input, status, sendMessage])

  const handleAbort = useCallback(async () => {
    await abort()
    toast.warning('Stopped')
  }, [abort])

  const handleReset = useCallback(async () => {
    await reset()
    toast.success('Session reset')
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
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const isLoading = status === 'loading'
  const isBusy = status === 'busy' || isStreaming
  const isDisabled = isLoading || status === 'error'

  // Messages: oldest first (chat-style)
  const displayMessages = messages

  // Keep the feed pinned to the bottom while new content arrives.
  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, isStreaming])

  return (
    <div className="h-full w-full flex flex-col bg-zinc-950 text-zinc-100">
      {/* Subtle gradient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)',
        }}
      />

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950"
          >
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            <p className="mt-4 text-sm text-zinc-400">
              {error || 'Connecting to OpenCode...'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="flex-1 min-h-0 flex justify-center">
        <div className="w-full max-w-3xl min-h-0 flex flex-col px-4 sm:px-6 pb-8">
          {/* Message feed - fills remaining space */}
          <div ref={feedRef} className="flex-1 overflow-y-auto min-h-0 pt-6 pb-6">
            {messages.length === 0 && !isBusy ? (
              <div className="min-h-full flex items-center justify-center text-center">
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-violet-400" />
                  </div>
                  <h2 className="text-xl font-medium text-zinc-100 mb-2">Welcome to VibeOS</h2>
                  <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
                    I can help you write code, create files, run commands, browse the web, and more.
                    Just type a message to get started.
                  </p>
                </div>
              </div>
            ) : (
              <div className="min-h-full flex flex-col justify-end gap-0 divide-y divide-zinc-800/40">
                {/* Messages */}
                <AnimatePresence mode="popLayout" initial={false}>
                  {displayMessages.map((msg) => (
                    <motion.div
                      key={msg.info.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <Message
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
                      className="flex items-center gap-3 py-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <span className="text-xs font-semibold text-emerald-400">V</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <span>Thinking</span>
                        <span className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse"
                              style={{ animationDelay: `${i * 200}ms` }}
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

          {/* Separator */}
          <div className="shrink-0 h-px bg-gradient-to-r from-transparent via-zinc-700/35 to-transparent" />

          {/* Input area - BOTTOM */}
          <div className="shrink-0 pt-6 pb-4 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-transparent">
            <div
              className={cn(
                'flex items-center gap-3 rounded-2xl border bg-zinc-900/70 shadow-lg shadow-black/30',
                'transition-all duration-200',
                isBusy
                  ? 'border-violet-400/35'
                  : 'border-zinc-700/50 focus-within:border-violet-400/35'
              )}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message VibeOS..."
                disabled={isDisabled}
                rows={1}
                className={cn(
                  'flex-1 min-h-[56px] max-h-[200px] px-5 py-4',
                  'bg-transparent text-[16px] text-zinc-100 leading-7',
                  'placeholder:text-zinc-500',
                  'resize-none outline-none',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              />
              <div className="pr-3 py-3">
                {isBusy ? (
                  <button
                    onClick={handleAbort}
                    className="h-11 w-11 flex items-center justify-center rounded-xl bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                    title="Stop (Esc)"
                  >
                    <Square className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!input.trim() || isDisabled}
                    className="h-11 w-11 flex items-center justify-center rounded-xl bg-violet-500/80 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Send"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Hints */}
            <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-500 mt-3">
              <div className="group">
                <ConnectionStatus />
              </div>
              <span><Kbd>Enter</Kbd> send</span>
              <span><Kbd>Shift+Enter</Kbd> new line</span>
              <span><Kbd>!</Kbd> launch app</span>
              <span><Kbd>$</Kbd> run command</span>
            </div>
          </div>
        </div>
      </main>

      {/* Toast notifications */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#fafafa',
            border: '1px solid #27272a',
          },
        }}
      />
    </div>
  )
}

// Keyboard hint component
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-medium bg-zinc-800 border border-zinc-700 rounded text-zinc-400">
      {children}
    </kbd>
  )
}

