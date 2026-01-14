import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/cn'

interface LoadingOverlayProps {
  visible: boolean
  text?: string
  error?: string | null
}

/**
 * Full-screen loading overlay for initialization
 */
export function LoadingOverlay({
  visible,
  text = 'Connecting to OpenCode...',
  error = null,
}: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'fixed inset-0 z-50',
            'flex flex-col items-center justify-center',
            'bg-[var(--bg-color)]'
          )}
        >
          {/* Spinner */}
          <div
            className={cn(
              'w-10 h-10 rounded-full',
              'border-[3px] border-[var(--border-color)]',
              'border-t-[var(--accent-color)]',
              'animate-spin'
            )}
          />

          {/* Text */}
          <p
            className={cn(
              'mt-4 text-sm',
              error ? 'text-[var(--error-color)]' : 'text-[var(--text-muted)]'
            )}
          >
            {error || text}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
