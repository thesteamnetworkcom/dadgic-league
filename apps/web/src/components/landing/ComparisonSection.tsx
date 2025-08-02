// src/components/landing/ComparisonSection.tsx
interface ComparisonSectionProps {
  className?: string
}

export function ComparisonSection({ className = '' }: ComparisonSectionProps) {
  return (
    <section className={`py-16 ${className}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Before vs After
          </h2>
          <p className="text-xl text-gray-400">
            See the difference Dadgic makes
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Before: Excel */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-red-300 mb-2">
                😤 The Excel Way
              </h3>
              <p className="text-red-200">What you're doing now</p>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="bg-red-950/50 p-4 rounded border border-red-600/50">
                <div className="font-mono text-red-200">
                  <div className="grid grid-cols-4 gap-2 text-xs mb-2 text-red-300">
                    <span>Date</span>
                    <span>Players</span>
                    <span>Winner</span>
                    <span>Time</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <span>2024-01-15</span>
                    <span>Me,Mike,Sarah,Tom</span>
                    <span>Me</span>
                    <span>45min</span>
                  </div>
                </div>
              </div>
              
              <ul className="text-red-200 space-y-2">
                <li>• Manual data entry every time</li>
                <li>• Complex formulas that break</li>
                <li>• No insights, just raw data</li>
                <li>• Forgotten games = lost data</li>
                <li>• Share via "here's a Google Sheet link"</li>
              </ul>
            </div>
          </div>

          {/* After: Dadgic */}
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-green-300 mb-2">
                ✨ The Dadgic Way
              </h3>
              <p className="text-green-200">What you could be doing</p>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="bg-green-950/50 p-4 rounded border border-green-600/50">
                <div className="font-mono text-green-200">
                  <div className="text-green-300 text-xs mb-2">Natural language input:</div>
                  <div className="text-green-400">
                    "Beat Mike and Sarah with Korvold, about 45 minutes"
                  </div>
                </div>
              </div>
              
              <ul className="text-green-200 space-y-2">
                <li>• Just describe what happened</li>
                <li>• Automatic parsing and data extraction</li>
                <li>• Real insights: "You beat Mike 73% of the time"</li>
                <li>• Discord integration for easy logging</li>
                <li>• Beautiful shareable summaries</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}