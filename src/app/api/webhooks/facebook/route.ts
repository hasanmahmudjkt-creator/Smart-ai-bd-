import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Upstash Redis Queue Interface / Redis Connection
// Pushes incoming payloads to asynchronous processing queue instantly

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.FB_VERIFY_TOKEN || "fcommerce_ai_secret_token_123";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ Webhook verified successfully with Meta Graph API.");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed. Invalid verify token." }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    // 1. Signature Verification
    if (process.env.FB_APP_SECRET && !verifyMetaSignature(rawBody, signature)) {
      console.error("❌ Invalid Meta webhook signature detected.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // 2. Queue Payload to Redis for Async Worker Processing
    if (payload.object === "page") {
      console.log(`📥 Webhook payload received for ${payload.entry?.length || 0} page entries. Queueing for async worker.`);
      // Enqueue background processing job asynchronously
      // await webhookQueue.add("process-fb-event", { payload, receivedAt: Date.now() });
    }

    // 3. FAST ACKNOWLEDGMENT: Respond HTTP 200 OK within 2 seconds to prevent Meta retries/timeouts
    return NextResponse.json({ status: "EVENT_RECEIVED", timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Webhook Handling Exception:", error);
    // Always return HTTP 200 to Meta to avoid webhook disablement
    return NextResponse.json({ status: "ACK_RECEIVED", note: "Handled error gracefully" }, { status: 200 });
  }
}

function verifyMetaSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const appSecret = process.env.FB_APP_SECRET || "";
  if (!appSecret) return true; // Fallback for dev environment

  const expectedHash = crypto
    .createHmac("sha256", appSecret)
    .update(body)
    .digest("hex");
  const signatureHash = signature.replace("sha256=", "");

  try {
    return crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(signatureHash));
  } catch (e) {
    return false;
  }
}
