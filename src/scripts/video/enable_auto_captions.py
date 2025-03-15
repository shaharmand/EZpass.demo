#!/usr/bin/env python3
"""
Vimeo Auto-Caption Enabler for EZpass

This script enables auto-captions for all videos in folders 1-27.
It will request auto-caption generation for videos that don't have captions yet.

Requirements:
    pip install PyVimeo

Usage:
    python enable_auto_captions.py

Environment Variables:
    VIMEO_ACCESS_TOKEN: Your Vimeo API access token
"""

import os
import sys
import time
import vimeo
from typing import List, Dict

class VimeoCaptionManager:
    def __init__(self, access_token: str):
        """Initialize the Vimeo client with the provided access token."""
        self.client = vimeo.VimeoClient(token=access_token)
        self.folders_cache = {}

    def get_all_folders(self) -> List[Dict]:
        """Get all folders from the account."""
        print("\n📁 Fetching all folders...")
        folders = []
        target_folders = set(str(i) for i in range(1, 28))  # Folders 1-27
        page = 1
        
        while True:
            try:
                response = self.client.get(f'/me/projects?page={page}&per_page=100')
                data = response.json()
                
                if not data.get('data'):
                    break
                    
                for folder in data['data']:
                    folder_name = folder.get('name', 'Untitled')
                    if folder_name in target_folders:
                        folders.append(folder)
                        folder_id = folder['uri'].split('/')[-1]
                        print(f"  - Found target folder: {folder_name} (ID: {folder_id})")
                        self.folders_cache[folder_id] = folder
                        target_folders.remove(folder_name)
                
                if not data.get('paging', {}).get('next'):
                    break
                    
                page += 1
                
            except Exception as e:
                print(f"Error fetching folders: {str(e)}")
                break
                
        print(f"\nTotal target folders found: {len(folders)}")
        return folders

    def get_folder_contents(self, folder_id: str) -> List[Dict]:
        """Get all videos from a specific folder."""
        videos = []
        try:
            folder = self.folders_cache.get(folder_id, {})
            folder_name = folder.get('name', 'Unknown Folder')
            print(f"\n📁 Processing folder {folder_name} (ID: {folder_id})")
            
            page = 1
            while True:
                response = self.client.get(f'/me/projects/{folder_id}/items?page={page}&per_page=100')
                data = response.json()
                
                if not data.get('data'):
                    break
                    
                for item in data['data']:
                    if item['type'] == 'video':
                        video_data = item.get('video', {})
                        if video_data and video_data.get('uri'):
                            videos.append(video_data)
                
                if not data.get('paging', {}).get('next'):
                    break
                    
                page += 1
                
        except Exception as e:
            print(f"Error getting folder contents: {str(e)}")
            
        return videos

    def enable_auto_captions(self, video_uri: str, video_name: str) -> bool:
        """Enable auto-captions for a video."""
        try:
            # First check if captions already exist
            response = self.client.get(f"{video_uri}/texttracks")
            data = response.json()
            
            if data.get('total', 0) > 0:
                print(f"  ⏩ Skipping {video_name} - already has captions")
                return True

            # Request auto-caption generation
            response = self.client.post(f"{video_uri}/texttracks", data={
                'type': 'subtitles',
                'language': 'he',  # Hebrew
                'name': 'Auto-generated',
                'auto': True
            })
            
            if response.status_code == 201:
                print(f"  ✓ Enabled auto-captions for: {video_name}")
                return True
            else:
                print(f"  ⚠️ Unexpected response: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"  ✗ Error enabling auto-captions for {video_name}: {str(e)}")
            return False

    def process_videos(self):
        """Process all videos and enable auto-captions."""
        # Get all videos from target folders
        all_videos = []
        folders = self.get_all_folders()
        
        for folder in folders:
            folder_id = folder['uri'].split('/')[-1]
            videos = self.get_folder_contents(folder_id)
            all_videos.extend(videos)
            
        print(f"\n📹 Found {len(all_videos)} total videos")
        
        if len(all_videos) == 0:
            print("\n⚠️ No videos found!")
            return
            
        print("\nEnabling auto-captions for all videos...")
        success_count = 0
        failed_videos = []
        
        for video in all_videos:
            video_name = video.get('name', 'Untitled')
            print(f"\nProcessing: {video_name}")
            
            if self.enable_auto_captions(video['uri'], video_name):
                success_count += 1
            else:
                failed_videos.append(video_name)
            
            # Add a small delay to avoid rate limiting
            time.sleep(0.5)
        
        # Print summary
        print("\n=== Summary ===")
        print(f"Total videos processed: {len(all_videos)}")
        print(f"Successfully enabled auto-captions: {success_count}")
        print(f"Failed: {len(failed_videos)}")
        
        if failed_videos:
            print("\nFailed videos:")
            for video in failed_videos:
                print(f"- {video}")

def main():
    """Main entry point of the script."""
    access_token = os.getenv('VIMEO_ACCESS_TOKEN')
    
    if not access_token:
        print("Error: VIMEO_ACCESS_TOKEN environment variable not set")
        print("Please set your Vimeo access token as an environment variable:")
        print("export VIMEO_ACCESS_TOKEN='your_token_here'")
        sys.exit(1)
    
    manager = VimeoCaptionManager(access_token)
    manager.process_videos()

if __name__ == "__main__":
    main() 