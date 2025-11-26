"""
Media index handler for managing images and documents.

This module creates a JSON index of all images and documents,
handles tagged people in captions, and copies files to the static directory.
"""

import os
import json
from typing import Dict, List, Tuple, Optional
from gedcom.normalizer import norm_individual
from utils.logger import get_logger, log_section
from utils.file_utils import copy_directory_safe, copy_file_safe
from utils.link_converter import LinkConverter
from config import IMAGE_EXTENSIONS

logger = get_logger(__name__)


class MediaIndexHandler:
    """
    Handles creation of media index and copying of media files.
    
    This class:
    - Scans documents/ directory for images and documents
    - Extracts tagged people from captions
    - Distributes images to all tagged people's galleries
    - Creates media-index.json
    - Copies files to static directories
    """
    
    def __init__(
        self,
        documents_dir: str,
        static_dir: str,
        bios_dir: str = "bios",
        content_dir: str = "site/content",
        individuals: Optional[Dict] = None,
        id_to_slug: Optional[Dict] = None
    ):
        """
        Initialize the media index handler.
        
        Args:
            documents_dir: Path to documents/ directory (source)
            static_dir: Path to site/quartz/static/ directory (destination)
            bios_dir: Path to bios/ directory (for images in biographies)
            content_dir: Path to site/content/ directory (for bio images)
            individuals: Raw individuals from GEDCOM (for validation)
            id_to_slug: Mapping from person ID to unique slug
        
        Example:
            >>> handler = MediaIndexHandler("documents/", "site/quartz/static",
            ...                             individuals=individuals, id_to_slug=id_to_slug)
        """
        self.documents_dir = documents_dir
        self.static_dir = static_dir
        self.bios_dir = bios_dir
        self.content_dir = content_dir
        
        # Normalize individuals if provided
        self.individuals = {}
        if individuals:
            self.individuals = {i: norm_individual(i, d) for i, d in individuals.items()}
        
        self.id_to_slug = id_to_slug or {}
        
        # Initialize link converter if we have the data
        self.link_converter = None
        if self.individuals and self.id_to_slug:
            self.link_converter = LinkConverter(self.individuals, self.id_to_slug)
        
        logger.info(f"MediaIndexHandler initialized")
        logger.debug(f"Documents dir: {documents_dir}")
        logger.debug(f"Static dir: {static_dir}")
    
    def create_media_index(self) -> Dict:
        """
        Create media-index.json and copy all media files.
        
        Returns:
            The created media index dictionary
        
        Example:
            >>> index = handler.create_media_index()
            >>> print(f"Indexed {len(index['images'])} profiles with images")
        """
        log_section(logger, "CREATING MEDIA INDEX")
        
        # Initialize index structure
        index = {
            "images": {},
            "documents": {}
        }
        
        # Scan and process documents directory
        if os.path.exists(self.documents_dir):
            all_media_items = self._scan_documents_directory()
            index = self._distribute_media_items(all_media_items)
        else:
            logger.warning(f"Documents directory does not exist: {self.documents_dir}")
        
        # Write index to file
        self._write_media_index(index)
        
        # Copy files to static directories
        self._copy_static_files()
        
        # Copy bios images to content directory
        self._copy_bios_images()
        
        logger.info(f"✓ Media index created successfully")
        return index
    
    # ========================================================================
    # Scanning and Processing
    # ========================================================================
    
    def _scan_documents_directory(self) -> List[Tuple]:
        """
        Scan documents/ directory for images and documents.
        
        Returns:
            List of tuples: (owner_id, filename, caption, people_ids, item_type, title, description)
        """
        logger.info(f"Scanning documents directory: {self.documents_dir}")
        
        all_media_items = []
        profile_dirs = [
            d for d in os.listdir(self.documents_dir)
            if os.path.isdir(os.path.join(self.documents_dir, d))
        ]
        
        logger.info(f"Found {len(profile_dirs)} profile directories")
        
        for profile_id in profile_dirs:
            profile_dir = os.path.join(self.documents_dir, profile_id)
            logger.debug(f"Processing profile {profile_id}")
            
            files_in_dir = os.listdir(profile_dir)
            logger.debug(f"  Files in {profile_id}: {len(files_in_dir)} files")
            
            for filename in files_in_dir:
                # Skip metadata files
                if filename.endswith(('.txt', '.md')):
                    logger.debug(f"  Skipping metadata file: {filename}")
                    continue
                
                # Process image or document
                if self._is_image(filename):
                    item = self._process_image(profile_id, profile_dir, filename)
                    if item:
                        all_media_items.append(item)
                else:
                    item = self._process_document(profile_id, profile_dir, filename)
                    if item:
                        all_media_items.append(item)
        
        logger.info(f"Processed {len(all_media_items)} media items")
        return all_media_items
    
    def _is_image(self, filename: str) -> bool:
        """Check if file is an image based on extension."""
        ext = os.path.splitext(filename)[1].lower()
        return ext in IMAGE_EXTENSIONS
    
    def _process_image(
        self,
        profile_id: str,
        profile_dir: str,
        filename: str
    ) -> Optional[Tuple]:
        """
        Process a single image file.
        
        Returns:
            Tuple of (owner_id, filename, caption_html, people_ids, 'image', None, None)
            or None if processing fails
        """
        logger.debug(f"  Found image: {filename}")
        base_name = os.path.splitext(filename)[0]
        
        # Try to read caption from metadata file
        caption_raw = ""
        for ext in ['.txt', '.md']:
            caption_file = os.path.join(profile_dir, base_name + ext)
            if os.path.exists(caption_file):
                try:
                    with open(caption_file, 'r', encoding='utf-8') as f:
                        caption_raw = f.read().strip()
                    logger.debug(f"    Caption from {base_name}{ext}: {caption_raw[:50]}...")
                    break
                except Exception as e:
                    logger.error(f"    Failed to read caption file {caption_file}: {e}")
        
        # Extract person IDs from caption
        people_ids = []
        if self.link_converter and caption_raw:
            people_ids = self.link_converter.extract_person_ids(caption_raw, validate=True)
            if people_ids:
                logger.debug(f"    Found tagged people: {people_ids}")
        
        # Convert IDs to links in caption
        caption_html = caption_raw
        if self.link_converter and caption_raw:
            caption_html = self.link_converter.convert_ids_to_links(caption_raw)
        
        return (profile_id, filename, caption_html, people_ids, 'image', None, None)
    
    def _process_document(
        self,
        profile_id: str,
        profile_dir: str,
        filename: str
    ) -> Optional[Tuple]:
        """
        Process a single document file.
        
        Returns:
            Tuple of (owner_id, filename, None, [], 'document', title, description)
            or None if processing fails
        """
        logger.debug(f"  Found document: {filename}")
        base_name = os.path.splitext(filename)[0]
        
        # Try to read metadata from file with same name
        title = filename
        description = ""
        
        for ext in ['.txt', '.md']:
            meta_file = os.path.join(profile_dir, base_name + ext)
            if os.path.exists(meta_file):
                try:
                    with open(meta_file, 'r', encoding='utf-8') as f:
                        lines = f.read().strip().split('\n')
                        if len(lines) > 0:
                            title = lines[0]
                        if len(lines) > 1:
                            description = lines[1]
                    logger.debug(f"    Metadata: title='{title}', desc='{description[:30]}...'")
                    break
                except Exception as e:
                    logger.error(f"    Failed to read metadata file {meta_file}: {e}")
        
        return (profile_id, filename, None, [], 'document', title, description)
    
    # ========================================================================
    # Distribution and Index Building
    # ========================================================================
    
    def _distribute_media_items(self, all_media_items: List[Tuple]) -> Dict:
        """
        Distribute media items to all tagged people.
        
        Args:
            all_media_items: List of media item tuples
        
        Returns:
            Media index dictionary
        """
        logger.info(f"Distributing {len(all_media_items)} media items to tagged profiles")
        
        index = {
            "images": {},
            "documents": {}
        }
        
        for owner_id, filename, caption_or_none, people_ids, item_type, title, description in all_media_items:
            if item_type == 'image':
                self._distribute_image(
                    index,
                    owner_id,
                    filename,
                    caption_or_none,
                    people_ids
                )
            else:  # document
                self._add_document(
                    index,
                    owner_id,
                    filename,
                    title,
                    description
                )
        
        logger.info(f"Final: {len(index['images'])} profiles with images, "
                   f"{len(index['documents'])} profiles with documents")
        return index
    
    def _distribute_image(
        self,
        index: Dict,
        owner_id: str,
        filename: str,
        caption: str,
        people_ids: List[str]
    ):
        """
        Add image to owner and all tagged people.
        
        Args:
            index: Media index dictionary (modified in place)
            owner_id: ID of profile that owns this image
            filename: Image filename
            caption: HTML caption with converted links
            people_ids: List of tagged person IDs (without @ symbols)
        """
        item = {
            "filename": filename,
            "caption": caption,
            "people": people_ids,
            "owner": owner_id,
            "path": f"/static/documents/{owner_id}/{filename}"
        }
        
        # Add image to owner
        if owner_id not in index["images"]:
            index["images"][owner_id] = []
        index["images"][owner_id].append(item)
        
        # Add image to all tagged people (remove duplicates)
        unique_people_ids = list(dict.fromkeys(people_ids))  # Preserves order
        if len(people_ids) != len(unique_people_ids):
            logger.warning(f"Duplicate IDs in people_ids for {filename}, removing duplicates")
        
        for person_id_raw in unique_people_ids:
            person_id_gedcom = '@' + person_id_raw + '@'
            # Don't duplicate for owner
            if person_id_gedcom != '@' + owner_id + '@':
                if person_id_raw not in index["images"]:
                    index["images"][person_id_raw] = []
                index["images"][person_id_raw].append(item)
                logger.debug(f"  Added image {filename} to {person_id_raw}'s gallery")
    
    def _add_document(
        self,
        index: Dict,
        owner_id: str,
        filename: str,
        title: str,
        description: str
    ):
        """
        Add document to owner.
        
        Args:
            index: Media index dictionary (modified in place)
            owner_id: ID of profile that owns this document
            filename: Document filename
            title: Document title
            description: Document description
        """
        item = {
            "filename": filename,
            "title": title,
            "description": description
        }
        
        if owner_id not in index["documents"]:
            index["documents"][owner_id] = []
        index["documents"][owner_id].append(item)
    
    # ========================================================================
    # File Operations
    # ========================================================================
    
    def _write_media_index(self, index: Dict):
        """
        Write media-index.json to static directory.
        
        Args:
            index: Media index dictionary
        """
        os.makedirs(self.static_dir, exist_ok=True)
        index_path = os.path.join(self.static_dir, "media-index.json")
        
        try:
            with open(index_path, 'w', encoding='utf-8') as f:
                json.dump(index, f, ensure_ascii=False, indent=2)
            logger.info(f"Wrote media index: {index_path}")
        except Exception as e:
            logger.error(f"Failed to write media index: {e}")
    
    def _copy_static_files(self):
        """Copy documents/ to site/quartz/static/documents/."""
        static_documents_dir = os.path.join(self.static_dir, "documents")
        
        logger.info(f"Copying {self.documents_dir} to {static_documents_dir}")
        
        if not os.path.exists(self.documents_dir):
            logger.warning(f"Source directory does not exist: {self.documents_dir}")
            return
        
        # Count files to copy
        total_files = sum(len(files) for _, _, files in os.walk(self.documents_dir))
        logger.info(f"Found {total_files} files to copy")
        
        # Copy directory
        success, error = copy_directory_safe(
            self.documents_dir,
            static_documents_dir,
            overwrite=True
        )
        
        if not success:
            logger.error(f"Failed to copy documents: {error}")
    
    def _copy_bios_images(self):
        """
        Copy image files from bios/ directory to site/content/.
        
        Quartz will then copy them to site/public/ during build.
        Creates both original filenames and dashed versions (for Quartz links).
        """
        logger.info(f"Copying image files from {self.bios_dir} to {self.content_dir}")
        
        if not os.path.exists(self.bios_dir):
            logger.warning(f"Bios directory does not exist: {self.bios_dir}")
            return
        
        os.makedirs(self.content_dir, exist_ok=True)
        
        copied_images = 0
        
        # Walk through bios directory and subdirectories
        for root, dirs, files in os.walk(self.bios_dir):
            # Skip hidden directories
            if any(part.startswith('.') for part in root.split(os.sep)):
                continue
            
            for filename in files:
                ext = os.path.splitext(filename)[1].lower()
                if ext not in IMAGE_EXTENSIONS:
                    continue
                
                file_path = os.path.join(root, filename)
                
                # Copy with original name (with spaces/underscores)
                dest_path = os.path.join(self.content_dir, filename)
                if copy_file_safe(file_path, dest_path):
                    copied_images += 1
                    logger.debug(f"  Copied {filename}")
                
                # Also copy with dashes instead of spaces AND underscores
                # (for Quartz links and to avoid italic parsing)
                filename_with_dashes = filename.replace(' ', '-').replace('_', '-')
                if filename_with_dashes != filename:
                    dest_path_dashed = os.path.join(self.content_dir, filename_with_dashes)
                    if copy_file_safe(file_path, dest_path_dashed):
                        copied_images += 1
                        logger.debug(f"  Copied {filename_with_dashes}")
        
        logger.info(f"Copied {copied_images} image files from bios/ to {self.content_dir}")

