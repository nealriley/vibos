import { useState, useRef, useEffect } from 'react'
import { ChatInput, ChatInputHints } from '@/components/ui/chat'

interface PromptInputProps {
  onSubmit: (input: string) => void
  onAbort: () => void
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
}

export function PromptInput({
  onSubmit,
  onAbort,
  disabled = false,
  isLoading = false,
  placeholder = 'Message VibeOS...',
}: PromptInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!disabled && !isLoading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [disabled, isLoading])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled || isLoading) return
    setValue('')
    onSubmit(trimmed)
  }

  return (
    <div className="py-4 px-6 no-drag">
      <div className="w-full max-w-3xl mx-auto">
        <ChatInput
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onSend={handleSubmit}
          onStop={onAbort}
          isLoading={isLoading}
          canSend={!disabled && !!value.trim()}
          placeholder={placeholder}
          disabled={disabled}
        />
        <ChatInputHints />
      </div>
    </div>
  )
}
