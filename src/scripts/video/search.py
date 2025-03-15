def calculate_match_score(question_text: str, solution_text: str, doc_content: str, doc_metadata: dict, question_metadata: dict) -> dict:
    """Calculate match score with all components separated and detailed breakdown"""
    
    # 1. Question similarity (semantic)
    question_similarity = cosine_similarity(
        get_embedding(question_text),
        get_embedding(doc_content)
    )
    
    # 2. Solution similarity (semantic)
    solution_similarity = cosine_similarity(
        get_embedding(solution_text),
        get_embedding(doc_content)
    )
    
    # 3. Term matching with significance levels
    term_matches = []
    term_boost = 0
    for term in doc_metadata.get('technical_terms', []):
        # Check both question and solution text
        if term['term'] in question_text or term['term'] in solution_text:
            boost = {
                5: 0.25,  # Critical terms
                4: 0.15,  # Important terms
                3: 0.08,  # Moderate terms
                2: 0.04,  # Minor terms
                1: 0.02   # Basic terms
            }.get(term['significance'], 0)
            
            term_matches.append({
                'term': term['term'],
                'significance': term['significance'],
                'boost': boost,
                'found_in': 'question' if term['term'] in question_text else 'solution'
            })
            term_boost += boost

    # 4. Title similarity (with lesson context)
    full_title = f"{doc_metadata.get('lesson_name', '')} - {doc_metadata.get('title', '')}"
    title_similarity = cosine_similarity(
        get_embedding(question_text),
        get_embedding(full_title)
    )
    
    # 5. Subtopic match - using subTopicID from metadata
    question_subtopic = question_metadata.get('metadata', {}).get('subTopicID')
    doc_subtopic = doc_metadata.get('subTopicID')
    is_subtopic_match = question_subtopic and doc_subtopic and question_subtopic == doc_subtopic
    subtopic_boost = 0.1 if is_subtopic_match else 0
    
    # Calculate final score with all components
    final_score = (
        question_similarity * 0.3 +    # Base question similarity (30%)
        solution_similarity * 0.2 +    # Solution similarity (20%)
        term_boost +                   # Term match boosts (variable based on significance)
        title_similarity * 0.15 +      # Title relevance (15%)
        subtopic_boost                 # Subtopic match (10% if matches)
    )
    
    return {
        'doc_id': doc_metadata.get('id'),
        'lesson_number': doc_metadata.get('lesson_number'),
        'segment_number': doc_metadata.get('segment_number'),
        'title': full_title,
        'components': {
            'question_similarity': {
                'raw': question_similarity,
                'weighted': question_similarity * 0.3
            },
            'solution_similarity': {
                'raw': solution_similarity,
                'weighted': solution_similarity * 0.2
            },
            'term_matches': {
                'matches': term_matches,
                'total_boost': term_boost
            },
            'title_similarity': {
                'raw': title_similarity,
                'weighted': title_similarity * 0.15
            },
            'subtopic_match': {
                'is_match': is_subtopic_match,
                'question_subtopic': question_subtopic,
                'doc_subtopic': doc_subtopic,
                'boost': subtopic_boost
            }
        },
        'final_score': final_score
    }

def search_videos(question: dict, videos: list, top_k: int = 5) -> dict:
    """Search videos with detailed breakdown of all scoring components"""
    
    results = []
    question_text = question.get('text', '')
    solution_text = question.get('solution', {}).get('text', '')
    
    print(f"\nProcessing search for question: {question_text[:100]}...")
    print(f"Solution text: {solution_text[:100]}...")
    print(f"Question subTopicID: {question.get('metadata', {}).get('subTopicID', 'None')}")
    
    # Process each video
    for video in videos:
        try:
            match_score = calculate_match_score(
                question_text=question_text,
                solution_text=solution_text,
                doc_content=video.get('content', ''),
                doc_metadata=video,
                question_metadata=question
            )
            results.append(match_score)
        except Exception as e:
            print(f"Error processing video {video.get('id')}: {str(e)}")
            continue
    
    # Sort by final score
    results.sort(key=lambda x: x['final_score'], reverse=True)
    
    # Separate results by subtopic
    subtopic_matches = [r for r in results if r['components']['subtopic_match']['is_match']]
    other_matches = [r for r in results if not r['components']['subtopic_match']['is_match']]
    
    # Always include best subtopic match if available
    final_results = []
    if subtopic_matches:
        final_results.append(subtopic_matches[0])  # Best subtopic match first
    
    # Add remaining results up to top_k
    remaining_slots = top_k - len(final_results)
    if remaining_slots > 0:
        # Merge and sort remaining results
        remaining_results = sorted(
            subtopic_matches[1:] + other_matches,
            key=lambda x: x['final_score'],
            reverse=True
        )[:remaining_slots]
        final_results.extend(remaining_results)
    
    # Calculate statistics
    stats = {
        'total_processed': len(results),
        'subtopic_matches': len(subtopic_matches),
        'score_distribution': {
            'high': len([r for r in results if r['final_score'] > 0.8]),
            'medium': len([r for r in results if 0.5 <= r['final_score'] <= 0.8]),
            'low': len([r for r in results if r['final_score'] < 0.5])
        },
        'average_scores': {
            'overall': sum(r['final_score'] for r in results) / len(results) if results else 0,
            'subtopic_matches': sum(r['final_score'] for r in subtopic_matches) / len(subtopic_matches) if subtopic_matches else 0,
            'other_matches': sum(r['final_score'] for r in other_matches) / len(other_matches) if other_matches else 0
        }
    }
    
    return {
        'matches': final_results,
        'stats': stats
    }

def format_search_results(search_results: dict) -> str:
    """Format search results for readable output"""
    output = []
    
    # Print statistics
    stats = search_results['stats']
    output.append("\nSearch Statistics:")
    output.append(f"Total videos processed: {stats['total_processed']}")
    output.append(f"Videos from same subtopic: {stats['subtopic_matches']}")
    output.append("\nScore Distribution:")
    output.append(f"High (>0.8): {stats['score_distribution']['high']}")
    output.append(f"Medium (0.5-0.8): {stats['score_distribution']['medium']}")
    output.append(f"Low (<0.5): {stats['score_distribution']['low']}")
    output.append("\nAverage Scores:")
    output.append(f"Overall: {stats['average_scores']['overall']:.3f}")
    output.append(f"Subtopic matches: {stats['average_scores']['subtopic_matches']:.3f}")
    output.append(f"Other matches: {stats['average_scores']['other_matches']:.3f}")
    
    # Print detailed matches
    output.append("\nTop Matches:")
    for i, match in enumerate(search_results['matches'], 1):
        output.append(f"\n{'-'*80}")
        output.append(f"{i}. {match['title']}")
        output.append(f"Lesson {match['lesson_number']}.{match['segment_number']}")
        output.append(f"Final Score: {match['final_score']:.3f}")
        
        # Component breakdown
        components = match['components']
        output.append("\nScore Components:")
        output.append(f"- Question Similarity: {components['question_similarity']['raw']:.3f} (weighted: {components['question_similarity']['weighted']:.3f})")
        output.append(f"- Solution Similarity: {components['solution_similarity']['raw']:.3f} (weighted: {components['solution_similarity']['weighted']:.3f})")
        output.append(f"- Title Similarity: {components['title_similarity']['raw']:.3f} (weighted: {components['title_similarity']['weighted']:.3f})")
        
        # Term matches
        if components['term_matches']['matches']:
            output.append("\nMatched Terms:")
            for term in components['term_matches']['matches']:
                output.append(f"- {term['term']} (significance: {term['significance']}, boost: {term['boost']:.3f}, found in: {term['found_in']})")
            output.append(f"Total term boost: {components['term_matches']['total_boost']:.3f}")
        
        # Subtopic match
        output.append(f"\nSubtopic Match: {'Yes' if components['subtopic_match']['is_match'] else 'No'} (boost: {components['subtopic_match']['boost']:.3f})")
    
    return '\n'.join(output) 