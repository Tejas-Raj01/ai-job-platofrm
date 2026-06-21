import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
from app.core.database import get_db
from app.models.domain import User, Resume, JobPosting, AnalysisResult
from app.services.pdf_parser import document_processor
from app.services.ai_matcher import ai_matcher
from app.services.job_searcher import dynamic_scraper

router = APIRouter()

class CustomJDRequest(BaseModel):
    title: str = "Custom Target Job"
    company: str = "Target Company"
    jd_text: str

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
    
    return {"resume_id": resume.id, "filename": file.filename, "message": "Resume uploaded successfully"}

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
        "summary": gaps.get("summary", ""),
        "missing_skills": gaps.get("missing_skills", []),
        "recommendations": gaps.get("recommendations", [])
    }

@router.post("/{resume_id}/analyze-and-fetch")
async def analyze_and_fetch_jobs(resume_id: int, db: Session = Depends(get_db)):
    """Dynamic Reverse-Search workflow matching specific user requirements."""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    # 1. Extract highly condensed search string
    keywords = ai_matcher.extract_search_keywords(resume.parsed_text)
    
    # 2. Dynamically scrape jobs concurrently via multiple providers (Wellfound + JSearch)
    scraped_data = await dynamic_scraper.scrape_jobs_for_profile(keywords, limit=15)
    
    if not scraped_data:
        # Fallback search if specific keywords return nothing
        scraped_data = await dynamic_scraper.scrape_jobs_for_profile("Software", limit=10)
        if not scraped_data:
            return {"matches": []}
        
    # 3. Save new jobs to DB to get IDs
    fresh_jobs = []
    for data in scraped_data:
        job = db.query(JobPosting).filter(JobPosting.url == data["url"]).first()
        if not job:
            job = JobPosting(
                title=data["title"],
                company=data["company"],
                description=data["description"],
                url=data["url"]
            )
            db.add(job)
        fresh_jobs.append(job)
        
    db.commit()
    for job in fresh_jobs:
        db.refresh(job)
        
    # 4. Semantic Ranking & Gap Analysis
    matches = ai_matcher.find_top_jobs(resume.parsed_text, fresh_jobs, top_k=10)
    
    # Add short descriptions and URLs to the response
    for match in matches:
        job = next((j for j in fresh_jobs if j.id == match["job_id"]), None)
        if job:
            match["url"] = job.url
            match["short_description"] = job.description[:150] + "..." if job.description else "No description available."
            
    return {"matches": matches}

@router.post("/{resume_id}/match_custom")
def match_custom_job(resume_id: int, request: CustomJDRequest, db: Session = Depends(get_db)):
    """Matches a resume against a specific custom job description pasted by the user."""
    try:
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
            
        # Save the custom JD to DB to get an ID
        job = JobPosting(
            title=request.title[:100],
            company=request.company[:100],
            description=request.jd_text,
            url=f"custom-paste-{uuid.uuid4()}"
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # Rank them against the resume (will be just 1 job)
        matches = ai_matcher.find_top_jobs(resume.parsed_text, [job], top_k=1)
        
        if matches:
            matches[0]["short_description"] = job.description[:150] + "..." if job.description else "Custom Job Description"
            
        return {"matches": matches}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}
