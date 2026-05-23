from pydantic import BaseModel
from datetime import datetime

class ChatMessageCreate(BaseModel):
    order_code: str
    sender_role: str
    sender_name: str
    message: str

class ChatMessageOut(BaseModel):
    id: int
    order_code: str
    sender_role: str
    sender_name: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True
