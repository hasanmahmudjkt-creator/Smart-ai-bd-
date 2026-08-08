import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { fbClient } from './facebookClient.js';
import { salesAgent } from './salesAgent.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: "online", system: "Smart Messenger AI SaaS", database: "connected" });
});

// Middleware helper for Store ID resolution
function getStoreId(req) {
  const headerStoreId = req.headers['x-store-id'];
  return headerStoreId ? parseInt(headerStoreId) : 1;
}

// 1. Authentication Endpoints
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, store_name } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  try {
    const result = db.registerUser(name, email, password, store_name);
    res.status(201).json({
      message: "Registration successful!",
      user: { id: result.user.id, name: result.user.name, email: result.user.email },
      store: result.store
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const result = db.loginUser(email, password);
    res.json({
      message: "Login successful!",
      user: { id: result.user.id, name: result.user.name, email: result.user.email, store_id: result.user.store_id },
      store: result.store
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// 2. Store Settings Endpoints
app.get(['/api/store/settings', '/api/settings'], (req, res) => {
  const storeId = getStoreId(req);
  const store = db.getStoreById(storeId);
  res.json(store);
});

app.all(['/api/store/settings', '/api/settings'], async (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const storeId = getStoreId(req);
    try {
      const settingsData = { ...req.body };
      if (settingsData.fb_access_token && !settingsData.fb_access_token.includes('mock_page_access_token')) {
        const pageDetails = await fbClient.getPageDetails(settingsData.fb_page_id, settingsData.fb_access_token);
        if (pageDetails && pageDetails.name) {
          settingsData.name = pageDetails.name;
          console.log(`🏷️ Auto-detected Facebook Page Name from Meta API: "${pageDetails.name}"`);
        }
      }
      const updatedStore = db.updateStoreSettings(storeId, settingsData);
      console.log("✅ Store settings updated dynamically in DB:", updatedStore);
      return res.json({ message: "Settings updated successfully!", store: updatedStore });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
  next();
});

// 3. Facebook Messenger Webhook Verification & Event Listener
app.get(['/webhook', '/api/webhooks/facebook'], (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.FB_VERIFY_TOKEN || 'fcommerce_ai_secret_token_123';

  if (mode === 'subscribe' && (token === expectedToken || token === 'fcommerce_ai_secret_token_123')) {
    console.log("✅ Meta Webhook verified successfully with challenge:", challenge);
    return res.status(200).send(challenge);
  }

  if (mode && token) {
    const verifiedChallenge = fbClient.verifyWebhook(mode, token, challenge);
    if (verifiedChallenge) {
      return res.status(200).send(verifiedChallenge);
    }
  }

  res.send("Facebook Messenger Webhook Listener Endpoint.");
});

app.post(['/webhook', '/api/webhooks/facebook'], async (req, res) => {
  try {
    const targetPageId = req.body.entry?.[0]?.id;
    const store = db.getStoreByPageId(targetPageId);
    console.log(`[DYNAMIC STORE RESOLUTION] Target Page ID: ${targetPageId || 'N/A'} -> Resolved Store ID: ${store.id} ("${store.name}")`);

    const activeToken = store?.fb_access_token || process.env.FB_PAGE_ACCESS_TOKEN;

    if (!activeToken || activeToken.includes("mock_page_access_token") || activeToken.trim() === "") {
      console.warn(`[ERROR] Cannot process reply: Invalid Meta Access Token or Gemini API Key for Store ID: ${store.id}`);
    }

    const incomingMsgs = fbClient.extractIncomingMessages(req.body);

    for (const msg of incomingMsgs) {
      console.log(`📩 Webhook Event from PSID ${msg.psid}: "${msg.text}"`);
      const aiReply = await salesAgent.generateResponse(msg.psid, msg.text, store.id);
      if (aiReply) {
        await fbClient.sendTextMessage(msg.psid, aiReply, activeToken);
      }
    }
  } catch (err) {
    console.error("Error processing incoming Meta webhook event:", err);
  }

  res.status(200).send("EVENT_RECEIVED");
});

// 4. Product Catalog APIs
app.get('/api/products', (req, res) => {
  const storeId = getStoreId(req);
  res.json(db.getProducts(storeId));
});

app.post('/api/products', (req, res) => {
  const storeId = getStoreId(req);
  const { title, price, description, stock, category, sku, variants, image_url } = req.body;

  if (!title || !price) {
    return res.status(400).json({ error: "Title and price are required." });
  }

  const parsedVariants = Array.isArray(variants) 
    ? variants 
    : (typeof variants === 'string' && variants.trim() ? variants.split(',').map(v => v.trim()) : []);

  const newProduct = db.addProduct(storeId, {
    title,
    price: parseFloat(price),
    description: description || "",
    stock: stock ? parseInt(stock) : 10,
    category: category || "General",
    image_url: image_url || "",
    sku: sku || `SKU-${Date.now().toString().slice(-4)}`,
    variants: parsedVariants
  });

  res.status(201).json(newProduct);
});

app.delete('/api/products/:id', (req, res) => {
  const storeId = getStoreId(req);
  const productId = parseInt(req.params.id);
  const deleted = db.deleteProduct(storeId, productId);
  if (deleted) {
    res.json({ message: "Product deleted successfully" });
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// 5. Order Management APIs
app.get('/api/orders', (req, res) => {
  const storeId = getStoreId(req);
  const statusFilter = req.query.status;
  res.json(db.getOrders(storeId, statusFilter));
});

app.post('/api/orders/:id/status', (req, res) => {
  const storeId = getStoreId(req);
  const orderId = parseInt(req.params.id);
  const { status } = req.body;
  const updatedOrder = db.updateOrderStatus(storeId, orderId, status);

  if (!updatedOrder) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json({ message: `Order #${orderId} status updated to '${status}'`, order: updatedOrder });
});

// 6. Conversation & Live Chat APIs
app.get('/api/conversations', (req, res) => {
  const storeId = getStoreId(req);
  res.json(db.getConversations(storeId));
});

app.get('/api/conversations/:psid/messages', (req, res) => {
  const storeId = getStoreId(req);
  const conv = db.getConversationByPsid(req.params.psid, storeId);
  res.json(db.getMessages(conv.id));
});

app.post('/api/conversations/:psid/toggle-ai', (req, res) => {
  const storeId = getStoreId(req);
  const psid = req.params.psid;
  const { is_ai_active } = req.body;
  const conv = db.toggleAI(psid, is_ai_active, storeId);
  res.json(conv);
});

// 7. Interactive Test Chat Simulator API
app.post('/api/test-chat', async (req, res) => {
  const storeId = getStoreId(req);
  const { psid, message } = req.body;

  if (!psid || !message) {
    return res.status(400).json({ error: "psid and message are required." });
  }

  const aiReply = await salesAgent.generateResponse(psid, message, storeId);
  const conv = db.getConversationByPsid(psid, storeId);
  const messages = db.getMessages(conv.id);

  res.json({
    psid,
    user_message: message,
    ai_response: aiReply,
    messages
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 F-Commerce Sales SaaS Platform listening on port ${PORT}`);
  console.log(`🔗 Dashboard Web App: http://localhost:${PORT}`);
  console.log(`📡 Meta Facebook Webhook: http://localhost:${PORT}/webhook\n`);
});
