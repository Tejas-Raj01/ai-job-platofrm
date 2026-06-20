import json
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from app.core.config import settings

class AIMatcher:
    def __init__(self):
        # We use a lightweight local model for vector embeddings to calculate similarity
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        # We can configure this to use OpenAI or Gemini based on the available key
        # Defaulting to Gemini as requested in system preferences
        api_key = getattr(settings, "OPENAI_API_KEY", "dummy_key")
        self.llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", google_api_key=api_key) if "AIza" in api_key else ChatGoogleGenerativeAI(model="gemini-1.5-pro", google_api_key="mock")

    def calculate_similarity(self, resume_text: str, jd_text: str) -> float:
        """
        Embeds both texts and computes cosine similarity using ChromaDB locally.
        """
        try:
            # Create a temporary in-memory chroma store with the JD
            vectorstore = Chroma.from_texts(
                texts=[jd_text],
                embedding=self.embeddings
            )
            # Perform similarity search with score
            # similarity_search_with_score returns (Document, score) where score is L2 distance for Chroma
            results = vectorstore.similarity_search_with_score(resume_text, k=1)
            if not results:
                return 0.0
                
            distance = results[0][1]
            # Convert L2 distance to similarity score (0 to 100)
            # Smaller distance means higher similarity.
            similarity = max(0.0, 100.0 - (distance * 50.0))
            return round(min(100.0, similarity), 2)
        except Exception as e:
            print(f"Embedding error: {e}")
            return 0.0

    def extract_search_keywords(self, resume_text: str) -> str:
        """Uses LLM to determine the highly condensed search string for a resume."""
        prompt = PromptTemplate(
            input_variables=["resume"],
            template='''Analyze this resume and extract a highly condensed search string (max 4-5 words) of the core role and primary skill.
Example: "Senior React Developer" or "Python Backend Engineer".

Resume:
{resume}

Respond ONLY with the search string and nothing else:'''
        )
        try:
            chain = prompt | self.llm
            response = chain.invoke({"resume": resume_text[:5000]})
            return response.content.strip().strip('"').replace('\n', '')
        except Exception as e:
            print(f"Keyword extraction error: {e}")
            return "Software Engineer"

    def find_top_jobs(self, resume_text: str, jobs: list, top_k: int = 10) -> list:
        """
        Embeds a list of jobs and finds the top K matches for the resume.
        """
        if not jobs:
            return []
            
        try:
            texts = [job.description for job in jobs]
            metadatas = [{"id": job.id, "title": job.title, "company": job.company} for job in jobs]
            
            vectorstore = Chroma.from_texts(
                texts=texts,
                metadatas=metadatas,
                embedding=self.embeddings
            )
            
            results = vectorstore.similarity_search_with_score(resume_text, k=min(top_k, len(jobs)))
            
            matches = []
            for doc, distance in results:
                similarity = max(0.0, 100.0 - (distance * 50.0))
                score = round(min(100.0, similarity), 2)
                matches.append({
                    "job_id": doc.metadata["id"],
                    "title": doc.metadata["title"],
                    "company": doc.metadata["company"],
                    "match_score": score
                })
                
            return sorted(matches, key=lambda x: x["match_score"], reverse=True)
        except Exception as e:
            print(f"Top jobs error: {e}")
            return []

    def analyze_gaps(self, resume_text: str, jd_text: str) -> dict:
        """
        Uses LLM to perform gap analysis based on exact user requested prompt.
        """
        prompt = PromptTemplate(
            input_variables=["resume", "jd"],
            template='''Compare this Resume with this JD. What specific keywords, projects, or phrasing are missing from the resume to make it a 100% match for this exact job?
Return the result strictly as a valid JSON object with the key "missing_skills" which is a list of strings (each string is a clear, actionable bullet point).

Resume:
{resume}

Job Description:
{jd}

Output JSON only:'''
        )
        try:
            chain = prompt | self.llm
            response = chain.invoke({"resume": resume_text, "jd": jd_text})
            text = response.content.strip()
            if text.startswith("```json"):
                text = text[7:-3]
            elif text.startswith("```"):
                text = text[3:-3]
            
            result = json.loads(text.strip())
            return result
        except Exception as e:
            print(f"LLM gap analysis error: {e}")
            return {"missing_skills": ["Error analyzing gaps"]}

ai_matcher = AIMatcher()
