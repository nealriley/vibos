import type { Message } from '@/types/message'
import { formatTime } from '@/lib/markdown'
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
} from '@/components/ui/chat'

interface UserMessageProps {
  message: Message
}

export function UserMessage({ message }: UserMessageProps) {
  const time = message.info.time?.created ? new Date(message.info.time.created) : new Date()
  const textPart = message.parts.find((p) => p.type === 'text')
  const text = textPart?.type === 'text' ? textPart.text : ''

  if (!text) return null

  return (
    <ChatBubble variant="sent">
      <div className="flex flex-col items-end gap-1">
        <ChatBubbleTimestamp timestamp={formatTime(time)} />
        <ChatBubbleMessage variant="sent">{text}</ChatBubbleMessage>
      </div>
      <ChatBubbleAvatar fallback="U" variant="sent" />
    </ChatBubble>
  )
}
