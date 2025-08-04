console.log('PWD:', process.cwd())
console.log('All env vars containing SUPABASE:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
console.log('PATH exists:', !!process.env.PATH)
console.log('SUPABASE_URL:', process.env.SUPABASE_URL)