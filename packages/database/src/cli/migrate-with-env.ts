#!/usr/bin/env node

// Load environment variables from multiple possible locations
import { config } from 'dotenv'
import path from 'path'
import { existsSync } from 'fs'

// Try loading from different locations
const envPaths = [
  '.env.local',           // Current directory
  '.env',                 // Current directory
  '../../.env.local',     // Root of project
  '../../.env',           // Root of project
  '../../../.env.local',  // In case we're nested deeper
]

console.log('🔧 Loading environment variables...')

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    console.log(`   📄 Loading: ${envPath}`)
    config({ path: envPath })
  }
}

// Verify environment variables are loaded
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('   📊 SUPABASE_URL:', supabaseUrl ? '✅ SET' : '❌ NOT SET')
console.log('   📊 SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ SET' : '❌ NOT SET')

if (!supabaseUrl || !supabaseKey) {
  console.error('')
  console.error('❌ Environment variables still not found!')
  console.error('   Tried loading from:', envPaths.join(', '))
  console.error('')
  console.error('💡 Manual fix: Copy .env.local to packages/database/')
  console.error('   cp ../../.env.local .env.local')
  process.exit(1)
}

console.log('✅ Environment variables loaded successfully')
console.log('')

// Now import and run the actual migration CLI
const originalArgv = process.argv
process.argv = ['node', 'migrate.ts', ...originalArgv.slice(2)]

// Import the original migrate script
import('./migrate.js').catch((error) => {
  // If compiled version doesn't exist, try TypeScript directly
  console.log('📝 Compiled version not found, running TypeScript directly...')
  require('tsx/cjs').require('./migrate.ts')
})
