import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/cn'

type StatusType = 'success' | 'error' | 'warning' | 'info'

interface StatusMessage {
  id: number
  text: string
  type: StatusType
}

let statusId = 0

// Global status emitter
const listeners = new Set<(msg: StatusMessage) => void>()

export function showStatus(text: string, type: StatusType = 'info') {
  const msg: StatusMessage = { id: ++statusId, text, type }
  listeners.forEach((fn) => fn(msg))
}

/**
 * Status bar for showing temporary messages
 */
export function StatusBar() {
  const [message, setMessage] = useState<StatusMessage | null>(null)

  useEffect(() => {
    const handleStatus = (msg: StatusMessage) => {
      setMessage(msg)
      setTimeout(() => {
        setMessage((current) => (current?.id === msg.id ? null : current))
      }, 3000)
    }

    listeners.add(handleStatus)
    return () => {
      listeners.delete(handleStatus)
    }
  }, [])

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed bottom-4 left-1/2 -translate-x-1/2',
            'px-4 py-2 rounded-lg text-xs',
            'bg-[var(--surface-color)] border',
            'pointer-events-none',
            message.type === 'error' && 'border-[var(--error-color)] text-[var(--error-color)]',
            message.type === 'success' &&
              'border-[var(--success-color)] text-[var(--success-color)]',
            message.type === 'warning' &&
              'border-[var(--warning-color)] text-[var(--warning-color)]',
            message.type === 'info' && 'border-[var(--border-color)] text-[var(--text-muted)]'
          )}
        >
          {message.text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
