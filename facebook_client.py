import os
import logging
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

FB_VERIFY_TOKEN = os.getenv("FB_VERIFY_TOKEN", "fcommerce_ai_secret_token_123")
FB_PAGE_ACCESS_TOKEN = os.getenv("FB_PAGE_ACCESS_TOKEN", "")

class FacebookMessengerClient:
    def __init__(self, page_access_token: str = None):
        self.access_token = page_access_token or FB_PAGE_ACCESS_TOKEN
        self.api_url = "https://graph.facebook.com/v19.0/me/messages"

    def verify_webhook(self, mode: str, token: str, challenge: str) -> str | None:
        """Verifies the webhook token sent by Meta during endpoint registration."""
        if mode == "subscribe" and token == FB_VERIFY_TOKEN:
            logger.info("Facebook Webhook verified successfully!")
            return challenge
        logger.warning(f"Webhook verification failed. Given token: {token}")
        return None

    def extract_incoming_messages(self, payload: dict) -> list[dict]:
        """Extracts sender PSID, Page ID, and text content from incoming Meta webhook payload."""
        messages = []
        try:
            entry_list = payload.get("entry", [])
            for entry in entry_list:
                page_id = entry.get("id")
                messaging_events = entry.get("messaging", [])
                for event in messaging_events:
                    sender_id = event.get("sender", {}).get("id")
                    recipient_id = event.get("recipient", {}).get("id")
                    
                    # Handle normal text message
                    if "message" in event and "text" in event["message"]:
                        text = event["message"]["text"]
                        messages.append({
                            "psid": sender_id,
                            "page_id": page_id,
                            "recipient_id": recipient_id,
                            "text": text,
                            "type": "text"
                        })
                    # Handle postback button clicks
                    elif "postback" in event and "payload" in event["postback"]:
                        payload_text = event["postback"]["payload"]
                        messages.append({
                            "psid": sender_id,
                            "page_id": page_id,
                            "recipient_id": recipient_id,
                            "text": payload_text,
                            "type": "postback"
                        })
        except Exception as e:
            logger.error(f"Error parsing Facebook webhook payload: {e}")
        return messages

    async def send_text_message(self, psid: str, text: str) -> bool:
        """Sends a text reply to a customer via Facebook Graph API."""
        if not self.access_token or self.access_token == "mock_page_access_token":
            logger.info(f"[TEST MODE - Mock FB Send] To PSID: {psid} | Message: {text}")
            return True

        params = {"access_token": self.access_token}
        payload = {
            "recipient": {"id": psid},
            "messaging_type": "RESPONSE",
            "message": {"text": text}
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.api_url, params=params, json=payload, timeout=10.0)
                if response.status_code == 200:
                    logger.info(f"Successfully sent FB message to PSID {psid}")
                    return True
                else:
                    logger.error(f"Failed to send FB message: {response.status_code} - {response.text}")
                    return False
            except Exception as e:
                logger.error(f"HTTP error sending FB message: {e}")
                return False
