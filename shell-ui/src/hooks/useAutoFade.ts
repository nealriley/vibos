import { useState, useEffect, useCallback, useRef } from 'react'

interface FadeState {
  [messageId: string]: number // opacity 0-1
}

interface UseAutoFadeOptions {
  /** Time in ms before fade starts (default: 5 minutes) */
  fadeDelay?: number
  /** Duration of fade in ms (default: 5 minutes) */
  fadeDuration?: number
  /** Minimum opacity (default: 0.3) */
  minOpacity?: number
  /** Enable/disable fading (default: true) */
  enabled?: boolean
}

const DEFAULT_FADE_DELAY = 5 * 60 * 1000 // 5 minutes
const DEFAULT_FADE_DURATION = 5 * 60 * 1000 // 5 minutes
const DEFAULT_MIN_OPACITY = 0.3
const UPDATE_INTERVAL = 10000 // Update every 10 seconds

/**
 * Hook for auto-fading old messages over time
 * Returns opacity values for each message ID
 */
export function useAutoFade(
  messageIds: string[],
  messageTimes: { [id: string]: string | undefined },
  options: UseAutoFadeOptions = {}
) {
  const {
    fadeDelay = DEFAULT_FADE_DELAY,
    fadeDuration = DEFAULT_FADE_DURATION,
    minOpacity = DEFAULT_MIN_OPACITY,
    enabled = true
  } = options

  const [fadeState, setFadeState] = useState<FadeState>({})
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const calculateOpacity = useCallback((createdTime: string | undefined): number => {
    if (!enabled || !createdTime) return 1

    const created = new Date(createdTime).getTime()
    const now = Date.now()
    const age = now - created

    if (age < fadeDelay) {
      return 1
    }

    const fadeProgress = Math.min((age - fadeDelay) / fadeDuration, 1)
    return Math.max(1 - fadeProgress * (1 - minOpacity), minOpacity)
  }, [enabled, fadeDelay, fadeDuration, minOpacity])

  const updateFadeState = useCallback(() => {
    const newState: FadeState = {}
    
    for (const id of messageIds) {
      newState[id] = calculateOpacity(messageTimes[id])
    }
    
    setFadeState(newState)
  }, [messageIds, messageTimes, calculateOpacity])

  // Initial calculation and periodic updates
  useEffect(() => {
    updateFadeState()

    if (enabled) {
      intervalRef.current = setInterval(updateFadeState, UPDATE_INTERVAL)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, updateFadeState])

  /**
   * Get opacity for a specific message
   * Returns 1 (full opacity) if not in state
   */
  const getOpacity = useCallback((messageId: string): number => {
    return fadeState[messageId] ?? 1
  }, [fadeState])

  /**
   * Reset opacity for a message (e.g., on hover)
   */
  const resetOpacity = useCallback((messageId: string) => {
    setFadeState(prev => ({
      ...prev,
      [messageId]: 1
    }))
  }, [])

  return {
    fadeState,
    getOpacity,
    resetOpacity
  }
}
