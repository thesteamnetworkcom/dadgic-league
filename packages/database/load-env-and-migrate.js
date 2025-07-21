#!/usr/bin/env node

// Load environment from parent directory
require('dotenv').config({ path: '../../.env.local' });

// Now run the actual migration script
require('./dist/cli/migrate.js');
