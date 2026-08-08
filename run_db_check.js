import { db } from './db.js';

function runDbCheck() {
  console.log('='.repeat(70));
  console.log('🔴 TEST 2: DATABASE SCHEMA & STORE VALIDATION');
  console.log('='.repeat(70));

  const stores = db.data.stores;
  console.log(`📊 Found ${stores.length} store(s) in database.\n`);

  const requiredFields = [
    'id', 'name', 'fb_page_id', 'fb_access_token', 'gemini_api_key',
    'groq_api_key', 'openrouter_api_key', 'inside_city_fee',
    'outside_city_fee', 'currency', 'custom_prompt'
  ];

  for (const store of stores) {
    console.log(`🏬 Store #${store.id}: "${store.name}"`);
    console.log(`  - fb_page_id: ${store.fb_page_id ? '✅ SET (' + store.fb_page_id + ')' : '❌ NOT SET'}`);
    console.log(`  - fb_access_token: ${store.fb_access_token ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`  - gemini_api_key: ${store.gemini_api_key ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`  - groq_api_key: ${store.groq_api_key ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`  - openrouter_api_key: ${store.openrouter_api_key ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`  - delivery charges: Inside ৳${store.inside_city_fee}, Outside ৳${store.outside_city_fee} (${store.currency})`);
    
    const missing = requiredFields.filter(f => store[f] === undefined);
    if (missing.length === 0) {
      console.log(`  - Schema Integrity: ✅ 100% Valid (All fields present)\n`);
    } else {
      console.log(`  - Schema Integrity: ⚠️ Missing fields: ${missing.join(', ')}\n`);
    }
  }

  console.log('='.repeat(70));
}

runDbCheck();
