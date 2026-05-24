from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.chat_model import ChatMessage
from ..schemas.chat_schema import ChatMessageCreate, ChatMessageOut
from ..services import firebase_service

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.get("/{order_code}", response_model=list[ChatMessageOut])
def get_chat_messages(order_code: str, db: Session = Depends(get_db)):
    return db.query(ChatMessage).filter(ChatMessage.order_code == order_code).order_by(ChatMessage.created_at).all()

@router.post("/", response_model=ChatMessageOut)
def send_chat_message(payload: ChatMessageCreate, db: Session = Depends(get_db)):
    new_msg = ChatMessage(
        order_code=payload.order_code,
        sender_role=payload.sender_role,
        sender_name=payload.sender_name,
        message=payload.message
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    # Integrasi Firebase NoSQL: Kirim pesan chat secara real-time
    firebase_service.send_chat_message(
        order_id=payload.order_code,  # Memakai order_code sebagai ID node chat
        sender_id=0, # Optional: jika butuh user id spesifik, tapi di frontend dikirim nama
        sender_role=payload.sender_role,
        message=payload.message
    )

    return new_msg
