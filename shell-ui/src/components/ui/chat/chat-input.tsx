import * as React from "react"
import { cn } from "@/lib/cn"
import { Button } from "@/components/ui/button"
import { Send, Square } from "lucide-react"

interface ChatInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSend?: () => void
  onStop?: () => void
  isLoading?: boolean
  canSend?: boolean
}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ className, onSend, onStop, isLoading = false, canSend = true, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    
    // Merge refs
    React.useImperativeHandle(ref, () => textareaRef.current!)

    // Auto-resize textarea
    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current
      if (textarea) {
        textarea.style.height = "auto"
        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
      }
    }, [])

    React.useEffect(() => {
      adjustHeight()
    }, [props.value, adjustHeight])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        if (canSend && !isLoading) {
          onSend?.()
        }
      }
      if (e.key === "Escape" && isLoading) {
        e.preventDefault()
        onStop?.()
      }
    }

    return (
      <div
        className={cn(
          "relative flex items-end gap-2",
          "bg-zinc-900 border border-zinc-700/50 rounded-2xl",
          "shadow-lg shadow-black/20",
          "focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/20",
          "transition-all duration-200",
          className
        )}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex-1 min-h-[56px] max-h-[200px] px-5 py-4",
            "bg-transparent text-lg text-zinc-100",
            "placeholder:text-zinc-500",
            "resize-none outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          {...props}
        />

        <div className="pr-2 pb-2">
          {isLoading ? (
            <Button
              type="button"
              size="icon"
              onClick={onStop}
              className="h-9 w-9 rounded-xl bg-red-600 hover:bg-red-500 text-white"
              title="Stop (Esc)"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              onClick={onSend}
              disabled={!canSend}
              className="h-9 w-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }
)
ChatInput.displayName = "ChatInput"

// Keyboard hints
function ChatInputHints() {
  return (
    <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-500 mt-2">
      <span><Kbd>Enter</Kbd> send</span>
      <span><Kbd>Shift+Enter</Kbd> new line</span>
      <span><Kbd>!</Kbd> launch app</span>
      <span><Kbd>$</Kbd> run command</span>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-medium bg-zinc-800 border border-zinc-700 rounded text-zinc-400">
      {children}
    </kbd>
  )
}

export { ChatInput, ChatInputHints }
