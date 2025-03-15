import os
from pathlib import Path
import json
from docx import Document
import re
from openai import OpenAI
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('REACT_APP_OPENAI_API_KEY'))

def load_config():
    """Load configuration from JSON file"""
    try:
        with open('src/scripts/video/config.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading config: {str(e)}")
        raise

# Load config at module level
CONFIG = load_config()

def get_embedding(text):
    """Get embedding for text using OpenAI API"""
    if not text:
        return None
        
    # Rate limiting using config
    time.sleep(CONFIG['openai']['rate_limit_delay'])
    
    try:
        response = client.embeddings.create(
            model=CONFIG['openai']['model'],
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error getting embedding: {str(e)}")
        return None

def load_video_data():
    """Load video data from JSON file"""
    with open(CONFIG['paths']['video_data'], 'r', encoding='utf-8') as f:
        return json.load(f)

def load_lesson_info():
    """Load lesson names from lesson_info.json"""
    with open(CONFIG['paths']['lesson_info'], 'r', encoding='utf-8') as f:
        data = json.load(f)
        return {str(lesson['id']): lesson['name'] for lesson in data['lessons']}

def extract_lesson_segment(filename):
    """Extract lesson number and segment number from filename"""
    match = re.search(r'שיעור (\d+)\.(\d+)', filename)
    if match:
        return int(match.group(1)), int(match.group(2))
    return None, None

def extract_content(doc_path):
    """Extract content from Word document with simple paragraph breaks"""
    doc = Document(doc_path)
    paragraphs = []
    for paragraph in doc.paragraphs:
        text = paragraph.text.strip()
        if text:  # Only add non-empty paragraphs
            paragraphs.append(text)
            paragraphs.append("")  # Add a blank line between paragraphs
    
    return "\n".join(paragraphs)

def load_subtopic_translations():
    """Load subtopic translations from construction_safety.json - the source of truth"""
    try:
        with open('data/subjects/construction_safety.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            translations = {}
            # Iterate through all topics and their subtopics
            for topic in data['topics']:
                for subtopic in topic['subTopics']:
                    translations[subtopic['id']] = subtopic['name']
            return translations
    except FileNotFoundError:
        print("Warning: construction_safety.json not found. Using subtopicIds as names.")
        return {}
    except Exception as e:
        print(f"Error loading subtopic translations: {str(e)}")
        return {}

def create_formatted_text(lesson_name, video_title, content):
    """Create formatted text using lesson name and video title"""
    return f"""שיעור ב{lesson_name}
מיקוד ב{video_title}
סיכום השיעור:
{content}"""

def load_topic_names():
    """Load topic and lesson names from construction_safety.json"""
    try:
        with open('data/subjects/construction_safety.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            topic_names = {}
            for topic in data['topics']:
                topic_names[topic['id']] = topic['name']
            return topic_names
    except Exception as e:
        print(f"Error loading topic names: {str(e)}")
        return {}

def get_topic_name_for_subtopic(subtopic_id):
    """Get the Hebrew topic name for a given subtopic ID from construction_safety.json"""
    try:
        with open('data/subjects/construction_safety.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            for topic in data['topics']:
                for subtopic in topic['subTopics']:
                    if subtopic['id'] == subtopic_id:
                        return topic['name']
            return subtopic_id  # Fallback to subtopic_id if not found
    except Exception as e:
        print(f"Error finding topic name: {str(e)}")
        return subtopic_id

def process_summaries(docs_dir):
    """Process all Word documents and match with video data"""
    video_data = load_video_data()
    videos = {(v['lessonNumber'], v['segmentNumber']): v for v in video_data['videos']}
    results = []
    
    # Create verification report file
    with open('process_summaries_verification.txt', 'w', encoding='utf-8') as verification:
        verification.write("VERIFICATION REPORT\n")
        verification.write("==================\n\n")
        
        # Create debug log file
        with open(CONFIG['paths']['debug_log'], 'w', encoding='utf-8') as log:
            for doc_file in Path(docs_dir).glob('*.docx'):
                try:
                    verification.write(f"\nProcessing: {doc_file.name}\n")
                    verification.write("-" * 80 + "\n")
                    
                    lesson_num, segment_num = extract_lesson_segment(doc_file.name)
                    if not lesson_num or not segment_num:
                        verification.write(f"ERROR: Could not extract lesson/segment from filename\n")
                        print(f"Could not extract lesson/segment from filename: {doc_file.name}")
                        continue
                        
                    video = videos.get((lesson_num, segment_num))
                    if not video:
                        verification.write(f"ERROR: No matching video found for lesson {lesson_num}.{segment_num}\n")
                        print(f"No matching video found for lesson {lesson_num}.{segment_num} ({doc_file.name})")
                        continue
                    
                    # Get topic name based on subtopic ID
                    topic_name = get_topic_name_for_subtopic(video['subtopicId'])
                    
                    # Extract content with paragraph breaks
                    content = extract_content(doc_file)
                    
                    # Create formatted text using topic name and video title
                    formatted_text = create_formatted_text(topic_name, video['title'], content)
                    
                    # Write verification info
                    verification.write(f"Found matches:\n")
                    verification.write(f"  - Lesson number: {lesson_num}\n")
                    verification.write(f"  - Segment number: {segment_num}\n")
                    verification.write(f"  - Topic name: {topic_name}\n")
                    verification.write(f"  - Video title: {video['title']}\n")
                    verification.write(f"  - Video ID: {video['id']}\n")
                    verification.write(f"  - Subtopic ID: {video['subtopicId']}\n\n")
                    verification.write("Formatted output:\n")
                    verification.write("-" * 40 + "\n")
                    verification.write(formatted_text)
                    verification.write("\n" + "-" * 40 + "\n\n")

                    # Generate embedding for the full formatted text
                    embedding = get_embedding(formatted_text)
                    verification.write(f"Embedding generated: {'Success' if embedding else 'Failed'}\n")
                    
                    # Log the formatted content for review
                    separator = CONFIG['templates']['debug_format']['separator'] * 80
                    log.write(f"\n{separator}\n")
                    log.write(f"File: {doc_file.name}\n")
                    log.write(f"Lesson: {lesson_num} ({topic_name})\n")
                    log.write(f"Segment: {segment_num}\n")
                    log.write(f"Video Title: {video['title']}\n\n")
                    log.write(formatted_text)
                    log.write(f"\n{separator}\n")
                    
                    result = {
                        'video_id': video['id'],
                        'video_title': video['title'],
                        'lesson_number': lesson_num,
                        'segment_number': segment_num,
                        'subtopic_id': video['subtopicId'],
                        'content': formatted_text,
                        'embedding': embedding
                    }
                    
                    results.append(result)
                    print(f"Processed: Lesson {lesson_num}.{segment_num} - {video['title']}")
                    
                except Exception as e:
                    verification.write(f"ERROR: Failed to process file: {str(e)}\n")
                    print(f"Error processing {doc_file.name}: {str(e)}")
    
    # Save results
    output_file = CONFIG['paths']['processed_summaries']
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({'summaries': results}, f, ensure_ascii=False, indent=2)
    
    print(f"\nProcessed {len(results)} documents")
    print(f"Results saved to {output_file}")
    print(f"Debug log saved to {CONFIG['paths']['debug_log']}")
    print(f"Verification report saved to process_summaries_verification.txt")

def process_summaries_quick_debug(docs_dir):
    """Quick debug version - no embeddings, just format verification"""
    video_data = load_video_data()
    lesson_names = load_lesson_info()
    videos = {(v['lessonNumber'], v['segmentNumber']): v for v in video_data['videos']}
    
    # Create debug log file
    with open('process_summaries_debug.log', 'w', encoding='utf-8') as log:
        for doc_file in Path(docs_dir).glob('*.docx'):
            try:
                lesson_num, segment_num = extract_lesson_segment(doc_file.name)
                if not lesson_num or not segment_num:
                    print(f"Could not extract lesson/segment from filename: {doc_file.name}")
                    continue
                    
                video = videos.get((lesson_num, segment_num))
                if not video:
                    print(f"No matching video found for lesson {lesson_num}.{segment_num} ({doc_file.name})")
                    continue
                
                lesson_name = lesson_names.get(str(lesson_num), "UNKNOWN LESSON")
                content = extract_content(doc_file)
                
                formatted_text = f"""
{'='*80}
File: {doc_file.name}
Lesson: {lesson_num} ({lesson_name})
Segment: {segment_num}
Video Title: {video['title']}

FORMATTED CONTENT:
----------------
שיעור ב{lesson_name}
מיקוד ב{video['title']}
סיכום השיעור:
{content}
{'='*80}
"""
                log.write(formatted_text)
                print(f"Processed: Lesson {lesson_num}.{segment_num} - {video['title']}")
                
            except Exception as e:
                print(f"Error processing {doc_file.name}: {str(e)}")
    
    print(f"\nDebug log saved to process_summaries_debug.log")

if __name__ == "__main__":
    docs_dir = CONFIG['paths']['docs_dir']
    process_summaries(docs_dir)  # Using full processing with embeddings 