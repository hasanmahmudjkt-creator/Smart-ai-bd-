import { db } from './db.js';
import { salesAgent } from './salesAgent.js';

async function runSimulator() {
  console.log("=" .repeat(70));
  printHeader("🤖 F-Commerce AI Messenger Sales Engine - Node.js Test Simulator");
  console.log("=" .repeat(70));

  const store = db.getStoreById(1);
  console.log(`\n🏬 Connected Store: ${store.name} (Currency: ${store.currency})`);
  
  const products = db.getProducts();
  console.log(`📦 Loaded Inventory: ${products.length} product(s) available:`);
  products.forEach(p => {
    console.log(`   - #${p.id} ${p.title} | ${store.currency} ${p.price} | Stock: ${p.stock}`);
  });

  console.log("\n" + "-".repeat(70));
  console.log("Simulating Messenger Customer Conversation (PSID: sim_customer_101)...");
  console.log("-".repeat(70));

  const testPsid = "sim_customer_101";

  const testMessages = [
    "Hi, what products do you have and what are their prices?",
    "How much is the delivery charge for Dhaka and outside Dhaka?",
    "I want to order 1 Cotton T-shirt size L. Name: Tanvir Hasan, Phone: 01711223344, Address: House 45, Road 7, Dhanmondi, Dhaka",
    "Can I speak with a human support agent?"
  ];

  for (const msg of testMessages) {
    console.log(`\n👤 Customer (PSID: ${testPsid}):\n   "${msg}"`);
    const reply = await salesAgent.generateResponse(testPsid, msg);
    console.log(`\n🤖 AI Sales Bot:\n${reply}`);
    console.log(".".repeat(70));
  }

  console.log("\n📊 Inspecting Database Orders:");
  const orders = db.getOrders();
  console.log(`Found ${orders.length} order(s) in system:`);
  orders.forEach(o => {
    console.log(`   - Order #${o.id} | Customer: ${o.customer_name} (${o.phone_number}) | Total: ${o.total_amount} ${store.currency} | Status: ${o.status}`);
    console.log(`     Address: ${o.full_address}`);
    console.log(`     Items: ${JSON.stringify(o.line_items)}`);
  });

  console.log("\n✅ Test Simulation Completed Successfully!");
}

function printHeader(title) {
  console.log(` ${title}`);
}

runSimulator();
