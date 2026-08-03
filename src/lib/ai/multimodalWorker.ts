// src/lib/ai/multimodalWorker.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const TRIGGER_WORDS = [
  "human",
  "manush",
  "মানুষ",
  "কথা বলতে চাই",
  "agent",
  "call me",
  "লাইভ সাপোর্ট",
  "কথা বলুন",
  "এডমিন",
  "admin"
];

export interface WebhookMessagePayload {
  senderPsid: string;
  pageId: string;
  messageText?: string;
  attachments?: Array<{ type: string; payload: { url: string } }>;
  isEcho?: boolean;
}

export class MultimodalFBWorker {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || "mock_gemini_key";
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Main Queue Item Processor
   */
  async processEvent(payload: WebhookMessagePayload, tenantContext: any) {
    const { senderPsid, messageText, attachments, isEcho } = payload;
    const { tenantId, accessToken, humanTakeoverUntil, smartRules, inventory } = tenantContext;

    // 1. Check Admin Manual Reply via Meta Business Suite (isEcho = true)
    if (isEcho) {
      await this.setHumanTakeoverLock(tenantId, senderPsid, 24, "Admin replied directly via Business Suite");
      return { reply: null, reason: "ADMIN_TAKEOVER_ACTIVATED" };
    }

    // 2. Check Active Human Takeover Lock
    if (humanTakeoverUntil && new Date(humanTakeoverUntil) > new Date()) {
      console.log(`🔒 [Silence Lock] Human takeover active until ${humanTakeoverUntil} for PSID ${senderPsid}. Issue NO automated response.`);
      return { reply: null, reason: "HUMAN_TAKEOVER_ACTIVE" };
    }

    // 3. Trigger Words Detection ("human", "manush", "কথা বলতে চাই", etc.)
    if (messageText && this.containsTriggerWord(messageText)) {
      await this.setHumanTakeoverLock(tenantId, senderPsid, 24, "Customer trigger word detected");
      const takeoverReply = "আমাদের একজন প্রতিনিধি শিগগিরই আপনার সাথে যোগাযোগ করবেন। অনুগ্রহ করে অপেক্ষা করুন।";
      await this.sendMetaReply(accessToken, senderPsid, takeoverReply);
      return { reply: takeoverReply, reason: "TRIGGER_WORD_HALT" };
    }

    // 4. Multimodal Processing Pipeline
    let aiResponseText: string | null = null;
    let confidenceScore = 0.95;

    try {
      if (attachments && attachments.length > 0) {
        const firstAtt = attachments[0];
        if (firstAtt.type === "audio") {
          // Voice Note (m4a/mp3/aac)
          aiResponseText = await this.processAudioVoiceNote(firstAtt.payload.url, smartRules);
        } else if (firstAtt.type === "image") {
          // Image: Payment Screenshot or Product Visual Match
          const imageResult = await this.processImageAttachment(firstAtt.payload.url, inventory, smartRules);
          aiResponseText = imageResult.replyText;
          if (imageResult.isPaymentScreenshot) {
            // Payment logged, notify merchant
            console.log(`💰 Payment Screenshot Logged. TrxID: ${imageResult.trxId}, Amount: ৳${imageResult.amount}`);
          }
        }
      } else if (messageText) {
        // Text Conversation with Gemini 1.5 Flash
        const result = await this.processTextInquiry(messageText, inventory, smartRules);
        aiResponseText = result.text;
        confidenceScore = result.confidence;
      }
    } catch (err) {
      console.error("Gemini 1.5 Flash Multimodal Inference Error:", err);
      confidenceScore = 0.40; // Force low confidence trigger on error
    }

    // 5. Low Confidence Auto-Halt (< 0.70)
    if (confidenceScore < 0.70) {
      console.warn(`⚠️ Low confidence score (${confidenceScore}). Triggering human takeover lock.`);
      await this.setHumanTakeoverLock(tenantId, senderPsid, 24, "AI confidence below 0.70 threshold");
      const fallbackReply = smartRules?.unclearRequestText || "আপনার মেসেজটি বুঝতে আমার একটু অসুবিধা হচ্ছে। আমাদের প্রতিনিধি আপনাকে সাহায্য করবেন।";
      await this.sendMetaReply(accessToken, senderPsid, fallbackReply);
      return { reply: fallbackReply, reason: "LOW_CONFIDENCE_TAKEOVER" };
    }

    // 6. Dispatch Response via Meta Graph API v19.0
    if (aiResponseText) {
      await this.sendMetaReply(accessToken, senderPsid, aiResponseText);
      return { reply: aiResponseText, reason: "SUCCESS" };
    }

    return { reply: null, reason: "NO_RESPONSE_GENERATED" };
  }

  private containsTriggerWord(text: string): boolean {
    const lower = text.toLowerCase();
    return TRIGGER_WORDS.some((word) => lower.includes(word.toLowerCase()));
  }

  private async setHumanTakeoverLock(tenantId: string, customerPsid: string, hours: number, reason: string) {
    const takeoverUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
    console.log(`🚨 Setting human_takeover_until = ${takeoverUntil.toISOString()} for PSID: ${customerPsid}. Reason: ${reason}`);
    // Prisma db.conversationThread.update({ ... })
  }

  // Audio Voice Note Handler (Bangla/Banglish Dialect Transcription)
  private async processAudioVoiceNote(audioUrl: string, smartRules: any): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const audioRes = await fetch(audioUrl);
    const audioBuffer = await audioRes.arrayBuffer();

    const prompt = `System Instruction: You are an expert Bangladeshi sales assistant. Transcribe this audio voice note (Bangla or Banglish dialect) and understand the customer's buying intent. Reply politely in natural Bangla. Rules: ${smartRules?.customPromptRules || ""}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "audio/mp3",
          data: Buffer.from(audioBuffer).toString("base64"),
        },
      },
    ]);

    return result.response.text() || smartRules?.unclearRequestText || "আপনার ভয়েস নোটটি বুঝতে পেরেছি। আপনাকে কিভাবে সাহায্য করতে পারি?";
  }

  // Image Handler (Payment OCR & Product Image Similarity)
  private async processImageAttachment(imageUrl: string, inventory: any[], smartRules: any) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const imgRes = await fetch(imageUrl);
    const imgBuffer = await imgRes.arrayBuffer();

    const prompt = `Analyze this image carefully.
1. Check if it is a payment transfer screenshot from bKash, Nagad, or Rocket. If yes, extract TrxID and Amount into JSON format: {"type": "PAYMENT", "trxId": "STR", "amount": NUM, "gateway": "BKASH|NAGAD|ROCKET"}.
2. If it is a product photo, match against catalog items and return JSON: {"type": "PRODUCT", "productDescription": "STR"}.

Catalog Items: ${JSON.stringify(inventory.map((i: any) => ({ sku: i.sku, title: i.title, price: i.discountPrice || i.basePrice, stock: i.stockQuantity })))}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: Buffer.from(imgBuffer).toString("base64"),
        },
      },
    ]);

    const rawText = result.response.text();
    let isPaymentScreenshot = false;
    let trxId = null;
    let amount = 0;
    let replyText = "আপনার ছবিটির জন্য ধন্যবাদ।";

    try {
      const jsonStart = rawText.indexOf("{");
      const jsonEnd = rawText.lastIndexOf("}") + 1;
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(rawText.substring(jsonStart, jsonEnd));
        if (parsed.type === "PAYMENT" && parsed.trxId) {
          isPaymentScreenshot = true;
          trxId = parsed.trxId;
          amount = parsed.amount || 0;
          replyText = smartRules?.paymentDetectedText || `পেমেন্ট স্ক্রিনশট রিসিভ হয়েছে (TrxID: ${trxId}, Amount: ৳${amount})। আমাদের টিম ভেরিফাই করে কনফার্ম করছে!`;
        } else if (parsed.type === "PRODUCT") {
          replyText = `আপনার পছন্দ করা প্রোডাক্টটি পাওয়া গেছে! দাম ও স্টক বিবরণ আমরা নিশ্চিত করছি।`;
        }
      }
    } catch (e) {
      replyText = rawText || smartRules?.paymentDetectedText || "ছবিটি পাওয়া গেছে। আমরা দ্রুত আপডেট দিচ্ছি!";
    }

    return { replyText, isPaymentScreenshot, trxId, amount };
  }

  // Text Inquiry Handler
  private async processTextInquiry(text: string, inventory: any[], smartRules: any) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const catalogContext = JSON.stringify(inventory.map((i: any) => ({ sku: i.sku, title: i.title, price: i.discountPrice || i.basePrice, stock: i.stockQuantity })));

    const systemPrompt = `You are Smart Messenger AI, an autonomous sales agent for a Bangladeshi merchant.
Tone: ${smartRules?.aiTone || "FRIENDLY"}.
Catalog: ${catalogContext}.
Delivery Fees: Inside Dhaka ৳70, Outside Dhaka ৳130.
Custom Rules: ${smartRules?.customPromptRules || ""}.

Instructions: Respond concisely in Bangla or Banglish. If customer asks to place an order, ask for their Name, Phone Number, and Full Delivery Address.`;

    const result = await model.generateContent([systemPrompt, text]);
    const responseText = result.response.text();

    return {
      text: responseText,
      confidence: 0.95,
    };
  }

  // Send Message via Meta Graph API v19.0
  private async sendMetaReply(accessToken: string, recipientPsid: string, text: string) {
    console.log(`📤 Sending Meta Graph API v19.0 reply to PSID ${recipientPsid}: "${text.substring(0, 60)}..."`);
    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientPsid },
        message: { text },
      }),
    });
  }
}
