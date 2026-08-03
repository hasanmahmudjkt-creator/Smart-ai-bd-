import React, { useState, useEffect } from 'react';
import { 
  Bot, ShoppingBag, Package, Truck, Sliders, Settings, 
  CreditCard, LogOut, CheckCircle2, AlertTriangle, ShieldCheck, 
  Download, Upload, Plus, PhoneCall, Zap, Lock, Mail, ArrowRight,
  MessageSquare, UserCheck, RefreshCw, Facebook, Layers, Sparkles,
  Sun, Moon
} from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('smart_messenger_auth') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [userEmail, setUserEmail] = useState('merchant@fashionhousebd.com');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Dark / Light Theme Toggle State
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} Mode!`);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  // Master System Toggle
  const [isSystemActive, setIsSystemActive] = useState(true);

  // Default Meta Settings & Training Rules
  const defaultMetaSettings = {
    pageName: "Posh People",
    webhookUrl: "https://smartmessenger.ai/api/webhooks/facebook",
    verifyToken: "fcommerce_ai_secret_token_123",
    pageId: "164682286725145",
    pageAccessToken: "EAAK...mock_page_access_token",
    appSecret: "3a9f8b2c...meta_app_secret",
    insideFee: 70,
    outsideFee: 130
  };

  const defaultRules = [
    { id: '1', ruleText: 'Always respond politely in natural Bangla or Banglish dialect.', active: true },
    { id: '2', ruleText: 'Ask customer for Full Name, Phone Number, and Delivery Address before confirming order.', active: true },
    { id: '3', ruleText: 'Never offer discounts higher than 10% on any item.', active: true },
    { id: '4', ruleText: 'If customer asks for delivery outside Dhaka, inform them delivery charge is ৳130 (Inside Dhaka is ৳70).', active: true },
  ];

  // Persistent Meta Credentials State (Fail-Safe)
  const [metaSettings, setMetaSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('smart_messenger_meta_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...defaultMetaSettings, ...parsed };
      }
    } catch (e) {
      console.error(e);
    }
    return defaultMetaSettings;
  });

  const saveMetaSettings = (newSettings) => {
    setMetaSettings(newSettings);
    try {
      localStorage.setItem('smart_messenger_meta_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error(e);
    }
  };

  // Persistent Bot Training Rules State (Fail-Safe)
  const [trainingRules, setTrainingRules] = useState(() => {
    try {
      const saved = localStorage.getItem('smart_messenger_training_rules');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return defaultRules;
  });

  const saveTrainingRules = (newRules) => {
    setTrainingRules(newRules);
    try {
      localStorage.setItem('smart_messenger_training_rules', JSON.stringify(newRules));
    } catch (e) {
      console.error(e);
    }
  };

  // Smart Rules & Bot Configuration State
  const [aiTone, setAiTone] = useState('FRIENDLY');
  const [maxDiscount, setMaxDiscount] = useState(10);
  const [paymentDetectedText, setPaymentDetectedText] = useState('পেমেন্ট ট্রানজেকশন রিসিভ হয়েছে। আমাদের টিম এটি ভেরিফাই করছে। ধন্যবাদ!');
  const [stockOutText, setStockOutText] = useState('দুঃখিত, এই প্রোডাক্টটি বর্তমানে স্টক আউট রয়েছে।');
  const [unclearRequestText, setUnclearRequestText] = useState('দুঃখিত, আপনার কথাটি বুঝতে পারিনি। বিস্তারিত বলবেন কি?');
  const [customPrompt, setCustomPrompt] = useState('Always respond politely in Bangla or Banglish. Confirm delivery district before creating an order.');

  // Inventory State
  const [inventory, setInventory] = useState([
    { id: '1', sku: 'TSHIRT-BLK-L', title: 'Premium Cotton T-Shirt Black', price: 650, discountPrice: 550, stock: 45, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300' },
    { id: '2', sku: 'DENIM-PANTS-32', title: 'Slim Fit Stretch Denim Pants', price: 1450, discountPrice: 1290, stock: 12, image: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=300' },
    { id: '3', sku: 'LEATHER-WALLET-01', title: 'Full Grain Genuine Leather Wallet', price: 950, discountPrice: 850, stock: 28, image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=300' },
  ]);

  const [newProduct, setNewProduct] = useState({ sku: '', title: '', price: '', discountPrice: '', stock: '' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Human Takeover Feed
  const [takeoverLogs, setTakeoverLogs] = useState([
    { id: '1', customer: 'Tanvir Hasan', psid: '88490219', reason: 'Trigger Word: "কথা বলতে চাই"', time: '12 mins ago' },
    { id: '2', customer: 'Nusrat Jahan', psid: '99120488', reason: 'Admin replied directly in Meta Business Suite', time: '45 mins ago' }
  ]);

  // Orders State
  const [orders] = useState([
    { id: 'ORD-9021', customerName: 'Rahim Uddin', phone: '01711002233', address: 'House 12, Road 5, Block C, Mirpur 10', district: 'Dhaka', items: '2x T-Shirt Black', amount: 1170, status: 'CONFIRMED', trxId: 'BK89234X' },
    { id: 'ORD-9022', customerName: 'Kamrul Hasan', phone: '01812998877', address: 'Station Road, Agrabad', district: 'Chittagong', items: '1x Denim Pants', amount: 1420, status: 'CONFIRMED', trxId: 'NG77210Y' },
    { id: 'ORD-9023', customerName: 'Salma Begum', phone: '01915667788', address: 'College Road, Zindabazar', district: 'Sylhet', items: '1x Leather Wallet', amount: 980, status: 'PAYMENT_UNVERIFIED', trxId: 'RK55120Z' },
  ]);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleLogin = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!userEmail) setUserEmail('merchant@fashionhousebd.com');
    setIsAuthenticated(true);
    try {
      localStorage.setItem('smart_messenger_auth', 'true');
    } catch (err) {}
    showToast('Logged in successfully as Merchant!');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('smart_messenger_auth');
    } catch (err) {}
    showToast('Logged out successfully.');
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProduct.title || !newProduct.price) return;
    setInventory([
      ...inventory,
      {
        id: Date.now().toString(),
        sku: newProduct.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        title: newProduct.title,
        price: Number(newProduct.price),
        discountPrice: newProduct.discountPrice ? Number(newProduct.discountPrice) : Number(newProduct.price),
        stock: Number(newProduct.stock) || 10,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'
      }
    ]);
    setNewProduct({ sku: '', title: '', price: '', discountPrice: '', stock: '' });
    setIsAddModalOpen(false);
    showToast('New Product added to AI Inventory!');
  };

  const exportCourierCSV = (courier) => {
    let csv = '';
    if (courier === 'STEADFAST') {
      csv = 'Invoice ID,Recipient Name,Recipient Phone,Recipient Address,Cod Amount,Note\n';
      orders.forEach(o => {
        csv += `${o.id},"${o.customerName}",${o.phone},"${o.address}, ${o.district}",${o.amount},"Call before delivery"\n`;
      });
    } else {
      csv = 'Item Type,Store Name,Merchant Order ID,Recipient Name,Recipient Phone,Recipient Address,Recipient City,Recipient Zone,Amount to Collect\n';
      orders.forEach(o => {
        csv += `Parcel,"Fashion House BD",${o.id},"${o.customerName}",${o.phone},"${o.address}",${o.district},Inside City,${o.amount}\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courier.toLowerCase()}_orders_export.csv`;
    a.click();
    showToast(`${courier} Courier CSV file downloaded!`);
  };

  // -------------------------------------------------------------
  // LOGIN SCREEN
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-950 text-slate-50' : 'bg-slate-100 text-slate-900'
      }`}>
        {/* Top-Right Theme Toggle Button */}
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all duration-300 shadow-xl font-bold text-xs cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-900/90 border-slate-800 text-amber-400 hover:border-slate-700'
                : 'bg-white/90 border-slate-200 text-indigo-600 hover:border-slate-300 shadow-md'
            }`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 fill-amber-400" /> Light Mode
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600" /> Dark Mode
              </>
            )}
          </button>
        </div>

        {/* Glowing Background Orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-gradient-to-br from-blue-600 via-indigo-600 to-fuchsia-600 rounded-2xl shadow-xl glow-fb">
              <Facebook className="w-10 h-10 text-white fill-white" />
            </div>
            <h1 className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Smart Messenger AI</h1>
            <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-sm`}>Autonomous Multimodal Facebook Page Sales Agent</p>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-xl border border-blue-500/30 p-8 rounded-2xl shadow-2xl space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Merchant Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="merchant@fashionhousebd.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group"
              >
                Sign In to Facebook Sales Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-xs font-semibold uppercase">Instant Demo</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Quick Demo Login Button */}
            <button
              type="button"
              onClick={(e) => handleLogin(e)}
              className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-700 text-emerald-400 font-extrabold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" /> One-Click Demo Login
            </button>

            <div className="p-4 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-center">
              <p className="text-xs text-indigo-300 font-medium">Don't have an active account?</p>
              <button 
                type="button"
                onClick={(e) => { handleLogin(e); setActiveTab('onboarding'); }}
                className="text-xs text-indigo-400 hover:underline font-bold mt-1 inline-block cursor-pointer"
              >
                Instant bKash Onboarding & Activation Panel →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN DASHBOARD LAYOUT
  // -------------------------------------------------------------
  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-50' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-semibold text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" /> {toastMessage}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`w-full md:w-64 border-r p-5 flex flex-col justify-between shrink-0 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="space-y-6">
          {/* Logo & Store Info */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg glow-fb">
              <Facebook className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h2 className={`font-extrabold text-sm tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Smart Messenger AI</h2>
              <p className="text-xs text-blue-600 font-extrabold truncate max-w-[140px]" title={metaSettings?.pageName || metaSettings?.name || "Posh People"}>
                {metaSettings?.pageName || metaSettings?.name || "Posh People"}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <SidebarItem id="overview" label="Overview" icon={<Bot className="w-4 h-4" />} active={activeTab} setActive={setActiveTab} theme={theme} />
            <SidebarItem id="inventory" label="Inventory Manager" icon={<Package className="w-4 h-4" />} active={activeTab} setActive={setActiveTab} theme={theme} />
            <SidebarItem id="orders" label="Orders & Courier CSV" icon={<Truck className="w-4 h-4" />} active={activeTab} setActive={setActiveTab} theme={theme} />
            <SidebarItem id="rules" label="Train Your Bot" icon={<Sliders className="w-4 h-4" />} active={activeTab} setActive={setActiveTab} theme={theme} />
            <SidebarItem id="settings" label="Settings & Integration" icon={<Settings className="w-4 h-4" />} active={activeTab} setActive={setActiveTab} theme={theme} />
            <SidebarItem id="onboarding" label="bKash Onboarding" icon={<CreditCard className="w-4 h-4" />} active={activeTab} setActive={setActiveTab} theme={theme} />
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className={`pt-6 border-t space-y-3 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`truncate max-w-[140px] font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{userEmail || 'merchant@store.com'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 border rounded-lg text-xs font-semibold transition-all ${
              theme === 'dark'
                ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
      }`}>
        {/* Top Header Bar */}
        <header className={`backdrop-blur-md border-b px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>FB Page Connection:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Connected (Meta Graph v19.0)
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Dark / Light Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all duration-300 shadow-md font-bold text-xs cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-amber-400'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-indigo-600 shadow-sm'
              }`}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-slate-200 font-semibold hidden sm:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                  <span className="text-slate-700 font-semibold hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>

            {/* Ultra-Attractive AI Master Toggle Button */}
            <button
              onClick={() => {
                setIsSystemActive(!isSystemActive);
                showToast(isSystemActive ? "AI Sales Agent Paused" : "AI Sales Agent Activated & Online!");
              }}
              className={`group relative flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all duration-300 shadow-xl cursor-pointer ${
                isSystemActive
                  ? 'bg-gradient-to-r from-emerald-950/90 via-slate-900 to-indigo-950/90 border-emerald-500/50 hover:border-emerald-400 glow-emerald'
                  : theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:border-amber-500/50' : 'bg-white border-slate-200 hover:border-amber-500/50 shadow-sm'
              }`}
            >
              {/* Pulsing Status Dot */}
              <span className="relative flex h-3 w-3">
                {isSystemActive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isSystemActive ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-500'}`}></span>
              </span>

              {/* Text Label */}
              <div className="text-left">
                <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 group-hover:text-slate-200 transition-colors">
                  Autonomous Agent
                </p>
                <p className={`text-xs font-black tracking-tight flex items-center gap-1.5 ${isSystemActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                  <Zap className={`w-3.5 h-3.5 ${isSystemActive ? 'fill-emerald-400 text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
                  {isSystemActive ? 'AI BOT ACTIVE & SELLING' : 'AI BOT PAUSED'}
                </p>
              </div>

              {/* Slider Toggle */}
              <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 ml-1 flex items-center ${isSystemActive ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${isSystemActive ? 'translate-x-5' : 'translate-x-0'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isSystemActive ? 'bg-emerald-600' : 'bg-slate-400'}`}></div>
                </div>
              </div>
            </button>
          </div>
        </header>

        {/* Tab Pages */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab 
              isSystemActive={isSystemActive} 
              takeoverLogs={takeoverLogs} 
              setTakeoverLogs={setTakeoverLogs}
              showToast={showToast}
              theme={theme}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab 
              inventory={inventory} 
              isAddModalOpen={isAddModalOpen}
              setIsAddModalOpen={setIsAddModalOpen}
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              handleAddProduct={handleAddProduct}
              showToast={showToast}
              theme={theme}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersTab 
              orders={orders} 
              exportCourierCSV={exportCourierCSV} 
              theme={theme}
            />
          )}

          {activeTab === 'rules' && (
            <SmartRulesTab 
              trainingRules={trainingRules}
              saveTrainingRules={saveTrainingRules}
              aiTone={aiTone} setAiTone={setAiTone}
              maxDiscount={maxDiscount} setMaxDiscount={setMaxDiscount}
              paymentDetectedText={paymentDetectedText} setPaymentDetectedText={setPaymentDetectedText}
              stockOutText={stockOutText} setStockOutText={setStockOutText}
              unclearRequestText={unclearRequestText} setUnclearRequestText={setUnclearRequestText}
              customPrompt={customPrompt} setCustomPrompt={setCustomPrompt}
              showToast={showToast}
              theme={theme}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab metaSettings={metaSettings} saveMetaSettings={saveMetaSettings} showToast={showToast} theme={theme} />
          )}

          {activeTab === 'onboarding' && (
            <OnboardingTab showToast={showToast} theme={theme} />
          )}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ id, label, icon, active, setActive, theme }) {
  const isSelected = active === id;
  return (
    <button
      onClick={() => setActive(id)}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
        isSelected
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-extrabold glow-fb'
          : theme === 'dark'
            ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// -------------------------------------------------------------
// TAB 1: OVERVIEW
// -------------------------------------------------------------
function OverviewTab({ isSystemActive, takeoverLogs, setTakeoverLogs, showToast, theme }) {
  const resumeAgent = (id) => {
    setTakeoverLogs(takeoverLogs.filter(l => l.id !== id));
    showToast('AI Agent resumed for this customer thread!');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className={`text-xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Dashboard Overview</h1>
        <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Real-time status of your autonomous Facebook Sales Agent</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard title="Today's Orders" value="28" subtitle="৳18,400 Total Sales" icon={<ShoppingBag className="w-5 h-5 text-blue-500" />} theme={theme} />
        <MetricCard title="Pending Payment Reviews" value="5" subtitle="bKash/Nagad TrxIDs" icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} theme={theme} />
        <MetricCard title="Active Threads" value="142" subtitle="Messenger Inquiry" icon={<MessageSquare className="w-5 h-5 text-sky-500" />} theme={theme} />
        <MetricCard title="Subscription Countdown" value="24 Days" subtitle="Expires Aug 22, 2026" icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />} theme={theme} />
      </div>

      {/* Feed & WhatsApp Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`border rounded-2xl p-5 space-y-4 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`flex justify-between items-center pb-3 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              <ShieldCheck className="w-4 h-4 text-amber-500" /> Active Human Takeover Locks (Silence Feeds)
            </h3>
            <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{takeoverLogs.length} Threads Locked</span>
          </div>

          {takeoverLogs.length === 0 ? (
            <p className={`text-xs py-6 text-center ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>No active silence locks. AI is handling all incoming conversations.</p>
          ) : (
            <div className="space-y-3">
              {takeoverLogs.map((log) => (
                <div key={log.id} className={`p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{log.customer} <span className={`font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>(PSID: {log.psid})</span></p>
                    <p className="text-xs text-amber-500 font-bold mt-0.5">{log.reason}</p>
                    <span className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>{log.time}</span>
                  </div>
                  <button
                    onClick={() => resumeAgent(log.id)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-sm transition-all shrink-0"
                  >
                    Resume AI Agent
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WhatsApp Support Box */}
        <div className={`border rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xl ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-950 border-emerald-500/40'
            : 'bg-gradient-to-br from-emerald-50 via-white to-slate-50 border-emerald-300'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
                <PhoneCall className="w-5 h-5 animate-pulse" />
              </span>
              <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-sm">
                24/7 LIVE SUPPORT
              </span>
            </div>
            <h3 className={`text-base font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Direct WhatsApp Support</h3>
            <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">+880 1718-823531</p>
            <p className={`text-xs mt-2 leading-relaxed font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              Need assistance with Facebook Page connection, bKash TrxID verification, or Steadfast/Pathao export setup?
            </p>
          </div>
          <a
            href="https://wa.me/8801718823531"
            target="_blank"
            rel="noreferrer"
            className="w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            <PhoneCall className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Chat on WhatsApp (+8801718823531)
          </a>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, theme }) {
  return (
    <div className={`border rounded-2xl p-5 space-y-3 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div className={`flex justify-between items-center ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
        <span className="text-xs font-bold">{title}</span>
        {icon}
      </div>
      <div>
        <div className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{value}</div>
        <p className={`text-[11px] mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600 font-semibold'}`}>{subtitle}</p>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// TAB 2: INVENTORY MANAGER
// -------------------------------------------------------------
function InventoryTab({ inventory, isAddModalOpen, setIsAddModalOpen, newProduct, setNewProduct, handleAddProduct, showToast, theme }) {
  return (
    <div className="space-y-6">
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <h1 className={`text-lg font-extrabold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <Package className="w-5 h-5 text-blue-600" /> Inventory Manager
          </h1>
          <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Manage catalog items used by Gemini 1.5 Flash for product sales</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => showToast('Sample CSV Imported! 15 items updated.')}
            className={`px-3 py-2 border text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              theme === 'dark'
                ? 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> 1-Click CSV Import
          </button>
          <button 
            onClick={() => showToast('Inventory CSV Downloaded!')}
            className={`px-3 py-2 border text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              theme === 'dark'
                ? 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Export Catalog
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-50' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className={`text-base font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Add New Product to Inventory</h3>
            <form onSubmit={handleAddProduct} className="space-y-3">
              <input
                placeholder="SKU (e.g. SHIRT-RED-M)"
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                className={`w-full border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-blue-500 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500'
                }`}
              />
              <input
                required
                placeholder="Product Title *"
                value={newProduct.title}
                onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                className={`w-full border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-blue-500 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500'
                }`}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="number"
                  placeholder="Base Price (৳) *"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-blue-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500'
                  }`}
                />
                <input
                  type="number"
                  placeholder="Offer Price (৳)"
                  value={newProduct.discountPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, discountPrice: e.target.value })}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-blue-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500'
                  }`}
                />
              </div>
              <input
                type="number"
                placeholder="Stock Quantity"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                className={`w-full border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-blue-500 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500'
                }`}
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`w-1/2 py-2 border text-xs font-bold rounded-xl ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-blue-600 text-white text-xs font-extrabold rounded-xl hover:bg-blue-500 shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {inventory.map((item) => (
          <div key={item.id} className={`border rounded-2xl overflow-hidden flex flex-col justify-between transition-colors duration-300 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
          }`}>
            <div className={`h-40 overflow-hidden relative ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'}`}>
              <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
              <span className="absolute top-3 left-3 bg-slate-900/90 text-blue-400 border border-blue-500/40 font-mono text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                {item.sku}
              </span>
            </div>
            <div className="p-4 space-y-2">
              <h3 className={`text-xs font-bold line-clamp-1 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{item.title}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">৳{item.discountPrice}</span>
                {item.price > item.discountPrice && (
                  <span className={`text-xs line-through ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>৳{item.price}</span>
                )}
              </div>
              <div className="flex justify-between items-center pt-2 text-xs">
                <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                  item.stock > 15 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 dark:border dark:border-emerald-800' 
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 dark:border dark:border-amber-800'
                }`}>
                  {item.stock} in stock
                </span>
                <button className={`font-bold ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Edit</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// TAB 3: ORDERS & COURIER EXPORT
// -------------------------------------------------------------
function OrdersTab({ orders, exportCourierCSV, theme }) {
  return (
    <div className="space-y-6">
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <h1 className={`text-lg font-extrabold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <Truck className="w-5 h-5 text-blue-600" /> Orders & Courier Software Export
          </h1>
          <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Download order files formatted for Bangladeshi courier portals</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportCourierCSV('STEADFAST')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Steadfast CSV
          </button>
          <button
            onClick={() => exportCourierCSV('PATHAO')}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Pathao CSV
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className={`border rounded-2xl overflow-hidden transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <table className="w-full text-left text-xs">
          <thead className={`border-b ${theme === 'dark' ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200 font-bold'}`}>
            <tr>
              <th className="p-4">Order ID</th>
              <th className="p-4">Customer Details</th>
              <th className="p-4">Address</th>
              <th className="p-4">Items</th>
              <th className="p-4">Amount</th>
              <th className="p-4">TrxID / Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-200'}`}>
            {orders.map((o) => (
              <tr key={o.id} className={theme === 'dark' ? 'hover:bg-slate-950/50' : 'hover:bg-slate-50'}>
                <td className="p-4 font-mono font-extrabold text-blue-600">{o.id}</td>
                <td className="p-4">
                  <p className={`font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{o.customerName}</p>
                  <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-medium'}>{o.phone}</p>
                </td>
                <td className={`p-4 max-w-[200px] truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>{o.address}, {o.district}</td>
                <td className={`p-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>{o.items}</td>
                <td className="p-4 font-black text-emerald-600 dark:text-emerald-400">৳{o.amount}</td>
                <td className="p-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    o.status === 'CONFIRMED' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 dark:border dark:border-emerald-800' 
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 dark:border dark:border-amber-800'
                  }`}>
                    {o.status} ({o.trxId})
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// TAB 4: HOW TO TRAIN YOUR BOT (RULES)
// -------------------------------------------------------------
function SmartRulesTab({ trainingRules, saveTrainingRules, aiTone, setAiTone, maxDiscount, setMaxDiscount, paymentDetectedText, setPaymentDetectedText, stockOutText, setStockOutText, unclearRequestText, setUnclearRequestText, customPrompt, setCustomPrompt, showToast, theme }) {
  const rulesList = Array.isArray(trainingRules) ? trainingRules : [];
  const [newRuleInput, setNewRuleInput] = useState('');

  const handleAddRule = (e) => {
    e?.preventDefault();
    if (!newRuleInput.trim()) return;
    const updated = [
      ...rulesList,
      {
        id: Date.now().toString(),
        ruleText: newRuleInput.trim(),
        active: true
      }
    ];
    saveTrainingRules(updated);
    setNewRuleInput('');
    showToast('New Bot Training Rule added permanently!');
  };

  const handleDeleteRule = (id) => {
    const updated = rulesList.filter(r => r.id !== id);
    saveTrainingRules(updated);
    showToast('Rule removed from Bot training!');
  };

  const handleToggleRule = (id) => {
    const updated = rulesList.map(r => r.id === id ? { ...r, active: !r.active } : r);
    saveTrainingRules(updated);
  };

  return (
    <div className="space-y-6">
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <h1 className={`text-lg font-extrabold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <Sliders className="w-5 h-5 text-blue-600" /> How Do You Want to Train Your Bot?
          </h1>
          <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Add custom training rules, set discount caps, tone, and fallback templates for your sales bot</p>
        </div>
        <button
          onClick={() => showToast('Bot Training Rules Saved Successfully!')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> Save Bot Training Rules
        </button>
      </div>

      {/* DYNAMIC CUSTOM TRAINING RULES SECTION */}
      <div className={`border rounded-2xl p-5 space-y-4 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className={`flex justify-between items-center pb-2 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <Sparkles className="w-4 h-4 text-amber-500" /> Active Bot Training Rules ({trainingRules.length})
          </h3>
          <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Rules applied in real-time to Facebook sales bot</span>
        </div>

        {/* Add New Rule Form */}
        <form onSubmit={handleAddRule} className="flex gap-2">
          <input
            required
            placeholder="Type a new training rule (e.g. 'Offer free delivery on orders above ৳2000')..."
            value={newRuleInput}
            onChange={(e) => setNewRuleInput(e.target.value)}
            className={`flex-1 border rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-blue-500 ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500'
            }`}
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Custom Rule
          </button>
        </form>

        {/* Rule List Cards */}
        <div className="space-y-2.5 pt-2">
          {rulesList.map((rule, idx) => (
            <div
              key={rule.id}
              className={`p-3.5 rounded-xl border flex justify-between items-center gap-3 transition-all ${
                rule.active
                  ? theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900 font-bold shadow-xs'
                  : theme === 'dark' ? 'bg-slate-950/40 border-slate-800/40 text-slate-500 line-through' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full border text-blue-600 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-xs'
                }`}>
                  #{idx + 1}
                </span>
                <p className="text-xs font-semibold">{rule.ruleText}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleRule(rule.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    rule.active
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                      : 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800'
                  }`}
                >
                  {rule.active ? 'ACTIVE' : 'DISABLED'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRule(rule.id)}
                  className={`p-1.5 rounded-lg transition-all ${
                    theme === 'dark' ? 'hover:bg-red-950/80 text-slate-500 hover:text-red-400' : 'hover:bg-red-100 text-slate-600 hover:text-red-600'
                  }`}
                  title="Remove Rule"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Persona Tuning */}
        <div className={`border rounded-2xl p-5 space-y-4 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
            <Bot className="w-4 h-4 text-blue-600" /> Bot Tone & Discount Controls
          </h3>
          <div>
            <label className={`text-xs font-bold block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>Conversational Tone</label>
            <select
              value={aiTone}
              onChange={(e) => setAiTone(e.target.value)}
              className={`w-full border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500 ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <option value="FRIENDLY">Friendly (আলাপচারী ও আন্তরিক)</option>
              <option value="PROFESSIONAL">Professional (পেশাদার ও সংক্ষিপ্ত)</option>
              <option value="DIRECT">Direct (সরাসরি অর্ডার ফোকাসড)</option>
            </select>
          </div>

          <div>
            <label className={`text-xs font-bold block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>Max Discount Cap (%)</label>
            <input
              type="number"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(Number(e.target.value))}
              className={`w-full border rounded-xl px-3 py-2 text-xs font-bold ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`text-xs font-bold block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>Master Prompt Instruction Override</label>
            <textarea
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className={`w-full border rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-blue-500 ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>
        </div>

        {/* Fallback Templates */}
        <div className={`border rounded-2xl p-5 space-y-4 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
            <MessageSquare className="w-4 h-4 text-emerald-600" /> Automated Fallback Templates
          </h3>
          <div>
            <label className={`text-xs font-bold block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>Payment Screenshot Reply Template</label>
            <textarea
              rows={2}
              value={paymentDetectedText}
              onChange={(e) => setPaymentDetectedText(e.target.value)}
              className={`w-full border rounded-xl p-3 text-xs font-medium ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`text-xs font-bold block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>Stock Out Notification Template</label>
            <textarea
              rows={2}
              value={stockOutText}
              onChange={(e) => setStockOutText(e.target.value)}
              className={`w-full border rounded-xl p-3 text-xs font-medium ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`text-xs font-bold block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>Unclear Request Fallback Template</label>
            <textarea
              rows={2}
              value={unclearRequestText}
              onChange={(e) => setUnclearRequestText(e.target.value)}
              className={`w-full border rounded-xl p-3 text-xs font-medium ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// TAB 5: SETTINGS & INTEGRATION
// -------------------------------------------------------------
function SettingsTab({ metaSettings, saveMetaSettings, showToast, theme }) {
  const safeMeta = metaSettings || {
    webhookUrl: "https://smartmessenger.ai/api/webhooks/facebook",
    verifyToken: "fcommerce_ai_secret_token_123",
    pageId: "109823471092",
    pageAccessToken: "EAAK...mock_page_access_token",
    appSecret: "3a9f8b2c...meta_app_secret",
    insideFee: 70,
    outsideFee: 130
  };

  const [webhookUrl, setWebhookUrl] = useState(safeMeta.webhookUrl || "");
  const [verifyToken, setVerifyToken] = useState(safeMeta.verifyToken || "");
  const [pageId, setPageId] = useState(safeMeta.pageId || "");
  const [pageAccessToken, setPageAccessToken] = useState(safeMeta.pageAccessToken || "");
  const [appSecret, setAppSecret] = useState(safeMeta.appSecret || "");
  const [insideFee, setInsideFee] = useState(safeMeta.insideFee ?? 70);
  const [outsideFee, setOutsideFee] = useState(safeMeta.outsideFee ?? 130);

  const handleSaveWebhook = async (e) => {
    e?.preventDefault();
    const updated = {
      ...metaSettings,
      webhookUrl,
      verifyToken,
      pageId,
      pageAccessToken,
      appSecret
    };
    saveMetaSettings(updated);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fb_page_id: pageId,
          fb_access_token: pageAccessToken,
          verify_token: verifyToken,
          inside_city_fee: insideFee,
          outside_city_fee: outsideFee
        })
      });
      const data = await res.json();
      if (data?.store?.name) {
        saveMetaSettings({
          ...updated,
          pageName: data.store.name
        });
        showToast(`Connected to Facebook Page: "${data.store.name}"!`);
        return;
      }
    } catch (err) {
      console.error("Backend settings sync exception:", err);
    }

    showToast("Facebook Webhook & Access Token Synced to DB Permanently!");
  };

  const handleSaveDelivery = async (e) => {
    e?.preventDefault();
    const updated = {
      ...metaSettings,
      insideFee,
      outsideFee
    };
    saveMetaSettings(updated);

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inside_city_fee: insideFee,
          outside_city_fee: outsideFee
        })
      });
    } catch (err) {
      console.error("Backend delivery fee sync exception:", err);
    }

    showToast("Delivery Charges Synced to DB Permanently!");
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    showToast("Webhook Callback URL copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <h1 className={`text-lg font-extrabold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <Settings className="w-5 h-5 text-blue-600" /> Settings & Facebook Webhook Integration
          </h1>
          <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Meta Graph API v19.0 configuration & delivery rules</p>
        </div>

        <button
          onClick={handleSaveWebhook}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> Save Webhook & Settings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Webhook & Meta API Credentials Panel */}
        <div className={`border rounded-2xl p-5 space-y-4 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`flex justify-between items-center pb-2 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
            <h3 className={`text-sm font-extrabold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <Facebook className="w-4 h-4 text-blue-600" /> Meta Webhook & Page API Credentials
            </h3>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 dark:border dark:border-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
              v19.0 Connected
            </span>
          </div>

          <form onSubmit={handleSaveWebhook} className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className={`font-extrabold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>Webhook Callback URL</label>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="text-[10px] text-blue-600 hover:underline font-extrabold"
                >
                  Copy URL
                </button>
              </div>
              <input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-blue-500 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-slate-50 border-slate-300 text-emerald-700'
                }`}
              />
            </div>

            <div>
              <label className={`font-extrabold block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>Webhook Verify Token (`hub.verify_token`)</label>
              <input
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-blue-500 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-blue-400' : 'bg-slate-50 border-slate-300 text-blue-700'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`font-extrabold block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>Facebook Page ID</label>
                <input
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-blue-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className={`font-extrabold block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>Meta App Secret</label>
                <input
                  type="password"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-blue-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`font-extrabold block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>Page Access Token</label>
              <textarea
                rows={2}
                value={pageAccessToken}
                onChange={(e) => setPageAccessToken(e.target.value)}
                className={`w-full border rounded-xl p-2.5 text-xs font-mono font-medium focus:outline-none focus:border-blue-500 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Webhook & Meta Settings
            </button>
          </form>
        </div>

        {/* Delivery & Store Rules Panel */}
        <div className={`border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-colors duration-300 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="space-y-4">
            <h3 className={`text-sm font-extrabold border-b pb-2 ${theme === 'dark' ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'}`}>Default Delivery Charges (BDT)</h3>
            <form onSubmit={handleSaveDelivery} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-xs block mb-1 font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>Inside Dhaka (৳)</label>
                  <input
                    type="number"
                    value={insideFee}
                    onChange={(e) => setInsideFee(Number(e.target.value))}
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-black ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs block mb-1 font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>Outside Dhaka (৳)</label>
                  <input
                    type="number"
                    value={outsideFee}
                    onChange={(e) => setOutsideFee(Number(e.target.value))}
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-black ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md"
              >
                Save Delivery Fees
              </button>
            </form>
          </div>

          <div className={`p-4 border rounded-xl space-y-2 text-xs ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <p className={`font-extrabold flex items-center gap-1.5 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Quick Setup Summary
            </p>
            <p className="leading-relaxed font-medium">
              When configuring Meta Developer Portal, paste the Callback URL & Verify Token above into your App Dashboard under <strong>Messenger → Webhooks</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* STEP-BY-STEP META INTEGRATION TUTORIAL GUIDE */}
      <div className={`border rounded-2xl p-6 space-y-6 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4 ${
          theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div>
            <h2 className={`text-base font-black flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <Sparkles className="w-5 h-5 text-amber-500" /> Facebook & Meta Integration Tutorial (ধাপ-বাই-ধাপ নির্দেশিকা)
            </h2>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Follow these 3 simple steps to find your Facebook Page ID, Access Token, App Secret & Webhooks</p>
          </div>
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-md"
          >
            <Facebook className="w-4 h-4 fill-white" /> Open Meta Developer Portal
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* STEP 1 */}
          <div className={`border rounded-xl p-5 space-y-3 relative ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="absolute -top-3 left-4 bg-blue-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-md">
              STEP 1
            </span>
            <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 pt-1">Find Your Facebook Page ID</h3>
            <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>ফেইসবুক পেইজ আইডি সংগ্রহ করা:</p>
            <ol className={`text-xs space-y-1.5 list-decimal pl-4 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
              <li>Open your Facebook Page in browser.</li>
              <li>Go to <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>About (সম্পর্কে)</strong> tab.</li>
              <li>Scroll to <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>Page Transparency</strong>.</li>
              <li>Copy the numeric <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Page ID</strong>.</li>
              <li>Paste it into the <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>Facebook Page ID</strong> field above.</li>
            </ol>
          </div>

          {/* STEP 2 */}
          <div className={`border rounded-xl p-5 space-y-3 relative ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="absolute -top-3 left-4 bg-blue-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-md">
              STEP 2
            </span>
            <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 pt-1">Get Page Token & App Secret</h3>
            <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>এক্সেস টোকেন ও সিক্রেট পাওয়া:</p>
            <ol className={`text-xs space-y-1.5 list-decimal pl-4 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
              <li>Go to <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">developers.facebook.com</a>.</li>
              <li>Select your App → Go to <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>Messenger → Settings</strong>.</li>
              <li>Under <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>Token Generation</strong>, select your Page & click <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>Generate Token</strong>.</li>
              <li>Copy token to <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>Page Access Token</strong> above.</li>
              <li>Go to <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>App Settings → Basic</strong> to copy <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>App Secret</strong>.</li>
            </ol>
          </div>

          {/* STEP 3 */}
          <div className={`border rounded-xl p-5 space-y-3 relative ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="absolute -top-3 left-4 bg-emerald-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-md">
              STEP 3
            </span>
            <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 pt-1">Set Up Webhook Subscriptions</h3>
            <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>ওয়েবহুক ব্যাকগ্রাউন্ড জব কানেক্ট করা:</p>
            <ol className={`text-xs space-y-1.5 list-decimal pl-4 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
              <li>In Meta Developer Portal, click <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>Messenger → Webhooks</strong>.</li>
              <li>Click <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>Add Callback URL</strong>.</li>
              <li>Paste your <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Callback URL</strong> & <strong className="text-blue-600 font-mono font-bold">Verify Token</strong>.</li>
              <li>Click <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>Verify and Save</strong>.</li>
              <li>Subscribe to <strong className="font-mono font-bold">messages</strong> & <strong className="font-mono font-bold">messaging_postbacks</strong>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// TAB 6: BKASH ONBOARDING
// -------------------------------------------------------------
function OnboardingTab({ showToast, theme }) {
  const [trxId, setTrxId] = useState('');
  const [isActivated, setIsActivated] = useState(false);

  const handleActivate = (e) => {
    e.preventDefault();
    setIsActivated(true);
    showToast('Account activated for 30 days!');
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className={`border rounded-2xl p-6 space-y-6 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="text-center space-y-1">
          <h2 className={`text-lg font-extrabold flex items-center justify-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <CreditCard className="w-5 h-5 text-blue-600" /> Instant bKash Account Activation
          </h2>
          <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Zero-friction SaaS subscription onboarding for merchants</p>
        </div>

        {!isActivated ? (
          <form onSubmit={handleActivate} className="space-y-4">
            <div className={`p-4 border rounded-xl text-center space-y-1 ${
              theme === 'dark' ? 'bg-indigo-950/40 border-indigo-800/40' : 'bg-blue-50 border-blue-200'
            }`}>
              <p className="text-xs text-blue-600 font-bold">bKash Send Money / Payment Number</p>
              <p className="text-base font-mono font-black text-emerald-600 dark:text-emerald-400">01700-123456 (৳1,500 / Month)</p>
            </div>

            <div>
              <label className={`text-xs font-extrabold block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>Enter Payment TrxID</label>
              <input
                required
                placeholder="e.g. BK89234X"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2.5 text-xs font-mono font-bold focus:outline-none focus:border-blue-500 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all">
              Verify TrxID & Activate (30 Days Access)
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="inline-flex p-3 bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 rounded-full text-emerald-600 dark:text-emerald-400 shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className={`text-base font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Subscription Active! Valid for 30 Days.</h3>
            <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-md">
              <Facebook className="w-4 h-4 fill-white" /> Connect FB Page with OAuth SDK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
