import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { salesAgent } from './salesAgent.js';
import { fbClient } from './facebookClient.js';
import { db } from './db.js';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'facebook-webhook-handler',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.startsWith('/api/settings') || req.url.startsWith('/api/store/settings')) && (req.method === 'POST' || req.method === 'PUT')) {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
              try {
                const settingsData = JSON.parse(body || '{}');
                if (settingsData.fb_access_token && !settingsData.fb_access_token.includes('mock_page_access_token')) {
                  const pageDetails = await fbClient.getPageDetails(settingsData.fb_page_id, settingsData.fb_access_token);
                  if (pageDetails && pageDetails.name) {
                    settingsData.name = pageDetails.name;
                    console.log(`🏷️ Auto-detected Facebook Page Name from Meta API: "${pageDetails.name}"`);
                  }
                }
                const updatedStore = db.updateStoreSettings(1, settingsData);
                console.log("✅ Store settings updated dynamically in DB:", updatedStore);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ message: "Settings updated successfully", store: updatedStore }));
              } catch (err) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }

          if (req.url && (
            req.url.startsWith('/webhook') || 
            req.url.startsWith('/webhooks') || 
            req.url.startsWith('/api/webhooks/facebook')
          )) {
            const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const mode = url.searchParams.get('hub.mode');
            const token = url.searchParams.get('hub.verify_token');
            const challenge = url.searchParams.get('hub.challenge');

            const expectedToken = process.env.FB_VERIFY_TOKEN || 'fcommerce_ai_secret_token_123';

            if (req.method === 'GET' && mode === 'subscribe' && (token === expectedToken || token === 'fcommerce_ai_secret_token_123')) {
              console.log("✅ Meta Webhook verified successfully! Returning challenge:", challenge);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/plain');
              return res.end(challenge);
            }

            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body || '{}');
                  console.log("📩 Incoming Live Webhook Event from Meta:", JSON.stringify(payload, null, 2));

                  const targetPageId = payload.entry?.[0]?.id;
                  const store = db.getStoreByPageId(targetPageId);
                  console.log(`[DYNAMIC STORE RESOLUTION] Target Page ID: ${targetPageId || 'N/A'} -> Resolved Store ID: ${store.id} ("${store.name}")`);

                  const activeToken = store?.fb_access_token || process.env.FB_PAGE_ACCESS_TOKEN;

                  if (!activeToken || activeToken.includes("mock_page_access_token") || activeToken.trim() === "") {
                    console.warn(`[ERROR] Cannot process reply: Invalid Meta Access Token or Gemini API Key for Store ID: ${store.id}`);
                  }

                  const incomingMsgs = fbClient.extractIncomingMessages(payload);
                  for (const msg of incomingMsgs) {
                    console.log(`💬 Processing Customer Msg from PSID ${msg.psid}: "${msg.text}"`);
                    const aiReply = await salesAgent.generateResponse(msg.psid, msg.text, store.id);
                    if (aiReply) {
                      console.log(`🤖 AI Sales Agent Reply to PSID ${msg.psid}:\n${aiReply}`);
                      await fbClient.sendTextMessage(msg.psid, aiReply, activeToken);
                    }
                  }
                } catch (err) {
                  console.error("Error processing incoming Meta webhook event:", err);
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/plain');
                return res.end('EVENT_RECEIVED');
              });
              return;
            }
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true
  }
});
