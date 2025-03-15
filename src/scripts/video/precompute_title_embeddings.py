import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from tqdm import tqdm

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('REACT_APP_OPENAI_API_KEY'))

def get_embedding(text: str) -> list[float]:
    """Get embedding for text using OpenAI API"""
    try:
        if not text or not isinstance(text, str):
            print(f"Error: Input text must be a non-empty string. Got: {text}")
            return None
            
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text.strip(),
            encoding_format="float"
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error getting embedding: {str(e)}")
        return None

def main():
    # First load lessons data to get lesson names
    lessons_data = None
    lessons_paths = [
        'lesson_info.json',
        'data/lesson_info.json',
        'public/data/lesson_info.json'
    ]
    
    for path in lessons_paths:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                lessons_data = json.load(f)
                print(f"Found lessons data at: {path}")
                break
        except FileNotFoundError:
            continue
            
    if not lessons_data:
        print("Could not find lesson_info.json in any expected location")
        return
        
    # Create lookup dictionary for lesson names
    lesson_names = {}
    if 'lessons' in lessons_data:
        for lesson in lessons_data['lessons']:
            lesson_id = str(lesson.get('id'))  # Convert to string to be safe
            lesson_names[lesson_id] = lesson.get('name', '')
    
    print(f"Loaded {len(lesson_names)} lesson names")
    
    # Now load video data
    possible_paths = [
        'processed_summaries_with_terms.json',
        'data/processed_summaries_with_terms.json'
    ]
    
    data = None
    input_path = None
    for path in possible_paths:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                input_path = path
                break
        except FileNotFoundError:
            continue
    
    if data is None:
        print("Could not find processed_summaries_with_terms.json in any expected location")
        return
        
    print(f"Found video data at: {input_path}")
    print(f"Total videos to process: {len(data['summaries'])}")
    print("Processing all videos and computing embeddings...")
    
    # Process each video and add title embedding
    processed_count = 0
    for doc in tqdm(data['summaries'], desc="Computing title embeddings"):
        lesson_id = str(doc.get('lesson_number', ''))
        lesson_name = lesson_names.get(lesson_id, 'NO LESSON NAME')
        video_title = doc.get('video_title', 'NO TITLE')
        
        print(f"\nProcessing video {processed_count + 1}:")
        print(f"Video title: {video_title}")
        print(f"Lesson ID: {lesson_id}")
        print(f"Lesson name: {lesson_name}")
        
        if lesson_name == 'NO LESSON NAME':
            print(f"Warning: Could not find lesson name for lesson ID: {lesson_id}")
            continue
            
        if video_title == 'NO TITLE':
            print(f"Warning: Missing video title")
            continue
            
        # Combine lesson name and video title with dash
        combined_title = f"{lesson_name} - {video_title}"
        print(f"Combined title: {combined_title}")
        
        # Force recompute embedding
        title_embedding = get_embedding(combined_title)
        if title_embedding:
            doc['title_embedding'] = title_embedding
            doc['combined_title'] = combined_title
            processed_count += 1
        else:
            print(f"Warning: Failed to get embedding for title: {combined_title}")
    
    # Save back to the same file
    print(f"\nProcessed {processed_count} videos successfully")
    print(f"Saving updated data back to {input_path}")
    with open(input_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("Done! Title embeddings have been precomputed and saved.")

if __name__ == "__main__":
    main() 