import time
import requests
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from urllib.parse import urlparse

class DynamicJobScraper:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        }

    def fetch_job_urls(self, job_title: str, max_results: int = 10):
        """Searches DuckDuckGo for ATS job board URLs matching the job title."""
        query = f'"{job_title}" site:boards.greenhouse.io OR site:jobs.lever.co'
        urls = []
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=max_results))
                for r in results:
                    url = r.get("href")
                    if url:
                        urls.append(url)
        except Exception as e:
            print(f"DDG Search error: {e}")
        return urls

    def scrape_job_description(self, url: str) -> dict:
        """Fetches the HTML of a job URL and extracts the title, company, and description."""
        try:
            resp = requests.get(url, headers=self.headers, timeout=10)
            if resp.status_code != 200:
                return None
            soup = BeautifulSoup(resp.content, "html.parser")
            
            title = soup.title.string.strip() if soup.title else "Job Posting"
            
            # Clean up title for common ATS formats
            if " at " in title:
                parts = title.split(" at ")
                clean_title = parts[0].strip()
                company = parts[1].strip()
            elif " - " in title:
                parts = title.split(" - ")
                clean_title = parts[0].strip()
                company = parts[-1].strip()
            else:
                clean_title = title
                domain = urlparse(url).netloc
                company = domain.split('.')[0].capitalize()

            # Remove unwanted sections
            for element in soup(["script", "style", "nav", "footer", "header"]):
                element.decompose()
                
            text = soup.get_text(separator="\n")
            lines = [line.strip() for line in text.splitlines() if line.strip()]
            clean_text = '\n'.join(lines)
            
            clean_text = clean_text[:10000]
            
            if len(clean_text) < 200:
                return None
                
            return {
                "title": clean_title[:100],
                "company": company[:100],
                "description": clean_text,
                "url": url
            }
        except Exception as e:
            print(f"Scrape error for {url}: {e}")
            return None

    def scrape_jobs_for_profile(self, job_title: str, limit: int = 5) -> list:
        """End-to-end flow: Search URLs -> Scrape Text -> Return Job dicts."""
        print(f"Scraping internet for: {job_title}")
        urls = self.fetch_job_urls(job_title, max_results=15)
        jobs = []
        for url in urls:
            if len(jobs) >= limit:
                break
            print(f"Fetching: {url}")
            job_data = self.scrape_job_description(url)
            if job_data:
                jobs.append(job_data)
            time.sleep(0.5) 
        print(f"Successfully scraped {len(jobs)} jobs from internet.")
        return jobs

dynamic_scraper = DynamicJobScraper()
