import json

def index_documents():
    """Index documents with their technical terms"""
    try:
        # Load processed summaries with terms
        with open('processed_summaries_with_terms.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            summaries = data['summaries']

        # Prepare documents for indexing
        documents = []
        for summary in summaries:
            doc = {
                'lesson_number': summary.get('lesson_number', ''),
                'segment_number': summary.get('segment_number', ''),
                'video_title': summary.get('video_title', ''),
                'content': summary.get('content', ''),
                'subtopic': summary.get('subtopic', ''),  # Optional field
                'technical_terms': summary.get('technical_terms', []),  # Include technical terms
                'video_id': summary.get('video_id', '')
            }
            documents.append(doc)

        # Save indexed documents
        with open('data/indexed_documents.json', 'w', encoding='utf-8') as f:
            json.dump({'documents': documents}, f, ensure_ascii=False, indent=2)
            
        print(f"Indexed {len(documents)} documents with technical terms")
        
    except Exception as e:
        print(f"Error indexing documents: {str(e)}")
        raise

if __name__ == "__main__":
    index_documents() 