from sqlalchemy import Column, Integer, String, Text, DateTime
import datetime
from ..database import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String(50), nullable=False, index=True)
    sender_role = Column(String(20), nullable=False)
    sender_name = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
