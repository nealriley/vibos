import { useMemo } from 'react'
import type { Message, MessageType } from '@/types/message'
import { formatTime } from '@/lib/markdown'
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

// Regular user message - right aligned, full-width bar
function RegularUserMessage({ text, time }: { text: string; time: Date }) {
  return (
    <div className="w-full bg-violet-500/10">
      <div className="flex items-start justify-end gap-3 px-5 py-3.5 group">
        <div className="flex flex-col items-end gap-1 max-w-[85%]">
          <span className="text-xs text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(time)}
          </span>
          <div className="text-[16px] leading-7 text-zinc-100">
            {text}
          </div>
        </div>
        <div className="h-8 w-8 shrink-0 rounded-full bg-violet-500/10 border border-violet-400/15 flex items-center justify-center">
          <span className="text-xs font-semibold text-violet-300">U</span>
        </div>
      </div>
    </div>
  )
}

// Shell command ($) - left aligned, full-width bar
function ShellMessage({ text, time }: { text: string; time: Date }) {
  return (
    <div className="w-full bg-emerald-500/8">
      <div className="flex items-start gap-3 px-5 py-3.5 group">
        <div className="h-8 w-8 shrink-0 rounded-full bg-emerald-500/10 border border-emerald-400/15 flex items-center justify-center">
          <Terminal className="w-4 h-4 text-emerald-300" />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] leading-5 font-medium text-emerald-200">Shell</span>
            <span className="text-xs text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(time)}
            </span>
          </div>
          <div className="font-mono text-[15px] leading-6 text-zinc-100">
            <span className="text-emerald-300 mr-2">$</span>
            {text}
          </div>
        </div>
      </div>
    </div>
  )
}


// App launch (!) - left aligned, full-width bar
function AppMessage({ text, time }: { text: string; time: Date }) {
  const appName = text.split(' ')[0]

  return (
    <div className="w-full bg-sky-500/8">
      <div className="flex items-center gap-3 px-5 py-3.5 group">
        <div className="h-8 w-8 shrink-0 rounded-full bg-sky-500/10 border border-sky-400/15 flex items-center justify-center">
          <Rocket className="w-4 h-4 text-sky-300" />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-[15px] leading-6 text-zinc-100">Launched</span>
          <span className="px-2 py-0.5 text-[13px] leading-5 font-medium bg-sky-500/12 text-sky-200 border border-sky-400/15 rounded-md">
            {appName}
          </span>
        </div>
        <span className="text-xs text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(time)}
        </span>
      </div>
    </div>
  )
}


// External API message - left aligned, full-width bar
function ExternalMessage({ text, time }: { text: string; time: Date }) {
  return (
    <div className="w-full bg-amber-500/8">
      <div className="flex items-start gap-3 px-5 py-3.5 group">
        <div className="h-8 w-8 shrink-0 rounded-full bg-amber-500/10 border border-amber-400/15 flex items-center justify-center">
          <Zap className="w-4 h-4 text-amber-300" />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-400/20 rounded font-medium">
              API
            </span>
            <span className="text-[13px] leading-5 text-zinc-300">External</span>
            <span className="text-xs text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(time)}
            </span>
          </div>
          <div className="text-[16px] leading-7 text-zinc-100 animate-pulse-border">
            {text}
          </div>
        </div>
      </div>
    </div>
  )
}

