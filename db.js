import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, 'fcommerce_db.json');

const defaultData = {
  users: [
    {
      id: 1,
      name: "Demo Store Owner",
      email: "demo@fcommerce.com",
      password: "password123",
      store_id: 1,
      created_at: new Date().toISOString()
    }
  ],
  stores: [
    {
      id: 1,
      user_id: 1,
      name: "F-Commerce Fashion Store",
      currency: "BDT",
      inside_city_fee: 60.0,
      outside_city_fee: 120.0,
      fb_page_id: "",
      fb_access_token: "",
      verify_token: "fcommerce_ai_secret_token_123",
      gemini_api_key: process.env.GEMINI_API_KEY || "",
      custom_prompt: `You are an aggressive yet polite F-Commerce Sales Agent for F-Commerce Fashion Store.

BUSINESS RULES & PAYMENTS:
- Payment Methods: Cash on Delivery (COD) or bKash / Nagad send money.
- Delivery Charges: Inside Dhaka ৳60, Outside Dhaka ৳120.
- Order Process: Ask customer for full Name, Phone Number, Full Address, and Product Title with Variant.

SALES INSTRUCTIONS:
1. Your sole goal is to answer customer questions accurately and close product orders.
2. Recommend products using their title, price, and image links when available.
3. If customer provides Name, Phone, and Address, summarize the order and confirm it.
4. IMPORTANT: If a message is spam, irrelevant, unanswerable, or low confidence, output strictly '[NO_REPLY]'.`
    }
  ],
  products: [
    {
      id: 1,
      store_id: 1,
      title: "Premium Cotton Graphic T-Shirt",
      sku: "TS-001",
      price: 650.0,
      stock: 25,
      category: "Apparel",
      image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80",
      variants: ["M", "L", "XL"],
      description: "100% Organic breathable cotton t-shirt with premium screen print."
    },
    {
      id: 2,
      store_id: 1,
      title: "Urban Slim Fit Denim Jacket",
      sku: "JK-002",
      price: 2200.0,
      stock: 10,
      category: "Outwear",
      image_url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&q=80",
      variants: ["Blue", "Black"],
      description: "Heavyweight durable denim jacket styled for modern streetwear."
    },
    {
      id: 3,
      store_id: 1,
      title: "Minimalist Canvas Sneakers",
      sku: "SN-003",
      price: 1450.0,
      stock: 15,
      category: "Footwear",
      image_url: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&q=80",
      variants: ["EU 40", "EU 41", "EU 42", "EU 43"],
      description: "Comfortable cushioned rubber sole canvas sneakers for everyday wear."
    }
  ],
  conversations: [],
  messages: [],
  orders: []
};

export class JsonDatabase {
  constructor() {
    this.dbPath = DB_FILE;
    this.data = defaultData;
    this.init();
  }

  init() {
    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(raw);
        if (!this.data.users) this.data.users = defaultData.users;
        if (!this.data.stores) this.data.stores = defaultData.stores;
      } catch (err) {
        console.error("Error loading DB file, resetting to defaults:", err);
        this.save();
      }
    } else {
      this.save();
    }
  }

  save() {
    fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  // Auth Methods
  registerUser(name, email, password, storeName) {
    const existing = this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    const userId = this.data.users.length > 0 ? Math.max(...this.data.users.map(u => u.id)) + 1 : 1;
    const storeId = this.data.stores.length > 0 ? Math.max(...this.data.stores.map(s => s.id)) + 1 : 1;

    const newStore = {
      id: storeId,
      user_id: userId,
      name: storeName || `${name}'s Store`,
      currency: "BDT",
      inside_city_fee: 60.0,
      outside_city_fee: 120.0,
      fb_page_id: "",
      fb_access_token: "",
      verify_token: `fcommerce_token_${storeId}_${Date.now().toString(36)}`,
      gemini_api_key: "",
      custom_prompt: `You are an expert F-Commerce Sales Assistant for ${storeName || name + "'s Store"}. Always greet customers warmly, answer questions politely, and guide them to place an order!`
    };

    const newUser = {
      id: userId,
      name,
      email,
      password,
      store_id: storeId,
      created_at: new Date().toISOString()
    };

    this.data.stores.push(newStore);
    this.data.users.push(newUser);
    this.save();

    return { user: newUser, store: newStore };
  }

  loginUser(email, password) {
    const user = this.data.users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) {
      throw new Error("Invalid email or password.");
    }
    const store = this.getStoreById(user.store_id);
    return { user, store };
  }

  getStoreById(storeId) {
    return this.data.stores.find(s => s.id === storeId) || this.data.stores[0];
  }

  getStoreByPageId(pageId) {
    if (!pageId) return this.getStoreById(1);
    const cleanId = String(pageId).trim();
    const store = this.data.stores.find(s => s.fb_page_id && String(s.fb_page_id).trim() === cleanId);
    return store || this.getStoreById(1);
  }

  updateStoreSettings(storeId, settings) {
    const store = this.getStoreById(storeId);
    if (!store) throw new Error("Store not found");

    const sanitizeString = (val) => {
      if (typeof val !== 'string') return val;
      let str = val.trim();
      if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
        str = str.slice(1, -1).trim();
      }
      return str;
    };

    if (settings.name !== undefined) store.name = sanitizeString(settings.name);
    if (settings.currency !== undefined) store.currency = sanitizeString(settings.currency);
    if (settings.inside_city_fee !== undefined) store.inside_city_fee = parseFloat(settings.inside_city_fee);
    if (settings.outside_city_fee !== undefined) store.outside_city_fee = parseFloat(settings.outside_city_fee);
    if (settings.custom_prompt !== undefined) store.custom_prompt = settings.custom_prompt;
    if (settings.fb_page_id !== undefined) store.fb_page_id = sanitizeString(settings.fb_page_id);
    if (settings.fb_access_token !== undefined) store.fb_access_token = sanitizeString(settings.fb_access_token);
    if (settings.verify_token !== undefined) store.verify_token = sanitizeString(settings.verify_token);
    if (settings.gemini_api_key !== undefined) store.gemini_api_key = sanitizeString(settings.gemini_api_key);
    if (settings.groq_api_key !== undefined) store.groq_api_key = sanitizeString(settings.groq_api_key);
    if (settings.openrouter_api_key !== undefined) store.openrouter_api_key = sanitizeString(settings.openrouter_api_key);

    this.save();
    return store;
  }

  // Products
  getProducts(storeId = 1) {
    return this.data.products.filter(p => p.store_id === storeId);
  }

  addProduct(storeId, productData) {
    const id = this.data.products.length > 0 
      ? Math.max(...this.data.products.map(p => p.id)) + 1 
      : 1;
    const newProduct = { id, store_id: storeId, ...productData };
    this.data.products.push(newProduct);
    this.save();
    return newProduct;
  }

  deleteProduct(storeId, productId) {
    const index = this.data.products.findIndex(p => p.id === productId && p.store_id === storeId);
    if (index !== -1) {
      this.data.products.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Conversations
  getConversationByPsid(psid, storeId = 1) {
    let conv = this.data.conversations.find(c => c.psid === psid && c.store_id === storeId);
    if (!conv) {
      conv = {
        id: this.data.conversations.length + 1,
        psid,
        store_id: storeId,
        is_ai_active: true,
        handoff_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.data.conversations.push(conv);
      this.save();
    }
    return conv;
  }

  getConversations(storeId = 1) {
    return this.data.conversations.filter(c => c.store_id === storeId);
  }

  toggleAI(psid, isActive, storeId = 1) {
    const conv = this.getConversationByPsid(psid, storeId);
    conv.is_ai_active = isActive;
    if (isActive) conv.handoff_reason = null;
    conv.updated_at = new Date().toISOString();
    this.save();
    return conv;
  }

  setHandoff(psid, reason, storeId = 1) {
    const conv = this.getConversationByPsid(psid, storeId);
    conv.is_ai_active = false;
    conv.handoff_reason = reason;
    conv.updated_at = new Date().toISOString();
    this.save();
    return conv;
  }

  addMessage(conversationId, sender, text) {
    const msg = {
      id: this.data.messages.length + 1,
      conversation_id: conversationId,
      sender,
      text,
      created_at: new Date().toISOString()
    };
    this.data.messages.push(msg);
    this.save();
    return msg;
  }

  getMessages(conversationId, limit = 15) {
    return this.data.messages
      .filter(m => m.conversation_id === conversationId)
      .slice(-limit);
  }

  // Orders
  addOrder(storeId, orderData) {
    const id = this.data.orders.length > 0 
      ? Math.max(...this.data.orders.map(o => o.id)) + 1 
      : 1;
    const newOrder = {
      id,
      store_id: storeId,
      status: 'pending',
      created_at: new Date().toISOString(),
      ...orderData
    };
    this.data.orders.push(newOrder);
    this.save();
    return newOrder;
  }

  getOrders(storeId = 1, statusFilter = null) {
    let orders = this.data.orders.filter(o => o.store_id === storeId);
    if (statusFilter) {
      orders = orders.filter(o => o.status === statusFilter);
    }
    return orders;
  }

  updateOrderStatus(storeId, orderId, status) {
    const order = this.data.orders.find(o => o.id === orderId && o.store_id === storeId);
    if (order) {
      order.status = status;
      this.save();
    }
    return order;
  }
}

export const db = new JsonDatabase();
