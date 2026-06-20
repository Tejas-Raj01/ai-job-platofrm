import time
import requests
import html2text

class DynamicJobScraper:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        }
        self.html_converter = html2text.HTML2Text()
        self.html_converter.ignore_links = True
        self.html_converter.ignore_images = True
        self.html_converter.body_width = 0

    def scrape_jobs_for_profile(self, keywords: str, limit: int = 15) -> list:
        """Hits the Remotive API with extracted keywords and returns job descriptions."""
        print(f"Searching Remotive API for: {keywords}")
        url = f"https://remotive.com/api/remote-jobs?search={requests.utils.quote(keywords)}&limit={limit}"
        jobs = []
        try:
            resp = requests.get(url, headers=self.headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("jobs", [])
                for item in results[:limit]:
                    clean_desc = self.html_converter.handle(item.get("description", ""))
                    clean_desc = clean_desc[:10000] # Limit tokens
                    if len(clean_desc) > 100:
                        jobs.append({
                            "title": item.get("title", "Job Posting")[:100],
                            "company": item.get("company_name", "Unknown Company")[:100],
                            "description": clean_desc,
                            "url": item.get("url", "")
                        })
        except Exception as e:
            print(f"Remotive API error: {e}")
            
        print(f"Successfully scraped {len(jobs)} jobs from internet.")
        return jobs

dynamic_scraper = DynamicJobScraper()
