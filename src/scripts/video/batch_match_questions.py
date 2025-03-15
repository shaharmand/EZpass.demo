import os
from supabase import create_client
import openai
from typing import List, Dict
import json
from datetime import datetime
import time
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(Path(__file__).parent / '.env')

# Initialize clients with env vars
supabase = create_client(
    os.getenv("REACT_APP_SUPABASE_URL"),
    os.getenv("REACT_APP_SUPABASE_ANON_KEY")
)
openai.api_key = os.getenv("REACT_APP_OPENAI_API_KEY")

# Constants
MAX_RETRIES = 3
SAMPLE_SIZE = 30  # Process 30 questions for evaluation

def get_embedding(text: str, retries: int = MAX_RETRIES) -> List[float]:
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

def get_question_context(question: Dict) -> str:
    """Combine question text, options, and solution into searchable context."""
    context_parts = [
        question.get('text', ''),  # Question text
        question.get('solution', '')  # Solution explanation
    ]
    
    # Add options only for multiple choice questions
    if question.get('type') == 'multiple_choice':
        options = question.get('options', [])
        if options:
            options_text = '\n'.join(f"{opt.get('text', '')}" for opt in options)
            context_parts.append(options_text)
    
    return '\n'.join(part for part in context_parts if part)

def find_matching_videos(question: Dict, threshold: float = 0.5, max_matches: int = 3) -> List[Dict]:
    """Find matching videos for a question using full context."""
    # Get full question context
    question_context = get_question_context(question)
    query_embedding = get_embedding(question_context)
    
    # Search in Supabase based on pure content similarity
    results = supabase.rpc('match_videos', {
        'query_embedding': query_embedding,
        'subtopic': question.get('subtopic_name_he', ''),  # Keep for reference
        'subtopic_boost': 0.0,  # No boost - let pure content similarity decide
        'similarity_threshold': threshold,
        'max_results': max_matches
    }).execute()
    
    # Process results
    matches = []
    for result in results.data:
        # Extract summary if it exists
        content = result['content']
        summary_start = content.find('לסיכום')
        relevant_content = content[summary_start:] if summary_start != -1 else content
        
        matches.append({
            'video_id': result['id'],
            'title': result['title'],
            'similarity': result['similarity'],
            'relevant_content': relevant_content[:500],  # Store first 500 chars of relevant content
            'subtopic': result.get('subtopic_name_he', '')  # Store Hebrew subtopic name
        })
    
    return matches

def store_matches(question_id: str, matches: List[Dict]):
    """Store video matches for a question in the database."""
    data = {
        'question_id': question_id,
        'video_matches': matches,
        'last_updated': datetime.utcnow().isoformat(),
        'is_reviewed': False
    }
    
    # Using upsert to update if exists, insert if not
    supabase.table('question_video_matches').upsert(data).execute()

def print_match_details(question: Dict, matches: List[Dict]):
    """Print detailed information about question and its matches."""
    print("\n" + "="*80)
    print(f"Question ID: {question['id']}")
    print(f"Question Text: {question.get('text', '')[:200]}...")
    print(f"Question Subtopic: {question.get('subtopic_name_he', 'None')}")
    print(f"Question Type: {question.get('type', 'unknown')}")
    print("\nMatching Videos:")
    
    for i, match in enumerate(matches, 1):
        print(f"\n{i}. {match['title']}")
        print(f"   Similarity: {match['similarity']:.2%}")
        print(f"   Video Subtopic: {match['subtopic']}")
        print(f"   Content Preview: {match['relevant_content'][:200]}...")
    print("="*80)

def process_sample_questions():
    """Process a sample of questions and show detailed results."""
    # Get questions with their full data
    response = supabase.table('questions').select('*').execute()
    questions = response.data[:SAMPLE_SIZE]  # Take first 30 questions
    
    print(f"Processing {len(questions)} sample questions for evaluation")
    
    start_time = time.time()
    results = []
    
    for i, question in enumerate(questions, 1):
        try:
            print(f"\nProcessing question {i}/{SAMPLE_SIZE}")
            
            # Find matching videos
            matches = find_matching_videos(question)
            
            # Store matches in database
            store_matches(question['id'], matches)
            
            # Print detailed results for evaluation
            print_match_details(question, matches)
            
            # Collect results for summary
            results.append({
                'question_id': question['id'],
                'matches_count': len(matches),
                'top_similarity': matches[0]['similarity'] if matches else 0,
                'same_subtopic_count': sum(1 for m in matches if m['subtopic'] == question.get('subtopic_name_he', ''))
            })
            
            # Sleep to respect API rate limits
            time.sleep(1)
            
        except Exception as e:
            print(f"Error processing question {question['id']}: {str(e)}")
            continue
    
    # Print summary statistics
    print("\nSummary Statistics:")
    print(f"Total questions processed: {len(results)}")
    avg_similarity = sum(r['top_similarity'] for r in results) / len(results)
    print(f"Average top match similarity: {avg_similarity:.2%}")
    same_subtopic_total = sum(r['same_subtopic_count'] for r in results)
    print(f"Matches from same subtopic: {same_subtopic_total}/{sum(r['matches_count'] for r in results)}")
    print(f"\nTotal processing time: {(time.time() - start_time)/60:.1f} minutes")

if __name__ == "__main__":
    print("Starting sample processing for evaluation...")
    process_sample_questions()
    print("Evaluation complete!") 