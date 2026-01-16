import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSession } from '../useSession'
import { getMockVibeos, resetMocks } from '../../test/setup'

describe('useSession', () => {
  beforeEach(() => {
    resetMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('starts with loading status', () => {
      const mockVibeos = getMockVibeos()
      mockVibeos.initSession.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useSession())

      expect(result.current.status).toBe('loading')
      expect(result.current.messages).toEqual([])
      expect(result.current.error).toBeNull()
    })

    it('transitions to ready on successful init', async () => {
      const mockVibeos = getMockVibeos()
      mockVibeos.initSession.mockResolvedValue({
        success: true,
        session: { id: 'test-session', title: 'desktop' },
        messages: [],
      })

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.status).toBe('ready')
      })
    })

    it('loads existing messages on init', async () => {
      const mockVibeos = getMockVibeos()
      const existingMessages = [
        { info: { id: 'msg-1', role: 'user' }, parts: [{ type: 'text', text: 'Hello' }] },
        { info: { id: 'msg-2', role: 'assistant' }, parts: [{ type: 'text', text: 'Hi!' }] },
      ]
      mockVibeos.initSession.mockResolvedValue({
        success: true,
        session: { id: 'test-session', title: 'desktop' },
        messages: existingMessages,
      })

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.messages).toEqual(existingMessages)
      })
    })

    it('transitions to error on failed init', async () => {
      const mockVibeos = getMockVibeos()
      mockVibeos.initSession.mockResolvedValue({
        success: false,
        error: 'Server unavailable',
      })

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.status).toBe('error')
        expect(result.current.error).toBe('Server unavailable')
      })
    })

    it('handles init exception', async () => {
      const mockVibeos = getMockVibeos()
      mockVibeos.initSession.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.status).toBe('error')
        expect(result.current.error).toBe('Network error')
      })
    })
  })

  describe('sendMessage', () => {
    beforeEach(() => {
      const mockVibeos = getMockVibeos()
      mockVibeos.initSession.mockResolvedValue({
        success: true,
        session: { id: 'test-session', title: 'desktop' },
        messages: [],
      })
    })

    it('returns error when session is busy', async () => {
      const mockVibeos = getMockVibeos()
      mockVibeos.submitInput.mockResolvedValue({ success: true, type: 'opencode' })

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.status).toBe('ready')
      })

      // Send first message
      act(() => {
        result.current.sendMessage('First message')
      })

      // Immediately try to send another (while busy)
      const secondResult = await result.current.sendMessage('Second message')

      expect(secondResult.success).toBe(false)
      expect(secondResult.error).toBe('Session is busy')
    })

    it('adds optimistic user message for opencode prompts', async () => {
      const mockVibeos = getMockVibeos()
      mockVibeos.submitInput.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.status).toBe('ready')
      })

      act(() => {
        result.current.sendMessage('Test prompt')
      })

      // Should have optimistic message
      expect(result.current.messages.length).toBe(1)
      expect(result.current.messages[0].parts[0].text).toBe('Test prompt')
      expect(result.current.messages[0].info.role).toBe('user')
    })

    it('sets status to busy for opencode prompts', async () => {
      const mockVibeos = getMockVibeos()
      mockVibeos.submitInput.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.status).toBe('ready')
      })

      act(() => {
        result.current.sendMessage('Test prompt')
      })

      expect(result.current.status).toBe('busy')
      expect(result.current.isStreaming).toBe(true)
    })

    it('does not set busy status for app launch commands', async () => {
      const mockVibeos = getMockVibeos()
      mockVibeos.submitInput.mockResolvedValue({ success: true, type: 'app' })

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.status).toBe('ready')
      })

      await act(async () => {
        await result.current.sendMessage('!chrome')
      })

      // Should stay ready for app commands
      expect(result.current.status).toBe('ready')
    })

    it('does not set busy status for shell commands', async () => {
      const mockVibeos = getMockVibeos()
      mockVibeos.submitInput.mockResolvedValue({ success: true, type: 'shell' })

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.status).toBe('ready')
      })

      await act(async () => {
        await result.current.sendMessage('$ls -la')
      })

      // Should stay ready for shell commands
      expect(result.current.status).toBe('ready')
    })

    it('rolls back optimistic message on failure', async () => {
      const mockVibeos = getMockVibeos()
      mockVibeos.submitInput.mockResolvedValue({ success: false, error: 'API error' })

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.status).toBe('ready')
      })

      await act(async () => {
        await result.current.sendMessage('Test prompt')
      })

      // Optimistic message should be removed
      expect(result.current.messages.length).toBe(0)
      expect(result.current.status).toBe('ready')
    })
  })

  describe('abort', () => {
    it('calls abort API and resets streaming state', async () => {
      const mockVibeos = getMockVibeos()
      mockVibeos.initSession.mockResolvedValue({
        success: true,
        session: { id: 'test-session', title: 'desktop' },
        messages: [],
      })
      mockVibeos.abort.mockResolvedValue({ success: true })
      mockVibeos.submitInput.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.status).toBe('ready')
      })

      // Start a message to make it busy
      act(() => {
        result.current.sendMessage('Long running prompt')
      })

      expect(result.current.isStreaming).toBe(true)

      // Abort
      await act(async () => {
        await result.current.abort()
      })

      expect(mockVibeos.abort).toHaveBeenCalled()
      expect(result.current.isStreaming).toBe(false)
      expect(result.current.status).toBe('ready')
    })
  })

  describe('reset', () => {
    it('calls resetSession and clears messages', async () => {
      const mockVibeos = getMockVibeos()
      mockVibeos.initSession.mockResolvedValue({
        success: true,
        session: { id: 'test-session', title: 'desktop' },
        messages: [
          { info: { id: 'msg-1', role: 'user' }, parts: [{ type: 'text', text: 'Hello' }] },
        ],
      })
      mockVibeos.resetSession.mockResolvedValue({ success: true })

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.messages.length).toBe(1)
      })

      // Reset
      await act(async () => {
        await result.current.reset()
      })

      expect(mockVibeos.resetSession).toHaveBeenCalled()
      expect(result.current.messages).toEqual([])
      expect(result.current.status).toBe('ready')
    })
  })

  describe('SSE event subscription', () => {
    it('subscribes to opencode events on mount', async () => {
      const mockVibeos = getMockVibeos()
      mockVibeos.initSession.mockResolvedValue({
        success: true,
        session: { id: 'test-session', title: 'desktop' },
        messages: [],
      })

      renderHook(() => useSession())

      await waitFor(() => {
        expect(mockVibeos.onOpencodeEvent).toHaveBeenCalled()
      })
    })

    it('unsubscribes from events on unmount', async () => {
      const mockVibeos = getMockVibeos()
      mockVibeos.initSession.mockResolvedValue({
        success: true,
        session: { id: 'test-session', title: 'desktop' },
        messages: [],
      })

      const { unmount } = renderHook(() => useSession())

      await waitFor(() => {
        expect(mockVibeos.onOpencodeEvent).toHaveBeenCalled()
      })

      unmount()

      expect(mockVibeos.removeOpencodeEventListener).toHaveBeenCalled()
    })
  })
})
