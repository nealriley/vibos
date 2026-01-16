/**
 * Template Selector Modal
 * 
 * Allows users to switch between available UI templates.
 * Triggered via Ctrl+Shift+T keyboard shortcut.
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Check, Palette } from 'lucide-react'
import { cn } from '@/lib/cn'
import { 
  getTemplateList, 
  getSelectedTemplateId, 
  setSelectedTemplateId,
  type TemplateInfo 
} from '@/templates'

interface TemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
}

export function TemplateSelector({ isOpen, onClose }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateInfo[]>([])
  const [selected, setSelected] = useState<string>('')
  const [pending, setPending] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setTemplates(getTemplateList())
      setSelected(getSelectedTemplateId())
      setPending(null)
    }
  }, [isOpen])

  const handleSelect = async (templateId: string) => {
    if (templateId === selected) {
      onClose()
      return
    }

    setPending(templateId)
    
    // Save selection
    setSelectedTemplateId(templateId)
    
    // Reload to apply new template
    if (window.vibeos?.setTemplate) {
      await window.vibeos.setTemplate(templateId)
    } else {
      // Fallback: just reload the page
      window.location.reload()
    }
  }

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-zinc-100">Choose Template</h2>
                  <p className="text-xs text-zinc-500">Select your preferred interface</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template List */}
            <div className="p-3 space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template.id)}
                  disabled={pending !== null}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                    'hover:bg-zinc-800/70',
                    selected === template.id && 'bg-zinc-800 ring-1 ring-violet-500/50',
                    pending === template.id && 'opacity-50'
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-100">
                        {template.name}
                      </span>
                      {selected === template.id && (
                        <Check className="w-3.5 h-3.5 text-violet-400" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {template.description}
                    </p>
                  </div>
                  {pending === template.id && (
                    <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </button>
              ))}
            </div>

            {/* Footer hint */}
            <div className="px-5 py-3 border-t border-zinc-800 text-center">
              <p className="text-xs text-zinc-500">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 font-mono">Ctrl+Shift+T</kbd> to open this menu
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
