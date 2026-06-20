from app.services.ai_matcher import AIMatcher
import pytest
from unittest.mock import patch, MagicMock
import json

@pytest.fixture
def ai_matcher():
    # Mocking the AI Matcher to avoid downloading HuggingFace models during tests
    with patch('app.services.ai_matcher.HuggingFaceEmbeddings'), \
         patch('app.services.ai_matcher.ChatGoogleGenerativeAI'):
        matcher = AIMatcher()
        return matcher

def test_calculate_similarity_mocked(ai_matcher):
    # Mock the Chroma vector store
    with patch('app.services.ai_matcher.Chroma') as mock_chroma:
        mock_instance = MagicMock()
        mock_instance.similarity_search_with_score.return_value = [(MagicMock(), 0.5)]
        mock_chroma.from_texts.return_value = mock_instance
        
        score = ai_matcher.calculate_similarity("I know Python", "Need Python dev")
        assert score == 75.0

def test_analyze_gaps_mocked(ai_matcher):
    with patch.object(ai_matcher, 'llm') as mock_llm:
        mock_response = MagicMock()
        mock_response.content = '```json\n{"missing_skills": ["Docker", "Kubernetes"]}\n```'
        # The chain | invoke returns the response
        # Wait, we need to mock the entire chain or the prompt | llm behavior.
        # Since we use prompt | llm, mock_llm.invoke is called.
        mock_llm.invoke.return_value = mock_response
        
        result = ai_matcher.analyze_gaps("I know Python", "Need Python and Docker")
        assert "missing_skills" in result
        assert "Docker" in result["missing_skills"]
