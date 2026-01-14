/**
 * Input parsing utilities for VibeOS Shell
 * Handles !app, $shell, and regular prompt commands
 */

export type CommandType = 'app' | 'shell' | 'opencode' | 'none'

export interface ParsedCommand {
  type: CommandType
  value: string
}

/**
 * Parse user input and determine command type
 * - !app     -> Launch application
 * - $cmd     -> Run shell command
 * - text     -> Send to OpenCode
 * - empty    -> None
 */
export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim()

  if (!trimmed) {
    return { type: 'none', value: '' }
  }

  // App launcher (! prefix)
  if (trimmed.startsWith('!')) {
    const appName = trimmed.slice(1).trim().toLowerCase()
    return { type: 'app', value: appName }
  }

  // Shell command ($ prefix)
  if (trimmed.startsWith('$')) {
    const cmd = trimmed.slice(1).trim()
    return { type: 'shell', value: cmd }
  }

  // Default: Send to OpenCode
  return { type: 'opencode', value: trimmed }
}

/**
 * Get display label for command type
 */
export function getCommandLabel(type: CommandType): string {
  switch (type) {
    case 'app':
      return 'Launch App'
    case 'shell':
      return 'Shell Command'
    case 'opencode':
      return 'AI Prompt'
    default:
      return ''
  }
}
