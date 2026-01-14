import { useState } from 'react'
import type { Message, ToolPart } from '@/types/message'
import { parseMarkdown, formatTime } from '@/lib/markdown'
import { ChevronDown, ChevronUp, Terminal, Check, X, Loader2 } from 'lucide-react'

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
    <div className="w-full bg-zinc-900/20">
      <div className="flex gap-3 px-5 py-3.5 group">
        {/* Avatar */}
        <div className="h-8 w-8 shrink-0 rounded-full bg-emerald-500/10 border border-emerald-400/15 flex items-center justify-center">
          <span className="text-xs font-semibold text-emerald-300">V</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] leading-5 font-medium text-zinc-300">VibeOS</span>
            <span className="text-xs text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(time)}
            </span>
          </div>

          {/* Text content */}
          {textContent.trim() && (
            <div
              className="prose-content text-[16px] leading-7"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(textContent.trim()) }}
            />
          )}

          {/* Tool calls */}
          {toolCalls.length > 0 && (
            <div className="space-y-2 pt-1">
              {toolCalls.map((tool, idx) => (
                <ToolCallDisplay key={tool.id || idx} tool={tool} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

}

function ToolCallDisplay({ tool }: { tool: ToolPart }) {
  const [expanded, setExpanded] = useState(false)

  const state = tool.state || {}
  const input = state.input || tool.input || {}
  const output = state.output || tool.output || ''
  const status = state.status || 'completed'
  const title = state.title || (typeof input === 'object' ? (input as { description?: string }).description : undefined) || ''
  const toolName = tool.tool || tool.name || 'Tool'

  let inputStr = ''
  if (typeof input === 'string') {
    inputStr = input
  } else if ((input as { command?: string }).command) {
    inputStr = (input as { command: string }).command
  } else if (Object.keys(input).length > 0) {
    inputStr = JSON.stringify(input, null, 2)
  }

  const outputStr = typeof output === 'string' ? output : JSON.stringify(output, null, 2)
  const hasOutput = outputStr && outputStr.trim().length > 0

  const statusIcon = {
    pending: <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />,
    running: <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />,
    completed: <Check className="w-3.5 h-3.5 text-emerald-400" />,
    error: <X className="w-3.5 h-3.5 text-red-400" />,
  }[status] || <Check className="w-3.5 h-3.5 text-emerald-400" />

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/40 transition-colors text-left"
      >
        <Terminal className="w-4 h-4 text-zinc-500" />
        <span className="text-[13px] leading-5 font-medium text-zinc-300">{toolName}</span>
        {title && (
          <span className="text-xs text-zinc-500 truncate flex-1">{title}</span>
        )}
        <div className="flex items-center gap-2">
          {statusIcon}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-zinc-800 px-4 py-3 space-y-3">
          {inputStr && (
            <div>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wide mb-1">Input</p>
              <pre className="text-sm text-zinc-300 font-mono bg-zinc-950/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                {inputStr}
              </pre>
            </div>
          )}
          {hasOutput && (
            <div>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wide mb-1">Output</p>
              <pre className="text-sm text-zinc-300 font-mono bg-zinc-950/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                {outputStr.slice(0, 2000)}
                {outputStr.length > 2000 && '\n... (truncated)'}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
