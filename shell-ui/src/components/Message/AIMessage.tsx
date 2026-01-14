import type { Message, ToolPart } from '@/types/message'
import { parseMarkdown, formatTime } from '@/lib/markdown'
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
  ToolCall,
} from '@/components/ui/chat'

interface AIMessageProps {
  message: Message
}

export function AIMessage({ message }: AIMessageProps) {
  const time = message.info.time?.created ? new Date(message.info.time.created) : new Date()

  let textContent = ''
  const toolCalls: ToolPart[] = []

  if (message.parts && Array.isArray(message.parts)) {
    for (const part of message.parts) {
      if (part.type === 'text' && part.text) {
        textContent += part.text
      } else if (part.type === 'tool') {
        toolCalls.push(part as ToolPart)
      }
    }
  }

  if (!textContent.trim() && toolCalls.length === 0) {
    return null
  }

  return (
    <ChatBubble variant="received" layout="ai">
      <ChatBubbleAvatar fallback="V" variant="received" />
      
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <ChatBubbleTimestamp timestamp={formatTime(time)} />
        
        {textContent.trim() && (
          <ChatBubbleMessage variant="received" layout="ai">
            <div
              className="prose-content text-lg"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(textContent.trim()) }}
            />
          </ChatBubbleMessage>
        )}

        {toolCalls.length > 0 && (
          <div className="flex flex-col gap-2">
            {toolCalls.map((tool, idx) => {
              const state = tool.state || {}
              const input = state.input || tool.input || {}
              const output = state.output || tool.output || ''
              const status = state.status || 'completed'
              const title = state.title || (typeof input === 'object' ? (input as { description?: string }).description : undefined) || ''
              
              let inputStr = ''
              if (typeof input === 'string') {
                inputStr = input
              } else if ((input as { command?: string }).command) {
                inputStr = `$ ${(input as { command: string }).command}`
              } else {
                inputStr = JSON.stringify(input, null, 2)
              }

              return (
                <ToolCall
                  key={tool.id || idx}
                  name={tool.tool || tool.name || 'Tool'}
                  description={title}
                  state={status as 'pending' | 'running' | 'completed' | 'error'}
                  input={inputStr}
                  output={typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
                />
              )
            })}
          </div>
        )}
      </div>
    </ChatBubble>
  )
}
