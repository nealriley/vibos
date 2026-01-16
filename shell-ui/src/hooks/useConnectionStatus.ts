import { useState, useEffect } from 'react'
import type { ConnectionStatus } from '@/types/vibeos'
import * as api from '@/lib/api'

/**
 * Hook for tracking SSE connection status
 * Returns current connection status and auto-updates on changes
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')

  useEffect(() => {
    // Get initial status
    api.getConnectionStatus().then(setStatus).catch(() => {
      setStatus('disconnected')
    })

    // Subscribe to status changes
    api.onConnectionStatus(setStatus)

    return () => {
      api.removeConnectionStatusListener()
    }
  }, [])

  return status
}
