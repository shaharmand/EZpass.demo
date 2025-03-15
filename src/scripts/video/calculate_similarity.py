def calculate_similarity(question, video, terms_weight=0.2):
    """Calculate similarity with semantic matching and contextual term boost"""
    # Base similarity from embeddings (primary matching mechanism)
    base_similarity = cosine_similarity(
        question['embedding'],
        video['embedding']
    )
    
    # Term boost (only if base similarity is already high)
    term_boost = 0
    if base_similarity > 0.4:  # Only consider term boost for highly relevant content
        if 'terms' in video and 'terms' in question:
            # Calculate term overlap as a percentage
            matched_terms = 0
            total_terms = 0
            rare_term_matches = 0
            
            # Check each term category
            for category in ['technical_terms', 'safety_terms', 'job_titles', 'regulatory_terms', 'procedures']:
                video_terms = set(video['terms'].get(category, []))
                question_terms = set(question['terms'].get(category, []))
                
                # Count matches
                matches = len(video_terms.intersection(question_terms))
                matched_terms += matches
                total_terms += len(question_terms)
                
                # Check for rare terms (terms that appear in few videos)
                for term in question_terms:
                    if term in video_terms:
                        # Count how many videos contain this term
                        term_frequency = sum(1 for v in videos if term in v.get('terms', {}).get(category, []))
                        if term_frequency <= 3:  # Term appears in 3 or fewer videos
                            rare_term_matches += 1
            
            if total_terms > 0:
                # Calculate base term boost
                term_boost = matched_terms / total_terms
                
                # Add extra boost for rare terms
                if rare_term_matches > 0:
                    rare_term_boost = rare_term_matches / total_terms
                    # Increased weight for rare terms (60% rare, 40% regular)
                    term_boost = term_boost * 0.4 + rare_term_boost * 0.6
                
                # Only apply boost if we have significant term overlap
                if term_boost < 0.3:  # Require at least 30% term overlap
                    term_boost = 0
    
    # Combine scores with term boost only if base similarity is good
    final_similarity = base_similarity
    if term_boost > 0:
        final_similarity = (1 - terms_weight) * base_similarity + terms_weight * term_boost
    
    return final_similarity

def extract_question_terms(question_text, openai_client):
    """Extract terms from question text using the same categories"""
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4-0125-preview",
            messages=[
                {"role": "system", "content": "Extract technical terms from this construction safety question into categories."},
                {"role": "user", "content": f"Analyze this question and extract terms into these categories:\n1. Technical terms\n2. Safety terms\n3. Job titles\n4. Regulatory terms\n5. Procedures\n\nQuestion: {question_text}"}
            ],
            response_format={ "type": "json_object" }
        )
        
        terms = json.loads(response.choices[0].message.content)
        return terms
    except Exception as e:
        print(f"Error extracting question terms: {e}")
        return {} 