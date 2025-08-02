// src/components/terminal/TerminalTable.tsx
import { ReactNode } from 'react'

interface Column {
  key: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface TerminalTableProps {
  columns: Column[]
  data: Record<string, any>[]
  className?: string
  emptyMessage?: string
  renderCell?: (key: string, value: any, row: Record<string, any>) => ReactNode
}

export function TerminalTable({ 
  columns, 
  data, 
  className = '',
  emptyMessage = 'No data available',
  renderCell
}: TerminalTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 font-mono text-sm">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse font-mono text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  bg-surface-secondary text-terminal-amber px-3 py-2 
                  border-b border-gray-600 text-xs uppercase font-semibold
                  ${column.align === 'center' ? 'text-center' : ''}
                  ${column.align === 'right' ? 'text-right' : 'text-left'}
                `}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-900/50 transition-colors">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`
                    px-3 py-2 border-b border-gray-800 text-terminal-green
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : 'text-left'}
                  `}
                >
                  {renderCell 
                    ? renderCell(column.key, row[column.key], row)
                    : row[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}