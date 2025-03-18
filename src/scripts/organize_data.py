import os
import shutil
import json
from pathlib import Path

# Define the new simplified data structure
NEW_DATA_STRUCTURE = {
    'videos': {
        'raw': 'raw',                  # Original downloaded videos
        'summaries': 'summaries',       # Video summaries (Word docs)
        'youtube': 'youtube',           # YouTube related data
        'evaluation': 'evaluation',     # Video evaluation results
        'embeddings': 'embeddings'      # Video embeddings and indexed documents
    },
    'course': {
        'CIV-SAF': {                   # Course name as subdirectory
            'content': 'content'        # Course content (lessons and video references)
        }
    }
}

def create_directory_structure(base_path):
    """Create the new directory structure."""
    for category, subcategories in NEW_DATA_STRUCTURE.items():
        category_path = base_path / category
        if isinstance(subcategories, dict):
            for subcategory, subsubcategories in subcategories.items():
                subcategory_path = category_path / subcategory
                if isinstance(subsubcategories, dict):
                    for subsubcategory, dir_name in subsubcategories.items():
                        (subcategory_path / dir_name).mkdir(parents=True, exist_ok=True)
                else:
                    (subcategory_path / subsubcategories).mkdir(parents=True, exist_ok=True)
        else:
            for subcategory, dir_name in subcategories.items():
                (category_path / dir_name).mkdir(parents=True, exist_ok=True)

def move_files(source_path, target_path, file_patterns):
    """Move files from source to target based on patterns."""
    for pattern in file_patterns:
        for file_path in source_path.glob(pattern):
            if file_path.is_file():
                target_file = target_path / file_path.name
                shutil.copy2(file_path, target_file)
                print(f"Copied: {file_path} -> {target_file}")

def remove_files(source_path, file_patterns):
    """Remove files matching the patterns."""
    for pattern in file_patterns:
        for file_path in source_path.glob(pattern):
            if file_path.is_file():
                file_path.unlink()
                print(f"Removed: {file_path}")

def create_video_mapping(project_root, new_data_root):
    """Create a proper video ID mapping file from upload_progress.txt."""
    mapping = {
        'vimeo_to_youtube': {},  # Vimeo ID -> YouTube ID
        'youtube_to_vimeo': {},  # YouTube ID -> Vimeo ID
        'video_info': {}         # Additional info like titles
    }
    
    # Read the upload progress file
    progress_file = project_root / 'src' / 'scripts' / 'video' / 'upload_progress.txt'
    if progress_file.exists():
        with open(progress_file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith('UPLOADED:'):
                    # Parse the line
                    _, data = line.split(':', 1)
                    vimeo_id, youtube_id, title = data.strip().split(',', 2)
                    
                    # Add to mappings
                    mapping['vimeo_to_youtube'][vimeo_id] = youtube_id
                    mapping['youtube_to_vimeo'][youtube_id] = vimeo_id
                    mapping['video_info'][vimeo_id] = {
                        'title': title,
                        'youtube_id': youtube_id
                    }
    
    # Save the mapping file
    mapping_file = new_data_root / 'videos' / 'youtube' / 'video_mapping.json'
    with open(mapping_file, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
    print(f"Created video mapping file: {mapping_file}")

def organize_data():
    """Main function to organize all data files."""
    # Get project root
    project_root = Path(__file__).parent.parent.parent
    
    # Create new structure
    new_data_root = project_root / 'data'
    create_directory_structure(new_data_root)
    
    # 1. Organize video-related data
    # Move raw videos
    move_files(
        project_root / 'data' / 'Videos' / 'downloaded_videos',
        new_data_root / 'videos' / 'raw',
        ['*.mp4', '*.mov', '*.avi']
    )
    
    # Move video summaries
    move_files(
        project_root / 'data' / 'Videos' / 'Videos_summaries',
        new_data_root / 'videos' / 'summaries',
        ['*.docx', '*.txt']
    )
    
    # Move YouTube data
    move_files(
        project_root / 'src' / 'scripts' / 'video',
        new_data_root / 'videos' / 'youtube',
        ['upload_progress.txt']
    )
    
    # Create proper video mapping file
    create_video_mapping(project_root, new_data_root)
    
    # Move evaluation results directly to evaluation folder
    move_files(
        project_root / 'data' / 'evaluation_results',
        new_data_root / 'videos' / 'evaluation',
        ['*.txt', '*.json']
    )
    
    # Move only the latest processed summaries file
    move_files(
        project_root / 'data',
        new_data_root / 'videos' / 'embeddings',
        ['processed_summaries.json']
    )
    
    # Remove the old files
    remove_files(
        project_root / 'data',
        ['indexed_documents.json', 'processed_summaries_with_terms.json']
    )
    
    # 2. Organize course data
    # Move all course-related content (lessons and video references)
    move_files(
        project_root / 'public' / 'data' / 'courses',
        new_data_root / 'course' / 'CIV-SAF' / 'content',
        ['*.json']
    )
    move_files(
        project_root / 'public' / 'data',
        new_data_root / 'course' / 'CIV-SAF' / 'content',
        ['lesson_info.json']
    )
    
    # 3. Keep subjects and exams in their original location
    # (No need to move them as they're already in the correct place)
    
    # Create a mapping file to track old and new locations
    mapping = {
        'old_structure': {
            'videos': str(project_root / 'data' / 'Videos'),
            'public_data': str(project_root / 'public' / 'data'),
            'evaluation': str(project_root / 'data' / 'evaluation_results'),
        },
        'new_structure': {
            'base_path': str(new_data_root),
            'categories': NEW_DATA_STRUCTURE
        }
    }
    
    # Save the mapping
    with open(new_data_root / 'data_mapping.json', 'w', encoding='utf-8') as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
    
    print("\n✨ Data organization complete!")
    print(f"New data structure created at: {new_data_root}")
    print("Please update your code to use the new paths!")

if __name__ == '__main__':
    organize_data() 