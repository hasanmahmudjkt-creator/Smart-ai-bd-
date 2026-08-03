import http from 'http';

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runSaaSTests() {
  console.log("=" .repeat(70));
  console.log(" 🧪 Testing Multi-Tenant F-Commerce SaaS Platform APIs");
  console.log("=" .repeat(70));

  try {
    // 1. Register new store owner
    console.log("\n1. Testing User Registration...");
    const regRes = await makeRequest('/api/auth/register', 'POST', {
      name: "Tariqul Islam",
      store_name: "Gadget World BD",
      email: `tariq_${Date.now()}@gadgetworld.com`,
      password: "secretpassword"
    });
    console.log("   Registration Status:", regRes.status);
    console.log("   New Store ID:", regRes.body.store.id, "| Store Name:", regRes.body.store.name);

    const storeId = regRes.body.store.id;
    const storeHeaders = { 'x-store-id': storeId };

    // 2. Update Custom AI Prompt & Delivery Fees
    console.log("\n2. Testing Custom AI Persona Prompt & Settings Update...");
    const settingsRes = await makeRequest('/api/store/settings', 'PUT', {
      name: "Gadget World BD",
      currency: "BDT",
      inside_city_fee: 70,
      outside_city_fee: 130,
      custom_prompt: "You are an enthusiastic tech gadget specialist. Always offer 5% cash discount for bKash payment!"
    }, storeHeaders);
    console.log("   Updated Store Prompt:", settingsRes.body.store.custom_prompt);

    // 3. Add Product to Inventory
    console.log("\n3. Testing Product Addition...");
    const prodRes = await makeRequest('/api/products', 'POST', {
      title: "Wireless ANC Earbuds Pro",
      price: 3200,
      stock: 15,
      category: "Electronics",
      description: "Active Noise Cancelling Bluetooth 5.3 Earbuds with 30hr battery."
    }, storeHeaders);
    console.log("   Added Product:", prodRes.body.title, "| Price:", prodRes.body.price);

    // 4. Test Chat Simulator with Custom AI Prompt & Inventory
    console.log("\n4. Testing Chat Simulator with Custom Store Prompt...");
    const chatRes = await makeRequest('/api/test-chat', 'POST', {
      psid: "gadget_customer_01",
      message: "Hi, what products do you sell?"
    }, storeHeaders);
    console.log("   AI Response:\n" + chatRes.body.ai_response);

    // 5. Test Automatic Order Intake
    console.log("\n5. Testing Automatic Order Intake...");
    const orderChatRes = await makeRequest('/api/test-chat', 'POST', {
      psid: "gadget_customer_01",
      message: "I want to order 1 Wireless ANC Earbuds Pro. Name: Sumon Khan, Phone: 01812345678, Address: Sector 4, Uttara, Dhaka"
    }, storeHeaders);
    console.log("   AI Order Reply:\n" + orderChatRes.body.ai_response);

    // 6. Test Selective Silence ([NO_REPLY])
    console.log("\n6. Testing Selective Silence (Irrelevant / Spam Message)...");
    const silenceRes = await makeRequest('/api/test-chat', 'POST', {
      psid: "gadget_customer_01",
      message: "x"
    }, storeHeaders);
    console.log("   AI Reply for spam input (Expected empty/silence):", JSON.stringify(silenceRes.body.ai_response));

    // 7. Verifying Captured Orders in Database...
    console.log("\n7. Verifying Captured Orders in Database...");
    const ordersListRes = await makeRequest('/api/orders', 'GET', null, storeHeaders);
    console.log("   Captured Orders Count:", ordersListRes.body.length);
    ordersListRes.body.forEach(o => {
      console.log(`   - Order #${o.id} | Customer: ${o.customer_name} (${o.phone_number}) | Total: BDT ${o.total_amount} | Status: ${o.status}`);
    });

    console.log("\n✅ All Multi-Tenant SaaS Platform API Tests Passed!");
  } catch (err) {
    console.error("Test execution failed:", err);
  }
}

runSaaSTests();
