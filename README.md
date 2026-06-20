# AI-Powered Job Matching & Web Scraping Platform

This is an end-to-end platform to match user resumes with job descriptions using AI.

## Architecture
- **Frontend**: React.js (Vite), Tailwind CSS
- **Backend**: FastAPI, PostgreSQL
- **Async Workers**: Celery, Redis
- **AI/ML**: LangChain, Vector DB (ChromaDB), OpenAI/Gemini

## Setup Instructions

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in your details.
3. Run `docker-compose up -d` to start the backend, database, redis, and workers.
4. Navigate to `frontend` and run `npm install` then `npm run dev`.
