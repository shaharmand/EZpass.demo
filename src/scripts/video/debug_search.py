import sys
from evaluate_matches import get_question_by_id, get_embedding, find_matches, cosine_similarity
import json
import os
from typing import Dict, List, Tuple, Any

class SearchError(Exception):
    """Custom error for search validation issues"""
    pass

def validate_data(question_data: Dict, video_data: Dict) -> None:
    """Validate required data exists"""
    # Check question data
    if not question_data.get('content', {}).get('text'):
        raise SearchError("Question text is missing")
    if not question_data.get('schoolAnswer', {}).get('solution'):
        raise SearchError("Question solution is missing")
    if not question_data.get('metadata', {}).get('subtopicId'):
        raise SearchError("Question subtopicId is missing")
        
    # Check video data structure
    if 'summaries' not in video_data:
        raise SearchError("Video summaries missing from data")
    
    # Check individual videos
    for video in video_data['summaries']:
        if not video.get('embedding'):
            raise SearchError(f"Video {video.get('video_id')} missing embedding")
        if not video.get('subtopicId'):
            raise SearchError(f"Video {video.get('video_id')} missing subtopicId")
        if not video.get('video_title'):
            raise SearchError(f"Video {video.get('video_id')} missing title")

def calculate_concept_similarity(question_text: str, solution_text: str, video_title: str) -> float:
    """Calculate semantic similarity between question/solution concepts and video title"""
    # Focus on the key concepts by combining question and solution
    question_concepts = f"{question_text} {solution_text}"
    
    # Get embeddings focusing on the semantic meaning
    concepts_embedding = get_embedding(question_concepts)
    title_embedding = get_embedding(video_title)
    
    if not concepts_embedding or not title_embedding:
        return 0.0
    
    # Calculate semantic similarity
    return cosine_similarity(concepts_embedding, title_embedding)

def analyze_match_components(question_data: Dict, video_data: Dict, question_embedding: List[float]) -> Dict:
    """Analyze individual components of the match scoring with improved metrics"""
    
    # Get question text and solution
    question_text = question_data['content']['text']
    question_solution = question_data['schoolAnswer']['solution']
    question_subtopic = question_data['metadata']['subtopicId']
    
    # Calculate similarities
    base_similarity = cosine_similarity(question_embedding, video_data['embedding'])
    
    # Solution similarity using embedding
    solution_embedding = get_embedding(question_solution)
    solution_similarity = cosine_similarity(solution_embedding, video_data['embedding'])
    
    # Concept similarity between question/solution and video title
    concept_similarity = calculate_concept_similarity(
        question_text,
        question_solution,
        video_data['video_title']
    )
    
    # Subtopic analysis
    subtopic_match = video_data['subtopicId'] == question_subtopic
    
    # Calculate weighted score - prioritizing concept matching
    weights = {
        'base': 0.25,        # Reduced from 0.3
        'solution': 0.25,    # Reduced from 0.3
        'concept': 0.3,      # Increased importance of conceptual matching
        'subtopic': 0.2      # Keep subtopic weight
    }
    
    weighted_score = (
        weights['base'] * base_similarity +
        weights['solution'] * solution_similarity +
        weights['concept'] * concept_similarity +
        (weights['subtopic'] if subtopic_match else 0)
    )
    
    return {
        'scores': {
            'base_similarity': base_similarity,
            'solution_similarity': solution_similarity,
            'concept_similarity': concept_similarity,
            'subtopic_match': subtopic_match,
            'weighted_score': weighted_score
        },
        'analysis': {
            'weights_used': weights,
            'video_title': video_data['video_title']
        },
        'video_metadata': {
            'title': video_data['video_title'],
            'subtopic': video_data['subtopicId'],
            'content_preview': video_data['content'][:200]
        }
    }

def group_by_measure(analyses: List[Tuple[Dict, Dict]]) -> Dict[str, List[Tuple[Dict, Dict]]]:
    """Group top results by different similarity measures"""
    measures = {
        'weighted': sorted(analyses, key=lambda x: x[0]['scores']['weighted_score'], reverse=True)[:3],
        'base': sorted(analyses, key=lambda x: x[0]['scores']['base_similarity'], reverse=True)[:3],
        'solution': sorted(analyses, key=lambda x: x[0]['scores']['solution_similarity'], reverse=True)[:3],
        'concept': sorted(analyses, key=lambda x: x[0]['scores']['concept_similarity'], reverse=True)[:3],
        'subtopic': [a for a in analyses if a[0]['scores']['subtopic_match']][:3]
    }
    return measures

def debug_search(question_id: str):
    """Debug search functionality with detailed component analysis"""
    
    print(f"\nDebug Analysis for Question {question_id}")
    print("-" * 80)
    
    try:
        # Get question
        question = get_question_by_id(question_id)
        if not question:
            raise SearchError(f"No question found with ID: {question_id}")
            
        question_data = question['data']
        
        # Load video data
        try:
            with open('data/processed_summaries_with_terms.json', 'r', encoding='utf-8') as f:
                video_data = json.load(f)
        except FileNotFoundError:
            try:
                with open('processed_summaries_with_terms.json', 'r', encoding='utf-8') as f:
                    video_data = json.load(f)
            except FileNotFoundError:
                raise SearchError("Could not find processed_summaries_with_terms.json")
        
        # Validate all required data exists
        validate_data(question_data, video_data)
        
        print(f"\nQuestion Text: {question_data['content']['text']}")
        print(f"Question Solution: {question_data['schoolAnswer']['solution']}")
        print(f"Question Subtopic: {question_data['metadata']['subtopicId']}")
        
        # Generate embedding
        question_embedding = get_embedding(question_data['content']['text'])
        if not question_embedding:
            raise SearchError("Failed to generate question embedding")
            
        print("\nAnalyzing matches...")
        
        # Analyze each video
        analyses = []
        for video in video_data['summaries']:
            analysis = analyze_match_components(question_data, video, question_embedding)
            analyses.append((analysis, video))
        
        # Group results by different measures
        grouped_results = group_by_measure(analyses)
        
        # Print analysis by measure
        for measure, results in grouped_results.items():
            print(f"\nTop 3 by {measure.upper()}:")
            print("=" * 80)
            
            for analysis, video in results:
                scores = analysis['scores']
                metadata = analysis['video_metadata']
                
                print(f"\nVideo Title: {metadata['title']}")
                print(f"Subtopic: {metadata['subtopic']}")
                print(f"\nScores:")
                print(f"- Base Similarity: {scores['base_similarity']:.3f}")
                print(f"- Solution Similarity: {scores['solution_similarity']:.3f}")
                print(f"- Concept Similarity: {scores['concept_similarity']:.3f}")
                print(f"- Subtopic Match: {'Yes' if scores['subtopic_match'] else 'No'}")
                print(f"- Weighted Score: {scores['weighted_score']:.3f}")
                
                print("\nContent Preview:")
                print(metadata['content_preview'] + "...")
                print("-" * 80)
        
        # Write full analysis to file
        output_file = f"debug_results_{question_id}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({
                'question_data': question_data,
                'analyses': [{
                    'analysis': a[0],
                    'video_id': v['video_id']
                } for a, v in analyses]
            }, f, indent=2, ensure_ascii=False)
        
        print(f"\nFull analysis written to {output_file}")
        
    except SearchError as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    question_id = sys.argv[1] if len(sys.argv) > 1 else None
    if not question_id:
        print("Please provide a question ID")
        sys.exit(1)
    debug_search(question_id) 