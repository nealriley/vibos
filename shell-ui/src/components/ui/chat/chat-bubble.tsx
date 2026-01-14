import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button, type ButtonProps } from "@/components/ui/button"

// ChatBubble - main container for a message
const chatBubbleVariants = cva(
  "flex gap-3 max-w-[85%] items-end relative group",
  {
    variants: {
      variant: {
        received: "self-start",
        sent: "self-end flex-row-reverse",
      },
      layout: {
        default: "",
        ai: "max-w-full w-full items-start",
      },
    },
    defaultVariants: {
      variant: "received",
      layout: "default",
    },
  }
)

interface ChatBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleVariants> {}

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  ({ className, variant, layout, children, ...props }, ref) => (
    <div
      className={cn(chatBubbleVariants({ variant, layout, className }))}
      ref={ref}
      {...props}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child) && typeof child.type !== "string"
          ? React.cloneElement(child, {
              variant,
              layout,
            } as React.ComponentProps<typeof child.type>)
          : child
      )}
    </div>
  )
)
ChatBubble.displayName = "ChatBubble"

// ChatBubbleAvatar
interface ChatBubbleAvatarProps {
  fallback: string
  className?: string
  variant?: "received" | "sent"
}

const ChatBubbleAvatar: React.FC<ChatBubbleAvatarProps> = ({
  fallback,
  className,
  variant,
}) => (
  <Avatar className={cn("h-8 w-8 shrink-0", className)}>
    <AvatarFallback
      className={cn(
        "text-xs font-semibold",
        variant === "sent"
          ? "bg-violet-600/20 text-violet-400"
          : "bg-emerald-500/20 text-emerald-400"
      )}
    >
      {fallback}
    </AvatarFallback>
  </Avatar>
)

// ChatBubbleMessage - the actual message content
const chatBubbleMessageVariants = cva("px-4 py-3 text-lg", {
  variants: {
    variant: {
      received: "bg-zinc-800/50 text-zinc-100 rounded-2xl rounded-tl-md border border-zinc-700/50",
      sent: "bg-violet-600 text-white rounded-2xl rounded-tr-md shadow-lg shadow-violet-500/10",
    },
    layout: {
      default: "",
      ai: "w-full rounded-xl",
    },
  },
  defaultVariants: {
    variant: "received",
    layout: "default",
  },
})

interface ChatBubbleMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleMessageVariants> {
  isLoading?: boolean
}

const ChatBubbleMessage = React.forwardRef<HTMLDivElement, ChatBubbleMessageProps>(
  ({ className, variant, layout, isLoading = false, children, ...props }, ref) => (
    <div
      className={cn(
        chatBubbleMessageVariants({ variant, layout, className }),
        "break-words max-w-full whitespace-pre-wrap"
      )}
      ref={ref}
      {...props}
    >
      {isLoading ? <MessageLoading /> : children}
    </div>
  )
)
ChatBubbleMessage.displayName = "ChatBubbleMessage"

// ChatBubbleTimestamp
interface ChatBubbleTimestampProps extends React.HTMLAttributes<HTMLSpanElement> {
  timestamp: string
}

const ChatBubbleTimestamp: React.FC<ChatBubbleTimestampProps> = ({
  timestamp,
  className,
  ...props
}) => (
  <span
    className={cn(
      "text-[11px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity",
      className
    )}
    {...props}
  >
    {timestamp}
  </span>
)

// ChatBubbleAction - action button on hover
type ChatBubbleActionProps = ButtonProps & {
  icon: React.ReactNode
}

const ChatBubbleAction: React.FC<ChatBubbleActionProps> = ({
  icon,
  className,
  ...props
}) => (
  <Button
    variant="ghost"
    size="icon"
    className={cn("h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity", className)}
    {...props}
  >
    {icon}
  </Button>
)

// ChatBubbleActionWrapper - container for action buttons
interface ChatBubbleActionWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "sent" | "received"
}

const ChatBubbleActionWrapper = React.forwardRef<HTMLDivElement, ChatBubbleActionWrapperProps>(
  ({ variant, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 flex gap-1",
        "opacity-0 group-hover:opacity-100 transition-opacity",
        variant === "sent"
          ? "-left-2 -translate-x-full"
          : "-right-2 translate-x-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
ChatBubbleActionWrapper.displayName = "ChatBubbleActionWrapper"

// MessageLoading - animated loading dots
function MessageLoading() {
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-current animate-bounce"
            style={{ animationDelay: `${i * 150}ms`, animationDuration: "600ms" }}
          />
        ))}
      </div>
      <span className="text-zinc-400 text-sm ml-2">Thinking...</span>
    </div>
  )
}

export {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
  MessageLoading,
  chatBubbleVariants,
  chatBubbleMessageVariants,
}
