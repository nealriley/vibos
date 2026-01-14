import { useState, useCallback, useEffect } from 'react'
import { Toaster } from 'sonner'
import { Header, StatusBar, LoadingOverlay, showStatus } from '@/components/Layout'
import { PromptInput } from '@/components/Input'
import { MessageFeed } from '@/components/Feed'
import { useSession } from '@/hooks/useSession'
import { useSSE } from '@/hooks/useSSE'
import * as api from '@/lib/api'

const MESSAGE_LIMIT = 20

export function App() {
  const { status, messages, error, isStreaming, sendMessage, abort, reset, updateStreamingPart } =
    useSession()

  const [displayedCount, setDisplayedCount] = useState(MESSAGE_LIMIT)

  useSSE({
    onPartUpdated: updateStreamingPart,
  })

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

  useEffect(() => {
    api.onSessionReset(() => {
      setDisplayedCount(MESSAGE_LIMIT)
      showStatus('Session reset', 'success')
    })
  }, [])

  const handleSubmit = useCallback(
    async (input: string) => {
      const result = await sendMessage(input)
      if (result.success) {
        if (result.type === 'app') {
          showStatus(`Launched app`, 'success')
        } else if (result.type === 'shell') {
          showStatus(`Running command`, 'success')
        }
      } else {
        showStatus(result.error || 'Failed to send', 'error')
      }
    },
    [sendMessage]
  )

  const handleAbort = useCallback(async () => {
    await abort()
    showStatus('Stopped', 'warning')
  }, [abort])

  const handleReset = useCallback(async () => {
    await reset()
    setDisplayedCount(MESSAGE_LIMIT)
    showStatus('Session reset', 'success')
  }, [reset])

  const handleLoadMore = useCallback(() => {
    setDisplayedCount((prev) => prev + MESSAGE_LIMIT)
  }, [])

  const isLoading = status === 'loading'
  const isBusy = status === 'busy' || isStreaming
  const hasMore = messages.length > displayedCount

  return (
    <div className="h-full w-full flex flex-col items-stretch bg-zinc-950">
      {/* Gradient */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
        }}
      />

      <LoadingOverlay visible={isLoading} error={status === 'error' ? error : null} />
      
      <Header />

      <MessageFeed
        messages={messages}
        isThinking={isBusy}
        displayLimit={displayedCount}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
      />

      <div className="shrink-0 w-full border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
        <PromptInput
          onSubmit={handleSubmit}
          onAbort={handleAbort}
          disabled={isLoading || status === 'error'}
          isLoading={isBusy}
        />
      </div>

      <StatusBar />

      <Toaster
        position="top-center"
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
