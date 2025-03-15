import os
import json
from openai import OpenAI
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('REACT_APP_OPENAI_API_KEY'))

def extract_technical_terms(content: str) -> dict:
    """Extract technical terms from content using OpenAI GPT-4 Turbo with significance scoring"""
    try:
        # Add delay to respect rate limits
        time.sleep(1)
        
        prompt = f"""
        Analyze this Hebrew construction safety text and extract ONLY the 10 most significant terms that are:
        1. Unique to construction safety domain
        2. Central to understanding the topic
        3. Frequently used in regulations/standards
        4. Critical for safety procedures
        5. Specific technical terms (not general safety concepts)

        For each term, provide:
        - The term in Hebrew
        - Significance score (1-5):
          5 = Critical technical/regulatory term specific to construction safety
          4 = Important domain-specific term
          3 = Relevant but more general term
          2 = Common term with technical usage
          1 = General term with some relevance

        Return a JSON object in this exact format:
        {{
            "terms": [
                {{"term": "term in hebrew", "significance": 5}},
                {{"term": "another term", "significance": 4}}
            ]
        }}

        Text to analyze:
        {content}
        """
        
        response = client.chat.completions.create(
            model="gpt-4-0125-preview",
            messages=[
                {"role": "system", "content": "You are a construction safety expert specializing in Israeli construction regulations and standards. Extract ONLY the 10 most significant technical terms, focusing on terms that are specific to construction safety, regulations, and formal procedures. Return ONLY a JSON object with a 'terms' array containing term objects."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        
        # Parse the JSON response
        response_json = json.loads(response.choices[0].message.content)
        print(f"Debug - Raw response: {response_json}")  # Debug print
        
        if 'terms' not in response_json:
            print(f"Warning: Expected 'terms' key not found in response: {response_json}")
            return []
            
        return response_json['terms']
        
    except Exception as e:
        print(f"Error extracting terms: {str(e)}")
        print(f"Response content: {response.choices[0].message.content if response else 'No response'}")  # Debug print
        return []

def process_summaries():
    """Process all summaries and extract technical terms"""
    try:
        # Load existing summaries
        with open('data/processed_summaries.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            summaries = data['summaries']  # This is a list
        
        # Load existing terms if any
        output_path = 'processed_summaries_with_terms.json'
        if os.path.exists(output_path):
            with open(output_path, 'r', encoding='utf-8') as f:
                processed_data = json.load(f)
                if 'summaries' not in processed_data:
                    processed_data = {'summaries': []}
        else:
            processed_data = {'summaries': []}
        
        # Create lookup of processed lessons
        processed_lessons = {f"{s['lesson_number']}.{s['segment_number']}": True 
                           for s in processed_data['summaries']} if 'summaries' in processed_data else {}
        
        # Process each summary
        for summary in summaries:
            lesson_id = f"{summary['lesson_number']}.{summary['segment_number']}"
            
            # Skip if already processed
            if lesson_id in processed_lessons:
                print(f"Skipping already processed: Lesson {lesson_id} - {summary['video_title']}")
                continue
                
            print(f"\nProcessing: Lesson {lesson_id} - {summary['video_title']}")
            
            # Extract terms
            terms = extract_technical_terms(summary['content'])
            print(f"Found {len(terms)} technical terms")
            
            # Add terms to summary
            summary['technical_terms'] = terms
            
            # Add to processed data
            processed_data['summaries'].append(summary)
            
            # Save progress after each document
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(processed_data, f, ensure_ascii=False, indent=2)
            
            print(f"Saved progress for Lesson {lesson_id}")
        
        print("\nProcessing complete!")
        
    except Exception as e:
        print(f"Error processing summaries: {str(e)}")
        raise

if __name__ == "__main__":
    process_summaries() 