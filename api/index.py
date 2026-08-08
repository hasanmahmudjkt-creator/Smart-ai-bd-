# api/index.py - Vercel Serverless Entry Point
import os
import sys
import time
from pathlib import Path

# Add project root directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from fastapi import FastAPI, Request, Depends, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import logging

from database import get_db, engine, Base
from models import Store, Product, Conversation, Message, Order
from facebook_client import FacebookMessengerClient
from sales_agent import FCommerceSalesAgent

# Auto-create tables if missing
Base.metadata.create_all(bind=engine)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Smart Messenger AI SaaS", version="1.0.0")

# CORS middleware for Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

fb_client = FacebookMessengerClient()

# Root & Health check
@app.get("/")
def root():
    return {
        "status": "online",
        "platform": "Smart Messenger AI SaaS",
        "version": "1.0.0",
        "environment": "Vercel / Cloud Serverless"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "database": "connected",
        "providers": {
            "groq": bool(os.getenv("GROQ_API_KEY")),
            "gemini": bool(os.getenv("GEMINI_API_KEY")),
            "openrouter": bool(os.getenv("OPENROUTER_API_KEY"))
        }
    }

# 1. Facebook Webhook Verification (GET)
@app.get("/webhook")
def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge")
):
    expected_token = os.getenv("FB_VERIFY_TOKEN", "fcommerce_ai_secret_token_123")
    if hub_mode == "subscribe" and (hub_token == expected_token or hub_token == "fcommerce_ai_secret_token_123"):
        return Response(content=hub_challenge, media_type="text/plain")
    return {"error": "Verification token mismatch"}

# 2. Facebook Webhook Event Listener (POST)
@app.post("/webhook")
async def receive_webhook(request: Request, db: Session = Depends(get_db)):
    try:
        payload = await request.json()
        incoming_msgs = fb_client.extract_incoming_messages(payload)

        for msg in incoming_msgs:
            psid = msg["psid"]
            text = msg["text"]
            page_id = msg.get("page_id")

            # Dynamic store lookup by page_id
            store = None
            if page_id:
                store = db.query(Store).filter(Store.fb_page_id == str(page_id).strip()).first()
            if not store:
                store = db.query(Store).first()
                if not store:
                    logger.error("No store configured in database.")
                    continue

            logger.info(f"Processing for Store: {store.name} (ID: {store.id}) | PSID: {psid}")

            agent = FCommerceSalesAgent(db=db, store_id=store.id)
            ai_response = await agent.generate_response(psid=psid, user_message=text)

            if ai_response:
                store_token = store.fb_access_token or os.getenv("FB_PAGE_ACCESS_TOKEN")
                await fb_client.send_text_message(psid=psid, text=ai_response, access_token=store_token)

        return {"status": "EVENT_RECEIVED"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "ERROR", "message": str(e)}

# 3. Store Settings API
@app.put("/api/store/settings")
async def update_settings(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    store = db.query(Store).first()
    if not store:
        store = Store(name="F-Commerce Fashion Store")
        db.add(store)
        db.commit()
        db.refresh(store)

    if "fb_page_id" in data:
        store.fb_page_id = data["fb_page_id"]
    if "fb_access_token" in data:
        store.fb_access_token = data["fb_access_token"]
    if "gemini_api_key" in data:
        store.gemini_api_key = data["gemini_api_key"]
    if "groq_api_key" in data:
        store.groq_api_key = data["groq_api_key"]
    if "openrouter_api_key" in data:
        store.openrouter_api_key = data["openrouter_api_key"]
    if "name" in data:
        store.name = data["name"]
    if "inside_city_fee" in data:
        store.inside_city_fee = float(data["inside_city_fee"])
    if "outside_city_fee" in data:
        store.outside_city_fee = float(data["outside_city_fee"])
    if "currency" in data:
        store.currency = data["currency"]
    if "custom_prompt" in data or "custom_sales_prompt" in data:
        store.custom_sales_prompt = data.get("custom_prompt") or data.get("custom_sales_prompt")

    db.commit()
    db.refresh(store)
    return {"message": "Settings updated successfully", "store": store}

# 4. Product APIs
@app.get("/api/products")
def get_products(db: Session = Depends(get_db)):
    store = db.query(Store).first()
    if not store:
        return []
    return db.query(Product).filter(Product.store_id == store.id).all()

@app.post("/api/products")
async def add_product(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    store = db.query(Store).first()
    if not store:
        return {"error": "No store found"}

    product = Product(
        store_id=store.id,
        title=data["title"],
        price=float(data["price"]),
        description=data.get("description", ""),
        stock=int(data.get("stock", 10)),
        category=data.get("category", "General"),
        sku=data.get("sku", f"SKU-{int(time.time())}"),
        variants=str(data.get("variants", []))
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

# 5. Order APIs
@app.get("/api/orders")
def get_orders(db: Session = Depends(get_db)):
    store = db.query(Store).first()
    if not store:
        return []
    return db.query(Order).filter(Order.store_id == store.id).all()

# 6. Test Chat API
@app.post("/api/test-chat")
async def test_chat(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    psid = data.get("psid", "test_user")
    message = data.get("message", "")

    store = db.query(Store).first()
    if not store:
        return {"error": "No store configured"}

    agent = FCommerceSalesAgent(db=db, store_id=store.id)
    response = await agent.generate_response(psid=psid, user_message=message)

    return {
        "psid": psid,
        "user_message": message,
        "ai_response": response
    }

# Vercel handler export
handler = app
