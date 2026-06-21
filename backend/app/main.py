from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import jobs, resumes
from app.core.database import Base, engine

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI-Powered Job Matching Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(resumes.router, prefix="/api/resumes", tags=["Resumes"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Backend is running"}
