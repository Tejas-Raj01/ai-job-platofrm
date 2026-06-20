import io
import PyPDF2
import re

class DocumentProcessor:
    @staticmethod
    def extract_text_from_pdf(pdf_bytes: bytes) -> str:
        """
        Extracts and cleans text from PDF byte stream.
        """
        try:
            reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
                    
            # Basic cleaning: remove extra whitespace and non-ascii
            text = re.sub(r'\s+', ' ', text).strip()
            # Retain mostly ASCII for safe processing
            text = text.encode("ascii", "ignore").decode()
            
            return text
        except Exception as e:
            print(f"PDF Extraction Error: {e}")
            return ""

document_processor = DocumentProcessor()
