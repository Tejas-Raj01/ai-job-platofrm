import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.domain import User, Resume, JobPosting, AnalysisResult
from app.services.pdf_parser import document_processor
from app.services.ai_matcher import ai_matcher

router = APIRouter()

@router.post("/upload")
async def upload_resume(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Uploads a PDF resume, parses it, and saves to DB."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    contents = await file.read()
    parsed_text = document_processor.extract_text_from_pdf(contents)
    
    # Ensure user exists (Mock auth)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=user_id, email=f"user{user_id}@example.com", name="Test User")
        db.add(user)
        db.commit()
    
    # Save to DB
    resume = Resume(
        user_id=user_id,
        file_path=file.filename,
        parsed_text=parsed_text,
        skills="Parsed by AI" # Simplified for now
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    
    return {"resume_id": resume.id, "message": "Resume uploaded successfully"}

@router.post("/match")
def match_resume(resume_id: int, job_id: int, db: Session = Depends(get_db)):
    """Matches a resume against a specific job posting."""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    
    if not resume or not job:
        raise HTTPException(status_code=404, detail="Resume or Job not found")
        
    score = ai_matcher.calculate_similarity(resume.parsed_text, job.description)
    gaps = ai_matcher.analyze_gaps(resume.parsed_text, job.description)
    
    analysis = AnalysisResult(
        resume_id=resume.id,
        job_id=job.id,
        match_score=score,
        missing_skills=json.dumps(gaps.get("missing_skills", []))
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    return {
        "analysis_id": analysis.id,
        "match_score": score,
        "missing_skills": gaps.get("missing_skills", [])
    }

@router.post("/{resume_id}/find_jobs")
def find_matching_jobs(resume_id: int, db: Session = Depends(get_db)):
    """Finds the best matching jobs for a given resume."""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    jobs = db.query(JobPosting).all()
    if not jobs:
        return {"matches": []}
        
    matches = ai_matcher.find_top_jobs(resume.parsed_text, jobs, top_k=10)
    return {"matches": matches}
