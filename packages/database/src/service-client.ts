// packages/database/src/client.ts
import { createClient } from '@supabase/supabase-js';

// Try to load dotenv if available (for Node.js environments)
try {
	const dotenv = require('dotenv');
	// Load from multiple possible locations
	dotenv.config({ path: '.env' });
	dotenv.config({ path: '.env.local' });
	dotenv.config({ path: '../../.env' });
	dotenv.config({ path: '../../.env.local' });
} catch {
	// dotenv not available, continue (browser environment)
}

// Try Next.js env vars first, then fallback to Node.js env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || !supabaseServiceRoleKey) {
	console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
	throw new Error('Missing Supabase environment variables. Check SUPABASE_URL and SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
	supabaseUrl,
	supabaseServiceRoleKey,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	}
);