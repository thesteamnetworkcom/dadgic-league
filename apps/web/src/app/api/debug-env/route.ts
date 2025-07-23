// apps/web/src/app/api/debug-env/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const debug = {
    nodeEnv: process.env.NODE_ENV,
    cwd: process.cwd(),
    geminiKeyExists: !!process.env.GEMINI_API_KEY,
    geminiKeyValue: process.env.GEMINI_API_KEY ? 'Found (hidden)' : 'Missing',
    allGeminiKeys: Object.keys(process.env).filter(key => key.includes('GEMINI')),
    totalEnvKeys: Object.keys(process.env).length,
    // Test if we can import the AI parser
    canImportParser: false
  }

  // Test if we can import and instantiate the parser
  try {
    const { parseWithAI } = await import('@dadgic/shared')
    debug.canImportParser = true
  } catch (error) {
    debug.canImportParser = false
    console.error('Cannot import parseWithAI:', error)
  }

  return NextResponse.json(debug)
}