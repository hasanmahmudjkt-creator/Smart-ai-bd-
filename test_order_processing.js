import { db } from './db.js';
import { salesAgent } from './salesAgent.js';

async function testOrderProcessing() {
  console.log('='.repeat(70));
  console.log('🔴 TEST 6: ORDER PROCESSING & PERSISTENCE VALIDATION');
  console.log('='.repeat(70));

  const store = db.getStoreById(1);
  const testMessage = "I want to order 1 T-shirt. Name: Test Customer, Phone: 01712345678, Address: Dhanmondi, Dhaka";
  const psid = "order_test_psid_555";

  console.log(`📝 Order Message: "${testMessage}"`);

  // Generate response (which automatically detects order details and saves to db)
  const reply = await salesAgent.generateResponse(psid, testMessage, store.id);
  console.log(`\n🤖 AI Sales Agent Confirmation:\n${reply}\n`);

  // Verify order in database
  const orders = db.getOrders(store.id);
  const latestOrder = orders[orders.length - 1];

  if (latestOrder && latestOrder.customer_name === "Test Customer") {
    console.log(`✅ Order verified in Database!`);
    console.log(`  - Order ID: #${latestOrder.id}`);
    console.log(`  - Customer: ${latestOrder.customer_name} (${latestOrder.phone_number})`);
    console.log(`  - Address: ${latestOrder.full_address}`);
    console.log(`  - Subtotal: ${store.currency} ${latestOrder.subtotal}`);
    console.log(`  - Delivery: ${store.currency} ${latestOrder.delivery_fee}`);
    console.log(`  - Total Amount: ${store.currency} ${latestOrder.total_amount}`);
    console.log(`  - Payment Method: ${latestOrder.payment_method}`);
  } else {
    console.log(`❌ Order was not saved properly in database.`);
  }

  console.log('='.repeat(70));
}

testOrderProcessing();
