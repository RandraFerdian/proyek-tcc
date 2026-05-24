import os
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# 1. Panggil load_dotenv() agar Python membaca file .env milikmu
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Katering Stich API"
    PROJECT_VERSION: str = "1.0.0"

    # Konfigurasi MySQL dari environment variables
    DB_USER: Optional[str] = os.getenv("DB_USER")
    DB_PASS: Optional[str] = os.getenv("DB_PASS", "") 
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_NAME: Optional[str] = os.getenv("DB_NAME")

    # Konfigurasi Keamanan
    SECRET_KEY: Optional[str] = os.getenv("SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Konfigurasi Firebase (Ditambah variabel untuk JSON String)
    FIREBASE_CREDENTIALS_PATH: Optional[str] = os.getenv("FIREBASE_CREDENTIALS_PATH")
    FIREBASE_CREDENTIALS_JSON: Optional[str] = os.getenv("FIREBASE_CREDENTIALS_JSON")
    FIREBASE_DATABASE_URL: Optional[str] = os.getenv("FIREBASE_DATABASE_URL")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Pengecekan Database
        if self.DB_USER is None or self.DB_PASS is None or self.DB_NAME is None:
            raise ValueError("Database credentials (DB_USER, DB_PASS, DB_NAME) must be set in environment variables")
        
        if not self.SECRET_KEY:
            raise ValueError("SECRET_KEY must be set in environment variables")
        
        if not self.FIREBASE_DATABASE_URL:
            raise ValueError("FIREBASE_DATABASE_URL must be set in environment variables")
            
        # PENGECEKAN FIREBASE DIUBAH DISINI:
        # Aplikasi hanya akan error jika KEDUA variabel ini kosong
        if not self.FIREBASE_CREDENTIALS_PATH and not self.FIREBASE_CREDENTIALS_JSON:
            raise ValueError("Harus menyediakan FIREBASE_CREDENTIALS_PATH (untuk lokal) ATAU FIREBASE_CREDENTIALS_JSON (untuk Cloud Run)")

    # Membuat URL koneksi secara otomatis
    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASS}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

settings = Settings()