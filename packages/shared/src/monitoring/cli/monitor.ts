#!/usr/bin/env node

import { HealthChecker } from '../health-checks/HealthChecker.js'
import { ErrorLogger } from '../error-logger/ErrorLogger.js'

async function main() {
	const command = process.argv[2]

	switch (command) {
		case 'health':
			await showHealth()
			break
		case 'errors':
			await showErrors()
			break
		case 'stats':
			await showStats()
			break
		default:
			showUsage()
	}
}

async function showHealth() {
	console.log('🏥 System Health Check')
	console.log('===================')

	try {
		const health = await HealthChecker.runAllChecks()

		console.log(`Overall Status: ${getStatusIcon(health.overall)} ${health.overall.toUpperCase()}`)
		console.log(`Timestamp: ${health.timestamp}`)
		console.log(`Environment: ${health.environment}`)
		console.log(`Version: ${health.version}`)
		console.log('')

		console.log('Individual Checks:')
		health.checks.forEach(check => {
			console.log(`  ${getStatusIcon(check.status)} ${check.name}: ${check.status} (${check.responseTime}ms)`)
			if (check.error) {
				console.log(`    Error: ${check.error}`)
			}
		})
	} catch (error) {
		console.error('❌ Health check failed:', error)
	}
}

async function showErrors() {
	console.log('🚨 Recent Errors')
	console.log('===============')

	const recentErrors = ErrorLogger.getRecentErrors(10)

	if (recentErrors.length === 0) {
		console.log('✅ No recent errors found')
		return
	}

	recentErrors.forEach(error => {
		const severity = getSeverityIcon(error.context.severity)
		console.log(`${severity} [${error.context.component}] ${error.error.message}`)
		console.log(`    Time: ${error.context.timestamp}`)
		console.log(`    Action: ${error.context.action || 'N/A'}`)
		console.log(`    User: ${error.context.userId || 'Anonymous'}`)
		console.log('')
	})
}

async function showStats() {
	console.log('📊 Error Statistics')
	console.log('==================')

	const stats = ErrorLogger.getErrorStats()

	console.log(`Total Errors: ${stats.totalErrors}`)
	console.log(`Last 24 Hours: ${stats.last24Hours}`)
	console.log('')

	console.log('By Component:')
	Object.entries(stats.byComponent).forEach(([component, count]) => {
		console.log(`  ${component}: ${count}`)
	})
	console.log('')

	console.log('By Severity:')
	Object.entries(stats.bySeverity).forEach(([severity, count]) => {
		const icon = getSeverityIcon(severity as any)
		console.log(`  ${icon} ${severity}: ${count}`)
	})
	console.log('')

	if (stats.topErrors.length > 0) {
		console.log('Top Errors:')
		stats.topErrors.slice(0, 5).forEach((error, index) => {
			console.log(`  ${index + 1}. ${error.error} (${error.count} times)`)
		})
	}
}

function getStatusIcon(status: string): string {
	switch (status) {
		case 'healthy': return '✅'
		case 'degraded': return '⚠️'
		case 'unhealthy': return '❌'
		default: return '❓'
	}
}

function getSeverityIcon(severity: string): string {
	switch (severity) {
		case 'low': return '💙'
		case 'medium': return '🟡'
		case 'high': return '🟠'
		case 'critical': return '🔴'
		default: return '⚪'
	}
}

function showUsage() {
	console.log('Monitoring CLI')
	console.log('')
	console.log('Usage:')
	console.log('  npm run monitor <command>')
	console.log('')
	console.log('Commands:')
	console.log('  health    - Show system health status')
	console.log('  errors    - Show recent errors')
	console.log('  stats     - Show error statistics')
	console.log('')
	console.log('Examples:')
	console.log('  npm run monitor health')
	console.log('  npm run monitor errors')
	console.log('  npm run monitor stats')
}

main().catch(error => {
	console.error('❌ Monitor CLI Error:', error)
	process.exit(1)
})
