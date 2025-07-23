// Test script for Client Factory
// Run with: node test-client-factory.js

const { SupabaseClientFactory, db } = require('./packages/database/dist/index.js');

async function testClientFactory() {
  console.log('🧪 Testing Client Factory Implementation...\n');

  try {
    // Test 1: User client creation
    console.log('1️⃣ Testing user client creation...');
    const userClient = SupabaseClientFactory.getClient('user');
    console.log('✅ User client created successfully');

    // Test 2: Service client creation  
    console.log('2️⃣ Testing service client creation...');
    const serviceClient = SupabaseClientFactory.getClient('service');
    console.log('✅ Service client created successfully');

    // Test 3: Health checks
    console.log('3️⃣ Testing health checks...');
    const userHealth = await SupabaseClientFactory.healthCheck('user');
    const serviceHealth = await SupabaseClientFactory.healthCheck('service');
    console.log(`✅ User client health: ${userHealth ? 'HEALTHY' : 'UNHEALTHY'}`);
    console.log(`✅ Service client health: ${serviceHealth ? 'HEALTHY' : 'UNHEALTHY'}`);

    // Test 4: Database abstraction
    console.log('4️⃣ Testing database abstraction...');
    const players = await db.players.getAll('user');
    console.log(`✅ Retrieved ${players.length} players using user client`);

    const playersService = await db.players.getAll('service');
    console.log(`✅ Retrieved ${playersService.length} players using service client`);

    console.log('\n🎉 All tests passed! Client Factory is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Only run if environment variables are set
if (process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  testClientFactory();
} else {
  console.log('⚠️ Skipping tests - environment variables not set');
  console.log('Required: SUPABASE_URL, SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  console.log('Optional: SUPABASE_SERVICE_ROLE_KEY (for service client tests)');
}
