import * as React from "react"
import { ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  smooth?: boolean
}

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  ({ className, children, smooth = true, ...props }, _ref) => {
    const scrollRef = React.useRef<HTMLDivElement>(null)
    const [isAtBottom, setIsAtBottom] = React.useState(true)
    const [autoScroll, setAutoScroll] = React.useState(true)
    const lastContentHeight = React.useRef(0)

    const checkIsAtBottom = React.useCallback((element: HTMLElement) => {
      const { scrollTop, scrollHeight, clientHeight } = element
      return Math.abs(scrollHeight - scrollTop - clientHeight) <= 30
    }, [])

    const scrollToBottom = React.useCallback((instant?: boolean) => {
      if (!scrollRef.current) return
      
      const targetScrollTop = scrollRef.current.scrollHeight - scrollRef.current.clientHeight
      
      if (instant) {
        scrollRef.current.scrollTop = targetScrollTop
      } else {
        scrollRef.current.scrollTo({
          top: targetScrollTop,
          behavior: smooth ? "smooth" : "auto",
        })
      }
      
      setIsAtBottom(true)
      setAutoScroll(true)
    }, [smooth])

    // Handle scroll events
    const handleScroll = React.useCallback(() => {
      if (!scrollRef.current) return
      const atBottom = checkIsAtBottom(scrollRef.current)
      setIsAtBottom(atBottom)
      if (atBottom) setAutoScroll(true)
    }, [checkIsAtBottom])

    // Disable auto-scroll on user scroll
    const disableAutoScroll = React.useCallback(() => {
      if (scrollRef.current && !checkIsAtBottom(scrollRef.current)) {
        setAutoScroll(false)
      }
    }, [checkIsAtBottom])

    // Attach scroll listener
    React.useEffect(() => {
      const element = scrollRef.current
      if (!element) return
      
      element.addEventListener("scroll", handleScroll, { passive: true })
      return () => element.removeEventListener("scroll", handleScroll)
    }, [handleScroll])

    // Auto-scroll when content changes
    React.useEffect(() => {
      const scrollElement = scrollRef.current
      if (!scrollElement) return

      const currentHeight = scrollElement.scrollHeight
      const hasNewContent = currentHeight !== lastContentHeight.current

      if (hasNewContent && autoScroll) {
        requestAnimationFrame(() => {
          scrollToBottom(lastContentHeight.current === 0)
        })
        lastContentHeight.current = currentHeight
      }
    }, [children, autoScroll, scrollToBottom])

    // Resize observer for dynamic content
    React.useEffect(() => {
      const element = scrollRef.current
      if (!element) return

      const resizeObserver = new ResizeObserver(() => {
        if (autoScroll) {
          scrollToBottom(true)
        }
      })

      resizeObserver.observe(element)
      return () => resizeObserver.disconnect()
    }, [autoScroll, scrollToBottom])

    return (
      <div className="relative flex-1 overflow-hidden w-full">
        <div
          ref={scrollRef}
          onWheel={disableAutoScroll}
          onTouchMove={disableAutoScroll}
          className={cn(
            "h-full w-full overflow-y-auto",
            "scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent",
            className
          )}
          {...props}
        >
          <div className="flex flex-col gap-6 py-6 max-w-3xl mx-auto px-6 min-h-full">
            {children}
          </div>
        </div>

        {/* Scroll to bottom button */}
        {!isAtBottom && (
          <Button
            onClick={() => scrollToBottom()}
            size="icon"
            variant="outline"
            className={cn(
              "absolute bottom-4 left-1/2 -translate-x-1/2",
              "h-8 w-8 rounded-full",
              "bg-zinc-800 border-zinc-700 hover:bg-zinc-700",
              "shadow-lg shadow-black/30",
              "animate-in fade-in slide-in-from-bottom-2 duration-200"
            )}
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }
)
ChatMessageList.displayName = "ChatMessageList"

export { ChatMessageList }
