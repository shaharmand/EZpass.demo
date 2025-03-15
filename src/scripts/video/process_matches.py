def get_matches(question, videos, similarity_scores, threshold=0.35):
    """Get matches with guaranteed subTopic representation and additional high-scoring matches"""
    question_subtopic = question.get('subtopic', '')
    
    # First, get the best match from the question's subTopic
    subtopic_matches = [
        (score, video) for score, video in zip(similarity_scores, videos)
        if video.get('subtopic') == question_subtopic
    ]
    
    # Sort by similarity score
    subtopic_matches.sort(reverse=True, key=lambda x: x[0])
    
    results = []
    
    # Always include the best subTopic match if available
    if subtopic_matches:
        best_subtopic_match = subtopic_matches[0]
        results.append({
            'similarity': best_subtopic_match[0],
            'video': best_subtopic_match[1],
            'is_subtopic_match': True
        })
    
    # Add other high-scoring matches
    all_matches = [(score, video) for score, video in zip(similarity_scores, videos)]
    all_matches.sort(reverse=True, key=lambda x: x[0])
    
    for score, video in all_matches:
        if score >= threshold and video != results[0]['video']:
            results.append({
                'similarity': score,
                'video': video,
                'is_subtopic_match': video.get('subtopic') == question_subtopic
            })
    
    # Get all videos from the same subTopic for reference
    subtopic_videos = [
        video for video in videos
        if video.get('subtopic') == question_subtopic
    ]
    
    return {
        'matches': results,
        'subtopic_videos': subtopic_videos
    }

def format_results(matches_data, question):
    """Format results with clear sections for matches and subTopic videos"""
    output = []
    output.append(f"Question:\nType: {question.get('type', 'unknown')}\nText: {question.get('text', '')}\n")
    
    if question.get('options'):
        output.append("\nOptions:")
        for opt in question['options']:
            output.append(f"- {opt['text']}")
    
    if question.get('answer'):
        output.append(f"\nAnswer: {question['answer']['text']}\n")
    
    output.append("\nTop Matches:")
    output.append("-" * 80)
    
    for idx, match in enumerate(matches_data['matches'], 1):
        video = match['video']
        similarity = match['similarity']
        subtopic_indicator = "[SubTopic Match]" if match['is_subtopic_match'] else ""
        
        output.append(f"\n{idx}. Match (Similarity: {similarity:.5f}) {subtopic_indicator}")
        output.append(f"Video: {video.get('title', 'Unknown')}")
        output.append(f"Subtopic ID: {video.get('subtopic', 'unknown')}")
        
        if video.get('doc_path'):
            output.append(f"Word Doc: file://{video['doc_path']}")
        
        if video.get('video_url'):
            output.append(f"Video URL: {video['video_url']}")
        
        if video.get('content'):
            output.append(f"\nContent Preview:")
            output.append(video['content'][:500] + "...")
    
    output.append("\nAll Videos in This SubTopic:")
    output.append("-" * 80)
    
    for video in matches_data['subtopic_videos']:
        output.append(f"\n- {video.get('title', 'Unknown')}")
        if video.get('video_url'):
            output.append(f"  URL: {video['video_url']}")
    
    return "\n".join(output) 