import firebase_admin
from firebase_admin import credentials, db
from typing import Optional
from app.core.config import settings

# Fungsi ini akan menginisialisasi koneksi ke Firebase Realtime Database
def init_firebase():
    # Mencegah inisialisasi ganda jika server me-reload
    if not firebase_admin._apps:
        try:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred, {
                'databaseURL': settings.FIREBASE_DATABASE_URL
            })
            print("Firebase terhubung!")
        except Exception as e:
            print(f"Peringatan: Gagal menghubungkan Firebase. Pastikan file {settings.FIREBASE_CREDENTIALS_PATH} ada. Error: {e}")

# Fungsi bantuan untuk menyimpan log perubahan status ke NoSQL
def log_delivery_event_to_nosql(order_id: int, status: str, location: Optional[dict] = None) -> None:
    try:
        ref = db.reference(f'delivery_logs/order_{order_id}')
        event_data: dict = {"status": status}
        if location:
            event_data["location"] = location
            
        ref.push(event_data)  # type: ignore
    except Exception as e:
        print(f"Gagal mencatat ke Firebase: {e}")

# 1. Menyimpan Live Tracking Kurir
def update_courier_location(order_id: int, courier_id: int, latitude: float, longitude: float) -> None:
    try:
        from datetime import datetime
        ref = db.reference(f'live_tracking/order_{order_id}')
        ref.set({
            "courier_id": courier_id,
            "latitude": latitude,
            "longitude": longitude,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        print(f"Gagal update lokasi kurir ke Firebase: {e}")

# 2. Update Status Pengiriman
def update_delivery_status(order_id: int, status: str) -> None:
    try:
        from datetime import datetime
        ref = db.reference(f'delivery_status/order_{order_id}')
        ref.set({
            "status": status,
            "updated_at": datetime.now().isoformat()
        })
        log_delivery_event_to_nosql(order_id, status)
    except Exception as e:
        print(f"Gagal update status pengiriman ke Firebase: {e}")

# 3. Notifikasi Pelanggan
def send_customer_notification(customer_id: int, title: str, message: str) -> None:
    try:
        from datetime import datetime
        ref = db.reference(f'notifications/customer_{customer_id}')
        ref.push({
            "title": title,
            "message": message,
            "is_read": False,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        print(f"Gagal kirim notifikasi ke Firebase: {e}")

# 4. Foto Bukti Antar
def save_delivery_proof(order_id: int, photo_url: str) -> None:
    try:
        from datetime import datetime
        ref = db.reference(f'delivery_proofs/order_{order_id}')
        ref.set({
            "photo_url": photo_url,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        print(f"Gagal simpan bukti antar ke Firebase: {e}")

# 5. Chat antara Pelanggan dan Kurir
def send_chat_message(order_id: int, sender_id: int, sender_role: str, message: str) -> None:
    try:
        from datetime import datetime
        ref = db.reference(f'chats/order_{order_id}')
        ref.push({
            "sender_id": sender_id,
            "sender_role": sender_role,
            "message": message,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        print(f"Gagal kirim pesan chat ke Firebase: {e}")

# 6. Cache Rute
def cache_route(order_id: int, route_data: dict) -> None:
    try:
        from datetime import datetime
        ref = db.reference(f'route_cache/order_{order_id}')
        ref.set({
            "route_data": route_data,
            "updated_at": datetime.now().isoformat()
        })
    except Exception as e:
        print(f"Gagal simpan cache rute ke Firebase: {e}")