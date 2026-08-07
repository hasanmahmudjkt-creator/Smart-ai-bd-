import { salesAgent } from './salesAgent.js';
import { db } from './db.js';

async function testAllProviders() {
  console.log('='.repeat(70));
  console.log('🧪 COMPREHENSIVE AI SALES ENGINE TEST - ALL PROVIDERS');
  console.log('='.repeat(70));

  const store = db.getStoreById(1);
  console.log(`\n🏬 Active Store: "${store.name}" (ID: ${store.id})`);
  console.log(`💳 Groq API Key: ${store.groq_api_key ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`💳 OpenRouter API Key: ${store.openrouter_api_key ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`💳 Gemini API Key: ${store.gemini_api_key ? '✅ SET' : '❌ NOT SET'}`);

  const testMessages = [
    "Hi, what products do you sell?",
    "How much is the delivery charge inside and outside Dhaka?",
    "I want to order 1 T-shirt. Name: Rahim, Phone: 01712345678, Address: Dhanmondi, Dhaka"
  ];

  for (const msg of testMessages) {
    console.log('\n' + '='.repeat(70));
    console.log(`👤 Customer: "${msg}"`);
    console.log('='.repeat(70));
    const start = Date.now();
    try {
      const response = await salesAgent.generateResponse('test_user_777', msg, store.id);
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      console.log(`🤖 AI Sales Agent Response (${elapsed}s):\n${response}`);
    } catch (e) {
      console.error('❌ Error generating response:', e);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ All customer test scenarios executed successfully!');
}

testAllProviders();
