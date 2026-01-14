import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/cn"
import { Badge } from "@/components/ui/badge"
import { 
  Terminal, 
  FileText, 
  Pencil, 
  Search, 
  CheckCircle2, 
  Loader2, 
  XCircle, 
  Clock,
  ChevronRight,
  Copy,
  Check
} from "lucide-react"

type ToolState = "pending" | "running" | "completed" | "error"

interface ToolCallProps {
  name: string
  description?: string
  state: ToolState
  input?: string
  output?: string
  className?: string
}

function ToolCall({ name, description, state, input, output, className }: ToolCallProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const Icon = getToolIcon(name)
  const StatusIcon = getStatusIcon(state)
  const displayName = formatToolName(name)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const content = [input, output].filter(Boolean).join("\n\n")
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-700/50 bg-zinc-800/30 overflow-hidden",
        "transition-all duration-200",
        expanded && "ring-1 ring-zinc-600/50",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5",
          "hover:bg-zinc-700/30 transition-colors",
          "text-left cursor-pointer"
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-md shrink-0",
            state === "completed" && "bg-emerald-500/15 text-emerald-400",
            state === "running" && "bg-amber-500/15 text-amber-400",
            state === "error" && "bg-red-500/15 text-red-400",
            state === "pending" && "bg-zinc-500/15 text-zinc-400"
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-200">
              {displayName}
            </span>
            {description && (
              <span className="text-xs text-zinc-500 truncate max-w-[200px]">
                {description}
              </span>
            )}
          </div>
        </div>

        {/* Status */}
        <Badge
          variant={
            state === "completed" ? "success" :
            state === "running" ? "warning" :
            state === "error" ? "destructive" : "secondary"
          }
          className="shrink-0 gap-1"
        >
          <StatusIcon className={cn("w-3 h-3", state === "running" && "animate-spin")} />
          {state === "completed" ? "Done" : state === "running" ? "Running" : state}
        </Badge>

        {/* Chevron */}
        <ChevronRight
          className={cn(
            "w-4 h-4 text-zinc-500 transition-transform duration-200",
            expanded && "rotate-90"
          )}
        />
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {expanded && (input || output) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              <div className="relative">
                <pre
                  className={cn(
                    "p-3 rounded-lg text-xs font-mono",
                    "bg-zinc-900/80 border border-zinc-700/30",
                    "max-h-[200px] overflow-auto",
                    "whitespace-pre-wrap break-words",
                    "text-zinc-400"
                  )}
                >
                  {input}
                  {output && (
                    <>
                      {input && "\n\n"}
                      <span className="text-zinc-500">{"─".repeat(20)} Output {"─".repeat(20)}</span>
                      {"\n\n"}
                      <span className="text-zinc-300">{output}</span>
                    </>
                  )}
                </pre>

                {/* Copy button */}
                <button
                  onClick={handleCopy}
                  className={cn(
                    "absolute top-2 right-2 p-1.5 rounded-md",
                    "bg-zinc-800 hover:bg-zinc-700 transition-colors",
                    "text-zinc-400 hover:text-zinc-200"
                  )}
                  title="Copy"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function formatToolName(name: string): string {
  return name
    .replace(/^mcp_/, "")
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function getToolIcon(name: string) {
  const key = name.toLowerCase().replace(/^mcp_/, "")

  const icons: Record<string, typeof Terminal> = {
    bash: Terminal,
    read: FileText,
    write: Pencil,
    edit: Pencil,
    glob: Search,
    grep: Search,
    task: FileText,
    webfetch: Search,
  }

  return icons[key] || Terminal
}

function getStatusIcon(state: ToolState) {
  switch (state) {
    case "completed":
      return CheckCircle2
    case "running":
      return Loader2
    case "error":
      return XCircle
    default:
      return Clock
  }
}

export { ToolCall, type ToolState }
