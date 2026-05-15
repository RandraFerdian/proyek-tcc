from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import auth_routes, employee_routes
from .database import engine, Base



# Import semua router
from .api import package_routes, order_routes, courier_routes, route_routes, customer_routes
# Import Firebase service
from .services.firebase_service import init_firebase

# Sinkronisasi tabel MySQL
Base.metadata.create_all(bind=engine)
# Inisialisasi Firebase Admin
init_firebase()
app = FastAPI(
    title="API Sistem Pemantauan Katering Stich",
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




@app.get("/")
def root():
    return {"message": "Sistem Backend Katering Stich Siap Digunakan!"}