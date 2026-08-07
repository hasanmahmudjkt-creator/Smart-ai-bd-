from datetime import datetime
import json
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    fb_page_id = Column(String(100), unique=True, index=True, nullable=True)
    fb_access_token = Column(Text, nullable=True)
    gemini_api_key = Column(Text, nullable=True)
    inside_city_fee = Column(Float, default=60.0)
    outside_city_fee = Column(Float, default=120.0)
    currency = Column(String(10), default="BDT")
    custom_sales_prompt = Column(Text, nullable=True)

    products = relationship("Product", back_populates="store", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="store", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="store", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    title = Column(String(200), nullable=False, index=True)
    sku = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=10)
    category = Column(String(100), nullable=True)
    image_url = Column(Text, nullable=True)
    variants = Column(Text, nullable=True) # e.g. JSON array string: ["S", "M", "L", "XL"] or ["Red", "Black"]

    store = relationship("Store", back_populates="products")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    psid = Column(String(100), index=True, nullable=False) # Facebook Page-Scoped User ID
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    is_ai_active = Column(Boolean, default=True) # If False, human agent has taken over
    handoff_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    store = relationship("Store", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender = Column(String(20), nullable=False) # "user", "assistant", "human_agent"
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    psid = Column(String(100), nullable=False, index=True)
    customer_name = Column(String(150), nullable=False)
    phone_number = Column(String(50), nullable=False)
    full_address = Column(Text, nullable=False)
    city_zone = Column(String(100), default="inside_city") # "inside_city" or "outside_city"
    line_items = Column(Text, nullable=False) # JSON array string of items ordered
    subtotal = Column(Float, nullable=False)
    delivery_fee = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    payment_method = Column(String(50), default="Cash on Delivery")
    status = Column(String(50), default="pending") # pending, confirmed, shipped, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    store = relationship("Store", back_populates="orders")
