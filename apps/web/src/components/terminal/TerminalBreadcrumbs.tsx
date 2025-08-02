// src/components/terminal/TerminalBreadcrumbs.tsx
interface BreadcrumbItem {
  label: string
  href?: string
  active?: boolean
}

interface TerminalBreadcrumbsProps {
  items: BreadcrumbItem[]
  separator?: string
  className?: string
}

export function TerminalBreadcrumbs({ 
  items, 
  separator = '>',
  className = '' 
}: TerminalBreadcrumbsProps) {
  return (
    <nav className={`font-mono text-sm ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-terminal-green">$</span>
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            {index > 0 && (
              <span className="text-gray-500">{separator}</span>
            )}
            {item.href && !item.active ? (
              <a 
                href={item.href}
                className="text-terminal-amber hover:text-terminal-green transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span className={item.active ? 'text-terminal-green' : 'text-gray-400'}>
                {item.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </nav>
  )
}