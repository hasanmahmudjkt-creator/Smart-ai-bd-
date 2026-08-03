import dotenv from 'dotenv';
dotenv.config();

const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || "fcommerce_ai_secret_token_123";
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || "";

export class FacebookMessengerClient {
  constructor(accessToken = null) {
    this.accessToken = accessToken || FB_PAGE_ACCESS_TOKEN;
    this.apiUrl = "https://graph.facebook.com/v19.0/me/messages";
  }

  async getPageDetails(pageId = null, pageAccessToken = null) {
    const token = pageAccessToken || this.accessToken || process.env.FB_PAGE_ACCESS_TOKEN;
    if (!token || token.includes("mock_page_access_token") || token.trim() === "") {
      return null;
    }

    const targetId = pageId || "me";
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${targetId}?access_token=${token}&fields=name,id`);
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ Fetched Meta Page Details for ${data.id}: "${data.name}"`);
        return data;
      } else {
        const errText = await res.text();
        console.warn(`Could not fetch Meta page details (${res.status}):`, errText);
      }
    } catch (e) {
      console.error("Error fetching Page details from Meta:", e);
    }
    return null;
  }

  verifyWebhook(mode, token, challenge) {
    if (mode === "subscribe" && token === FB_VERIFY_TOKEN) {
      console.log("✅ Facebook Webhook verified successfully!");
      return challenge;
    }
    console.warn(`⚠️ Webhook verification failed. Received token: ${token}`);
    return null;
  }

  extractIncomingMessages(payload) {
    const messages = [];
    try {
      const entryList = payload.entry || [];
      for (const entry of entryList) {
        const pageId = entry.id;
        const messagingEvents = entry.messaging || [];
        for (const event of messagingEvents) {
          const senderId = event.sender?.id;
          const recipientId = event.recipient?.id;

          if (event.message && event.message.text) {
            messages.push({
              psid: senderId,
              pageId,
              recipientId,
              text: event.message.text,
              type: 'text'
            });
          } else if (event.postback && event.postback.payload) {
            messages.push({
              psid: senderId,
              pageId,
              recipientId,
              text: event.postback.payload,
              type: 'postback'
            });
          }
        }
      }
    } catch (err) {
      console.error("Error parsing Facebook webhook payload:", err);
    }
    return messages;
  }

  async sendTextMessage(psid, text, overrideToken = null) {
    const token = overrideToken || this.accessToken || process.env.FB_PAGE_ACCESS_TOKEN;

    if (!token || token.includes("mock_page_access_token") || token.trim() === "") {
      console.warn(`⚠️ Cannot send live Meta message: Page Access Token is missing or set to mock token! (PSID: ${psid})`);
      console.log(`[SIMULATED AI RESPONSE TO PSID ${psid}]:\n${text}`);
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}?access_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: psid },
          messaging_type: "RESPONSE",
          message: { text }
        })
      });

      if (response.ok) {
        console.log(`✅ Successfully sent live FB Messenger reply to PSID ${psid}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ Meta Graph API Error (${response.status}):`, errorText);
        return false;
      }
    } catch (err) {
      console.error("HTTP error sending FB message:", err);
      return false;
    }
  }
}

export const fbClient = new FacebookMessengerClient();
