import os
import json
import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from models import Store, Product, Conversation, Message, Order

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# System Prompt Template for F-Commerce Sales Specialist
SYSTEM_PROMPT_TEMPLATE = """
You are an expert F-Commerce (Facebook Commerce) Sales Assistant for {store_name}.
Your job is to be extremely polite, friendly, helpful, and focused on converting customer inquiries into completed orders.

STORE DETAILS & POLICIES:
- Store Name: {store_name}
- Currency: {currency}
- Inside City Delivery Charge: {currency} {inside_city_fee}
- Outside City Delivery Charge: {currency} {outside_city_fee}
- Payment Methods: Cash on Delivery (COD), Mobile Banking (bKash / Nagad)

OUR PRODUCTS CATALOG:
{product_catalog_str}

YOUR RESPONSIBILITIES & SALES FLOW:
1. Greet the customer warmly and answer their questions about products, availability, specifications, or pricing clearly.
2. Recommend relevant products matching their interest if requested or if they seem undecided.
3. When the customer shows interest in buying, proactively guide them to place an order by asking for:
   - Full Name
   - Phone Number
   - Complete Shipping Address (City, Area, Road/House number)
   - Selected Product Title, Variant (Size/Color if applicable), and Quantity
4. Once ALL required order details (Name, Phone, Address, Product) are provided, ALWAYS run the `create_order` tool to record their purchase!
5. If the customer requests a human agent or has an unresolvable complaint, invoke `handoff_to_human`.

STRICT RULES:
- Never make up fake products or prices not listed in the store catalog.
- Keep responses concise and formatted cleanly for mobile Messenger screens (short paragraphs, clear bullet points).
- If information is missing to place an order, politely ask for the missing field.
"""

class FCommerceSalesAgent:
    def __init__(self, db: Session, store_id: int):
        self.db = db
        self.store = db.query(Store).filter(Store.id == store_id).first()
        if not self.store:
            # Create default store if missing
            self.store = Store(
                name=os.getenv("DEFAULT_STORE_NAME", "F-Commerce Store"),
                inside_city_fee=float(os.getenv("DEFAULT_INSIDE_CITY_FEE", "60.0")),
                outside_city_fee=float(os.getenv("DEFAULT_OUTSIDE_CITY_FEE", "120.0")),
                currency=os.getenv("DEFAULT_CURRENCY", "BDT")
            )
            db.add(self.store)
            db.commit()
            db.refresh(self.store)

    def _get_product_catalog_str(self) -> str:
        products = self.db.query(Product).filter(Product.store_id == self.store.id).all()
        if not products:
            return "No products currently listed in store."
        
        catalog = []
        for p in products:
            variants = f" | Variants: {p.variants}" if p.variants else ""
            catalog.append(
                f"- ID #{p.id}: {p.title} | Price: {self.store.currency} {p.price} | Stock: {p.stock}{variants} | Description: {p.description or 'N/A'}"
            )
        return "\n".join(catalog)

    def search_products(self, query: str) -> List[Dict[str, Any]]:
        """Search products in database matching title, category or description."""
        query_str = f"%{query}%"
        products = self.db.query(Product).filter(
            Product.store_id == self.store.id,
            (Product.title.ilike(query_str)) | 
            (Product.description.ilike(query_str)) | 
            (Product.category.ilike(query_str))
        ).all()
        
        return [
            {
                "id": p.id,
                "title": p.title,
                "price": p.price,
                "stock": p.stock,
                "variants": p.variants,
                "description": p.description
            } for p in products
        ]

    def calculate_delivery_charge(self, address_or_city: str) -> Dict[str, Any]:
        """Calculates delivery charge based on inside vs outside city address."""
        address_lower = address_or_city.lower()
        if any(inside_keyword in address_lower for inside_keyword in ["dhaka", "inside city", "inside", "city"]):
            fee = self.store.inside_city_fee
            zone = "Inside City"
        else:
            fee = self.store.outside_city_fee
            zone = "Outside City"
        
        return {
            "zone": zone,
            "delivery_fee": fee,
            "currency": self.store.currency
        }

    def execute_create_order(
        self,
        psid: str,
        customer_name: str,
        phone_number: str,
        full_address: str,
        items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Validates items, calculates total, and inserts order record in DB."""
        subtotal = 0.0
        validated_items = []

        for item in items:
            product_id = item.get("product_id")
            product_name = item.get("product_name")
            qty = item.get("quantity", 1)
            variant = item.get("variant", "")

            db_product = None
            if product_id:
                db_product = self.db.query(Product).filter(Product.id == product_id).first()
            elif product_name:
                db_product = self.db.query(Product).filter(
                    Product.store_id == self.store.id,
                    Product.title.ilike(f"%{product_name}%")
                ).first()

            if db_product:
                price = db_product.price
                item_total = price * qty
                subtotal += item_total
                validated_items.append({
                    "product_id": db_product.id,
                    "title": db_product.title,
                    "quantity": qty,
                    "variant": variant,
                    "price_per_unit": price,
                    "total": item_total
                })
            else:
                # Fallback item pricing
                price = item.get("price", 0.0)
                subtotal += price * qty
                validated_items.append({
                    "title": product_name or "Custom Product",
                    "quantity": qty,
                    "variant": variant,
                    "price_per_unit": price,
                    "total": price * qty
                })

        delivery_info = self.calculate_delivery_charge(full_address)
        delivery_fee = delivery_info["delivery_fee"]
        total_amount = subtotal + delivery_fee

        order = Order(
            store_id=self.store.id,
            psid=psid,
            customer_name=customer_name,
            phone_number=phone_number,
            full_address=full_address,
            city_zone=delivery_info["zone"],
            line_items=json.dumps(validated_items),
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            total_amount=total_amount,
            status="pending"
        )

        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)

        logger.info(f"Order #{order.id} created successfully for {customer_name} ({phone_number})")
        return {
            "order_id": order.id,
            "customer_name": customer_name,
            "phone_number": phone_number,
            "full_address": full_address,
            "subtotal": subtotal,
            "delivery_fee": delivery_fee,
            "total_amount": total_amount,
            "currency": self.store.currency,
            "status": "pending"
        }

    def handoff_to_human(self, psid: str, reason: str) -> str:
        """Disables AI auto reply for conversation and flags for human agent."""
        conv = self.db.query(Conversation).filter(
            Conversation.psid == psid,
            Conversation.store_id == self.store.id
        ).first()

        if conv:
            conv.is_ai_active = False
            conv.handoff_reason = reason
            self.db.commit()
            logger.info(f"Conversation for PSID {psid} handed off to human. Reason: {reason}")
        return f"Conversation handed over to human support team. Reason: {reason}"

    def get_api_key(self) -> str:
        """
        Get the Gemini API key for this store, falling back to environment variable.
        """
        if (self.store.gemini_api_key and 
            self.store.gemini_api_key.strip() and 
            self.store.gemini_api_key != "your_gemini_api_key_here" and
            not self.store.gemini_api_key.startswith("AIzaSy_TEST")):
            return self.store.gemini_api_key
        return os.getenv("GEMINI_API_KEY", "")

    async def generate_response(self, psid: str, user_message: str) -> str:
        """Generates contextual sales responses via Gemini API with store-specific credentials or fallback rule engine."""
        # 1. Look up or create conversation
        conv = self.db.query(Conversation).filter(
            Conversation.psid == psid, 
            Conversation.store_id == self.store.id
        ).first()

        if not conv:
            conv = Conversation(psid=psid, store_id=self.store.id, is_ai_active=True)
            self.db.add(conv)
            self.db.commit()
            self.db.refresh(conv)

        # 2. Check if Human Takeover lock is active
        if not conv.is_ai_active:
            logger.info(f"[HUMAN TAKEOVER] AI auto-reply paused for PSID: {psid} (Store ID: {self.store.id}).")
            return ""

        # 3. Add incoming user message to history
        user_msg_db = Message(conversation_id=conv.id, sender="user", text=user_message)
        self.db.add(user_msg_db)
        self.db.commit()

        # Load recent context history (last 10 messages)
        history_msgs = self.db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.id.desc()).limit(10).all()
        history_msgs.reverse()

        product_catalog_str = self._get_product_catalog_str()
        system_prompt = (getattr(self.store, 'custom_sales_prompt', None) or SYSTEM_PROMPT_TEMPLATE).format(
            store_name=self.store.name,
            currency=self.store.currency,
            inside_city_fee=self.store.inside_city_fee,
            outside_city_fee=self.store.outside_city_fee,
            product_catalog_str=product_catalog_str
        )

        ai_reply = None
        gemini_key = self.get_api_key()

        # 1. Try Groq API (Ultra-fast Llama 3.3 70B ~0.4s)
        groq_key = getattr(self.store, 'groq_api_key', None) or os.getenv("GROQ_API_KEY", "")
        if groq_key and groq_key != "YOUR_GROQ_API_KEY_HERE" and not ai_reply:
            try:
                import httpx
                headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
                messages_payload = [{"role": "system", "content": system_prompt}]
                for m in history_msgs:
                    messages_payload.append({"role": "user" if m.sender == "user" else "assistant", "content": m.text})
                
                async with httpx.AsyncClient() as http_client:
                    res = await http_client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers=headers,
                        json={"model": "llama-3.3-70b-versatile", "messages": messages_payload, "temperature": 0.7},
                        timeout=10.0
                    )
                    if res.status_code == 200:
                        data = res.json()
                        ai_reply = data["choices"][0]["message"]["content"]
            except Exception as e:
                logger.error(f"Groq API execution error: {e}")

        # 2. Try OpenRouter API (Free open models)
        openrouter_key = getattr(self.store, 'openrouter_api_key', None) or os.getenv("OPENROUTER_API_KEY", "")
        if openrouter_key and openrouter_key != "YOUR_OPENROUTER_API_KEY_HERE" and not ai_reply:
            try:
                import httpx
                headers = {
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://smartmessenger.ai",
                    "X-Title": "Smart Messenger AI SaaS"
                }
                messages_payload = [{"role": "system", "content": system_prompt}]
                for m in history_msgs:
                    messages_payload.append({"role": "user" if m.sender == "user" else "assistant", "content": m.text})
                
                async with httpx.AsyncClient() as http_client:
                    res = await http_client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers=headers,
                        json={"model": "meta-llama/llama-3.3-70b-instruct:free", "messages": messages_payload},
                        timeout=15.0
                    )
                    if res.status_code == 200:
                        data = res.json()
                        ai_reply = data["choices"][0]["message"]["content"]
            except Exception as e:
                logger.error(f"OpenRouter API execution error: {e}")

        # 3. Use Gemini API if valid key is available
        if not ai_reply:
            gemini_key = self.get_api_key()
            if gemini_key and gemini_key != "your_gemini_api_key_here" and not gemini_key.startswith("AIzaSy_TEST"):
                try:
                    import httpx
                    models_to_try = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-2.0-flash"]
                    for model in models_to_try:
                        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
                        contents_payload = [
                            {"role": "user" if m.sender == "user" else "model", "parts": [{"text": m.text}]}
                            for m in history_msgs
                        ]
                        async with httpx.AsyncClient() as http_client:
                            res = await http_client.post(
                                url,
                                headers={"Content-Type": "application/json"},
                                json={"system_instruction": {"parts": [{"text": system_prompt}]}, "contents": contents_payload},
                                timeout=15.0
                            )
                            if res.status_code == 200:
                                data = res.json()
                                ai_reply = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text")
                                if ai_reply:
                                    break
                except Exception as e:
                    logger.error(f"Gemini API execution error: {e}")

        # 4. Try Ollama Local (Free local instance)
        if not ai_reply:
            try:
                import httpx
                async with httpx.AsyncClient() as http_client:
                    res = await http_client.post(
                        "http://localhost:11434/api/chat",
                        json={"model": "qwen3:8b", "messages": [{"role": "system", "content": system_prompt}] + [{"role": "user" if m.sender == "user" else "assistant", "content": m.text} for m in history_msgs], "stream": False},
                        timeout=5.0
                    )
                    if res.status_code == 200:
                        ai_reply = res.json().get("message", {}).get("content")
            except Exception:
                pass

        # 5. High-Precision F-Commerce Rule Engine (Guaranteed fallback)
        if not ai_reply:
            ai_reply = self._fallback_rule_engine(user_message, psid, history_msgs)

        # 4. Save AI reply to database
        ai_msg_db = Message(conversation_id=conv.id, sender="assistant", text=ai_reply)
        self.db.add(ai_msg_db)
        self.db.commit()

        return ai_reply

    def _fallback_rule_engine(self, user_message: str, psid: str, history: List[Message]) -> str:
        """High-precision local F-commerce sales rule engine when external API keys are not provided."""
        text = user_message.lower()

        # Check for human agent request
        if any(h in text for h in ["human", "person", "agent", "real person", "call me", "speak with owner"]):
            self.handoff_to_human(psid, "Customer requested human support.")
            return f"Understood! I am notifying a human support representative from {self.store.name} to take over this chat. Please hold on a moment."

        # Check for pricing / product inquiry
        products = self.db.query(Product).filter(Product.store_id == self.store.id).all()

        # Check if user is trying to place an order (contains phone/address patterns)
        import re
        phone_match = re.search(r'(\+?8801|01)[3-9]\d{8}', user_message)
        
        if phone_match and len(user_message) > 15:
            # Order details extraction attempt
            phone = phone_match.group(0)
            lines = [l.strip() for l in user_message.split('\n') if l.strip()]
            name = lines[0] if len(lines) > 0 else "Customer"
            address = user_message.replace(phone, "").strip()

            # Assign first available product if not specified
            sample_product = products[0] if products else None
            items = [{"product_id": sample_product.id if sample_product else 1, "product_name": sample_product.title if sample_product else "Standard Item", "quantity": 1}]
            
            order_res = self.execute_create_order(
                psid=psid,
                customer_name=name,
                phone_number=phone,
                full_address=address or "Dhaka, Bangladesh",
                items=items
            )

            return (
                f"🎉 Thank you, {name}! Your order has been placed successfully!\n\n"
                f"📋 **Order Summary (Order #{order_res['order_id']}):**\n"
                f"• Items Subtotal: {order_res['currency']} {order_res['subtotal']:.2f}\n"
                f"• Delivery Fee ({order_res['city_zone']}): {order_res['currency']} {order_res['delivery_fee']:.2f}\n"
                f"• **Total Payable:** {order_res['currency']} {order_res['total_amount']:.2f}\n\n"
                f"📍 Delivery Address: {address}\n"
                f"📞 Contact Phone: {phone}\n"
                f"Payment Method: Cash on Delivery (COD)\n\n"
                f"Our dispatch team will contact you shortly before shipping!"
            )

        # Inquiry response generator
        if any(p in text for p in ["price", "cost", "how much", "dam koto", "koto"]):
            if products:
                prod_list = "\n".join([f"• **{p.title}**: {self.store.currency} {p.price} (In Stock: {p.stock})" for p in products])
                return (
                    f"Hello! Here are our current product prices at {self.store.name}:\n\n"
                    f"{prod_list}\n\n"
                    f"🚚 **Delivery Charge:**\n"
                    f"• Inside City: {self.store.currency} {self.store.inside_city_fee}\n"
                    f"• Outside City: {self.store.currency} {self.store.outside_city_fee}\n\n"
                    f"Which item would you like to order today? Please reply with your **Name, Phone Number, and Full Address** to confirm your order!"
                )

        if any(d in text for d in ["delivery", "shipping", "charge", "time", "location"]):
            return (
                f"🚚 **Delivery Information for {self.store.name}:**\n"
                f"• Inside City (Dhaka): {self.store.currency} {self.store.inside_city_fee} (Takes 24-48 hours)\n"
                f"• Outside City: {self.store.currency} {self.store.outside_city_fee} (Takes 2-4 days)\n\n"
                f"Payment mode: Cash on Delivery (COD) or bKash.\n"
                f"Would you like to place an order now?"
            )

        # Default greeting & store summary
        prod_names = ", ".join([p.title for p in products[:3]]) if products else "products"
        return (
            f"Hello! Welcome to **{self.store.name}**! 👋\n\n"
            f"We offer high quality items such as {prod_names}.\n\n"
            f"How can I assist you today? You can ask for prices, product availability, delivery charges, or send us your details to place an order!"
        )
