import sys
from evaluate_matches import get_question_by_id, get_embedding, find_matches

def test_search(question_id: str = None):
    """Test search functionality with a specific question ID"""
    # Use provided ID or default test questions
    if question_id:
        test_questions = [question_id]
    else:
        test_questions = [
            'CIV-SAF-010670',  # Question about מקדם (K) במענב דו ענפי
            'CIV-SAF-010671',  # Another question to test
            'CIV-SAF-010672'   # And one more
        ]
    
    for qid in test_questions:
        print(f"\nTesting search for question {qid}")
        
        # Get question from database
        question = get_question_by_id(qid)
        if not question:
            print(f"No question found with ID: {qid}")
            continue
            
        question_data = question['data']
        content_text = question_data.get('content', {}).get('text', '')
        
        if not content_text:
            print("Error: Question text is empty")
            continue
            
        print(f"\nContent text: {content_text}")
        
        # Generate embedding for question text
        question_embedding = get_embedding(content_text)
        if not question_embedding:
            print("Failed to generate embedding")
            continue
            
        # Find matches
        matches, manager_video = find_matches(question_embedding, question_data)
        if not matches:
            print("No matches found")
            continue
            
        # Print results
        print("\nTop matches:")
        print("-" * 80)
        
        for i, match in enumerate(matches, 1):
            print(f"\n{i}. Match (Score: {match['score_breakdown']['final_score']:.3f})")
            print(f"Video: {match['video_title']}")
            print(f"SubtopicId: {match.get('subtopicId', 'None')}")
            print("\nScore Breakdown:")
            print(f"- Base Similarity: {match['score_breakdown']['base_similarity']:.3f}")
            print(f"- Solution Similarity: {match['score_breakdown']['solution_similarity']:.3f}")
            print(f"- Title Similarity: {match['score_breakdown']['title_similarity']:.3f}")
            print(f"- Subtopic Boost: {match['score_breakdown']['subtopic_boost']:.3f}")
            print(f"\nContent Preview: {match['content'][:200]}...")
            print("-" * 80)
            
        if manager_video:
            print("\nManager Video Found:")
            print(f"Title: {manager_video['video_title']}")
            print(f"Score: {manager_video['score_breakdown']['final_score']:.3f}")

if __name__ == '__main__':
    # Get question ID from command line argument if provided
    question_id = sys.argv[1] if len(sys.argv) > 1 else None
    test_search(question_id) 