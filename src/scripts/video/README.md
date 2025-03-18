# Video Processing Scripts

This directory contains scripts for processing and analyzing video content. Here's a description of each script:

## Core Video Processing
- `detect_titles.py`: Detects chapter titles in videos by analyzing dark frame transitions and using OCR to extract text
- `detect_dark_transitions.py`: Identifies dark frame transitions in videos that typically indicate chapter breaks
- `download_and_transcribe.py`: Downloads videos from Vimeo and generates transcriptions using Whisper

## Search and Analysis
- `search.py`: Main search functionality for finding relevant content in video transcriptions
- `search_utils.py`: Utility functions for text processing and search operations
- `search_engine.py`: Core search engine implementation for video content
- `search_interface.py`: User interface for the search functionality

## Summary Processing
- `process_summaries.py`: Processes and formats video summaries for display

## Testing and Debugging
- `test_search.py`: Tests for the search functionality
- `debug_search.py`: Debugging tools for search operations

## Usage
Each script can be run independently. For example:
```bash
python detect_titles.py video.mp4
python search.py "search query"
python download_and_transcribe.py video_url
``` 