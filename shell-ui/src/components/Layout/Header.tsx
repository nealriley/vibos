interface HeaderProps {
  title?: string
  tagline?: string
}

export function Header({ title = 'VibeOS', tagline = 'What do you want to build?' }: HeaderProps) {
  return (
    <header className="px-4 pt-4 pb-2 text-center shrink-0 drag-region">
      <h1 className="text-lg font-medium tracking-[0.2em] uppercase text-zinc-200">
        {title}
      </h1>
      <p className="text-xs text-zinc-500 mt-0.5">{tagline}</p>
    </header>
  )
}
