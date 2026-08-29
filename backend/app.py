from fastapi import FastAPI
from config import supabase
from routes.upload_routes import router as upload_router
from routes.detection_routes import router as detection_router
from routes.location_routes import router as location_router
from routes.report_routes import router as report_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Cognitia Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(upload_router)
app.include_router(detection_router)
app.include_router(location_router)
app.include_router(report_router)


@app.get("/")
def home():
    return {
        "message": "Cognitia backend is running!"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }

@app.get("/database-test")
def database_test():
    response = supabase.table("sonar_images").select("*").execute()

    return {
        "message": "Supabase connected successfully",
        "data": response.data
    }