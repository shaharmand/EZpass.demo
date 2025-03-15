import json
import os
from openai import OpenAI
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

# Initialize OpenAI client
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
            model="gpt-4-0125-preview",
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

def process_questions():
    """Process all questions and add extracted terms"""
    # Load questions
    with open('data/questions.json', 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    # Process each question
    for question in questions:
        # Extract terms from question text and answer
        question_text = question.get('text', '')
        answer_text = question.get('answer', {}).get('text', '')
        
        terms = extract_question_terms(question_text, answer_text)
        
        # Add terms to question
        question['terms'] = terms
    
    # Save updated questions
    with open('data/questions_with_terms.json', 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    
    print(f"Processed {len(questions)} questions")

if __name__ == "__main__":
    process_questions() 