'use client'

import { ErrorBoundary } from './ErrorBoundary'
import { ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
	children: ReactNode
	componentName?: string
	resetKeys?: Array<string | number>
}

export function ComponentErrorBoundary({ children, componentName, resetKeys }: Props) {
	const customFallback = (
		<div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 my-4">
			<div className="flex items-center gap-3">
				<AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
				<div className="flex-1">
					<h3 className="text-sm font-semibold text-red-300">
						Component Error
					</h3>
					<p className="text-sm text-red-200/80 mt-1">
						The {componentName || 'component'} failed to load. Try refreshing the page.
					</p>
				</div>
				<button
					onClick={() => window.location.reload()}
					className="flex items-center gap-1 text-sm text-red-300 hover:text-red-200 transition-colors"
				>
					<RefreshCw className="w-4 h-4" />
					Refresh
				</button>
			</div>
		</div>
	)

	return (
		<ErrorBoundary
			fallback={customFallback}
			resetKeys={resetKeys}
			onError={(error, errorInfo) => {
				console.error(`Component error in ${componentName}:`, error, errorInfo)
			}}
		>
			{children}
		</ErrorBoundary>
	)
}
