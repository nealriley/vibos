import { useMemo } from 'react'
import type { Message as MessageType } from '@/types/message'
import { Message } from '@/components/Message'
import { ThinkingIndicator } from '@/components/Status'
import { ChatMessageList } from '@/components/ui/chat'
import { Button } from '@/components/ui/button'
import { ChevronUp, Sparkles } from 'lucide-react'

interface MessageFeedProps {
  messages: MessageType[]
  isThinking?: boolean
  displayLimit?: number
  onLoadMore?: () => void
  hasMore?: boolean
}

const MESSAGE_LIMIT = 20

export function MessageFeed({
  messages,
  isThinking = false,
  displayLimit = MESSAGE_LIMIT,
  onLoadMore,
  hasMore = false,
}: MessageFeedProps) {
  const displayedMessages = useMemo(() => {
    const startIndex = Math.max(0, messages.length - displayLimit)
    return messages.slice(startIndex)
  }, [messages, displayLimit])

  const isEmpty = messages.length === 0 && !isThinking

  return (
    <ChatMessageList>
      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            <ChevronUp className="w-4 h-4 mr-1" />
            Load older messages
          </Button>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && <EmptyState />}

      {/* Messages */}
      {displayedMessages.map((msg) => (
        <Message key={msg.info.id} message={msg} />
      ))}

      {/* Thinking indicator */}
      {isThinking && <ThinkingIndicator />}
    </ChatMessageList>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl mb-6 bg-violet-500/10 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-violet-400" />
      </div>
      <h2 className="text-lg font-medium text-zinc-100 mb-2">
        Welcome to VibeOS
      </h2>
      <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
        I can help you write code, create files, run commands, browse the web, and more.
        Just type a message to get started.
      </p>
    </div>
  )
}
