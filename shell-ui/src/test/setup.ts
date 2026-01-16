import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.vibeos API
const mockVibeos = {
  initSession: vi.fn(),
  submitInput: vi.fn(),
  getMessages: vi.fn(),
  abort: vi.fn(),
  resetSession: vi.fn(),
  getConfig: vi.fn(),
  onOpencodeEvent: vi.fn(),
  removeOpencodeEventListener: vi.fn(),
  onSessionReset: vi.fn(),
  getConnectionStatus: vi.fn(),
  onConnectionStatus: vi.fn(),
  removeConnectionStatusListener: vi.fn(),
  toggleMainWindow: vi.fn(),
  onWindowsUpdate: vi.fn(),
  focusWindow: vi.fn(),
  closeWindow: vi.fn(),
}

// @ts-expect-error - mocking window.vibeos
window.vibeos = mockVibeos

// Helper to reset all mocks between tests
export function resetMocks() {
  Object.values(mockVibeos).forEach(mock => {
    if (typeof mock.mockReset === 'function') {
      mock.mockReset()
    }
  })
}

// Helper to get the mock vibeos object
export function getMockVibeos() {
  return mockVibeos
}

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

// Mock matchMedia
window.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))
