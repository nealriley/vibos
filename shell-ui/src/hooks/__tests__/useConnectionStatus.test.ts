import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useConnectionStatus } from '../useConnectionStatus'
import { getMockVibeos, resetMocks } from '../../test/setup'

describe('useConnectionStatus', () => {
  beforeEach(() => {
    resetMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns initial disconnected status', async () => {
    const mockVibeos = getMockVibeos()
    mockVibeos.getConnectionStatus.mockResolvedValue('disconnected')

    const { result } = renderHook(() => useConnectionStatus())

    // Initially returns 'disconnected' (the useState default)
    expect(result.current).toBe('disconnected')
  })

  it('fetches and updates status on mount', async () => {
    const mockVibeos = getMockVibeos()
    mockVibeos.getConnectionStatus.mockResolvedValue('connected')

    const { result } = renderHook(() => useConnectionStatus())

    await waitFor(() => {
      expect(result.current).toBe('connected')
    })

    expect(mockVibeos.getConnectionStatus).toHaveBeenCalledTimes(1)
  })

  it('subscribes to status changes on mount', () => {
    const mockVibeos = getMockVibeos()
    mockVibeos.getConnectionStatus.mockResolvedValue('connected')

    renderHook(() => useConnectionStatus())

    expect(mockVibeos.onConnectionStatus).toHaveBeenCalledTimes(1)
    expect(mockVibeos.onConnectionStatus).toHaveBeenCalledWith(expect.any(Function))
  })

  it('updates status when callback is called', async () => {
    const mockVibeos = getMockVibeos()
    mockVibeos.getConnectionStatus.mockResolvedValue('disconnected')
    
    let statusCallback: ((status: string) => void) | null = null
    mockVibeos.onConnectionStatus.mockImplementation((cb: (status: string) => void) => {
      statusCallback = cb
    })

    const { result } = renderHook(() => useConnectionStatus())

    // Wait for initial fetch
    await waitFor(() => {
      expect(mockVibeos.getConnectionStatus).toHaveBeenCalled()
    })

    // Simulate status change via callback
    act(() => {
      statusCallback?.('reconnecting')
    })

    expect(result.current).toBe('reconnecting')

    // Simulate another status change
    act(() => {
      statusCallback?.('connected')
    })

    expect(result.current).toBe('connected')
  })

  it('unsubscribes on unmount', () => {
    const mockVibeos = getMockVibeos()
    mockVibeos.getConnectionStatus.mockResolvedValue('connected')

    const { unmount } = renderHook(() => useConnectionStatus())

    unmount()

    expect(mockVibeos.removeConnectionStatusListener).toHaveBeenCalledTimes(1)
  })

  it('handles getConnectionStatus error gracefully', async () => {
    const mockVibeos = getMockVibeos()
    mockVibeos.getConnectionStatus.mockRejectedValue(new Error('API error'))

    const { result } = renderHook(() => useConnectionStatus())

    // Should stay at 'disconnected' on error
    await waitFor(() => {
      expect(mockVibeos.getConnectionStatus).toHaveBeenCalled()
    })

    expect(result.current).toBe('disconnected')
  })
})
