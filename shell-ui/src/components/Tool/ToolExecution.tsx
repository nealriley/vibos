import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Terminal, FileText, Pencil, Search, CheckCircle2, Loader2, XCircle, Clock, ChevronRight } from 'lucide-react'
import type { ToolPart } from '@/types/message'

interface ToolExecutionProps {
  tool: ToolPart
  isLast?: boolean
}

/**
 * Clean, collapsible tool execution display
 */
export function ToolExecution({ tool, isLast = false }: ToolExecutionProps) {
  const [expanded, setExpanded] = useState(false)

  const toolName = tool.tool || tool.name || 'Tool'
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

  const outputSection = output ? `\n\n--- Output ---\n${output}` : ''
  const Icon = getToolIcon(toolName)
  const StatusIcon = getStatusIcon(status)

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center gap-3 px-4 py-2.5',
            'hover:bg-muted/50 transition-colors',
            'text-left cursor-pointer',
            !isLast && 'border-b border-border'
          )}
        >
          {/* Icon */}
          <div className={cn(
            'flex items-center justify-center w-7 h-7 rounded-lg shrink-0',
            status === 'completed' && 'bg-emerald-500/10 text-emerald-400',
            status === 'running' && 'bg-amber-500/10 text-amber-400',
            status === 'error' && 'bg-red-500/10 text-red-400',
            status === 'pending' && 'bg-muted text-muted-foreground'
          )}>
            <Icon className="w-4 h-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {formatToolName(toolName)}
              </span>
              {title && (
                <span className="text-xs text-muted-foreground truncate">
                  {title}
                </span>
              )}
            </div>
          </div>

          {/* Status badge */}
          <Badge
            variant={
              status === 'completed' ? 'success' :
              status === 'running' ? 'warning' :
              status === 'error' ? 'destructive' : 'secondary'
            }
            className="shrink-0"
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {status === 'completed' ? 'Done' : status}
          </Badge>

          {/* Chevron */}
          <ChevronRight className={cn(
            'w-4 h-4 text-muted-foreground transition-transform',
            expanded && 'rotate-90'
          )} />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="px-4 pb-3"
        >
          <pre className={cn(
            'mt-2 p-3 rounded-lg',
            'bg-muted/50 border border-border',
            'text-xs font-mono',
            'max-h-[200px] overflow-auto',
            'whitespace-pre-wrap break-words',
            'text-muted-foreground'
          )}>
            {inputStr}
            {outputSection}
          </pre>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function formatToolName(name: string): string {
  return name
    .replace(/^mcp_/, '')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getToolIcon(name: string) {
  const key = name.toLowerCase().replace(/^mcp_/, '')
  
  const icons: Record<string, typeof Terminal> = {
    bash: Terminal,
    read: FileText,
    write: Pencil,
    edit: Pencil,
    glob: Search,
    grep: Search,
    task: FileText,
  }

  return icons[key] || Terminal
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return CheckCircle2
    case 'running':
      return Loader2
    case 'error':
      return XCircle
    default:
      return Clock
  }
}
