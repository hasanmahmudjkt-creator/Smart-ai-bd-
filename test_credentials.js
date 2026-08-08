import { db } from './db.js';

async function testGroqKey(apiKey) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 5
      })
    });
    return { valid: res.ok, status: res.status };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

async function testGeminiKey(apiKey) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    return { valid: res.ok, status: res.status };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

async function testMetaToken(accessToken, pageId) {
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=name,id&access_token=${accessToken}`);
    return { valid: res.ok, status: res.status };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

async function validateAllCredentials() {
  console.log('='.repeat(70));
  console.log('🔴 TEST 3: CREDENTIAL VALIDATION (GROQ, GEMINI, META)');
  console.log('='.repeat(70));

  const stores = db.data.stores;

  for (const store of stores) {
    console.log(`\n🔍 Validating credentials for: "${store.name}" (ID: ${store.id})`);

    // 1. Groq
    if (store.groq_api_key && store.groq_api_key !== "YOUR_GROQ_API_KEY_HERE") {
      const gRes = await testGroqKey(store.groq_api_key);
      console.log(`  - Groq API Key: ${gRes.valid ? '✅ VALID' : '⚠️ (' + (gRes.status || gRes.error) + ')'}`);
    } else {
      console.log('  - Groq API Key: ⚠️ NOT SET (Optional)');
    }

    // 2. Gemini
    const geminiKey = store.gemini_api_key || process.env.GEMINI_API_KEY;
    if (geminiKey && !geminiKey.includes("TEST_GEMINI_KEY") && geminiKey !== "your_gemini_api_key_here") {
      const gemRes = await testGeminiKey(geminiKey);
      console.log(`  - Gemini API Key: ${gemRes.valid ? '✅ VALID (200 OK)' : '⚠️ (' + (gemRes.status || gemRes.error) + ')'}`);
    } else {
      console.log('  - Gemini API Key: ⚠️ NOT SET');
    }

    // 3. Meta Access Token & Page ID
    if (store.fb_access_token && store.fb_page_id && !store.fb_access_token.includes('mock_page_access_token')) {
      const metaRes = await testMetaToken(store.fb_access_token, store.fb_page_id);
      console.log(`  - Meta Access Token: ${metaRes.valid ? '✅ VALID' : '⚠️ (' + (metaRes.status || metaRes.error) + ')'}`);
    } else {
      console.log('  - Meta Access Token: ℹ️ Configured in Settings');
    }
  }

  console.log('\n' + '='.repeat(70));
}

validateAllCredentials();
