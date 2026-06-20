import requests
from app.core.config import settings

class DynamicJobScraper:
    def __init__(self):
        self.api_key = settings.JSEARCH_API_KEY
        self.headers = {
            "x-rapidapi-host": "jsearch.p.rapidapi.com",
            "x-rapidapi-key": self.api_key
        }

    def scrape_jobs_for_profile(self, keywords: str, limit: int = 10) -> list:
        """Hits the JSearch API to fetch real jobs (LinkedIn, Glassdoor, etc)."""
        if not self.api_key:
            print("Warning: JSEARCH_API_KEY is not set. Cannot fetch jobs.")
            return []
            
        print(f"Searching JSearch API for: {keywords}")
        url = "https://jsearch.p.rapidapi.com/search"
        querystring = {"query": f"{keywords}", "page": "1", "num_pages": "1"}
        
        jobs = []
        try:
            resp = requests.get(url, headers=self.headers, params=querystring, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("data", [])
                for item in results[:limit]:
                    desc = item.get("job_description", "")
                    if desc:
                        jobs.append({
                            "title": item.get("job_title", "Job Posting")[:100],
                            "company": item.get("employer_name", "Unknown Company")[:100],
                            "description": desc[:10000],
                            "url": item.get("job_apply_link", "")
                        })
            else:
                print(f"JSearch API returned status {resp.status_code}")
        except Exception as e:
            print(f"JSearch API error: {e}")
            
        print(f"Successfully scraped {len(jobs)} jobs from internet via JSearch.")
        return jobs

dynamic_scraper = DynamicJobScraper()
