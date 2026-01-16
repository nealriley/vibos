/**
 * Template Registry
 * 
 * Manages available templates and provides selection functionality.
 */

import type { Template, TemplateInfo, TemplateComponent } from './types'

// Import all templates
import * as defaultTemplate from './default'
import * as minimalTemplate from './minimal'

/**
 * Registry of all available templates
 */
export const templates: Record<string, Template> = {
  default: {
    ...defaultTemplate.info,
    component: defaultTemplate.Template,
  },
  minimal: {
    ...minimalTemplate.info,
    component: minimalTemplate.Template,
  },
}

/**
 * Default template ID
 */
export const DEFAULT_TEMPLATE_ID = 'default'

/**
 * Storage key for persisting template selection
 */
const STORAGE_KEY = 'vibeos-template'

/**
 * Get the currently selected template ID
 */
export function getSelectedTemplateId(): string {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATE_ID
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && templates[stored]) {
      return stored
    }
  } catch {
    // localStorage not available
  }
  
  return DEFAULT_TEMPLATE_ID
}

/**
 * Set the selected template ID
 */
export function setSelectedTemplateId(id: string): boolean {
  if (!templates[id]) return false
  
  try {
    localStorage.setItem(STORAGE_KEY, id)
    return true
  } catch {
    return false
  }
}

/**
 * Get the currently selected template
 */
export function getSelectedTemplate(): Template {
  const id = getSelectedTemplateId()
  return templates[id] || templates[DEFAULT_TEMPLATE_ID]
}

/**
 * Get list of all available templates (for UI)
 */
export function getTemplateList(): TemplateInfo[] {
  return Object.values(templates).map(({ component, ...info }) => info)
}

/**
 * Get a template by ID
 */
export function getTemplate(id: string): Template | undefined {
  return templates[id]
}

// Re-export types
export type { Template, TemplateInfo, TemplateComponent, TemplateProps } from './types'
