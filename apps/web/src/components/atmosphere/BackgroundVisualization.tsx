// src/components/atmosphere/BackgroundVisualization.tsx
import { useEffect, useState } from 'react'

interface DataNode {
  id: number
  x: number
  y: number
  connections: number[]
  activity: number
}

interface BackgroundVisualizationProps {
  nodeCount?: number
  connectionDensity?: number
  className?: string
}

export function BackgroundVisualization({ 
  nodeCount = 12,
  connectionDensity = 0.3,
  className = '' 
}: BackgroundVisualizationProps) {
  const [nodes, setNodes] = useState<DataNode[]>([])
  const [codeLines, setCodeLines] = useState<string[]>([])

  useEffect(() => {
    // Initialize network nodes
    const initialNodes: DataNode[] = Array.from({ length: nodeCount }, (_, i) => {
      const connections: number[] = []
      for (let j = 0; j < nodeCount; j++) {
        if (i !== j && Math.random() < connectionDensity) {
          connections.push(j)
        }
      }
      
      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        connections,
        activity: Math.random()
      }
    })
    
    setNodes(initialNodes)

    // Sample code lines that scroll by
    const sampleCode = [
      'SELECT * FROM pods WHERE user_id = ?',
      'UPDATE players SET wins = wins + 1',
      'INSERT INTO games (duration, winner)',
      '{ "players": [...], "result": "W" }',
      'POST /api/pod { data: gameData }',
      'await parseNaturalLanguage(input)',
      'const winRate = wins / totalGames',
      'if (commander === "Korvold") {...}',
      'export const GameLogger = () => {',
      'return { success: true, data }',
    ]
    
    setCodeLines(sampleCode)

    // Animate node activity
    const interval = setInterval(() => {
      setNodes(prev => prev.map(node => ({
        ...node,
        activity: Math.random(),
        x: node.x + (Math.random() - 0.5) * 0.1,
        y: node.y + (Math.random() - 0.5) * 0.1
      })))
    }, 2000)

    return () => clearInterval(interval)
  }, [nodeCount, connectionDensity])

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden opacity-10 ${className}`}>
      {/* Network Visualization */}
      <svg className="absolute inset-0 w-full h-full">
        {/* Draw connections */}
        {nodes.map(node => 
          node.connections.map(targetId => {
            const target = nodes[targetId]
            if (!target) return null
            
            return (
              <line
                key={`${node.id}-${targetId}`}
                x1={`${node.x}%`}
                y1={`${node.y}%`}
                x2={`${target.x}%`}
                y2={`${target.y}%`}
                stroke="rgba(0, 255, 65, 0.2)"
                strokeWidth="1"
                opacity={node.activity * 0.5}
              />
            )
          })
        )}
        
        {/* Draw nodes */}
        {nodes.map(node => (
          <circle
            key={node.id}
            cx={`${node.x}%`}
            cy={`${node.y}%`}
            r={node.activity * 3 + 2}
            fill="rgba(0, 255, 65, 0.3)"
            opacity={node.activity}
          />
        ))}
      </svg>

      {/* Scrolling Code Background */}
      <div className="absolute right-4 top-0 bottom-0 w-80 overflow-hidden">
        <div 
          className="font-mono text-xs text-terminal-green space-y-2 opacity-20"
          style={{
            animation: 'scrollCode 20s linear infinite'
          }}
        >
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-2">
              {codeLines.map((line, index) => (
                <div key={`${i}-${index}`} className="whitespace-nowrap">
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Hexagonal Pattern Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ff41' fill-opacity='0.03'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <style jsx>{`
        @keyframes scrollCode {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
      `}</style>
    </div>
  )
}