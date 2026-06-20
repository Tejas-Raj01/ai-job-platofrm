import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import SessionLocal
from app.models.domain import JobPosting

db = SessionLocal()
jobs = [
    JobPosting(
        title="Frontend Developer",
        company="Tech Innovators",
        description="We are looking for a skilled Frontend Developer proficient in React, Tailwind CSS, and modern JavaScript. Experience with Framer Motion is a plus."
    ),
    JobPosting(
        title="Backend Engineer",
        company="DataSystems Inc.",
        description="Seeking a Backend Engineer to build robust APIs using FastAPI and Python. Must have experience with PostgreSQL, Celery, and Redis."
    ),
    JobPosting(
        title="Full Stack Engineer",
        company="StartupX",
        description="Looking for a Full Stack Engineer capable of handling both React frontend and Python FastAPI backend. DevOps knowledge with Docker is highly desired."
    )
]

for job in jobs:
    if not db.query(JobPosting).filter(JobPosting.title == job.title).first():
        db.add(job)

db.commit()
print("Successfully seeded jobs!")
