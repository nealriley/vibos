/**
 * App.tsx - Template Host
 * 
 * This component:
 * 1. Uses the useSession hook to manage session state
 * 2. Loads the selected template
 * 3. Passes session state/callbacks to the template
 * 4. Provides template switching via Ctrl+Shift+T
 * 
 * Templates handle all UI rendering.
 */

import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/hooks/useSession'
import { getSelectedTemplate } from '@/templates'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { TemplateSelector } from '@/components/TemplateSelector'

export function App() {
  const session = useSession()
  const [selectorOpen, setSelectorOpen] = useState(false)
  
  // Get the selected template
  const template = getSelectedTemplate()
  const TemplateComponent = template.component
  
  // Build props for the template
  const templateProps = {
    status: session.status,
    messages: session.messages,
    error: session.error,
    isStreaming: session.isStreaming,
    sendMessage: session.sendMessage,
    abort: session.abort,
    reset: session.reset,
    isExternalMessage: session.isExternalMessage,
  }
  
  // Keyboard shortcut: Ctrl+Shift+T to open template selector
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        setSelectorOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  const closeSelector = useCallback(() => {
    setSelectorOpen(false)
  }, [])
  
  return (
    <ErrorBoundary>
      <TemplateComponent {...templateProps} />
      <TemplateSelector isOpen={selectorOpen} onClose={closeSelector} />
    </ErrorBoundary>
  )
}
