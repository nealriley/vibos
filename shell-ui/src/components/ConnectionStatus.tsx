import { useConnectionStatus } from '@/hooks/useConnectionStatus'
import { cn } from '@/lib/cn'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'

/**
 * Connection status indicator
 * Shows current SSE connection state with visual feedback
 */
export function ConnectionStatus() {
  const status = useConnectionStatus()

  const statusConfig = {
    connected: {
      icon: Wifi,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400',
      label: 'Connected',
    },
    disconnected: {
      icon: WifiOff,
      color: 'text-red-400',
      bgColor: 'bg-red-400',
      label: 'Disconnected',
    },
    reconnecting: {
      icon: Loader2,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400',
      label: 'Reconnecting',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className="flex items-center gap-2 text-xs text-zinc-500"
      title={config.label}
    >
      {/* Status dot */}
      <div className="relative">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            config.bgColor,
            status === 'reconnecting' && 'animate-pulse'
          )}
        />
        {status === 'connected' && (
          <div
            className={cn(
              'absolute inset-0 w-2 h-2 rounded-full',
              config.bgColor,
              'animate-ping opacity-75'
            )}
            style={{ animationDuration: '2s' }}
          />
        )}
      </div>
      
      {/* Icon (shown on hover via parent) */}
      <Icon
        className={cn(
          'w-3.5 h-3.5 hidden group-hover:block',
          config.color,
          status === 'reconnecting' && 'animate-spin'
        )}
      />
    </div>
  )
}
