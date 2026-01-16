import { useEffect, useCallback } from 'react'
import type { OpenCodeEvent, MessagePart } from '@/types/message'
import * as api from '@/lib/api'

interface UseSSEOptions {
  onStatusChange?: (status: 'idle' | 'busy') => void
  onPartUpdated?: (part: MessagePart & { messageID?: string }) => void
  onSessionIdle?: () => void
  onMessageCreated?: (info: { role: string; id: string }) => void
}

/**
 * Hook for handling OpenCode SSE events
 * Separates event handling from state management
 */
export function useSSE(options: UseSSEOptions = {}) {
  const { onStatusChange, onPartUpdated, onSessionIdle, onMessageCreated } = options

  const handleEvent = useCallback((event: OpenCodeEvent) => {
    const eventType = event.type

    switch (eventType) {
      case 'session.status': {
        const statusEvent = event as { properties: { status: { type: string } | string } }
        const statusObj = statusEvent.properties?.status
        const statusType = typeof statusObj === 'object' ? statusObj.type : statusObj
        
        if (statusType === 'busy' || statusType === 'idle') {
          onStatusChange?.(statusType as 'idle' | 'busy')
        }
        break
      }

      case 'session.idle':
        onSessionIdle?.()
        break

      case 'message.created': {
        const msgEvent = event as { properties: { info: { role: string; id: string } } }
        if (msgEvent.properties?.info) {
          onMessageCreated?.(msgEvent.properties.info)
        }
        break
      }

      case 'message.part.updated': {
        const partEvent = event as { properties: { part: (MessagePart | { type: string }) & { messageID?: string } } }
        const part = partEvent.properties?.part
        
        if (!part) break
        
        // Skip non-content parts (step-start, step-finish, etc.)
        if (part.type !== 'text' && part.type !== 'tool') break
        
        onPartUpdated?.(part as MessagePart & { messageID?: string })
        break
      }
    }
  }, [onStatusChange, onPartUpdated, onSessionIdle, onMessageCreated])

  useEffect(() => {
    api.onOpencodeEvent(handleEvent)

    return () => {
      api.removeOpencodeEventListener()
    }
  }, [handleEvent])
}
