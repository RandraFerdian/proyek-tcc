from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from .api import auth_routes, employee_routes
from .database import engine, Base



# Import semua router
from .api import package_routes, order_routes, courier_routes, route_routes, customer_routes, address_routes, chat_routes
# Import Firebase service
from .services.firebase_service import init_firebase

# Sinkronisasi tabel MySQL
Base.metadata.create_all(bind=engine)


def ensure_package_type_column():
    inspector = inspect(engine)
    columns = [column["name"] for column in inspector.get_columns("catering_packages")]
    if "type" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE catering_packages "
                    "ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'Makanan Berat'"
                )
            )


ensure_package_type_column()
# Inisialisasi Firebase Admin
init_firebase()
app = FastAPI(
    title="API Catering Sehat",
    version="1.0.0"
)



app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Registrasi Router Modular
app.include_router(employee_routes.router, prefix="/api/v1")
app.include_router(package_routes.router, prefix="/api/v1")
app.include_router(order_routes.router, prefix="/api/v1")
app.include_router(courier_routes.router, prefix="/api/v1")
app.include_router(route_routes.router, prefix="/api/v1")
app.include_router(auth_routes.router, prefix="/api/v1")
app.include_router(customer_routes.router, prefix="/api/v1")
app.include_router(address_routes.router, prefix="/api/v1")
app.include_router(chat_routes.router, prefix="/api/v1")




@app.get("/")
def root():
    return {"message": "Sistem Backend Catering Sehat Siap Digunakan!"}
