// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PageErrorBoundary, AsyncErrorBoundary } from '@/components/error-boundaries'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: 'Dadgic - MTG Commander Tracker',
	description: 'Track your Magic: The Gathering Commander games with natural language processing',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body className={`${inter.className} bg-neutral-900 text-white`}>
				<AsyncErrorBoundary>
					<PageErrorBoundary pageName="Dadgic">
						<AuthProvider>
							<ToastProvider>
								{children}
							</ToastProvider>
						</AuthProvider>
					</PageErrorBoundary>
				</AsyncErrorBoundary>
			</body>
		</html>
	)
}
