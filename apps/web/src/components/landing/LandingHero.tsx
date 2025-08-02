// src/components/landing/LandingHero.tsx
interface LandingHeroProps {
  className?: string
}

export function LandingHero({ className = '' }: LandingHeroProps) {
  return (
    <section className={`py-16 text-center ${className}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* Problem Statement */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-red-300 mb-6 leading-tight">
            Stop Tracking Commander Games in Excel
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            You're a grown adult. You deserve better than spreadsheets 
            for tracking your Magic games.
          </p>
          
          {/* Value Proposition */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-8 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-orange-400 mb-4">
              What if you could just say:
            </h2>
            
            <div className="bg-black/50 border border-gray-600 rounded-lg p-6 font-mono text-green-400">
              <p className="text-lg md:text-xl">
                "Beat Mike and Sarah with Korvold, took about 45 minutes"
              </p>
            </div>
            
            <p className="text-gray-300 mt-4 text-lg">
              And have it automatically tracked, analyzed, and turned into insights?
            </p>
          </div>
          
          {/* Supporting Text */}
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Dadgic understands natural language game reports and gives you 
            the insights that actually matter. No more fighting with spreadsheet formulas.
          </p>
        </div>
      </div>
    </section>
  )
}