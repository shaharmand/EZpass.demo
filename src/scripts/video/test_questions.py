import os
from pathlib import Path
import json
import openai
from supabase import create_client
from typing import Dict, List
import csv
from datetime import datetime

# Initialize clients
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)
openai.api_key = os.getenv("OPENAI_API_KEY")

def get_embedding(text: str) -> List[float]:
    """Get embedding for text using OpenAI's API."""
    response = openai.embeddings.create(
        model="text-embedding-3-small",
        input=text,
        encoding_format="float"
    )
    return response.data[0].embedding

def find_matching_videos(
    question_id: str,
    question_text: str,
    options: List[str],
    solution: str,
    subtopic: str,
    subtopic_boost: float = 0.3,
    similarity_threshold: float = 0.6,
    max_results: int = 5
) -> Dict:
    """Find matching videos for a question and return detailed results."""
    
    # Combine question components for search
    search_text = f"""
    שאלה: {question_text}
    
    אפשרויות:
    {chr(10).join(f'{i+1}. {opt}' for i, opt in enumerate(options))}
    
    פתרון:
    {solution}
    """
    
    # Get embedding
    query_embedding = get_embedding(search_text)
    
    # Search videos
    results = supabase.rpc('match_videos_debug', {
        'query_embedding': query_embedding,
        'subtopic': subtopic,
        'subtopic_boost': subtopic_boost,
        'similarity_threshold': similarity_threshold,
        'max_results': max_results
    }).execute()
    
    return {
        'question_id': question_id,
        'question_text': question_text,
        'subtopic': subtopic,
        'matches': results.data,
        'search_text': search_text,
        'timestamp': datetime.now().isoformat()
    }

def save_results(results: Dict, output_dir: Path):
    """Save search results in both JSON and CSV formats."""
    
    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save detailed JSON results
    json_path = output_dir / f"question_{results['question_id']}_results.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    # Save CSV summary
    csv_path = output_dir / f"question_{results['question_id']}_summary.csv"
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Rank', 'Video', 'Title', 'Similarity', 'Final Score'])
        
        for match in results['matches']:
            writer.writerow([
                match['rank'],
                f"{match['lesson_number']}.{match['segment_number']}",
                match['title'],
                f"{match['similarity']:.3f}",
                f"{match['final_score']:.3f}"
            ])

def test_questions(questions_file: Path, output_dir: Path):
    """Test a batch of questions and save results."""
    
    # Load questions
    with open(questions_file, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    all_results = []
    
    # Process each question
    for question in questions:
        try:
            print(f"Processing question {question['id']}...")
            
            results = find_matching_videos(
                question_id=question['id'],
                question_text=question['text'],
                options=question['options'],
                solution=question['solution'],
                subtopic=question['subtopic']
            )
            
            # Save individual question results
            save_results(results, output_dir)
            
            # Add to summary
            all_results.append({
                'question_id': question['id'],
                'top_match': f"{results['matches'][0]['lesson_number']}.{results['matches'][0]['segment_number']}",
                'top_score': results['matches'][0]['final_score']
            })
            
            print(f"Completed question {question['id']}")
            
        except Exception as e:
            print(f"Error processing question {question['id']}: {str(e)}")
    
    # Save summary of all results
    summary_path = output_dir / "all_questions_summary.json"
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    # Example questions file structure:
    """
    [
        {
            "id": "q123",
            "text": "מהם התנאים לבדיקת פיגום?",
            "options": [
                "בדיקה יומית",
                "בדיקה שבועית",
                "בדיקה חודשית"
            ],
            "solution": "התשובה היא ב - נדרשת בדיקה שבועית של פיגומים...",
            "subtopic": "פיגומים"
        },
        ...
    ]
    """
    
    questions_file = Path("data/test_questions.json")
    output_dir = Path("results/video_matches")
    
    test_questions(questions_file, output_dir) 