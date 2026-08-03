import asyncio
import sys
import os
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Store, Product, Order, Conversation, Message
from sales_agent import FCommerceSalesAgent
from main import init_sample_data

# Ensure tables are created
Base.metadata.create_all(bind=engine)

async def run_simulation():
    print("=" * 70)
    print(" 🤖 F-Commerce AI Messenger Sales Engine - Local Test Simulator")
    print("=" * 70)

    db: Session = SessionLocal()
    init_sample_data()

    store = db.query(Store).first()
    print(f"\n🏬 Store Connected: {store.name} (Currency: {store.currency})")
    products = db.query(Product).filter(Product.store_id == store.id).all()
    print(f"📦 Inventory Loaded: {len(products)} products available:")
    for p in products:
        print(f"   - #{p.id} {p.title} | {store.currency} {p.price} | Stock: {p.stock}")

    print("\n" + "-" * 70)
    print("Starting simulated customer sales conversation (PSID: sim_user_99)...")
    print("-" * 70)

    agent = FCommerceSalesAgent(db=db, store_id=store.id)
    test_psid = "sim_customer_99"

    test_messages = [
        "Hi, what products do you sell and how much is the cotton t-shirt?",
        "What is the delivery charge for Dhaka and outside Dhaka?",
        "I want to order 1 Cotton T-shirt size L. Name: Tanvir Hasan, Phone: 01711223344, Address: House 45, Road 7, Dhanmondi, Dhaka",
        "Can I speak with a human support agent?"
    ]

    for msg in test_messages:
        print(f"\n👤 Customer (PSID: {test_psid}):\n   \"{msg}\"")
        response = await agent.generate_response(psid=test_psid, user_message=msg)
        print(f"\n🤖 AI Sales Bot:\n{response}")
        print("." * 70)

    print("\n📊 Inspecting Database Orders:")
    orders = db.query(Order).all()
    print(f"Found {len(orders)} order(s) in system:")
    for o in orders:
        print(f"   - Order #{o.id} | Customer: {o.customer_name} ({o.phone_number}) | Total: {o.total_amount} {store.currency} | Status: {o.status}")
        print(f"     Address: {o.full_address}")
        print(f"     Items: {o.line_items}")

    db.close()
    print("\n✅ Simulation completed successfully!")

if __name__ == "__main__":
    asyncio.run(run_simulation())
