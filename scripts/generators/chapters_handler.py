"""
Chapters index handler for managing biography chapters.

This module creates a JSON index of all chapter files for each profile
and copies them to the static directory.
"""

import os
import json
import re
from typing import Dict, List, Optional
from utils.logger import get_logger, log_section
from utils.file_utils import copy_file_safe, remove_directory_safe
from gedcom.normalizer import norm_individual

logger = get_logger(__name__)


class ChaptersIndexHandler:
    """
    Handles creation of chapters index and copying of chapter files.
    
    This class:
    - Scans bios/ directory for chapter subdirectories
    - Reads chapter files and extracts titles
    - Handles shared chapters between profiles
    - Creates chapters-index.json
    - Copies chapter files to static/chapters/
    """
    
    def __init__(
        self,
        bios_dir: str,
        static_dir: str,
        individuals: Dict,
        link_converter=None
    ):
        """
        Initialize the chapters index handler.
        
        Args:
            bios_dir: Path to bios/ directory (source)
            static_dir: Path to site/quartz/static/ directory (destination)
            individuals: Raw individuals from GEDCOM (for profile names)
            link_converter: Optional LinkConverter for processing [Name|ID] links
        
        Example:
            >>> handler = ChaptersIndexHandler("bios/", "site/quartz/static", individuals, link_converter)
        """
        self.bios_dir = bios_dir
        self.static_dir = static_dir
        self.individuals = individuals
        self.link_converter = link_converter
        
        logger.info(f"ChaptersIndexHandler initialized")
        logger.debug(f"Bios dir: {bios_dir}")
        logger.debug(f"Static dir: {static_dir}")
        if link_converter:
            logger.debug("Link converter enabled for chapter processing")
    
    def create_chapters_index(self) -> Dict:
        """
        Create chapters-index.json and copy all chapter files.
        
        Returns:
            The created chapters index dictionary
        
        Example:
            >>> index = handler.create_chapters_index()
            >>> print(f"Indexed {len(index)} profiles with chapters")
        """
        log_section(logger, "CREATING CHAPTERS INDEX")
        
        chapters_index = {}
        chapters_output_dir = os.path.join(self.static_dir, "chapters")
        
        # Remove old chapters directory if it exists
        remove_directory_safe(chapters_output_dir)
        os.makedirs(chapters_output_dir, exist_ok=True)
        
        # Load shared chapters configuration
        shared_chapters_config = self._load_shared_chapters_config()
        
        # Scan bios directory for subdirectories
        if not os.path.exists(self.bios_dir):
            logger.warning(f"Bios directory not found: {self.bios_dir}")
            return chapters_index
        
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
            self._process_profile_chapters(
                entry,
                entry_path,
                chapters_output_dir,
                chapters_index
            )
        
        # Process shared chapters
        self._process_shared_chapters(
            shared_chapters_config,
            chapters_output_dir,
            chapters_index
        )
        
        # Write index to file
        self._write_chapters_index(chapters_index)
        
        logger.info(f"✓ Chapters index created with {len(chapters_index)} profiles")
        return chapters_index
    
    # ========================================================================
    # Configuration Loading
    # ========================================================================
    
    def _load_shared_chapters_config(self) -> Dict:
        """
        Load shared chapters configuration from bios/shared_chapters.json.
        
        Returns:
            Dictionary of shared chapters config, or empty dict if not found
        """
        shared_chapters_path = os.path.join(self.bios_dir, "shared_chapters.json")
        
        if not os.path.exists(shared_chapters_path):
            logger.debug("No shared_chapters.json found")
            return {}
        
        try:
            with open(shared_chapters_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            logger.info(f"Loaded shared chapters config: {len(config)} profiles")
            return config
        except Exception as e:
            logger.error(f"Error loading shared_chapters.json: {e}")
            return {}
    
    # ========================================================================
    # Profile Chapters Processing
    # ========================================================================
    
    def _process_profile_chapters(
        self,
        profile_id: str,
        profile_path: str,
        chapters_output_dir: str,
        chapters_index: Dict
    ):
        """
        Process chapters for a single profile.
        
        Args:
            profile_id: Profile ID (e.g., "I11052340")
            profile_path: Path to profile directory
            chapters_output_dir: Output directory for chapters
            chapters_index: Index dictionary (modified in place)
        """
        logger.debug(f"Found chapter directory: {profile_id}")
        
        # Get profile name from GEDCOM
        person_key = f"@{profile_id}@"
        person = self.individuals.get(person_key)
        if not person:
            logger.warning(f"Profile {profile_id} not found in GEDCOM, skipping")
            return
        
        profile_name = person.get("NAME", "Unknown")
        
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
        
        if not chapter_files and not main_bio_file:
            logger.debug(f"No chapter files found in {profile_path}")
            return
        
        # Create chapter output directory
        profile_chapters_dir = os.path.join(chapters_output_dir, profile_id)
        os.makedirs(profile_chapters_dir, exist_ok=True)
        
        # Build chapters list
        chapters_list = []
        
        # Add main bio as "Introduction" if it exists
        if main_bio_file:
            intro_chapter = self._process_main_bio(
                profile_path,
                main_bio_file,
                profile_chapters_dir
            )
            if intro_chapter:
                chapters_list.append(intro_chapter)
        
        # Add other chapters
        for filename in chapter_files:
            chapter = self._process_chapter_file(
                profile_path,
                filename,
                profile_chapters_dir
            )
            if chapter:
                chapters_list.append(chapter)
        
        # Add to index
        if chapters_list:
            chapters_index[profile_id] = {
                "profileName": profile_name,
                "main": chapters_list[0] if main_bio_file else None,
                "chapters": chapters_list[1:] if main_bio_file else chapters_list
            }
            logger.info(f"Added {len(chapters_list)} chapters for {profile_id}")
    
    def _process_main_bio(
        self,
        profile_path: str,
        main_bio_file: str,
        output_dir: str
    ) -> Optional[Dict]:
        """
        Process main biography file.
        
        Returns:
            Chapter info dictionary or None on error
        """
        main_bio_path = os.path.join(profile_path, main_bio_file)
        
        # Read title from file - skip empty lines and find first heading
        title = "Introduction"
        try:
            with open(main_bio_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and line.startswith('#'):
                        title = line.lstrip('#').strip()
                        break
        except Exception as e:
            logger.warning(f"Error reading title from {main_bio_path}: {e}")
        
        # Read, process, and write file
        dest_path = os.path.join(output_dir, main_bio_file)
        try:
            with open(main_bio_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Process [Name|ID] links if converter available
            # Use Markdown links (not HTML) so JavaScript can add base path correctly
            if self.link_converter:
                content = self.link_converter.convert_ids_to_markdown_links(content)
            
            with open(dest_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            logger.debug(f"  Copied and processed {main_bio_file}")
        except Exception as e:
            logger.error(f"Failed to copy {main_bio_file}: {e}")
            return None
        
        return {
            "slug": "introduction",
            "name": "Introduction",
            "title": title,
            "filename": main_bio_file
        }
    
    def _process_chapter_file(
        self,
        profile_path: str,
        filename: str,
        output_dir: str
    ) -> Optional[Dict]:
        """
        Process a single chapter file.
        
        Returns:
            Chapter info dictionary or None on error
        """
        chapter_path = os.path.join(profile_path, filename)
        
        # Generate slug from filename
        slug = filename[:-3].replace('_', '-').lower()
        
        # Generate name from filename
        name = re.sub(r'^\d+-', '', filename[:-3])  # Remove leading numbers
        name = name.replace('_', ' ').replace('-', ' ').title()
        
        # Read title from file - skip empty lines and find first heading
        title = name
        try:
            with open(chapter_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and line.startswith('#'):
                        title = line.lstrip('#').strip()
                        break
        except Exception as e:
            logger.warning(f"Error reading title from {chapter_path}: {e}")
        
        # Read, process, and write file
        dest_path = os.path.join(output_dir, filename)
        try:
            with open(chapter_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Process [Name|ID] links if converter available
            # Use Markdown links (not HTML) so JavaScript can add base path correctly
            if self.link_converter:
                content = self.link_converter.convert_ids_to_markdown_links(content)
            
            with open(dest_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            logger.debug(f"  Copied and processed {filename}")
        except Exception as e:
            logger.error(f"Failed to copy {filename}: {e}")
            return None
        
        return {
            "slug": slug,
            "name": name,
            "title": title,
            "filename": filename
        }
    
    # ========================================================================
    # Shared Chapters Processing
    # ========================================================================
    
    def _process_shared_chapters(
        self,
        shared_config: Dict,
        chapters_output_dir: str,
        chapters_index: Dict
    ):
        """
        Process shared chapters from configuration.
        
        Args:
            shared_config: Shared chapters configuration
            chapters_output_dir: Output directory for chapters
            chapters_index: Index dictionary (modified in place)
        """
        if not shared_config:
            return
        
        logger.info(f"Processing {len(shared_config)} profiles with shared chapters")
        
        for target_profile_id, config in shared_config.items():
            source_profile_id = config.get("shared_from")
            shared_chapter_files = config.get("chapters", [])
            
            if not source_profile_id or not shared_chapter_files:
                logger.warning(f"Invalid shared chapters config for {target_profile_id}")
                continue
            
            self._add_shared_chapters_to_profile(
                target_profile_id,
                source_profile_id,
                shared_chapter_files,
                chapters_output_dir,
                chapters_index
            )
    
    def _add_shared_chapters_to_profile(
        self,
        target_profile_id: str,
        source_profile_id: str,
        shared_chapter_files: List[str],
        chapters_output_dir: str,
        chapters_index: Dict
    ):
        """
        Add shared chapters to a target profile.
        
        Args:
            target_profile_id: Target profile ID
            source_profile_id: Source profile ID (where chapters come from)
            shared_chapter_files: List of chapter filenames to share
            chapters_output_dir: Output directory for chapters
            chapters_index: Index dictionary (modified in place)
        """
        # Check source directory exists
        source_chapters_dir = os.path.join(self.bios_dir, source_profile_id)
        if not os.path.exists(source_chapters_dir):
            logger.warning(f"Source directory not found: {source_chapters_dir}")
            return
        
        # Get target profile info
        person_key = f"@{target_profile_id}@"
        person = self.individuals.get(person_key)
        if not person:
            logger.warning(f"Target profile {target_profile_id} not found in GEDCOM")
            return
        
        target_profile_name = person.get("NAME", "Unknown")
        target_chapters_dir = os.path.join(chapters_output_dir, target_profile_id)
        os.makedirs(target_chapters_dir, exist_ok=True)
        
        # Initialize chapters index entry if it doesn't exist
        if target_profile_id not in chapters_index:
            self._initialize_target_profile(
                target_profile_id,
                target_profile_name,
                target_chapters_dir,
                chapters_index
            )
        
        # Add shared chapters
        for shared_chapter_file in shared_chapter_files:
            source_chapter_path = os.path.join(source_chapters_dir, shared_chapter_file)
            if not os.path.exists(source_chapter_path):
                logger.warning(f"Shared chapter not found: {source_chapter_path}")
                continue
            
            # Generate slug and name
            slug = shared_chapter_file[:-3].replace('_', '-').lower()
            name = re.sub(r'^\d+-', '', shared_chapter_file[:-3])
            name = name.replace('_', ' ').replace('-', ' ').title()
            
            # Read title - skip empty lines and find first heading
            title = name
            try:
                with open(source_chapter_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and line.startswith('#'):
                            title = line.lstrip('#').strip()
                            break
            except Exception as e:
                logger.warning(f"Error reading title from {source_chapter_path}: {e}")
            
            # Add to chapters list
            chapter_info = {
                "slug": slug,
                "name": name,
                "title": title,
                "filename": shared_chapter_file
            }
            chapters_index[target_profile_id]["chapters"].append(chapter_info)
            
            # Read, process, and write shared chapter file
            dest_path = os.path.join(target_chapters_dir, shared_chapter_file)
            try:
                with open(source_chapter_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Process [Name|ID] links if converter available
                # Use Markdown links (not HTML) so JavaScript can add base path correctly
                if self.link_converter:
                    content = self.link_converter.convert_ids_to_markdown_links(content)
                
                with open(dest_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                logger.debug(f"  Copied and processed shared chapter {shared_chapter_file} from {source_profile_id}")
            except Exception as e:
                logger.error(f"Failed to copy shared chapter {shared_chapter_file}: {e}")
        
        logger.info(f"Added {len(shared_chapter_files)} shared chapters to {target_profile_id}")
    
    def _initialize_target_profile(
        self,
        target_profile_id: str,
        target_profile_name: str,
        target_chapters_dir: str,
        chapters_index: Dict
    ):
        """
        Initialize a target profile that doesn't have its own chapters yet.
        
        Args:
            target_profile_id: Target profile ID
            target_profile_name: Target profile name
            target_chapters_dir: Output directory for this profile
            chapters_index: Index dictionary (modified in place)
        """
        # Check if target has its own bio directory
        target_bio_dir = os.path.join(self.bios_dir, target_profile_id)
        target_main_bio = None
        
        if os.path.exists(target_bio_dir):
            for filename in os.listdir(target_bio_dir):
                if filename.lower().endswith('.md') and filename.lower() == f"{target_profile_id.lower()}.md":
                    target_main_bio = filename
                    break
        
        if target_main_bio:
            # Has own main bio - process it
            main_bio_path = os.path.join(target_bio_dir, target_main_bio)
            title = "Introduction"
            try:
                with open(main_bio_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and line.startswith('#'):
                            title = line.lstrip('#').strip()
                            break
            except Exception as e:
                logger.warning(f"Error reading title from {main_bio_path}: {e}")
            
            chapters_index[target_profile_id] = {
                "profileName": target_profile_name,
                "main": {
                    "slug": "introduction",
                    "name": "Introduction",
                    "title": title,
                    "filename": target_main_bio
                },
                "chapters": []
            }
            
            # Read, process, and write main bio file
            dest_path = os.path.join(target_chapters_dir, target_main_bio)
            try:
                with open(main_bio_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Process [Name|ID] links if converter available
                # Use Markdown links (not HTML) so JavaScript can add base path correctly
                if self.link_converter:
                    content = self.link_converter.convert_ids_to_markdown_links(content)
                
                with open(dest_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                logger.debug(f"  Copied and processed {target_main_bio}")
            except Exception as e:
                logger.error(f"Failed to copy {target_main_bio}: {e}")
        else:
            # Create minimal introduction
            chapters_index[target_profile_id] = {
                "profileName": target_profile_name,
                "main": {
                    "slug": "introduction",
                    "name": "Introduction",
                    "title": f"{target_profile_name} - Introduction",
                    "filename": f"{target_profile_id}.md"
                },
                "chapters": []
            }
            
            # Create minimal introduction file
            intro_path = os.path.join(target_chapters_dir, f"{target_profile_id}.md")
            try:
                with open(intro_path, 'w', encoding='utf-8') as f:
                    f.write(f"## {target_profile_name}\n\n")
                    f.write(f"This biography includes shared chapters from other family members.\n")
                logger.debug(f"  Created minimal introduction for {target_profile_id}")
            except Exception as e:
                logger.error(f"Failed to create minimal introduction: {e}")
    
    # ========================================================================
    # Index Writing
    # ========================================================================
    
    def _write_chapters_index(self, chapters_index: Dict):
        """
        Write chapters-index.json to static directory.
        
        Args:
            chapters_index: Chapters index dictionary
        """
        index_path = os.path.join(self.static_dir, "chapters-index.json")
        
        try:
            with open(index_path, 'w', encoding='utf-8') as f:
                json.dump(chapters_index, f, ensure_ascii=False, indent=2)
            logger.info(f"Wrote chapters index: {index_path}")
        except Exception as e:
            logger.error(f"Failed to write chapters index: {e}")

