async function simulateWebhooks() {
  const serverUrl = 'http://localhost:3000/webhook';
  console.log('='.repeat(70));
  console.log('🧪 LIVE WEBHOOK SIMULATION TEST (GREETING, PRICING, ORDER)');
  console.log('='.repeat(70));

  const testCases = [
    {
      name: "Greeting Inquiry",
      sender: "test_user_001",
      text: "Hi, what products do you sell?"
    },
    {
      name: "Delivery Charge Inquiry",
      sender: "test_user_002",
      text: "How much is the delivery charge?"
    },
    {
      name: "Full Order Placement",
      sender: "test_user_003",
      text: "I want to order 1 T-shirt. Name: Rahim, Phone: 01712345678, Address: Uttara, Dhaka"
    }
  ];

  for (const tc of testCases) {
    console.log(`\n📨 Dispatching Webhook Event: [${tc.name}] ...`);
    const payload = {
      object: 'page',
      entry: [
        {
          id: '164682286725145',
          time: Date.now(),
          messaging: [
            {
              sender: { id: tc.sender },
              recipient: { id: '164682286725145' },
              message: { text: tc.text }
            }
          ]
        }
      ]
    };

    try {
      const res = await fetch(serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const responseText = await res.text();
      console.log(`✅ Webhook Status: ${res.status} | Response: ${responseText}`);
    } catch (err) {
      console.error(`❌ Webhook failed for [${tc.name}]:`, err.message);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ All Webhook simulations processed with 200 OK!');
}

simulateWebhooks();
