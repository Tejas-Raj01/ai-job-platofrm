import json
import re
import time
import requests
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from app.core.config import settings

def get_active_groq_models(api_key: str) -> list:
    """Fetches and filters active Groq text models dynamically."""
    try:
        headers = {"Authorization": f"Bearer {api_key}"}
        response = requests.get("https://api.groq.com/openai/v1/models", headers=headers, timeout=10)
        response.raise_for_status()
        models_data = response.json().get("data", [])
        
        # Filter text models: exclude whisper
        text_models = [m["id"] for m in models_data if "whisper" not in m["id"].lower()]
        
        # Prioritize known high-capability models
        priority = ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "llama3-70b-8192", "mixtral-8x7b-32768"]
        sorted_models = []
        for p in priority:
            if p in text_models:
                sorted_models.append(p)
                text_models.remove(p)
                
        sorted_models.extend(text_models)
        return sorted_models
        
    except Exception as e:
        print(f"Failed to fetch dynamic Groq models: {e}")
        # Fallback to hardcoded list if fetch fails
        return ["llama3-70b-8192", "llama3-8b-8192", "mixtral-8x7b-32768", "gemma-7b-it"]

def clean_llm_json_output(text: str) -> str:
    """Utility function using Regex to aggressively strip out markdown wrappers."""
    cleaned_response = re.sub(r'```json\s*|\s*```', '', text, flags=re.IGNORECASE).strip()
    return cleaned_response

class AIMatcher:
    def __init__(self):
        # We use a lightweight local model for vector embeddings to calculate similarity
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.api_key = getattr(settings, "GROQ_API_KEY", "dummy_key")
        self.active_models = get_active_groq_models(self.api_key)

    def _execute_with_fallback(self, prompt_template: PromptTemplate, inputs: dict, enforce_json: bool = False) -> str:
        """Iterates over dynamically fetched Groq models, falling back on 429 or other API errors."""
        for i, model_name in enumerate(self.active_models):
            try:
                # Configure JSON mode if required
                model_kwargs = {"response_format": {"type": "json_object"}} if enforce_json else {}
                
                llm = ChatGroq(
                    model=model_name,
                    api_key=self.api_key,
                    temperature=0.0,
                    model_kwargs=model_kwargs
                )
                chain = prompt_template | llm
                response = chain.invoke(inputs)
                print(f"\n--- RAW LLM RESPONSE FROM {model_name} ---\n{response.content}\n---------------------------------------\n")
                return response.content
            except Exception as e:
                err_str = str(e)
                print(f"Model {model_name} failed: {err_str}")
                
                # If we exhausted all models, raise an error to be caught by the caller
                if i == len(self.active_models) - 1:
                    raise RuntimeError(f"All Groq models failed. Last error: {err_str}")
                    
                # Check if it's a rate limit or quota error
                if "429" in err_str or "rate limit" in err_str.lower() or "quota" in err_str.lower():
                    print(f"Model {model_name} limit reached, falling back to {self.active_models[i+1]}")
                else:
                    print(f"Model {model_name} encountered an error, falling back to {self.active_models[i+1]}")
                
                # Add a small delay to avoid spamming immediate requests on non-rate-limit errors
                time.sleep(1)
                continue

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
            content = self._execute_with_fallback(prompt, {"resume": resume_text[:5000]}, enforce_json=False)
            return content.strip().strip('"').replace('\n', '')
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

Return the result strictly as a valid JSON object matching the exact schema below:
{{
  "summary": "Short 2-sentence summary of the fit.",
  "missing_skills": ["Skill 1", "Skill 2", "Skill 3"],
  "recommendations": ["Actionable tip 1", "Actionable tip 2"]
}}

CRITICAL INSTRUCTION: Return ONLY the raw JSON object. Do NOT wrap the output in markdown code blocks (e.g., no ```json). Do NOT include any conversational text before or after.

Resume:
{resume}

Job Description:
{jd}'''
        )
        try:
            content = self._execute_with_fallback(prompt, {"resume": resume_text[:5000], "jd": jd_text[:5000]}, enforce_json=True)
            text = clean_llm_json_output(content)
            
            # Robust JSON extraction using regex
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            json_str = json_match.group(0) if json_match else text
            
            try:
                result = json.loads(json_str)
            except json.JSONDecodeError as json_err:
                print(f"JSON PARSING FAILED: {str(json_err)}")
                print(f"Raw string attempted: {json_str}")
                raise
                
            return {
                "summary": result.get("summary", "No summary provided."),
                "missing_skills": result.get("missing_skills", []),
                "recommendations": result.get("recommendations", [])
            }
                
        except Exception as e:
            print(f"LLM gap analysis error: {e}")
            return {
                "summary": "Analysis completed, but response formatting failed. Please try analyzing again.",
                "missing_skills": ["Error parsing skills"],
                "recommendations": ["Error parsing recommendations"]
            }

ai_matcher = AIMatcher()
