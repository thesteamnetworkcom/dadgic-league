'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'

interface HealthData {
	overall: string
	checks: Array<{
		name: string
		status: string
		responseTime: number
		error?: string
		metadata?: any
	}>
	errorStats?: {
		totalErrors: number
		last24Hours: number
		byComponent: Record<string, number>
		bySeverity: Record<string, number>
	}
	timestamp: string
}

export default function MonitoringDashboard() {
	const { user, loading } = useAuth()
	const router = useRouter()
	const [healthData, setHealthData] = useState<HealthData | null>(null)
	const [refreshing, setRefreshing] = useState(false)
	const [autoRefresh, setAutoRefresh] = useState(true)

	useEffect(() => {
		if (!loading && (!user || user.role !== 'admin')) {
			router.push('/dashboard')
			return
		}

		if (user) {
			fetchHealthData()
		}
	}, [user, loading, router])

	useEffect(() => {
		if (!autoRefresh) return

		const interval = setInterval(() => {
			fetchHealthData()
		}, 30000) // Refresh every 30 seconds

		return () => clearInterval(interval)
	}, [autoRefresh])

	const fetchHealthData = async () => {
		setRefreshing(true)
		try {
			const response = await fetch('/api/health/detailed')
			const data = await response.json()
			setHealthData(data)
		} catch (error) {
			console.error('Failed to fetch health data:', error)
		} finally {
			setRefreshing(false)
		}
	}

	if (loading) return <div className="p-4">Loading...</div>

	if (!user || user.role !== 'admin') {
		return <div className="p-4">Access denied</div>
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'healthy': return 'text-green-800 bg-green-100'  // Darker text
			case 'degraded': return 'text-yellow-800 bg-yellow-100'  // Darker text
			case 'unhealthy': return 'text-red-800 bg-red-100'  // Darker text
			default: return 'text-gray-800 bg-gray-100'  // Darker text
		}
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'healthy': return '✅'
			case 'degraded': return '⚠️'
			case 'unhealthy': return '❌'
			default: return '❓'
		}
	}

	return (
		<AppLayout>
			<div className="container mx-auto p-6">
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">System Monitoring</h1>
					<div className="flex gap-4">
						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={autoRefresh}
								onChange={(e) => setAutoRefresh(e.target.checked)}
							/>
							Auto-refresh
						</label>
						<button
							onClick={fetchHealthData}
							disabled={refreshing}
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
						>
							{refreshing ? 'Refreshing...' : 'Refresh'}
						</button>
					</div>
				</div>

				{healthData && (
					<div className="space-y-6">
						{/* Overall Status */}
						<div className={`p-4 rounded-lg ${getStatusColor(healthData.overall)}`}>
							<div className="flex items-center gap-2">
								<span className="text-2xl">{getStatusIcon(healthData.overall)}</span>
								<h2 className="text-xl font-semibold">
									Overall Status: {healthData.overall.toUpperCase()}
								</h2>
							</div>
							<p className="text-sm mt-1">
								Last checked: {new Date(healthData.timestamp).toLocaleString()}
							</p>
						</div>

						{/* Health Checks */}
						<div className="bg-neutral-800 rounded-lg shadow">
							<h3 className="text-lg font-semibold p-4 border-b">System Health Checks</h3>
							<div className="divide-y">
								{healthData.checks.map((check, index) => (
									<div key={index} className="p-4 flex items-center justify-between">
										<div className="flex items-center gap-3">
											<span className="text-xl">{getStatusIcon(check.status)}</span>
											<div>
												<h4 className="font-medium capitalize">{check.name.replace('-', ' ')}</h4>
												{check.error && (
													<p className="text-sm text-red-600">{check.error}</p>
												)}
											</div>
										</div>
										<div className="text-right">
											<span className={`px-2 py-1 rounded text-xs ${getStatusColor(check.status)}`}>
												{check.status}
											</span>
											<p className="text-xs text-gray-500 mt-1">
												{check.responseTime}ms
											</p>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Error Statistics */}
						{healthData.errorStats && (
							<div className="bg-white rounded-lg shadow">
								<h3 className="text-lg font-semibold p-4 border-b">Error Statistics</h3>
								<div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
									<div className="text-center">
										<div className="text-2xl font-bold text-blue-600">
											{healthData.errorStats.totalErrors}
										</div>
										<div className="text-sm text-gray-600">Total Errors</div>
									</div>
									<div className="text-center">
										<div className="text-2xl font-bold text-orange-600">
											{healthData.errorStats.last24Hours}
										</div>
										<div className="text-sm text-gray-600">Last 24 Hours</div>
									</div>
									<div className="text-center">
										<div className="text-2xl font-bold text-green-600">
											{Object.keys(healthData.errorStats.byComponent).length}
										</div>
										<div className="text-sm text-gray-600">Components</div>
									</div>
									<div className="text-center">
										<div className="text-2xl font-bold text-purple-600">
											{healthData.errorStats.bySeverity.critical || 0}
										</div>
										<div className="text-sm text-gray-600">Critical Errors</div>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{!healthData && !refreshing && (
					<div className="text-center py-8">
						<p className="text-gray-600">No health data available</p>
						<button
							onClick={fetchHealthData}
							className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
						>
							Load Health Data
						</button>
					</div>
				)}
			</div>
		</AppLayout>
	)
}