import os
import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Depends, Query, HTTPException, Request, Response, BackgroundTask
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import engine, get_db, Base
from models import Store, Product, Conversation, Message, Order
from facebook_client import FacebookMessengerClient
from sales_agent import FCommerceSalesAgent

load_dotenv()

# Initialize Database tables
Base.metadata.create_all(bind=engine)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("fcommerce_app")

app = FastAPI(
    title="F-Commerce AI Messenger Sales Engine",
    description="Automated AI sales, product catalog inquiry, and order extraction backend for Facebook Commerce.",
    version="1.0.0"
)

fb_client = FacebookMessengerClient()

# Initialize Default Store & Sample Data on startup
@app.on_event("startup")
def init_sample_data():
    db = next(get_db())
    store = db.query(Store).first()
    if not store:
        store = Store(
            name=os.getenv("DEFAULT_STORE_NAME", "F-Commerce Fashion Store"),
            inside_city_fee=float(os.getenv("DEFAULT_INSIDE_CITY_FEE", "60.0")),
            outside_city_fee=float(os.getenv("DEFAULT_OUTSIDE_CITY_FEE", "120.0")),
            currency=os.getenv("DEFAULT_CURRENCY", "BDT")
        )
        db.add(store)
        db.commit()
        db.refresh(store)

        # Add sample products
        sample_products = [
            Product(
                store_id=store.id,
                title="Premium Cotton Graphic T-Shirt",
                sku="TS-001",
                price=650.0,
                stock=25,
                category="Apparel",
                variants='["M", "L", "XL"]',
                description="100% Organic breathable cotton t-shirt with premium screen print."
            ),
            Product(
                store_id=store.id,
                title="Urban Slim Fit Denim Jacket",
                sku="JK-002",
                price=2200.0,
                stock=10,
                category="Outwear",
                variants='["Blue", "Black"]',
                description="Heavyweight durable denim jacket styled for modern streetwear."
            ),
            Product(
                store_id=store.id,
                title="Minimalist Canvas Sneakers",
                sku="SN-003",
                price=1450.0,
                stock=15,
                category="Footwear",
                variants='["EU 40", "EU 41", "EU 42", "EU 43"]',
                description="Comfortable cushioned rubber sole canvas sneakers for everyday wear."
            )
        ]
        db.add_all(sample_products)
        db.commit()
        logger.info("Initialized default store and sample products in database.")
    db.close()

# Pydantic Schemas
class ProductCreate(BaseModel):
    title: str
    price: float
    description: Optional[str] = None
    stock: Optional[int] = 10
    category: Optional[str] = None
    sku: Optional[str] = None
    variants: Optional[str] = None

class TestChatRequest(BaseModel):
    psid: str = Field(default="test_user_101", description="Page-Scoped User ID for testing")
    message: str = Field(..., description="Customer message text")

class ToggleAIRequest(BaseModel):
    is_ai_active: bool

# Endpoints
@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "F-Commerce AI Messenger Sales Engine",
        "documentation": "/docs"
    }

# 1. Facebook Webhook Verification
@app.get("/webhook")
def verify_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge")
):
    if hub_mode and hub_token:
        challenge = fb_client.verify_webhook(hub_mode, hub_token, hub_challenge)
        if challenge:
            return Response(content=challenge, media_type="text/plain")
        raise HTTPException(status_code=403, detail="Verification token mismatch")
    return {"message": "Facebook Webhook Verification Endpoint. Send hub.mode, hub.verify_token, hub.challenge."}

# Background processing of FB Webhook event
async def process_facebook_message(psid: str, text: str, db: Session):
    try:
        agent = FCommerceSalesAgent(db=db, store_id=1)
        ai_response = await agent.generate_response(psid=psid, user_message=text)
        if ai_response:
            await fb_client.send_text_message(psid=psid, text=ai_response)
    except Exception as e:
        logger.error(f"Error processing FB message in background: {e}")

# 2. Facebook Webhook Event Listener
@app.post("/webhook")
async def receive_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    incoming_msgs = fb_client.extract_incoming_messages(payload)

    for msg in incoming_msgs:
        psid = msg["psid"]
        text = msg["text"]
        logger.info(f"Incoming FB Message from PSID {psid}: {text}")
        
        agent = FCommerceSalesAgent(db=db, store_id=1)
        ai_response = await agent.generate_response(psid=psid, user_message=text)
        
        if ai_response:
            await fb_client.send_text_message(psid=psid, text=ai_response)

    return {"status": "EVENT_RECEIVED"}

# 3. Product Catalog APIs
@app.post("/api/products")
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    store = db.query(Store).first()
    product = Product(
        store_id=store.id,
        title=product_in.title,
        price=product_in.price,
        description=product_in.description,
        stock=product_in.stock or 10,
        category=product_in.category,
        sku=product_in.sku,
        variants=product_in.variants
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@app.get("/api/products")
def list_products(db: Session = Depends(get_db)):
    store = db.query(Store).first()
    return db.query(Product).filter(Product.store_id == store.id).all()

# 4. Order Management APIs
@app.get("/api/orders")
def list_orders(status: Optional[str] = None, db: Session = Depends(get_db)):
    store = db.query(Store).first()
    query = db.query(Order).filter(Order.store_id == store.id)
    if status:
        query = query.filter(Order.status == status)
    return query.order_by(Order.id.desc()).all()

@app.post("/api/orders/{order_id}/status")
def update_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status
    db.commit()
    return {"message": f"Order #{order_id} status updated to {status}", "order": order}

# 5. Conversation Handoff APIs
@app.get("/api/conversations")
def list_conversations(db: Session = Depends(get_db)):
    store = db.query(Store).first()
    convs = db.query(Conversation).filter(Conversation.store_id == store.id).all()
    results = []
    for c in convs:
        last_msg = db.query(Message).filter(Message.conversation_id == c.id).order_by(Message.id.desc()).first()
        results.append({
            "id": c.id,
            "psid": c.psid,
            "is_ai_active": c.is_ai_active,
            "handoff_reason": c.handoff_reason,
            "last_message": last_msg.text if last_msg else None,
            "last_sender": last_msg.sender if last_msg else None,
            "updated_at": c.updated_at
        })
    return results

@app.post("/api/conversations/{psid}/toggle-ai")
def toggle_ai_conversation(psid: str, body: ToggleAIRequest, db: Session = Depends(get_db)):
    store = db.query(Store).first()
    conv = db.query(Conversation).filter(
        Conversation.psid == psid,
        Conversation.store_id == store.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conv.is_ai_active = body.is_ai_active
    if body.is_ai_active:
        conv.handoff_reason = None
    db.commit()
    return {"psid": psid, "is_ai_active": conv.is_ai_active}

# 6. Interactive Test Chat Simulator (For local testing)
@app.post("/api/test-chat")
async def test_chat_simulator(req: TestChatRequest, db: Session = Depends(get_db)):
    agent = FCommerceSalesAgent(db=db, store_id=1)
    response_text = await agent.generate_response(psid=req.psid, user_message=req.message)
    return {
        "psid": req.psid,
        "user_message": req.message,
        "ai_response": response_text
    }
