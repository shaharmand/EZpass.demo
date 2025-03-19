import sys
import json
from openai import OpenAI
from dotenv import load_dotenv
from process_matches import get_matches, format_results
import time

# Load environment variables
load_dotenv()
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def extract_question_terms(question_text, answer_text=None):
    """Extract terms from question and answer text using GPT-4"""
    try:
        # Add delay to respect rate limits
        time.sleep(1)
        
        # Combine question and answer for better context
        full_text = question_text
        if answer_text:
            full_text += "\n" + answer_text
            
        prompt = f"""
        Analyze this construction safety question and extract terms into these categories:
        1. Technical terms (equipment, tools, machinery)
        2. Safety terms (hazards, safety measures)
        3. Job titles and roles
        4. Regulatory terms and standards
        5. Procedures and processes
        
        Return ONLY a JSON object with these categories as keys and arrays of Hebrew terms as values.
        Keep terms in their original Hebrew form.
        
        Question and Answer:
        {full_text}
        """
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a construction safety expert specializing in Israeli construction regulations and safety standards. Extract technical terms from Hebrew text and return them ONLY as a JSON object with term categories as keys and arrays of Hebrew terms as values."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        
        terms = json.loads(response.choices[0].message.content)
        return terms
    except Exception as e:
        print(f"Error extracting terms: {e}")
        return {}

def search_by_question(question_id):
    # Load questions and videos
    with open('data/questions.json', 'r', encoding='utf-8') as f:
        questions = json.load(f)
    with open('data/processed_summaries.json', 'r', encoding='utf-8') as f:
        videos = json.load(f)
    
    # Find the question
    question = next((q for q in questions if q['id'] == question_id), None)
    if not question:
        return f"Question {question_id} not found"
    
    # Extract terms for this question
    question_text = question.get('text', '')
    answer_text = question.get('answer', {}).get('text', '')
    question['terms'] = extract_question_terms(question_text, answer_text)
    
    # Calculate similarity scores
    similarity_scores = []
    for video in videos:
        score = calculate_similarity(question, video)
        similarity_scores.append(score)
    
    # Get matches using matching logic
    matches_data = get_matches(question, videos, similarity_scores)
    
    # Format results
    return format_results(matches_data, question)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python search_by_question.py <question_id>")
        sys.exit(1)
    
    question_id = sys.argv[1]
    results = search_by_question(question_id)
    print(results) 