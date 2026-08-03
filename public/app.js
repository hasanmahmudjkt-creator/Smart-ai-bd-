// State Management
let currentUser = null;
let currentStore = null;
let currentPsid = "sim_customer_101";
let activeTab = "tab-chat";
let currentOrderFilter = "all";

document.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
  checkAuthSession();
});

function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (currentStore && currentStore.id) {
    headers["x-store-id"] = currentStore.id;
  }
  return headers;
}

// 1. Auth & Session Management
function checkAuthSession() {
  const savedUser = localStorage.getItem("fcommerce_user");
  const savedStore = localStorage.getItem("fcommerce_store");

  if (savedUser && savedStore) {
    currentUser = JSON.parse(savedUser);
    currentStore = JSON.parse(savedStore);
    showAppLayout();
  } else {
    showAuthModal();
  }
}

function showAuthModal() {
  document.getElementById("auth-modal").classList.remove("hidden");
  document.getElementById("app-container").classList.add("hidden");
}

function showAppLayout() {
  document.getElementById("auth-modal").classList.add("hidden");
  document.getElementById("app-container").classList.remove("hidden");

  document.getElementById("header-store-name").innerText = currentStore.name;
  document.getElementById("user-display-name").innerText = currentUser.name;

  loadDashboardData();
}

function initEventListeners() {
  // Auth Form Switching
  document.getElementById("show-register").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("login-form").classList.add("hidden");
    document.getElementById("register-form").classList.remove("hidden");
  });

  document.getElementById("show-login").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("register-form").classList.add("hidden");
    document.getElementById("login-form").classList.remove("hidden");
  });

  // Login Submission
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      currentUser = data.user;
      currentStore = data.store;
      localStorage.setItem("fcommerce_user", JSON.stringify(currentUser));
      localStorage.setItem("fcommerce_store", JSON.stringify(currentStore));

      showAppLayout();
    } catch (err) {
      alert(`Login Error: ${err.message}`);
    }
  });

  // Register Submission
  document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value;
    const store_name = document.getElementById("reg-store-name").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, store_name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      currentUser = data.user;
      currentStore = data.store;
      localStorage.setItem("fcommerce_user", JSON.stringify(currentUser));
      localStorage.setItem("fcommerce_store", JSON.stringify(currentStore));

      showAppLayout();
    } catch (err) {
      alert(`Registration Error: ${err.message}`);
    }
  });

  // Logout
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("fcommerce_user");
    localStorage.removeItem("fcommerce_store");
    currentUser = null;
    currentStore = null;
    showAuthModal();
  });

  // Navigation Tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      activeTab = btn.getAttribute("data-tab");
      document.getElementById(activeTab).classList.add("active");

      loadDashboardData();
    });
  });

  // Simulator Chat Input Form
  document.getElementById("chat-input-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const inputEl = document.getElementById("chat-user-input");
    const message = inputEl.value.trim();
    if (!message) return;

    appendMessageBubble("user", message);
    inputEl.value = "";

    try {
      const res = await fetch("/api/test-chat", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ psid: currentPsid, message })
      });
      const data = await res.json();
      if (data.ai_response) {
        appendMessageBubble("assistant", data.ai_response);
      }
      loadConversations();
      loadOrders();
    } catch (err) {
      console.error("Chat error:", err);
    }
  });

  // Toggle AI Auto-Reply vs Human Mode
  document.getElementById("toggle-ai-btn").addEventListener("click", async () => {
    const currentStatus = document.getElementById("current-chat-status").innerText;
    const isCurrentlyActive = currentStatus.includes("Active");
    const newStatus = !isCurrentlyActive;

    try {
      await fetch(`/api/conversations/${currentPsid}/toggle-ai`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ is_ai_active: newStatus })
      });
      updateChatHeader(newStatus);
      loadConversations();
    } catch (err) {
      console.error("Error toggling AI:", err);
    }
  });

  // Settings Form Submit
  document.getElementById("settings-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const custom_prompt = document.getElementById("setting-prompt").value;
    const name = document.getElementById("setting-store-name").value;
    const currency = document.getElementById("setting-currency").value;
    const inside_city_fee = document.getElementById("setting-inside-fee").value;
    const outside_city_fee = document.getElementById("setting-outside-fee").value;
    const fb_access_token = document.getElementById("setting-fb-token").value;
    const gemini_api_key = document.getElementById("setting-gemini-key").value;

    try {
      const res = await fetch("/api/store/settings", {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          name,
          currency,
          inside_city_fee,
          outside_city_fee,
          custom_prompt,
          fb_access_token,
          gemini_api_key
        })
      });
      const data = await res.json();
      if (res.ok) {
        currentStore = data.store;
        localStorage.setItem("fcommerce_store", JSON.stringify(currentStore));
        document.getElementById("header-store-name").innerText = currentStore.name;
        alert("✅ Gemini AI Training & Store Configuration saved successfully!");
      }
    } catch (err) {
      alert(`Error saving settings: ${err.message}`);
    }
  });

  // Add Product Modal Trigger
  document.getElementById("open-add-product-modal").addEventListener("click", () => {
    document.getElementById("add-product-modal").classList.remove("hidden");
  });

  document.getElementById("close-add-product-modal").addEventListener("click", () => {
    document.getElementById("add-product-modal").classList.add("hidden");
  });

  // Add Product Form Submission
  document.getElementById("add-product-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("prod-title").value;
    const price = document.getElementById("prod-price").value;
    const stock = document.getElementById("prod-stock").value;
    const image_url = document.getElementById("prod-image-url").value;
    const category = document.getElementById("prod-category").value;
    const variants = document.getElementById("prod-variants").value;
    const description = document.getElementById("prod-description").value;

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ title, price, stock, image_url, category, variants, description })
      });
      if (res.ok) {
        document.getElementById("add-product-modal").classList.add("hidden");
        document.getElementById("add-product-form").reset();
        loadProducts();
      }
    } catch (err) {
      alert(`Error adding product: ${err.message}`);
    }
  });

  // Order Filters
  document.querySelectorAll(".btn-filter").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-filter").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentOrderFilter = btn.getAttribute("data-filter");
      loadOrders();
    });
  });
}

// 2. Data Loaders
function loadDashboardData() {
  loadStoreSettings();
  loadProducts();
  loadOrders();
  loadConversations();
  loadChatMessages();
}

async function loadStoreSettings() {
  try {
    const res = await fetch("/api/store/settings", { headers: getHeaders() });
    const store = await res.json();
    currentStore = store;

    document.getElementById("setting-store-name").value = store.name || "";
    document.getElementById("setting-currency").value = store.currency || "BDT";
    document.getElementById("setting-inside-fee").value = store.inside_city_fee || 60;
    document.getElementById("setting-outside-fee").value = store.outside_city_fee || 120;
    document.getElementById("setting-prompt").value = store.custom_prompt || "";
    document.getElementById("setting-fb-token").value = store.fb_access_token || "";
    document.getElementById("setting-verify-token").value = store.verify_token || "";
    document.getElementById("setting-gemini-key").value = store.gemini_api_key || "";
  } catch (err) {
    console.error("Error loading store settings:", err);
  }
}

async function loadProducts() {
  try {
    const res = await fetch("/api/products", { headers: getHeaders() });
    const products = await res.json();

    document.getElementById("stat-products").innerText = products.length;
    const grid = document.getElementById("products-grid");
    grid.innerHTML = "";

    if (products.length === 0) {
      grid.innerHTML = `<div class="empty-state">No products in inventory. Click '+ Add New Product & Photo' to add one!</div>`;
      return;
    }

    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <button class="btn btn-sm btn-outline" style="position: absolute; top: 12px; right: 12px; color: #ef4444;" onclick="deleteProduct(${p.id})">Delete</button>
        ${p.image_url ? `<img src="${p.image_url}" alt="${p.title}" style="width:100%; height:160px; object-fit:cover; border-radius:8px; margin-bottom:12px;" onerror="this.style.display='none'">` : ''}
        <h3>${p.title}</h3>
        <div class="product-price">${currentStore.currency || 'BDT'} ${p.price.toFixed(2)}</div>
        <div class="product-desc">${p.description || 'No description provided.'}</div>
        <div style="font-size: 12px; color: var(--text-muted);">
          In Stock: <strong>${p.stock}</strong> | Category: <strong>${p.category || 'General'}</strong>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading products:", err);
  }
}

async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  try {
    await fetch(`/api/products/${id}`, { method: "DELETE", headers: getHeaders() });
    loadProducts();
  } catch (err) {
    console.error("Delete error:", err);
  }
}

async function loadOrders() {
  try {
    const filterQuery = currentOrderFilter !== "all" ? `?status=${currentOrderFilter}` : "";
    const res = await fetch(`/api/orders${filterQuery}`, { headers: getHeaders() });
    const orders = await res.json();

    let totalRevenue = 0;
    orders.forEach(o => { totalRevenue += o.total_amount; });
    document.getElementById("stat-revenue").innerText = `${currentStore.currency || 'BDT'} ${totalRevenue.toFixed(2)}`;
    document.getElementById("stat-orders").innerText = orders.length;
    document.getElementById("orders-badge-count").innerText = orders.length;

    const tbody = document.getElementById("orders-table-body");
    tbody.innerHTML = "";

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No orders captured yet. Test the AI simulator to generate orders!</td></tr>`;
      return;
    }

    orders.forEach(o => {
      const tr = document.createElement("tr");
      const itemsStr = Array.isArray(o.line_items) 
        ? o.line_items.map(i => `${i.title} (x${i.quantity})`).join(", ")
        : "Standard Product";

      tr.innerHTML = `
        <td><strong>#${o.id}</strong></td>
        <td>${o.customer_name}</td>
        <td>${o.phone_number}</td>
        <td>${o.full_address}</td>
        <td><span class="badge badge-warning">${o.city_zone || 'Standard'}</span></td>
        <td>${itemsStr}</td>
        <td><strong>${currentStore.currency || 'BDT'} ${o.total_amount.toFixed(2)}</strong></td>
        <td><span class="badge ${o.status === 'confirmed' ? 'badge-success' : 'badge-warning'}">${o.status.toUpperCase()}</span></td>
        <td>
          <select onchange="updateOrderStatus(${o.id}, this.value)" style="padding: 4px; font-size: 12px;">
            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading orders:", err);
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    await fetch(`/api/orders/${orderId}/status`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    loadOrders();
  } catch (err) {
    console.error("Status update error:", err);
  }
}

async function loadConversations() {
  try {
    const res = await fetch("/api/conversations", { headers: getHeaders() });
    const convs = await res.json();

    document.getElementById("stat-conversations").innerText = convs.length;
    const listEl = document.getElementById("conversations-list");
    listEl.innerHTML = "";

    // Always ensure sim_customer_101 is available
    if (!convs.find(c => c.psid === "sim_customer_101")) {
      convs.unshift({ psid: "sim_customer_101", is_ai_active: true });
    }

    convs.forEach(c => {
      const item = document.createElement("div");
      item.className = `conv-item ${c.psid === currentPsid ? 'active' : ''}`;
      item.onclick = () => selectConversation(c.psid, c.is_ai_active);
      item.innerHTML = `
        <div class="conv-psid">Customer: ${c.psid}</div>
        <div class="conv-status ${c.is_ai_active ? '' : 'human'}">
          ${c.is_ai_active ? '● AI Auto-Reply Active' : '👤 Human Takeover'}
        </div>
      `;
      listEl.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading conversations:", err);
  }
}

function selectConversation(psid, isAiActive) {
  currentPsid = psid;
  document.getElementById("current-chat-psid").innerText = `Customer: ${psid}`;
  updateChatHeader(isAiActive);
  loadConversations();
  loadChatMessages();
}

function updateChatHeader(isAiActive) {
  const statusEl = document.getElementById("current-chat-status");
  const btnEl = document.getElementById("toggle-ai-btn");
  if (isAiActive) {
    statusEl.innerText = "Status: AI Auto-Reply Active";
    statusEl.style.color = "var(--accent-green)";
    btnEl.innerText = "Pause AI (Human Mode)";
  } else {
    statusEl.innerText = "Status: Human Support Takeover";
    statusEl.style.color = "var(--accent-orange)";
    btnEl.innerText = "Enable AI Auto-Reply";
  }
}

async function loadChatMessages() {
  try {
    const res = await fetch(`/api/conversations/${currentPsid}/messages`, { headers: getHeaders() });
    const messages = await res.json();
    const container = document.getElementById("chat-messages");
    container.innerHTML = "";

    if (messages.length === 0) {
      container.innerHTML = `<div class="empty-state">No chat history yet. Type a message below to start simulating!</div>`;
      return;
    }

    messages.forEach(m => {
      appendMessageBubble(m.sender, m.text);
    });
  } catch (err) {
    console.error("Error loading messages:", err);
  }
}

function appendMessageBubble(sender, text) {
  const container = document.getElementById("chat-messages");
  const bubble = document.createElement("div");
  bubble.className = `message-bubble msg-${sender}`;
  bubble.innerText = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}
