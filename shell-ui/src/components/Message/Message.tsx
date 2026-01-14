import type { Message as MessageType } from '@/types/message'
import { AIMessage } from './AIMessage'
import { UserMessage } from './UserMessage'

interface MessageProps {
  message: MessageType
}

/**
 * Polymorphic message component that renders the appropriate
 * message type based on the message role
 */
export function Message({ message }: MessageProps) {
  const role = message.info.role

  switch (role) {
    case 'assistant':
      return <AIMessage message={message} />
    case 'user':
      return <UserMessage message={message} />
    default:
      return null
  }
}
