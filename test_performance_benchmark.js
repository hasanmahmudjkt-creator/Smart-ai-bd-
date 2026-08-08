import { salesAgent } from './salesAgent.js';
import { db } from './db.js';

async function benchmarkPerformance() {
  console.log('='.repeat(70));
  console.log('🚀 TEST 9: PERFORMANCE BENCHMARK & LATENCY AUDIT');
  console.log('='.repeat(70));

  const store = db.getStoreById(1);
  const testMessages = [
    "Hello",
    "What products do you sell?",
    "How much is delivery inside Dhaka?",
    "I want to order 1 T-shirt. Name: Rahim, Phone: 01712345678, Address: Dhaka"
  ];

  const results = [];

  for (const msg of testMessages) {
    const start = Date.now();
    try {
      const response = await salesAgent.generateResponse("perf_test_user", msg, store.id);
      const elapsed = ((Date.now() - start) / 1000);
      results.push({
        msg: msg.slice(0, 30) + '...',
        time: elapsed,
        length: response.length,
        success: true
      });
      console.log(`✅ "${msg.slice(0, 30)}..." → ${elapsed.toFixed(3)}s (${response.length} chars)`);
    } catch (err) {
      const elapsed = ((Date.now() - start) / 1000);
      results.push({
        msg: msg.slice(0, 30) + '...',
        time: elapsed,
        success: false,
        error: err.message
      });
      console.log(`❌ "${msg.slice(0, 30)}..." → ERROR: ${err.message}`);
    }
  }

  const successCount = results.filter(r => r.success).length;
  const avgTime = results.reduce((a, b) => a + b.time, 0) / results.length;

  console.log('\n' + '='.repeat(70));
  console.log('📊 PERFORMANCE SUMMARY');
  console.log(`Total test queries: ${results.length}`);
  console.log(`Success rate: ${((successCount / results.length) * 100).toFixed(1)}%`);
  console.log(`Average response time: ${avgTime.toFixed(3)}s`);
  console.log('='.repeat(70));
}

benchmarkPerformance();
