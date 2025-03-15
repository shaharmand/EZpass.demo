import os
from supabase import create_client
import openai
from typing import List, Dict
import json
from datetime import datetime
import time
from pathlib import Path
from dotenv import load_dotenv
from docx import Document
import glob

# Load environment variables from .env file
load_dotenv(Path(__file__).parent / '.env')

# Initialize clients
supabase = create_client(
    os.getenv("REACT_APP_SUPABASE_URL"),
    os.getenv("REACT_APP_SUPABASE_ANON_KEY")
)
openai.api_key = os.getenv("REACT_APP_OPENAI_API_KEY")

def get_embedding(text: str, retries: int = 3) -> List[float]:
    """Get embedding for text using OpenAI API with retry logic."""
    for attempt in range(retries):
        try:
            response = openai.embeddings.create(
                model="text-embedding-3-small",
                input=text,
                encoding_format="float"
            )
            return response.data[0].embedding
        except Exception as e:
            if attempt == retries - 1:
                raise
            print(f"Embedding attempt {attempt + 1} failed: {str(e)}. Retrying...")
            time.sleep(2 ** attempt)

def extract_doc_content(file_path: str) -> Dict:
    """Extract content and metadata from Word document."""
    doc = Document(file_path)
    
    # Get title from filename or first paragraph
    filename = Path(file_path).stem
    title = filename  # Default to filename
    
    # Extract all text
    content = []
    for para in doc.paragraphs:
        if para.text.strip():
            content.append(para.text)
    
    # Try to get subtopic from filename or content
    subtopic = None
    # TODO: Extract subtopic based on your naming convention or content structure
    
    return {
        'title': title,
        'content': '\n'.join(content),
        'subtopic_name_he': subtopic
    }

def store_doc_data(doc_data: Dict):
    """Store document data and its embedding in the videos table."""
    # Generate embedding for the content
    embedding = get_embedding(doc_data['content'])
    
    # Prepare data for insertion
    data = {
        'title': doc_data['title'],
        'content': doc_data['content'],
        'subtopic_name_he': doc_data['subtopic_name_he'],
        'embedding': embedding,
        'created_at': datetime.utcnow().isoformat()
    }
    
    # Insert into videos table
    supabase.table('videos').insert(data).execute()

def process_docs(docs_dir: str):
    """Process all Word documents in the specified directory."""
    # Find all .docx files
    doc_files = glob.glob(os.path.join(docs_dir, "**/*.docx"), recursive=True)
    
    print(f"Found {len(doc_files)} Word documents to process")
    
    for i, doc_file in enumerate(doc_files, 1):
        try:
            print(f"\nProcessing document {i}/{len(doc_files)}: {doc_file}")
            
            # Extract content
            doc_data = extract_doc_content(doc_file)
            print(f"Title: {doc_data['title']}")
            print(f"Content length: {len(doc_data['content'])} characters")
            
            # Store in database
            store_doc_data(doc_data)
            
            # Sleep to respect API rate limits
            time.sleep(1)
            
        except Exception as e:
            print(f"Error processing document {doc_file}: {str(e)}")
            continue

if __name__ == "__main__":
    # Get the documents directory from environment or use default
    docs_dir = os.getenv("WORD_DOCS_DIR", "docs")
    
    print(f"Starting document processing from directory: {docs_dir}")
    process_docs(docs_dir)
    print("Processing complete!") 