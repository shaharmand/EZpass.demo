import os
import json
import numpy as np
from openai import OpenAI
from dotenv import load_dotenv
from supabase import create_client, Client
import sys

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('REACT_APP_OPENAI_API_KEY'))

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv('REACT_APP_SUPABASE_URL'),
    os.getenv('REACT_APP_SUPABASE_ANON_KEY')
)

def get_embedding(text: str) -> list[float]:
    """Get embedding for text using OpenAI API"""
    try:
        # Ensure text is not empty and is a string
        if not text or not isinstance(text, str):
            print(f"Error: Input text must be a non-empty string. Got: {text}")
            return None
            
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text.strip(),  # Ensure text is stripped of whitespace
            encoding_format="float"
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error getting embedding: {str(e)}")
        return None

def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def get_question_by_id(question_id: str):
    """Get question details from Supabase"""
    try:
        response = supabase.table('questions').select('*').eq('id', question_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error querying database: {str(e)}")
        return None

def get_subtopic_info(subtopic_id: str):
    """Get subtopic information - just return the ID for now"""
    return {'id': subtopic_id} if subtopic_id else None

def load_lesson_names():
    """Load lesson names from lesson_info.json"""
    try:
        lesson_paths = [
            'lesson_info.json',
            'data/lesson_info.json',
            'public/data/lesson_info.json'
        ]
        
        for path in lesson_paths:
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if 'lessons' in data:
                        # Create lookup dictionary
                        return {str(lesson['id']): lesson['name'] for lesson in data['lessons']}
            except FileNotFoundError:
                continue
                
        print("Warning: Could not find lesson_info.json")
        return {}
    except Exception as e:
        print(f"Error loading lesson names: {str(e)}")
        return {}

# Load lesson names at module level
LESSON_NAMES = load_lesson_names()

def format_video_info(match):
    """Format video information consistently with lesson name"""
    lesson_num = match.get('lesson_number', 'N/A')
    segment_num = match.get('segment_number', 'N/A')
    video_title = match.get('video_title', 'N/A')
    
    # Get lesson name from our lookup
    lesson_name = LESSON_NAMES.get(str(lesson_num), 'Unknown Lesson')
    
    return f"שיעור {lesson_num}.{segment_num} - {lesson_name} - {video_title}"

def get_hebrew_subtopic_name(subtopic_id: str) -> str:
    """Get Hebrew subtopic name from construction_safety.json"""
    if not subtopic_id:
        raise ValueError("No subtopic ID provided")
        
    try:
        with open('data/subjects/construction_safety.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            
            # Search through all topics and their subtopics
            for topic in data['topics']:
                for subtopic in topic['subTopics']:
                    if subtopic['id'] == subtopic_id:
                        return subtopic['name']
                        
            # If we get here, we didn't find the subtopic
            raise ValueError(f"Could not find Hebrew name for subtopic: {subtopic_id}")
            
    except FileNotFoundError:
        raise ValueError("Could not find construction_safety.json")
    except json.JSONDecodeError:
        raise ValueError("Error parsing construction_safety.json")
    except Exception as e:
        raise ValueError(f"Error loading Hebrew subtopic name: {str(e)}")

def create_question_embedding_text(question_data: dict) -> str:
    """Single source of truth for creating the embedding text from question data."""
    
    try:
        # Extract all required components
        metadata = question_data.get('metadata', {})
        subtopic_id = metadata.get('subtopicId', '')
        
        # Try to get Hebrew name - if we can't, log and exit
        try:
            subtopic_name = get_hebrew_subtopic_name(subtopic_id)
            print(f"\nFound subtopic: {subtopic_name} (ID: {subtopic_id})")
        except ValueError as e:
            print(f"\nError: לא נמצא שם בעברית לתת-נושא {subtopic_id}")
            print(f"פרטי השגיאה: {str(e)}")
            sys.exit(1)
            
        # Rest of the function...
        question_text = question_data.get('content', {}).get('text', '')
        
        # Format options with Hebrew letters
        hebrew_letters = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י']
        content_options = question_data.get('content', {}).get('options', [])
        options_text = "\n".join(
            f"{hebrew_letters[i]}. {opt['text'] if isinstance(opt, dict) else str(opt)}"
            for i, opt in enumerate(content_options)
        ) if content_options else ""
        
        # Get solution and answer
        school_answer = question_data.get('schoolAnswer', {})
        solution = school_answer.get('solution', '')
        solution_text = solution['text'] if isinstance(solution, dict) else solution
        final_answer = school_answer.get('finalAnswer', {})
        final_answer_value = final_answer.get('value', 1) if isinstance(final_answer, dict) else final_answer
        
        if not content_options or not final_answer_value:
            raise ValueError("Missing content_options or finalAnswer")
        
        # Get correct answer text
        final_answer_value = int(final_answer_value)
        correct_letter = hebrew_letters[final_answer_value - 1]
        correct_text = content_options[final_answer_value - 1]['text']
        
        return f"""שיעור ב{subtopic_name}
המיקוד בשאלה:
{question_text}

{options_text}

התשובה הנכונה היא {correct_letter}. {correct_text}

הסבר:
{solution_text}"""
    except Exception as e:
        print(f"\nשגיאה ביצירת טקסט לשאלה: {str(e)}")
        sys.exit(1)

def create_structured_question_text(question_data):
    """Create structured text from question data"""
    return create_question_embedding_text(question_data)

def find_matches(question_embedding: list[float], question_data: dict, top_k: int = 10):
    """Find top k matches using semantic similarity with small subtopic boost"""
    try:
        # Load processed summaries
        with open('data/processed_summaries.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        results = []
        manager_video = None
        
        # Calculate scores for all videos
        for doc in data['summaries']:
            if doc['embedding'] is None:
                continue
                
            # Calculate semantic similarity
            similarity = cosine_similarity(question_embedding, doc['embedding'])
            
            # Small boost for same subtopic
            subtopic_boost = 0.2 if doc.get('subtopic_id') == question_data.get('metadata', {}).get('subtopicId') else 0.0
            final_score = similarity * (1 + subtopic_boost)
            
            # Store result with similarity and boost
            match = {
                **doc,
                'score_breakdown': {
                    'base_similarity': similarity,
                    'solution_similarity': 0.0,  # Kept for compatibility
                    'title_similarity': 0.0,     # Kept for compatibility
                    'subtopic_boost': subtopic_boost,
                    'final_score': final_score
                }
            }
            
            results.append(match)
            
            # Track manager video if this is one
            if doc.get('isManagerVideo'):
                manager_video = match
        
        print("\nSorting results...")
        # Sort results by final score
        results.sort(key=lambda x: x['score_breakdown']['final_score'], reverse=True)
        
        # Take top k results
        final_results = results[:top_k]
        
        print("\nTop 10 matches:")
        for i, match in enumerate(final_results[:10], 1):
            print(f"\n{i}. {format_video_info(match)}")
            print(f"Score: {match['score_breakdown']['final_score']:.3f}")
            if match.get('subtopic_id') == question_data.get('metadata', {}).get('subtopicId'):
                print("(Same subtopic)")
        
        return final_results, manager_video
        
    except Exception as e:
        print(f"Error finding matches: {str(e)}")
        return [], None

def get_word_doc_path(lesson_num: int, segment_num: int) -> str:
    """Get the full path to the Word document"""
    try:
        base_paths = [
            "data/Videos/Videos_summaries",
            "Videos/Videos_summaries",
            "public/data/Videos/Videos_summaries"
        ]
        
        for base_path in base_paths:
            if os.path.exists(base_path):
                # List all files in the directory
                files = os.listdir(base_path)
                # Find the matching file
                for file in files:
                    if file.startswith(f"שיעור {lesson_num}.{segment_num}") and file.endswith(".docx"):
                        full_path = os.path.abspath(os.path.join(base_path, file))
                        print(f"Found word doc: {full_path}")
                        return full_path
                        
        print(f"Warning: No word doc found for lesson {lesson_num}.{segment_num}")
        return None
    except Exception as e:
        print(f"Error finding word doc: {str(e)}")
        return None

def write_results(results_file: str, embedding_text: str, results: dict):
    """Write the results to a file."""
    with open(results_file, 'w', encoding='utf-8') as f:
        # Write the embedding text first
        f.write(embedding_text)
        
        # Write matches section
        f.write("\n\nTop Matches:\n")
        f.write("-" * 80 + "\n")
        
        for i, match in enumerate(results.get('matches', []), 1):
            f.write(f"\n{i}. Match (Final Score: {match['score_breakdown']['final_score']:.3f})\n")
            
            # Get lesson name and format full video info
            lesson_num = match.get('lesson_number', 'N/A')
            segment_num = match.get('segment_number', 'N/A')
            video_title = match.get('video_title', 'N/A')
            lesson_name = LESSON_NAMES.get(str(lesson_num), 'Unknown Lesson')
            
            # Write full video information with RTL mark
            f.write(f"\u202Bשיעור {lesson_num}.{segment_num} - {lesson_name} - {video_title}\n")
            
            # Subtopic information
            subtopic_id = match.get('subtopic_id', 'N/A')
            subtopic_match = subtopic_id == results.get('metadata', {}).get('subtopicId')
            f.write(f"SubtopicId: {subtopic_id}")
            if subtopic_match:
                f.write(" (MATCH!)")
            f.write("\n")
            
            # Write score breakdown
            breakdown = match['score_breakdown']
            f.write("\nScore Breakdown:\n")
            f.write(f"- Base Similarity: {breakdown['base_similarity']:.3f}\n")
            f.write(f"- Solution Similarity: {breakdown['solution_similarity']:.3f}\n")
            f.write(f"- Title Similarity: {breakdown['title_similarity']:.3f}\n")
            f.write(f"- Subtopic Boost: {breakdown['subtopic_boost']:.3f}\n")
            
            # Get and write word document path
            word_path = get_word_doc_path(lesson_num, segment_num)
            if word_path:
                file_url = f"file:///{word_path.replace(os.sep, '/')}"
                f.write(f"Word Doc: {file_url}\n")
            else:
                f.write("Word Doc: Not found\n")
                
            # Write video URL
            video_id = match.get('video_id', '').replace('video_', '')
            vimeo_url = f"https://vimeo.com/{video_id}"
            f.write(f"Video URL: {vimeo_url}\n")
            
            f.write("\nContent Preview:\n")
            f.write(f"{match.get('content', 'N/A')}\n")
            
        # Write debug info about מנהל עבודה video if exists
        if results.get('manager_video'):
            f.write("\n\u202BDebug - מנהל עבודה Video Information:\n")
            manager = results['manager_video']
            lesson_num = manager.get('lesson_number', 'N/A')
            segment_num = manager.get('segment_number', 'N/A')
            video_title = manager.get('video_title', 'N/A')
            lesson_name = LESSON_NAMES.get(str(lesson_num), 'Unknown Lesson')
            
            f.write(f"\u202Bשיעור {lesson_num}.{segment_num} - {lesson_name} - {video_title}\n")
            f.write(f"SubtopicId: {manager.get('subtopic_id', 'N/A')}\n")
            f.write(f"Score: {manager['score_breakdown']['final_score']:.3f}\n")
            
            # Write score breakdown for manager video
            breakdown = manager['score_breakdown']
            f.write("\nScore Breakdown:\n")
            f.write(f"- Base Similarity: {breakdown['base_similarity']:.3f}\n")
            f.write(f"- Solution Similarity: {breakdown['solution_similarity']:.3f}\n")
            f.write(f"- Title Similarity: {breakdown['title_similarity']:.3f}\n")
            f.write(f"- Subtopic Boost: {breakdown['subtopic_boost']:.3f}\n")
            
            # Get and write word document path for manager video
            word_path = get_word_doc_path(lesson_num, segment_num)
            if word_path:
                file_url = f"file:///{word_path.replace(os.sep, '/')}"
                f.write(f"Word Doc: {file_url}\n")
            else:
                f.write("Word Doc: Not found\n")
            
            f.write("\nContent Preview:\n")
            f.write(f"{manager.get('content', 'N/A')}\n")
            
    print(f"\nResults written to {results_file}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python evaluate_matches.py <question_id>")
        return
        
    question_id = sys.argv[1]
    print(f"\nProcessing question ID: {question_id}")
    
    # Get question from database
    question = get_question_by_id(question_id)
    if not question:
        print(f"No question found with ID: {question_id}")
        return
    
    try:
        question_data = question['data']
        
        # Create embedding text and get embedding
        embedding_text = create_question_embedding_text(question_data)
        if not embedding_text:
            print("Failed to create embedding text")
            return
            
        question_embedding = get_embedding(embedding_text)
        if not question_embedding:
            print("Failed to generate embedding")
            return
        
        # Extract fields for display
        metadata = question_data.get('metadata', {})
        content_text = question_data.get('content', {}).get('text', '')
        school_answer = question_data.get('schoolAnswer', {}).get('solution', '')
        content_options = question_data.get('content', {}).get('options', [])
        
        print(f"\nQuestion Text: {content_text}")
        print(f"Question SubtopicId: {metadata.get('subtopicId', 'N/A')}")
        
        # Find matches with the generated embedding
        matches, manager_video = find_matches(question_embedding, question_data)
        
        print("\nAdding word doc paths to matches...")
        # Add word doc paths
        for match in matches:
            word_path = get_word_doc_path(match.get('lesson_number'), match.get('segment_number'))
            match['word_path'] = word_path
            
        # Collect all results
        results = {
            'metadata': metadata,
            'metadata_type': metadata.get('type', ''),
            'content_text': content_text,
            'school_answer': school_answer,
            'content_options': content_options,
            'matches': matches,
            'manager_video': manager_video
        }
        
        # Write results to file with both embedding text and matches
        output_file = f"results_{question_id}.txt"
        write_results(output_file, embedding_text, results)
            
    except KeyError as e:
        print(f"Error: Missing required field: {e}")
        return

if __name__ == "__main__":
    main() 