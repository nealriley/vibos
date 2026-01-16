import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Message } from '../Message'
import type { Message as MessageType } from '@/types/message'

// Helper to create test messages
function createMessage(role: 'user' | 'assistant', text: string, id = 'test-msg'): MessageType {
  return {
    info: {
      id,
      role,
      time: { created: '2026-01-16T12:00:00Z' },
    },
    parts: [{ type: 'text', text }],
  }
}

describe('Message', () => {
  describe('role-based rendering', () => {
    it('renders UserMessage for user role', () => {
      const message = createMessage('user', 'Hello')
      render(<Message message={message} />)

      expect(screen.getByText('Hello')).toBeInTheDocument()
      // User messages have a "U" avatar
      expect(screen.getByText('U')).toBeInTheDocument()
    })

    it('renders AIMessage for assistant role', () => {
      const message = createMessage('assistant', 'Hi there!')
      render(<Message message={message} />)

      expect(screen.getByText('Hi there!')).toBeInTheDocument()
      // AI messages have a "V" avatar
      expect(screen.getByText('V')).toBeInTheDocument()
    })

    it('returns null for unknown role', () => {
      const message = {
        info: { id: 'test', role: 'system' as const, time: { created: '' } },
        parts: [{ type: 'text' as const, text: 'System message' }],
      }
      const { container } = render(<Message message={message as MessageType} />)

      expect(container.firstChild).toBeNull()
    })
  })
})

describe('UserMessage variants', () => {
  it('renders regular user message', () => {
    const message = createMessage('user', 'Regular prompt')
    render(<Message message={message} />)

    expect(screen.getByText('Regular prompt')).toBeInTheDocument()
    // Should have violet background (checked via class)
    expect(screen.getByText('Regular prompt').closest('div')).toHaveClass('text-zinc-100')
  })

  it('renders shell command with $ prefix', () => {
    const message = createMessage('user', '$ls -la')
    render(<Message message={message} />)

    // Should show "Shell" label
    expect(screen.getByText('Shell')).toBeInTheDocument()
    // Should show command without $
    expect(screen.getByText('ls -la')).toBeInTheDocument()
    // Should show $ prefix in styled format
    expect(screen.getByText('$')).toBeInTheDocument()
  })

  it('renders app launch command with ! prefix', () => {
    const message = createMessage('user', '!chrome')
    render(<Message message={message} />)

    // Should show "Launched" text
    expect(screen.getByText('Launched')).toBeInTheDocument()
    // Should show app name
    expect(screen.getByText('chrome')).toBeInTheDocument()
  })

  it('renders app launch with arguments', () => {
    const message = createMessage('user', '!firefox https://example.com')
    render(<Message message={message} />)

    expect(screen.getByText('Launched')).toBeInTheDocument()
    // First word is the app name
    expect(screen.getByText('firefox')).toBeInTheDocument()
  })

  it('renders external API message', () => {
    const message = createMessage('user', 'External prompt')
    render(<Message message={message} isExternal={true} />)

    // Should show "API" badge
    expect(screen.getByText('API')).toBeInTheDocument()
    // Should show "External" label
    expect(screen.getByText('External')).toBeInTheDocument()
    // Should show the message text
    expect(screen.getByText('External prompt')).toBeInTheDocument()
  })

  it('returns null for empty text', () => {
    const message = createMessage('user', '')
    const { container } = render(<Message message={message} />)

    expect(container.firstChild).toBeNull()
  })

  it('handles message with no text part', () => {
    const message: MessageType = {
      info: { id: 'test', role: 'user', time: { created: '' } },
      parts: [{ type: 'tool', name: 'test', input: {} }],
    }
    const { container } = render(<Message message={message} />)

    expect(container.firstChild).toBeNull()
  })
})

describe('AIMessage', () => {
  it('renders assistant message with V avatar', () => {
    const message = createMessage('assistant', 'I can help with that.')
    render(<Message message={message} />)

    expect(screen.getByText('V')).toBeInTheDocument()
    expect(screen.getByText('I can help with that.')).toBeInTheDocument()
  })

  it('renders markdown content', () => {
    const message = createMessage('assistant', '**Bold** and *italic*')
    render(<Message message={message} />)

    // The text should be present (markdown rendering is handled by the component)
    expect(screen.getByText(/Bold/)).toBeInTheDocument()
    expect(screen.getByText(/italic/)).toBeInTheDocument()
  })

  it('renders message with tool parts', () => {
    const message: MessageType = {
      info: { id: 'test', role: 'assistant', time: { created: '' } },
      parts: [
        { type: 'text', text: 'Let me check that.' },
        { type: 'tool', name: 'Read', input: { path: '/test' } },
      ],
    }
    render(<Message message={message} />)

    expect(screen.getByText('Let me check that.')).toBeInTheDocument()
    // Tool calls are rendered (checking for tool name)
    expect(screen.getByText(/Read/)).toBeInTheDocument()
  })
})
