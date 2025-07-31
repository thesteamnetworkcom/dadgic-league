import { NextRequest, NextResponse } from 'next/server'
import { extractAuthContext, requireAdmin } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
	try {
		const auth = await extractAuthContext(request)
		return NextResponse.json({
			success: true,
			auth: auth,
			message: 'Auth middleware working'
		})
	} catch (error) {
		return NextResponse.json({
			success: false,
			error: error instanceof Error ? error.message : 'Auth failed'
		}, { status: 401 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const auth = await requireAdmin(request)
		return NextResponse.json({
			success: true,
			auth: auth,
			message: 'Admin auth working'
		})
	} catch (error) {
		return NextResponse.json({
			success: false,
			error: error instanceof Error ? error.message : 'Admin access required'
		}, { status: 403 })
	}
}