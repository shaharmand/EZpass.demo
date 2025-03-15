from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
from supabase import create_client
import openai
from pathlib import Path
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Initialize clients
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)
openai.api_key = os.getenv("OPENAI_API_KEY")

# Mount templates
templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))

class SearchQuery(BaseModel):
    query: str
    subtopic: str = ""  # Optional subtopic filter

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("test_matching.html", {"request": request})

@app.post("/api/search")
async def search(query: SearchQuery):
    # Get embedding for search query
    response = openai.embeddings.create(
        model="text-embedding-3-small",
        input=query.query,
        encoding_format="float"
    )
    query_embedding = response.data[0].embedding
    
    # Search in Supabase with debug info
    results = supabase.rpc('match_videos_debug', {
        'query_embedding': query_embedding,
        'subtopic': query.subtopic,
        'subtopic_boost': 0.3 if query.subtopic else 0.0,
        'similarity_threshold': 0.5,
        'max_results': 4
    }).execute()
    
    # Process results to highlight relevant content
    processed_results = []
    for result in results.data:
        # Extract summary section if it exists
        content = result['content']
        summary_start = content.find('לסיכום')
        if summary_start != -1:
            # Add the summary at the top if it exists
            summary_section = content[summary_start:]
            remaining_content = content[:summary_start].strip()
            content = f"{summary_section}\n\n{remaining_content}"
        
        # Split content into paragraphs and format
        paragraphs = content.split('\n')
        formatted_content = []
        for para in paragraphs:
            if para.strip():
                if para.endswith(':'):  # Likely a header
                    formatted_content.append(f"\n### {para}\n")
                else:
                    formatted_content.append(para)
        
        # Create simplified result object
        processed_result = {
            'title': result['title'],
            'content': '\n'.join(formatted_content),
            'similarity': result['similarity']
        }
        processed_results.append(processed_result)
    
    return processed_results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 