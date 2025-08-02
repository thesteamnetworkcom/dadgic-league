// src/components/landing/CTASection.tsx
import { TerminalButton } from '../terminal/TerminalButton'
import { DiscordIcon } from '../icons/DiscordIcon'

interface CTASectionProps {
  onDiscordAuth: () => void
  isLoading?: boolean
  className?: string
}

export function CTASection({ onDiscordAuth, isLoading = false, className = '' }: CTASectionProps) {
  return (
    <section className={`py-16 ${className}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to ditch the spreadsheet?
          </h2>
          
          <p className="text-xl text-gray-300 mb-8">
            Get started in 30 seconds. Just sign in with Discord and start logging games.
          </p>
          
          <div className="space-y-4">
            <TerminalButton
              variant="discord"
              size="lg"
              onClick={onDiscordAuth}
              disabled={isLoading}
              icon={<DiscordIcon size={20} />}
              className="text-lg px-8 py-4"
            >
              {isLoading ? 'Connecting...' : 'Sign in with Discord'}
            </TerminalButton>
            
            <p className="text-sm text-gray-500">
              Free to use • No credit card required • Data stays private
            </p>
          </div>
          
          {/* Trust signals */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <p className="text-sm text-gray-400 mb-4">
              Join commanders who've tracked <strong className="text-orange-400">1,247 games</strong> and counting
            </p>
            
            <div className="flex justify-center space-x-8 text-xs text-gray-500">
              <span>✓ Discord OAuth Security</span>
              <span>✓ No Data Selling</span>
              <span>✓ Export Anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}