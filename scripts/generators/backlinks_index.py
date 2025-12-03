"""
Backlinks index generator for biography chapters.

This module creates a JSON index mapping profile IDs to chapters that mention them,
enabling backlinks from biography chapters to profile pages.
"""

import os
import json
import re
from typing import Dict, List, Optional
from utils.logger import get_logger, log_section
from utils.link_converter import LinkConverter

logger = get_logger(__name__)


class BacklinksIndexHandler:
    """
    Handles creation of backlinks index from biography chapters.
    
    This class:
    - Scans all biography chapter files
    - Extracts profile links ([Name|ID] format)
    - Creates backlinks-index.json mapping each profile ID to chapters that mention them
    """
    
    def __init__(
        self,
        bios_dir: str,
        static_dir: str,
        individuals: Dict,
        id_to_slug: Dict,
        link_converter: Optional[LinkConverter] = None
    ):
        """
        Initialize the backlinks index handler.
        
        Args:
            bios_dir: Path to bios/ directory
            static_dir: Path to site/quartz/static/ directory
            individuals: Normalized individuals dictionary
            id_to_slug: Mapping from person ID to unique slug
            link_converter: Optional LinkConverter (will create one if not provided)
        """
        self.bios_dir = bios_dir
        self.static_dir = static_dir
        self.individuals = individuals
        self.id_to_slug = id_to_slug
        
        if link_converter:
            self.link_converter = link_converter
        else:
            self.link_converter = LinkConverter(individuals, id_to_slug)
        
        logger.info("BacklinksIndexHandler initialized")
        logger.debug(f"Bios dir: {bios_dir}")
        logger.debug(f"Static dir: {static_dir}")
    
    def create_backlinks_index(self) -> Dict:
        """
        Create backlinks-index.json mapping profile IDs to chapters that mention them.
        
        Returns:
            The created backlinks index dictionary
            
        Structure:
        {
            "I38735986": [
                {
                    "profileId": "I11052340",
                    "profileSlug": "Moshe-משה-Hoffman-Hochman",
                    "chapterSlug": "07-tobl-zitserman",
                    "chapterTitle": "Tobl Zitserman",
                    "profileName": "Moshe משה Hoffman"
                }
            ]
        }
        """
        log_section(logger, "CREATING BACKLINKS INDEX")
        
        backlinks_index: Dict[str, List[Dict]] = {}
        
        if not os.path.exists(self.bios_dir):
            logger.warning(f"Bios directory not found: {self.bios_dir}")
            return backlinks_index
        
        # Load chapters index to get chapter metadata
        chapters_index_path = os.path.join(self.static_dir, "chapters-index.json")
        chapters_index = {}
        if os.path.exists(chapters_index_path):
            try:
                with open(chapters_index_path, 'r', encoding='utf-8') as f:
                    chapters_index = json.load(f)
                logger.debug(f"Loaded chapters index with {len(chapters_index)} profiles")
            except Exception as e:
                logger.warning(f"Could not load chapters index: {e}")
        
        # Process each profile directory
        for entry in os.listdir(self.bios_dir):
            entry_path = os.path.join(self.bios_dir, entry)
            
            # Check if it's a directory
            if not os.path.isdir(entry_path):
                continue
            
            # Skip hidden directories
            if entry.startswith('.'):
                continue
            
            # Process this profile's chapters
            profile_id = entry
            self._process_profile_chapters(
                profile_id,
                entry_path,
                chapters_index.get(profile_id, {}),
                backlinks_index
            )
        
        # Write index to file
        self._write_backlinks_index(backlinks_index)
        
        total_backlinks = sum(len(links) for links in backlinks_index.values())
        logger.info(f"✓ Backlinks index created: {len(backlinks_index)} profiles with {total_backlinks} total backlinks")
        
        return backlinks_index
    
    def _process_profile_chapters(
        self,
        profile_id: str,
        profile_path: str,
        chapters_data: Dict,
        backlinks_index: Dict
    ):
        """
        Process chapters for a single profile and extract backlinks.
        
        Args:
            profile_id: Profile ID (e.g., "I11052340")
            profile_path: Path to profile directory
            chapters_data: Chapter metadata from chapters-index.json
            backlinks_index: Backlinks index dictionary (modified in place)
        """
        # Get profile info
        person_key = f"@{profile_id}@"
        person = self.individuals.get(person_key)
        if not person:
            logger.debug(f"Profile {profile_id} not found in GEDCOM, skipping")
            return
        
        profile_name = person.get("NAME", "Unknown")
        profile_slug = self.id_to_slug.get(person_key, "")
        
        if not profile_slug:
            logger.debug(f"No slug found for {profile_id}, skipping")
            return
        
        # Find all markdown files
        chapter_files = []
        main_bio_file = None
        
        try:
            for filename in sorted(os.listdir(profile_path)):
                if not filename.lower().endswith('.md'):
                    continue
                
                # Check if it's the main bio file
                if filename.lower() == f"{profile_id.lower()}.md":
                    main_bio_file = filename
                else:
                    chapter_files.append(filename)
        except Exception as e:
            logger.error(f"Error listing files in {profile_path}: {e}")
            return
        
        # Process main bio file
        if main_bio_file:
            self._process_chapter_file(
                profile_id,
                profile_path,
                main_bio_file,
                profile_name,
                profile_slug,
                chapters_data.get("main"),
                backlinks_index
            )
        
        # Process other chapter files
        for filename in chapter_files:
            # Find chapter metadata
            chapter_meta = None
            for chapter in chapters_data.get("chapters", []):
                if chapter.get("filename") == filename:
                    chapter_meta = chapter
                    break
            
            self._process_chapter_file(
                profile_id,
                profile_path,
                filename,
                profile_name,
                profile_slug,
                chapter_meta,
                backlinks_index
            )
    
    def _process_chapter_file(
        self,
        profile_id: str,
        profile_path: str,
        filename: str,
        profile_name: str,
        profile_slug: str,
        chapter_meta: Optional[Dict],
        backlinks_index: Dict
    ):
        """
        Process a single chapter file and extract profile links.
        
        Args:
            profile_id: Profile ID that owns this chapter
            profile_path: Path to profile directory
            filename: Chapter filename
            profile_name: Name of the profile that owns this chapter
            profile_slug: Slug of the profile that owns this chapter
            chapter_meta: Chapter metadata from chapters-index.json
            backlinks_index: Backlinks index dictionary (modified in place)
        """
        chapter_path = os.path.join(profile_path, filename)
        
        # Get chapter info from metadata or generate from filename
        if chapter_meta:
            chapter_slug = chapter_meta.get("slug", "")
            chapter_title = chapter_meta.get("title", "")
        else:
            # Generate from filename
            chapter_slug = filename[:-3].replace('_', '-').lower()
            chapter_title = filename[:-3].replace('_', ' ').replace('-', ' ').title()
        
        try:
            with open(chapter_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            logger.warning(f"Error reading chapter {chapter_path}: {e}")
            return
        
        # Extract person IDs from content
        person_ids = self.link_converter.extract_person_ids(content, validate=False)
        
        # Add backlinks for each mentioned person
        for mentioned_id in person_ids:
            # Skip self-references (person mentioned in their own biography)
            if mentioned_id == profile_id:
                continue
            
            # Initialize backlinks list for this person if needed
            person_key = f"@{mentioned_id}@"
            if mentioned_id not in backlinks_index:
                backlinks_index[mentioned_id] = []
            
            # Get mentioned person's info
            mentioned_person = self.individuals.get(person_key)
            if not mentioned_person:
                logger.debug(f"Mentioned person {mentioned_id} not found in GEDCOM")
                continue
            
            mentioned_name = mentioned_person.get("NAME", "Unknown")
            mentioned_slug = self.id_to_slug.get(person_key, "")
            
            if not mentioned_slug:
                logger.debug(f"No slug found for mentioned person {mentioned_id}")
                continue
            
            # Create backlink entry
            backlink_entry = {
                "profileId": profile_id,
                "profileSlug": profile_slug,
                "chapterSlug": chapter_slug,
                "chapterTitle": chapter_title,
                "profileName": profile_name
            }
            
            # Avoid duplicates - check if this exact combination already exists
            # (same profile + same chapter = duplicate)
            existing_entries = backlinks_index[mentioned_id]
            is_duplicate = any(
                entry.get("profileId") == profile_id and 
                entry.get("chapterSlug") == chapter_slug
                for entry in existing_entries
            )
            
            if not is_duplicate:
                backlinks_index[mentioned_id].append(backlink_entry)
                logger.debug(
                    f"Added backlink: {mentioned_id} ({mentioned_name}) "
                    f"← {profile_id} ({profile_name}) - {chapter_title}"
                )
            else:
                logger.debug(
                    f"Skipped duplicate backlink: {mentioned_id} "
                    f"← {profile_id} - {chapter_title}"
                )
    
    def _write_backlinks_index(self, backlinks_index: Dict):
        """
        Write backlinks-index.json to static directory.
        
        Args:
            backlinks_index: Backlinks index dictionary
        """
        index_path = os.path.join(self.static_dir, "backlinks-index.json")
        
        try:
            with open(index_path, 'w', encoding='utf-8') as f:
                json.dump(backlinks_index, f, ensure_ascii=False, indent=2)
            logger.info(f"Wrote backlinks index: {index_path}")
        except Exception as e:
            logger.error(f"Failed to write backlinks index: {e}")

