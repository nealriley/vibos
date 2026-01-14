import { useState, useCallback, useEffect, useRef } from 'react'
import type { Message, OpenCodeEvent, MessagePart } from '@/types/message'
import * as api from '@/lib/api'

export type SessionStatus = 'loading' | 'ready' | 'busy' | 'error'

interface UseSessionReturn {
  status: SessionStatus
  messages: Message[]
  error: string | null
  isStreaming: boolean
  streamingMessageId: string | null
  
  // Actions
  sendMessage: (input: string) => Promise<{ success: boolean; type?: string; error?: string }>
  abort: () => Promise<void>
  reset: () => Promise<void>
  
  // For streaming updates
  updateStreamingPart: (part: MessagePart & { messageID?: string }) => void
  
  // Check if a message came from external API
  isExternalMessage: (messageId: string) => boolean
}

const MESSAGE_LIMIT = 10

export function useSession(): UseSessionReturn {
  const [status, setStatus] = useState<SessionStatus>('loading')
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  
  // Track displayed count for pagination
  const displayedCountRef = useRef(MESSAGE_LIMIT)
  
  // Track which message IDs came from external API
  const externalMessageIds = useRef(new Set<string>())
  
  // Initialize session on mount
  useEffect(() => {
    let mounted = true
    
    async function init() {
      try {
        const result = await api.initSession()
        
        if (!mounted) return
        
        if (result.success) {
          setStatus('ready')
          if (result.messages) {
            setMessages(result.messages)
          }
        } else {
          setStatus('error')
          setError(result.error || 'Failed to initialize session')
        }
      } catch (e) {
        if (!mounted) return
        setStatus('error')
        setError(e instanceof Error ? e.message : 'Unknown error')
      }
    }
    
    init()
    
    return () => {
      mounted = false
    }
  }, [])
  
  // Subscribe to SSE events
  useEffect(() => {
    function handleEvent(event: OpenCodeEvent) {
      const eventType = event.type
      
      switch (eventType) {
        case 'session.status': {
          const statusEvent = event as { properties: { status: { type: string } | string } }
          const statusObj = statusEvent.properties?.status
          const statusType = typeof statusObj === 'object' ? statusObj.type : statusObj
          
          if (statusType === 'busy') {
            setStatus('busy')
            setIsStreaming(true)
          } else if (statusType === 'idle') {
            setStatus('ready')
          }
          break
        }
        
        case 'session.idle':
          setStatus('ready')
          setIsStreaming(false)
          setStreamingMessageId(null)
          // Refresh from server to get final state
          refreshMessages()
          break
        
        case 'message.created': {
          const msgEvent = event as { 
            properties: { info: { id?: string; role: string } }
            isExternal?: boolean 
          }
          if (msgEvent.properties?.info?.role === 'user') {
            // Track if this was an external message
            if (msgEvent.isExternal && msgEvent.properties?.info?.id) {
              externalMessageIds.current.add(msgEvent.properties.info.id)
            }
            // Refresh to show the new message
            refreshMessages()
          }
          break
        }
      }
    }
    
    api.onOpencodeEvent(handleEvent)
    
    // Subscribe to external reset events
    api.onSessionReset(() => {
      setMessages([])
      setIsStreaming(false)
      setStreamingMessageId(null)
      setStatus('ready')
      displayedCountRef.current = MESSAGE_LIMIT
    })
    
    return () => {
      api.removeOpencodeEventListener()
    }
  }, [])
  
  const refreshMessages = useCallback(async () => {
    try {
      const result = await api.getMessages()
      if (result.success && result.messages) {
        setMessages(result.messages)
      }
    } catch (e) {
      console.error('Failed to refresh messages:', e)
    }
  }, [])
  
  const sendMessage = useCallback(async (input: string) => {
    if (status === 'busy') {
      return { success: false, error: 'Session is busy' }
    }
    
    // Check if it's an OpenCode prompt
    const isOpencode = !input.trim().startsWith('!') && !input.trim().startsWith('$')
    
    if (isOpencode) {
      setStatus('busy')
      setIsStreaming(true)
    }
    
    try {
      const result = await api.submitInput(input)
      
      if (!result.success) {
        if (isOpencode) {
          setStatus('ready')
          setIsStreaming(false)
        }
        return { success: false, error: result.error }
      }
      
      return { success: true, type: result.type }
    } catch (e) {
      if (isOpencode) {
        setStatus('ready')
        setIsStreaming(false)
      }
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
    }
  }, [status])
  
  const abortSession = useCallback(async () => {
    try {
      await api.abort()
      setIsStreaming(false)
      setStreamingMessageId(null)
      setStatus('ready')
    } catch (e) {
      console.error('Failed to abort:', e)
    }
  }, [])
  
  const resetSession = useCallback(async () => {
    try {
      await api.resetSession()
      setMessages([])
      setIsStreaming(false)
      setStreamingMessageId(null)
      setStatus('ready')
      displayedCountRef.current = MESSAGE_LIMIT
    } catch (e) {
      console.error('Failed to reset:', e)
    }
  }, [])
  
  const updateStreamingPart = useCallback((part: MessagePart & { messageID?: string }) => {
    if (!part.messageID) return
    
    setStreamingMessageId(part.messageID)
    
    setMessages(prev => {
      // Find or create the streaming message
      const existingIdx = prev.findIndex(m => m.info.id === part.messageID)
      
      if (existingIdx >= 0) {
        // Update existing message
        const updated = [...prev]
        const msg = { ...updated[existingIdx] }
        
        if (part.type === 'text') {
          // Replace or add text part
          const textIdx = msg.parts.findIndex(p => p.type === 'text')
          if (textIdx >= 0) {
            msg.parts = [...msg.parts]
            msg.parts[textIdx] = part
          } else {
            msg.parts = [...msg.parts, part]
          }
        } else if (part.type === 'tool') {
          // Find or add tool part by ID
          const toolPart = part as { id?: string }
          const toolIdx = msg.parts.findIndex(p => p.type === 'tool' && (p as { id?: string }).id === toolPart.id)
          if (toolIdx >= 0) {
            msg.parts = [...msg.parts]
            msg.parts[toolIdx] = part
          } else {
            msg.parts = [...msg.parts, part]
          }
        }
        
        updated[existingIdx] = msg
        return updated
      } else {
        // Create new message
        const newMsg: Message = {
          info: {
            id: part.messageID!,
            role: 'assistant',
            time: { created: new Date().toISOString() }
          },
          parts: [part]
        }
        return [...prev, newMsg]
      }
    })
  }, [])
  
  // Check if a message was from external API
  const isExternalMessage = useCallback((messageId: string): boolean => {
    return externalMessageIds.current.has(messageId)
  }, [])
  
  return {
    status,
    messages,
    error,
    isStreaming,
    streamingMessageId,
    sendMessage,
    abort: abortSession,
    reset: resetSession,
    updateStreamingPart,
    isExternalMessage
  }
}
