import { useMemo } from 'react'
import type { Message, MessageType } from '@/types/message'
import { formatTime } from '@/lib/markdown'
import { cn } from '@/lib/cn'
import { Terminal, Rocket, Zap } from 'lucide-react'

interface UserMessageProps {
  message: Message
  isExternal?: boolean
}

function getMessageType(text: string, isExternal?: boolean): MessageType {
  if (isExternal) return 'external'
  if (text.startsWith('$')) return 'shell'
  if (text.startsWith('!')) return 'app'
  return 'user'
}

function getDisplayText(text: string, type: MessageType): string {
  if (type === 'shell') return text.slice(1).trim()
  if (type === 'app') return text.slice(1).trim()
  return text
}

export function UserMessage({ message, isExternal = false }: UserMessageProps) {
  const time = message.info.time?.created ? new Date(message.info.time.created) : new Date()
  const textPart = message.parts.find((p) => p.type === 'text')
  const text = textPart?.type === 'text' ? textPart.text : ''

  const messageType = useMemo(() => getMessageType(text, isExternal), [text, isExternal])
  const displayText = useMemo(() => getDisplayText(text, messageType), [text, messageType])

  if (!text) return null

  switch (messageType) {
    case 'shell':
      return <ShellMessage text={displayText} time={time} />
    case 'app':
      return <AppMessage text={displayText} time={time} />
    case 'external':
      return <ExternalMessage text={text} time={time} />
    default:
      return <RegularUserMessage text={text} time={time} />
  }
}

// Regular user message - right aligned, purple bubble
function RegularUserMessage({ text, time }: { text: string; time: Date }) {
  return (
    <div className="flex justify-end gap-3 group">
      <div className="flex flex-col items-end gap-1.5 max-w-[85%]">
        <span className="text-xs text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(time)}
        </span>
        <div className="bg-violet-600 text-white rounded-2xl rounded-tr-md px-4 py-3 text-base shadow-lg shadow-violet-500/20">
          {text}
        </div>
      </div>
      <div className="h-8 w-8 shrink-0 rounded-full bg-violet-600/20 flex items-center justify-center">
        <span className="text-xs font-semibold text-violet-400">U</span>
      </div>
    </div>
  )
}

// Shell command ($) - left aligned, green theme
function ShellMessage({ text, time }: { text: string; time: Date }) {
  return (
    <div className="flex gap-3 group">
      <div className="h-8 w-8 shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <Terminal className="w-4 h-4 text-emerald-400" />
      </div>
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-emerald-400">Shell Command</span>
          <span className="text-xs text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(time)}
          </span>
        </div>
        <div
          className={cn(
            'bg-emerald-950/30 border border-emerald-800/30 rounded-xl px-4 py-3',
            'font-mono text-base text-emerald-100'
          )}
        >
          <span className="text-emerald-500 mr-2">$</span>
          {text}
        </div>
      </div>
    </div>
  )
}

// App launch (!) - left aligned, blue theme, compact
function AppMessage({ text, time }: { text: string; time: Date }) {
  const appName = text.split(' ')[0]

  return (
    <div className="flex gap-3 items-center group">
      <div className="h-8 w-8 shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center">
        <Rocket className="w-4 h-4 text-blue-400" />
      </div>
      <div
        className={cn(
          'bg-blue-950/30 border border-blue-800/30 rounded-xl px-4 py-2.5',
          'flex items-center gap-2'
        )}
      >
        <span className="text-base text-blue-100">Launched</span>
        <span className="px-2 py-0.5 text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-md">
          {appName}
        </span>
      </div>
      <span className="text-xs text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
        {formatTime(time)}
      </span>
    </div>
  )
}

// External API message - left aligned, amber theme with pulse
function ExternalMessage({ text, time }: { text: string; time: Date }) {
  return (
    <div className="flex gap-3 group">
      <div className="h-8 w-8 shrink-0 rounded-full bg-amber-500/20 flex items-center justify-center">
        <Zap className="w-4 h-4 text-amber-400" />
      </div>
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded font-medium">
            API
          </span>
          <span className="text-sm text-zinc-400">External message</span>
          <span className="text-xs text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(time)}
          </span>
        </div>
        <div
          className={cn(
            'bg-amber-950/20 rounded-xl px-4 py-3 text-base text-zinc-100',
            'border-2 border-amber-600/50',
            'animate-pulse-border'
          )}
        >
          {text}
        </div>
      </div>
    </div>
  )
}
