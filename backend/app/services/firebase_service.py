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