// src/components/terminal/DataExport.tsx
import { useState } from 'react'
import { TerminalButton } from './TerminalButton'
import { TerminalModal } from './TerminalModal'

interface DataExportProps {
  data: any
  filename?: string
  formats?: ('json' | 'csv' | 'txt')[]
  className?: string
}

export function DataExport({ 
  data, 
  filename = 'dadgic_export',
  formats = ['json', 'csv'],
  className = '' 
}: DataExportProps) {
  const [showModal, setShowModal] = useState(false)
  const [copying, setCopying] = useState(false)

  const exportAsJson = () => {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    downloadBlob(blob, `${filename}.json`)
  }

  const exportAsCsv = () => {
    // Simple CSV conversion - works for arrays of objects
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]).join(',')
      const rows = data.map(row => 
        Object.values(row).map(val => `"${val}"`).join(',')
      ).join('\n')
      const csv = `${headers}\n${rows}`
      
      const blob = new Blob([csv], { type: 'text/csv' })
      downloadBlob(blob, `${filename}.csv`)
    }
  }

  const exportAsTxt = () => {
    const txtString = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    const blob = new Blob([txtString], { type: 'text/plain' })
    downloadBlob(blob, `${filename}.txt`)
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async () => {
    setCopying(true)
    try {
      const jsonString = JSON.stringify(data, null, 2)
      await navigator.clipboard.writeText(jsonString)
      // Could show a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    } finally {
      setCopying(false)
    }
  }

  return (
    <>
      <div className={`flex items-center space-x-2 ${className}`}>
        <TerminalButton
          variant="terminal"
          size="sm"
          onClick={() => setShowModal(true)}
        >
          [export_data]
        </TerminalButton>
        
        <TerminalButton
          variant="secondary"
          size="sm"
          onClick={copyToClipboard}
          disabled={copying}
        >
          {copying ? '[copying...]' : '[copy_json]'}
        </TerminalButton>
      </div>

      <TerminalModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="export_data_dialog"
        variant="info"
      >
        <div className="space-y-4">
          <div className="text-sm">
            Select export format for current dataset:
          </div>
          
          <div className="space-y-2">
            {formats.includes('json') && (
              <TerminalButton
                variant="terminal"
                size="sm"
                onClick={() => {
                  exportAsJson()
                  setShowModal(false)
                }}
                className="w-full justify-start"
              >
                JSON Format (.json)
              </TerminalButton>
            )}
            
            {formats.includes('csv') && (
              <TerminalButton
                variant="terminal"
                size="sm"
                onClick={() => {
                  exportAsCsv()
                  setShowModal(false)
                }}
                className="w-full justify-start"
              >
                CSV Format (.csv)
              </TerminalButton>
            )}
            
            {formats.includes('txt') && (
              <TerminalButton
                variant="terminal"
                size="sm"
                onClick={() => {
                  exportAsTxt()
                  setShowModal(false)
                }}
                className="w-full justify-start"
              >
                Text Format (.txt)
              </TerminalButton>
            )}
          </div>
        </div>
      </TerminalModal>
    </>
  )
}