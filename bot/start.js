#!/usr/bin/env node

// Load environment variables from bot directory
require('dotenv').config({ path: __dirname + '/.env' });

// Start the bot
require('./dist/index.js');
