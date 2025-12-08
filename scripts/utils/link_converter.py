"""
Link conversion utilities for people and places.

This module provides a LinkConverter class that handles conversion of:
- Person IDs to HTML links
- Tagged people in captions ([Name|ID] format)
- Place names to Wikipedia links
"""

import re
import urllib.parse
from typing import List, Dict, Optional
from .logger import get_logger
from .file_utils import safe_filename
from .place_mappings import get_wiki_name

logger = get_logger(__name__)


class LinkConverter:
    """
    Converts IDs and names to HTML links.
    
    This class unifies several similar functions from the original code:
    - person_id_to_html
    - person_link_to_html
    - convert_ids_to_links
    - extract_person_ids
    """
    
    def __init__(self, individuals: Dict, id_to_slug: Dict):
        """
        Initialize the link converter.
        
        Args:
            individuals: Normalized individuals dictionary
            id_to_slug: Mapping from person ID to unique slug
        
        Example:
            >>> converter = LinkConverter(individuals, id_to_slug)
        """
        self.individuals = individuals
        self.id_to_slug = id_to_slug
        logger.debug(f"LinkConverter initialized with {len(individuals)} people")
    
    def person_id_to_html(self, person_id: str) -> str:
        """
        Convert a person ID to an HTML link.
        
        Args:
            person_id: GEDCOM ID (e.g., "@I123@")
        
        Returns:
            HTML link string, "private" if person is private, or "—" if person not found
        
        Example:
            >>> html = converter.person_id_to_html("@I11052340@")
            '<a href="/profiles/Morris-Hochman">Morris Hochman</a>'
        """
        if not person_id or person_id not in self.individuals:
            return "—"
        
        person = self.individuals[person_id]
        
        # Check if person is private
        if person.get("is_private", False):
            return "private"
        
        name = person.get("name") or person_id
        
        # Get unique slug
        slug = self.id_to_slug.get(person_id)
        if not slug:
            # Fallback to safe filename
            slug = safe_filename(name).replace(" ", "-")
            logger.warning(f"No slug found for {person_id}, using fallback: {slug}")
        
        # Encode slug for URL
        encoded_slug = urllib.parse.quote(slug)
        
        return f'<a href="/profiles/{encoded_slug}">{name}</a>'
    
    def extract_person_ids(self, text: str, validate: bool = True) -> List[str]:
        """
        Extract all person IDs from text.
        
        Supports two formats:
        1. [Name|ID] format (preferred): extracts ID from [John|I123456]
        2. Standalone ID format (legacy): extracts I123456
        
        Args:
            text: Text containing person IDs
            validate: Whether to validate IDs against GEDCOM data and warn on mismatches
        
        Returns:
            List of unique person IDs (without @ symbols)
        
        Example:
            >>> text = "Photo of [Morris|I11052340] and [Tobl|I11052350]"
            >>> ids = converter.extract_person_ids(text)
            ['I11052340', 'I11052350']
        """
        if not text:
            return []
        
        ids = []
        name_id_pairs = []  # Store (name, ID) pairs for validation
        
        # Extract from [Name|ID] format
        matches = re.findall(r'\[([^\|]+)\|(I\d+)\]', text)
        for name, person_id in matches:
            name_id_pairs.append((name.strip(), person_id))
            ids.append(person_id)
        
        # Extract standalone IDs (for backward compatibility)
        standalone_ids = re.findall(r'\bI\d+\b', text)
        for sid in standalone_ids:
            # Only add if not already in a [Name|ID] format
            if not re.search(r'\[[^\|]+\|' + re.escape(sid) + r'\]', text):
                ids.append(sid)
        
        # Check for duplicates
        from collections import Counter
        id_counts = Counter(ids)
        duplicates = {id_val: count for id_val, count in id_counts.items() if count > 1}
        if duplicates:
            logger.warning(f"Duplicate person IDs found in text: {duplicates}")
            logger.debug(f"Text snippet: {text[:100]}...")
        
        # Validate name-ID pairs against GEDCOM data
        if validate and self.individuals:
            for name, person_id in name_id_pairs:
                self._validate_name_id_pair(name, person_id, text)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_ids = []
        for id_val in ids:
            if id_val not in seen:
                seen.add(id_val)
                unique_ids.append(id_val)
        
        if len(ids) != len(unique_ids):
            logger.debug(f"Removed {len(ids) - len(unique_ids)} duplicate ID(s)")
        
        return unique_ids
    
    def _validate_name_id_pair(self, caption_name: str, person_id: str, full_text: str):
        """
        Validate that a name-ID pair matches GEDCOM data.
        
        Args:
            caption_name: Name from caption
            person_id: Person ID (without @)
            full_text: Full text for error reporting
        """
        person_id_gedcom = '@' + person_id + '@'
        person_info = self.individuals.get(person_id_gedcom)
        
        if not person_info:
            logger.warning(f"Person ID not found in GEDCOM: {person_id}")
            logger.debug(f"Caption: '[{caption_name}|{person_id}]'")
            logger.debug(f"Text: {full_text[:100]}...")
            return
        
        gedcom_name = person_info.get("name", "").lower()
        caption_name_lower = caption_name.lower()
        
        # Check if any part of caption name matches any part of GEDCOM name
        name_parts = gedcom_name.split()
        caption_parts = caption_name_lower.split()
        
        name_match = False
        for caption_part in caption_parts:
            for name_part in name_parts:
                if caption_part in name_part or name_part in caption_part:
                    name_match = True
                    break
            if name_match:
                break
        
        # Also check full name match
        if not name_match:
            if caption_name_lower not in gedcom_name and gedcom_name not in caption_name_lower:
                logger.warning(f"Possible name-ID mismatch:")
                logger.warning(f"  Caption: '[{caption_name}|{person_id}]'")
                logger.warning(f"  GEDCOM:  '{person_info.get('name', 'N/A')}' (ID: {person_id})")
                logger.debug(f"  Text: {full_text[:100]}...")
    
    def convert_ids_to_links(self, text: str) -> str:
        """
        Convert [Name|ID] and standalone IDs in text to HTML links.
        Skips processing inside code blocks (```...```) to preserve ASCII trees.
        
        Args:
            text: Text with person IDs
        
        Returns:
            Text with HTML links
        
        Example:
            >>> text = "Photo of [Morris|I11052340] in Perth"
            >>> html = converter.convert_ids_to_links(text)
            'Photo of <a href="/profiles/Morris-Hochman">Morris</a> in Perth'
        """
        if not text or not self.individuals or not self.id_to_slug:
            return text
        
        # Split text into code blocks, image wikilinks, and regular content
        # Pattern: ```language\n...\n``` or ```\n...\n```
        # Also exclude image wikilinks: ![[path/to/image.png]]
        code_block_pattern = r'(```[^\n]*\n[\s\S]*?```|!\[\[[^\]]+\]\])'
        parts = re.split(code_block_pattern, text)
        
        result_parts = []
        for i, part in enumerate(parts):
            # Even indices are regular content, odd indices are code blocks or image wikilinks
            if i % 2 == 0:
                # Regular content - process links
                # IMPORTANT: Don't process [Name|ID] if it's part of a Markdown link [text](url)
                # Pattern: [Name|ID] but NOT [Name|ID](url)
                # We need to be careful not to match [Name|ID] that's already part of a link
                processed = re.sub(r'\[([^\|]+)\|(I\d+)\](?!\()', self._replace_name_id_format, part)
                # Then, replace standalone IDs (legacy format)
                # IMPORTANT: Don't process IDs that are part of file paths (e.g., bios/I11052340/img.png)
                # Pattern: I\d+ but NOT if it's part of a path like /I123/ or \I123\ or bios/I123/
                # Use negative lookbehind/lookahead to exclude IDs that are surrounded by path separators
                processed = re.sub(r'(?<![/\\\w])I\d+(?![/\\\w])', self._replace_standalone_id, processed)
                result_parts.append(processed)
            else:
                # Code block or image wikilink - keep as-is (don't process links)
                result_parts.append(part)
        
        return ''.join(result_parts)
    
    def _replace_name_id_format(self, match):
        """
        Replace [Name|ID] with HTML link using the original name.
        
        Args:
            match: Regex match object
        
        Returns:
            HTML link string or original name text (without link) if person is private
        """
        full_match = match.group(0)  # e.g., "[Hymie|I40775871]"
        original_name = match.group(1)  # e.g., "Hymie"
        raw_id = match.group(2)  # e.g., "I40775871"
        person_id = '@' + raw_id + '@'  # Convert to GEDCOM format
        
        person_info = self.individuals.get(person_id)
        if not person_info:
            logger.debug(f"Person not found for {raw_id}, keeping original text")
            return full_match  # Keep as-is if not found
        
        # Check if person is private - if so, return just the name without link
        if person_info.get("is_private", False):
            logger.warning(f"Private profile detected: [{original_name}|{raw_id}] - returning name without link")
            return original_name
        
        # Get slug for this person
        slug = self.id_to_slug.get(person_id)
        if not slug:
            # Fallback: use full name from GEDCOM
            name = person_info.get("name") or raw_id
            slug = safe_filename(name).replace(" ", "-")
            logger.debug(f"No slug for {person_id}, using fallback: {slug}")
        
        # Create HTML link using the ORIGINAL name from caption
        encoded_slug = urllib.parse.quote(slug)
        return f'<a href="/profiles/{encoded_slug}">{original_name}</a>'
    
    def _replace_standalone_id(self, match):
        """
        Replace standalone I123456 with HTML link using full name (legacy format).
        
        Args:
            match: Regex match object
        
        Returns:
            HTML link string or name text (without link) if person is private
        """
        raw_id = match.group(0)  # e.g., "I11052340"
        person_id = '@' + raw_id + '@'  # Convert to GEDCOM format
        
        person_info = self.individuals.get(person_id)
        if not person_info:
            logger.debug(f"Person not found for {raw_id}, keeping original text")
            return raw_id  # Keep as-is if not found
        
        # Check if person is private - if so, return just the name without link
        if person_info.get("is_private", False):
            # Get full name from GEDCOM to return as plain text
            name = person_info.get("name") or raw_id
            logger.warning(f"Private profile detected: {raw_id} ({name}) - returning name without link")
            return name
        
        # Get full name from GEDCOM
        name = person_info.get("name") or raw_id
        
        # Get slug for this person
        slug = self.id_to_slug.get(person_id)
        if not slug:
            slug = safe_filename(name).replace(" ", "-")
            logger.debug(f"No slug for {person_id}, using fallback: {slug}")
        
        # Create HTML link with full name
        encoded_slug = urllib.parse.quote(slug)
        return f'<a href="/profiles/{encoded_slug}">{name}</a>'
    
    def convert_ids_to_markdown_links(self, text: str) -> str:
        """
        Convert [Name|ID] format to Markdown links [Name](/profiles/Slug).
        
        This is used for static pages where Quartz will process the Markdown,
        so we need Markdown links, not HTML.
        
        Args:
            text: Text with person IDs in [Name|ID] format
        
        Returns:
            Text with Markdown links
        
        Example:
            >>> text = "Photo of [Morris|I11052340] in Perth"
            >>> markdown = converter.convert_ids_to_markdown_links(text)
            'Photo of [Morris](/profiles/Morris-Hochman) in Perth'
        """
        if not text or not self.individuals or not self.id_to_slug:
            return text
        
        def replace_name_id_to_markdown(match):
            """Replace [Name|ID] with Markdown link [Name](/profiles/Slug)."""
            full_match = match.group(0)  # e.g., "[Morris|I11052340]"
            original_name = match.group(1)  # e.g., "Morris"
            raw_id = match.group(2)  # e.g., "I11052340"
            person_id = '@' + raw_id + '@'  # Convert to GEDCOM format
            
            person_info = self.individuals.get(person_id)
            if not person_info:
                logger.debug(f"Person not found for {raw_id}, keeping original text")
                return full_match  # Keep as-is if not found
            
            # Check if person is private - if so, return just the name without link
            if person_info.get("is_private", False):
                logger.warning(f"Private profile detected: [{original_name}|{raw_id}] - returning name without link")
                return original_name
            
            # Get slug for this person
            slug = self.id_to_slug.get(person_id)
            if not slug:
                # Fallback: use full name from GEDCOM
                name = person_info.get("name") or raw_id
                slug = safe_filename(name).replace(" ", "-")
                logger.debug(f"No slug for {person_id}, using fallback: {slug}")
            
            # Encode slug for URL
            encoded_slug = urllib.parse.quote(slug)
            
            # Return Markdown link (not HTML)
            return f'[{original_name}](/profiles/{encoded_slug})'
        
        # Replace [Name|ID] format with Markdown links
        # IMPORTANT: Don't process [Name|ID] if it's part of a Markdown link [text](url)
        # Pattern: [Name|ID] but NOT [Name|ID](url)
        text = re.sub(r'\[([^\|]+)\|(I\d+)\](?!\()', replace_name_id_to_markdown, text)
        
        return text
    
    def wikilink_place(self, place: str, format: str = "markdown") -> str:
        """
        Create a Wikipedia link for a place.
        
        Args:
            place: Place name
            format: "markdown" or "html"
        
        Returns:
            Formatted link string, or empty string if no place
        
        Example:
            >>> link = converter.wikilink_place("Perth, Australia")
            '[Perth, Australia](https://en.wikipedia.org/wiki/Perth,_Western_Australia)'
        """
        if not place:
            return ""
        
        wiki_name = get_wiki_name(place)
        wiki_url = f"https://en.wikipedia.org/wiki/{wiki_name}"
        
        if format == "html":
            return f'<a href="{wiki_url}">{place}</a>'
        else:  # markdown
            return f"[{place}]({wiki_url})"

