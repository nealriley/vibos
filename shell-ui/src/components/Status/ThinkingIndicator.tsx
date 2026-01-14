import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  MessageLoading,
} from '@/components/ui/chat'

export function ThinkingIndicator() {
  return (
    <ChatBubble variant="received" layout="ai">
      <ChatBubbleAvatar fallback="V" variant="received" />
      <ChatBubbleMessage variant="received" isLoading />
    </ChatBubble>
  )
}
