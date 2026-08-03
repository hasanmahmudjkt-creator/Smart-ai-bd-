import { db } from './db.js';

export class FCommerceSalesAgent {
  getStore(storeId = 1) {
    return db.getStoreById(storeId);
  }

  calculateDeliveryCharge(storeId, addressOrCity) {
    const store = this.getStore(storeId);
    const text = addressOrCity.toLowerCase();
    if (text.includes("dhaka") || text.includes("inside city") || text.includes("inside")) {
      return { zone: "Inside City", fee: store.inside_city_fee, currency: store.currency };
    }
    return { zone: "Outside City", fee: store.outside_city_fee, currency: store.currency };
  }

  executeCreateOrder(storeId, psid, customerName, phoneNumber, fullAddress, itemsList) {
    const store = this.getStore(storeId);
    const products = db.getProducts(storeId);
    let subtotal = 0;
    const validatedItems = [];

    for (const item of itemsList) {
      const prodName = item.product_name || item.title || "";
      const match = products.find(p => p.title.toLowerCase().includes(prodName.toLowerCase()) || p.id === item.product_id);
      
      const price = match ? match.price : (item.price || 650);
      const qty = item.quantity || 1;
      const title = match ? match.title : (prodName || "Standard Product");
      const itemTotal = price * qty;
      
      subtotal += itemTotal;
      validatedItems.push({
        product_id: match ? match.id : null,
        title,
        quantity: qty,
        variant: item.variant || "",
        price_per_unit: price,
        total: itemTotal
      });
    }

    const deliveryInfo = this.calculateDeliveryCharge(storeId, fullAddress);
    const totalAmount = subtotal + deliveryInfo.fee;

    const order = db.addOrder(storeId, {
      psid,
      customer_name: customerName,
      phone_number: phoneNumber,
      full_address: fullAddress,
      city_zone: deliveryInfo.zone,
      line_items: validatedItems,
      subtotal,
      delivery_fee: deliveryInfo.fee,
      total_amount: totalAmount,
      currency: store.currency,
      payment_method: "Cash on Delivery"
    });

    console.log(`✅ Order #${order.id} placed for ${customerName} (${phoneNumber}) - Total: ${totalAmount} ${store.currency}`);
    return order;
  }

  async generateGeminiResponse(apiKey, systemInstruction, conversationHistory) {
    const modelsToTry = ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-2.0-flash'];
    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const contents = conversationHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

        const payload = {
          system_instruction: {
            parts: [{ text: systemInstruction }]
          },
          contents
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        } else {
          const errText = await res.text();
          console.warn(`Gemini API Model (${model}) warning [${res.status}]:`, errText);
        }
      } catch (err) {
        console.error(`Gemini request exception for ${model}:`, err.message);
      }
    }
    return null;
  }

  async generateResponse(psid, userMessage, storeId = 1) {
    const store = this.getStore(storeId);
    const conv = db.getConversationByPsid(psid, storeId);

    // 1. If human agent has taken over, stay silent
    if (!conv.is_ai_active) {
      console.log(`[HUMAN HANDOVER ACTIVE] Store #${storeId} | PSID: ${psid}. AI auto-reply paused.`);
      return "";
    }

    // Save incoming user message
    db.addMessage(conv.id, "user", userMessage);

    const products = db.getProducts(storeId);
    const recentMessages = db.getMessages(conv.id, 10);

    // Format Product Catalog with Image URLs
    const productCatalogStr = products.map(p => 
      `- Item ID #${p.id}: "${p.title}" | Price: ${store.currency} ${p.price} | Stock: ${p.stock}` +
      (p.variants && p.variants.length ? ` | Variants: ${p.variants.join(', ')}` : "") +
      (p.image_url ? ` | Image: ${p.image_url}` : "") +
      (p.description ? ` | Description: ${p.description}` : "")
    ).join('\n');

    // Build Complete Store Training & Sales System Instruction for Gemini
    const systemInstruction = `
${store.custom_prompt || "You are an expert F-Commerce Sales Agent."}

STORE INFORMATION & POLICIES:
- Store Name: ${store.name}
- Currency: ${store.currency}
- Inside City Delivery Charge: ${store.currency} ${store.inside_city_fee}
- Outside City Delivery Charge: ${store.currency} ${store.outside_city_fee}

OUR PRODUCT CATALOG WITH IMAGES:
${productCatalogStr || "No products currently in stock."}

CRITICAL OPERATIONAL RULES:
1. HIGH INTENT TO SELL: Your primary goal is to provide product details, prices, images, and convert inquiries into orders.
2. SELECTIVE SILENCE ([NO_REPLY]): If the customer message is spam, inappropriate, completely irrelevant to our store, or if you do not know the answer with high confidence, output strictly '[NO_REPLY]'.
3. ORDER CONFIRMATION: When customer provides Name, Phone Number, and Address, calculate total cost and confirm the order clearly.
4. HUMAN HANDOVER: If customer requests human support, output a friendly handover response.
`.trim();

    let reply = "";

    // Check if store owner has provided a Gemini API Key (or server environment fallback)
    const apiKey = store.gemini_api_key || process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== "your_gemini_api_key_here") {
      const geminiReply = await this.generateGeminiResponse(apiKey, systemInstruction, recentMessages);
      if (geminiReply) {
        reply = geminiReply;
      }
    }

    // If Gemini API is not configured or fails, use high-precision F-Commerce rule engine
    if (!reply) {
      reply = this._fallbackRuleEngine(store, products, psid, userMessage, storeId);
    }

    // Check for Selective Silence ([NO_REPLY])
    if (reply.includes("[NO_REPLY]")) {
      console.log(`[SELECTIVE SILENCE] AI decided not to reply to message: "${userMessage}"`);
      return "";
    }

    // Save AI reply to database
    db.addMessage(conv.id, "assistant", reply);
    return reply;
  }

  _fallbackRuleEngine(store, products, psid, userMessage, storeId) {
    const textLower = userMessage.toLowerCase();

    // Spam / Irrelevant filter (Selective Silence)
    if (textLower.length < 2 && !["hi", "hey"].includes(textLower)) {
      return "[NO_REPLY]";
    }

    // Check for human agent request
    if (["human", "person", "agent", "real person", "call me", "owner", "support"].some(k => textLower.includes(k))) {
      db.setHandoff(psid, "Customer requested human support.", storeId);
      return `Understood! I am notifying a human support representative from ${store.name} to take over this chat. Please hold on a moment.`;
    }

    // Order Placement Detection (Name, Phone, Address pattern)
    if (/(\+?8801|01)[3-9]\d{8}/.test(userMessage) && userMessage.length > 15) {
      const phoneMatch = userMessage.match(/(\+?8801|01)[3-9]\d{8}/);
      const phone = phoneMatch ? phoneMatch[0] : "";

      const nameMatch = userMessage.match(/Name:\s*([^,\n]+)/i);
      let name = nameMatch ? nameMatch[1].trim() : "";
      if (!name) {
        const lines = userMessage.split('\n').map(l => l.trim()).filter(Boolean);
        name = lines[0] && lines[0].length < 30 ? lines[0] : "Valued Customer";
      }

      const addressMatch = userMessage.match(/Address:\s*([^\n]+)/i);
      let address = addressMatch ? addressMatch[1].trim() : "";
      if (!address) {
        address = userMessage.replace(phone, "").replace(/Name:\s*[^,\n]+/i, "").trim() || "Dhaka, Bangladesh";
      }

      const sampleProd = products[0] || { id: 1, title: "Standard Item", price: 650 };
      const order = this.executeCreateOrder(
        storeId,
        psid,
        name,
        phone,
        address,
        [{ product_id: sampleProd.id, product_name: sampleProd.title, quantity: 1 }]
      );

      return `🎉 Thank you, ${name}! Your order has been placed successfully!\n\n` +
        `📋 **Order Summary (Order #${order.id}):**\n` +
        `• Subtotal: ${store.currency} ${order.subtotal.toFixed(2)}\n` +
        `• Delivery Fee (${order.city_zone}): ${store.currency} ${order.delivery_fee.toFixed(2)}\n` +
        `• **Total Payable:** ${store.currency} ${order.total_amount.toFixed(2)}\n\n` +
        `📍 Delivery Address: ${address}\n` +
        `📞 Contact Phone: ${phone}\n` +
        `Payment Method: Cash on Delivery (COD)\n\n` +
        `Our delivery team will call you shortly before dispatching your package!`;
    }

    // Catalog & Pricing Inquiry
    if (["price", "cost", "how much", "dam koto", "koto", "catalogue", "products"].some(k => textLower.includes(k))) {
      const prodList = products.length > 0 
        ? products.map(p => `• **${p.title}**: ${store.currency} ${p.price} (In Stock)` + (p.image_url ? `\n  🖼️ Photo: ${p.image_url}` : "")).join('\n')
        : "No products currently in stock.";

      return `Hello! Here are our available products at **${store.name}**:\n\n` +
        `${prodList}\n\n` +
        `🚚 **Delivery Charge:**\n` +
        `• Inside City: ${store.currency} ${store.inside_city_fee}\n` +
        `• Outside City: ${store.currency} ${store.outside_city_fee}\n\n` +
        `Which product would you like to order? Reply with your **Name, Phone Number, and Address** to place an order!`;
    }

    // Delivery Inquiry
    if (["delivery", "shipping", "charge", "time", "location"].some(k => textLower.includes(k))) {
      return `🚚 **Delivery Information for ${store.name}:**\n` +
        `• Inside City: ${store.currency} ${store.inside_city_fee} (Takes 24-48 hours)\n` +
        `• Outside City: ${store.currency} ${store.outside_city_fee} (Takes 2-4 days)\n\n` +
        `Payment method: Cash on Delivery (COD) or bKash.\n` +
        `Would you like to place an order now?`;
    }

    // Default Friendly Sales Response
    const sampleNames = products.slice(0, 3).map(p => p.title).join(', ');
    return `Hello! Welcome to **${store.name}**! 👋\n\n` +
      (sampleNames ? `We offer top quality items such as: ${sampleNames}.\n\n` : "") +
      `How can I help you today? Ask us about prices, product details, delivery charges, or send your **Name, Phone & Address** to place an order!`;
  }
}

export const salesAgent = new FCommerceSalesAgent();
