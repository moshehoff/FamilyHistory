"""
Index generators for creating navigation and summary pages.

This module provides functions for creating various index pages:
- All profiles index
- Profiles with biographies
- Profiles with galleries
- Family data JSON
- Source content copying
- Project cleaning
"""

import os
import json
import urllib.parse
from typing import Dict
from gedcom.normalizer import norm_individual, norm_family
from utils.logger import get_logger
from utils.file_utils import copy_file_safe, copy_directory_safe, remove_directory_safe

logger = get_logger(__name__)


def write_people_index(people_dir: str, pages_dir: str):
    """
    Create all-profiles.md with links to all profiles.
    
    Args:
        people_dir: Directory containing profile markdown files
        pages_dir: Directory to write index page to
    
    Example:
        >>> write_people_index("site/content/profiles", "site/content/pages")
    """
    logger.info("Creating all-profiles index")
    
    files = sorted(
        f for f in os.listdir(people_dir)
        if f.lower().endswith(".md") and f.lower() not in ("index.md", "bios.md")
    )
    
    lines = ["## All Profiles\n"]
    for fname in files:
        # Use slugified name (with dashes) for URL
        slugified_name = fname[:-3]  # strip .md
        # Display name with spaces instead of dashes (same as profiles-of-interest)
        display_name = slugified_name.replace('-', ' ')
        url = "/profiles/" + urllib.parse.quote(slugified_name)
        lines.append(f"* [{display_name}]({url})")
    
    os.makedirs(pages_dir, exist_ok=True)
    output_path = os.path.join(pages_dir, "all-profiles.md")
    
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
        logger.info(f"Created all-profiles.md with {len(files)} profiles")
    except Exception as e:
        logger.error(f"Failed to write all-profiles.md: {e}")


def write_bios_index(people_dir: str, bios_dir: str, pages_dir: str):
    """
    Create profiles-of-interest.md with links to profiles that have biographies.
    
    Args:
        people_dir: Directory containing profile markdown files
        bios_dir: Directory containing biography files
        pages_dir: Directory to write index page to
    
    Example:
        >>> write_bios_index("site/content/profiles", "bios", "site/content/pages")
    """
    logger.info("Creating profiles-of-interest index")
    
    # Get all biography IDs
    bio_ids = _collect_bio_ids(bios_dir)
    logger.info(f"Found {len(bio_ids)} profiles with biographies")
    
    # Get all profile files that have matching bios
    profiles_with_bios = []
    for fname in sorted(os.listdir(people_dir)):
        if not fname.endswith('.md'):
            continue
        
        profile_path = os.path.join(people_dir, fname)
        gedcom_id = _extract_gedcom_id(profile_path)
        
        if gedcom_id and gedcom_id in bio_ids:
            # Use slugified name (with dashes instead of spaces) for URL
            slugified_name = fname[:-3].replace(' ', '-')
            # Display name with spaces instead of dashes
            display_name = fname[:-3].replace('-', ' ')
            profiles_with_bios.append((display_name, slugified_name))
    
    # Create the index page
    lines = [
        "## Profiles of Interest\n",
        "This page lists family members who have extended biographical information.\n"
    ]
    
    if profiles_with_bios:
        for title, slugified_name in profiles_with_bios:
            url = "/profiles/" + slugified_name
            lines.append(f"* [{title}]({url})")
    else:
        lines.append("*No biographical information available yet.*")
    
    os.makedirs(pages_dir, exist_ok=True)
    output_path = os.path.join(pages_dir, "profiles-of-interest.md")
    
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
        logger.info(f"Created profiles-of-interest.md with {len(profiles_with_bios)} profiles")
    except Exception as e:
        logger.error(f"Failed to write profiles-of-interest.md: {e}")


def write_gallery_index(people_dir: str, static_dir: str, pages_dir: str):
    """
    Create profiles-with-gallery.md with links to profiles that have images.
    
    Args:
        people_dir: Directory containing profile markdown files
        static_dir: Directory containing media-index.json
        pages_dir: Directory to write index page to
    
    Example:
        >>> write_gallery_index("site/content/profiles", "site/quartz/static", "site/content/pages")
    """
    logger.info("Creating profiles-with-gallery index")
    
    # Read media-index.json
    media_index_path = os.path.join(static_dir, "media-index.json")
    
    if not os.path.exists(media_index_path):
        logger.warning("media-index.json not found, creating empty gallery index")
        _create_empty_gallery_index(pages_dir)
        return
    
    # Load media index
    try:
        with open(media_index_path, 'r', encoding='utf-8') as f:
            media_index = json.load(f)
    except Exception as e:
        logger.error(f"Failed to read media-index.json: {e}")
        _create_empty_gallery_index(pages_dir)
        return
    
    # Get all profile IDs that have images
    gallery_ids = set()
    if 'images' in media_index:
        gallery_ids = set(media_index['images'].keys())
    
    logger.info(f"Found {len(gallery_ids)} profiles with gallery images")
    
    # Get all profile files that have matching gallery
    profiles_with_gallery = []
    for fname in sorted(os.listdir(people_dir)):
        if not fname.endswith('.md'):
            continue
        
        profile_path = os.path.join(people_dir, fname)
        gedcom_id = _extract_gedcom_id(profile_path)
        
        if gedcom_id and gedcom_id in gallery_ids:
            # Use slugified name (with dashes instead of spaces) for URL
            slugified_name = fname[:-3].replace(' ', '-')
            # Display name with spaces instead of dashes
            display_name = fname[:-3].replace('-', ' ')
            profiles_with_gallery.append((display_name, slugified_name))
    
    # Create the index page
    lines = [
        "## Profiles with Gallery\n",
        "This page lists family members who have images in their gallery.\n"
    ]
    
    if profiles_with_gallery:
        for title, slugified_name in profiles_with_gallery:
            url = "/profiles/" + slugified_name
            lines.append(f"* [{title}]({url})")
    else:
        lines.append("*No gallery images available yet.*")
    
    os.makedirs(pages_dir, exist_ok=True)
    output_path = os.path.join(pages_dir, "profiles-with-gallery.md")
    
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
        logger.info(f"Created profiles-with-gallery.md with {len(profiles_with_gallery)} profiles")
    except Exception as e:
        logger.error(f"Failed to write profiles-with-gallery.md: {e}")


def write_family_data_json(individuals: Dict, families: Dict, out_dir: str):
    """
    Generate family-data.json for the large family tree visualization.
    
    Args:
        individuals: Raw individuals from GEDCOM
        families: Raw families from GEDCOM
        out_dir: Output directory for profiles (used to find static dir)
    
    Example:
        >>> write_family_data_json(individuals, families, "site/content/profiles")
    """
    logger.info("Generating family-data.json")
    
    inds = {i: norm_individual(i, d) for i, d in individuals.items()}
    fams = {f: norm_family(f, d) for f, d in families.items()}
    
    # Build clean data structure
    people = []
    for pid, p in inds.items():
        clean_id = pid.strip("@")
        people.append({
            "id": clean_id,
            "name": p["name"],
            "birth_date": p["birth_date"],
            "death_date": p["death_date"],
            "famc": p["famc"].strip("@") if p["famc"] else None,
            "fams": [f.strip("@") for f in p["fams"]]
        })
    
    families_list = []
    for fid, f in fams.items():
        clean_id = fid.strip("@")
        families_list.append({
            "id": clean_id,
            "husband": f["husband"].strip("@") if f["husband"] else None,
            "wife": f["wife"].strip("@") if f["wife"] else None,
            "children": [c.strip("@") for c in f["children"]]
        })
    
    data = {
        "people": people,
        "families": families_list
    }
    
    # Write to Quartz static folder
    # Assuming output is site/content/profiles, static is at site/quartz/static
    static_dir = os.path.join(out_dir, "..", "..", "quartz", "static")
    os.makedirs(static_dir, exist_ok=True)
    output_path = os.path.join(static_dir, "family-data.json")
    
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info(f"Generated family-data.json with {len(people)} people and {len(families_list)} families")
    except Exception as e:
        logger.error(f"Failed to write family-data.json: {e}")


def write_id_to_slug_json(id_to_slug: Dict, out_dir: str, static_dir: str = None):
    """
    Generate id-to-slug.json for JavaScript to convert [Name|ID] to slugs.
    
    Args:
        id_to_slug: Mapping from person ID (with @ symbols) to unique slug
        out_dir: Output directory for profiles (used to find static dir if static_dir not provided)
        static_dir: Optional static directory path (if provided, used directly)
    
    Example:
        >>> write_id_to_slug_json(id_to_slug, "site/content/profiles")
        >>> write_id_to_slug_json(id_to_slug, "site/content/profiles", "site/quartz/static")
    """
    logger.info("Generating id-to-slug.json")
    
    # Convert IDs from @I123@ format to I123 format for JavaScript
    clean_mapping = {}
    for pid, slug in id_to_slug.items():
        clean_id = pid.strip("@")
        clean_mapping[clean_id] = slug
    
    # Write to Quartz static folder
    if static_dir is None:
        # Calculate static dir relative to out_dir
        # Assuming output is site/content/profiles, static is at site/quartz/static
        static_dir = os.path.join(out_dir, "..", "..", "quartz", "static")
    
    # Normalize path to handle relative paths correctly
    # If static_dir is relative and starts with "site/", resolve it relative to project root
    if not os.path.isabs(static_dir):
        # Check if path starts with "site/" - if so, find project root
        if static_dir.startswith("site/"):
            # Find project root by looking for scripts/ or site/ directory
            current = os.path.abspath(os.curdir)
            project_root = current
            # Go up until we find scripts/ or site/ directory
            while project_root and project_root != os.path.dirname(project_root):
                if os.path.exists(os.path.join(project_root, "scripts")) and os.path.exists(os.path.join(project_root, "site")):
                    break
                project_root = os.path.dirname(project_root)
            
            if project_root and project_root != os.path.dirname(project_root):
                # Make static_dir absolute relative to project root
                static_dir = os.path.normpath(os.path.join(project_root, static_dir))
            else:
                # Fallback: use absolute path from current directory
                static_dir = os.path.normpath(os.path.abspath(static_dir))
        else:
            # Other relative paths: resolve from current directory
            static_dir = os.path.normpath(os.path.abspath(static_dir))
    else:
        static_dir = os.path.normpath(static_dir)
    
    os.makedirs(static_dir, exist_ok=True)
    output_path = os.path.join(static_dir, "id-to-slug.json")
    
    try:
        logger.debug(f"Writing id-to-slug.json to: {output_path}")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(clean_mapping, f, ensure_ascii=False, indent=2)
        logger.info(f"Generated id-to-slug.json with {len(clean_mapping)} mappings at {output_path}")
        # Verify file was written
        if not os.path.exists(output_path):
            logger.error(f"File was not created at {output_path}")
        else:
            logger.debug(f"Verified: file exists at {output_path}")
    except Exception as e:
        logger.error(f"Failed to write id-to-slug.json: {e}", exc_info=True)


def copy_source_content(src_content_dir: str, dst_content_dir: str, link_converter=None):
    """
    Copy source content (index.md, pages/) to site/content/ and process profile links.
    
    Args:
        src_content_dir: Source content directory (e.g., "content")
        dst_content_dir: Destination content directory (e.g., "site/content")
        link_converter: Optional LinkConverter for processing [Name|ID] links
    
    Example:
        >>> copy_source_content("content", "site/content", link_converter)
    """
    logger.info(f"Copying source content from {src_content_dir} to {dst_content_dir}")
    
    os.makedirs(dst_content_dir, exist_ok=True)
    
    # Copy index.md
    src_index = os.path.join(src_content_dir, "index.md")
    if os.path.exists(src_index):
        dst_index = os.path.join(dst_content_dir, "index.md")
        copy_file_safe(src_index, dst_index)
    
    # Copy and process pages/ directory
    src_pages = os.path.join(src_content_dir, "pages")
    dst_pages = os.path.join(dst_content_dir, "pages")
    
    if os.path.exists(src_pages):
        os.makedirs(dst_pages, exist_ok=True)
        for filename in os.listdir(src_pages):
            if not filename.endswith('.md'):
                # Copy non-markdown files as-is
                src_file = os.path.join(src_pages, filename)
                dst_file = os.path.join(dst_pages, filename)
                copy_file_safe(src_file, dst_file)
                continue
            
            src_file = os.path.join(src_pages, filename)
            dst_file = os.path.join(dst_pages, filename)
            
            try:
                # Read content
                with open(src_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Process [Name|ID] links if converter available
                # For static pages, convert to Markdown links (not HTML) since Quartz will process them
                if link_converter:
                    content = link_converter.convert_ids_to_markdown_links(content)
                
                # Write processed content
                with open(dst_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                logger.debug(f"  Copied and processed {filename}")
            except Exception as e:
                logger.error(f"Failed to process {filename}: {e}")
                # Fallback to simple copy
                copy_file_safe(src_file, dst_file)


def clean_project():
    """Remove all generated files and build outputs."""
    logger.info("Cleaning project...")
    
    paths_to_remove = [
        "site/content",  # All content (profiles, index.md, pages/)
        "site/public",   # Quartz build output
        "site/.quartz-cache",  # Quartz cache
        "site/site",  # Accidentally created nested directory
        "site/quartz/static/family-data.json",  # Generated family data
        "site/quartz/static/media-index.json",  # Generated media index
        "site/quartz/static/chapters-index.json",  # Generated chapters index
        "site/quartz/static/backlinks-index.json",  # Generated backlinks index
        "site/quartz/static/documents",  # Copied documents directory
        "site/quartz/static/chapters",  # Copied chapters directory
    ]
    
    for path in paths_to_remove:
        full_path = os.path.abspath(path)
        if os.path.exists(full_path):
            if os.path.isdir(full_path):
                if remove_directory_safe(full_path):
                    logger.info(f"  Removed directory: {path}")
            else:
                try:
                    os.remove(full_path)
                    logger.info(f"  Removed file: {path}")
                except Exception as e:
                    logger.warning(f"  Could not remove {path}: {e}")
        else:
            logger.debug(f"  Not found, skipping: {path}")
    
    logger.info("Clean complete!")


# ============================================================================
# Helper Functions
# ============================================================================

def _collect_bio_ids(bios_dir: str) -> set:
    """
    Collect all profile IDs that have biographies.
    
    Returns:
        Set of profile IDs (without @ symbols)
    """
    bio_ids = set()
    
    if not os.path.exists(bios_dir):
        return bio_ids
    
    for entry in os.listdir(bios_dir):
        entry_path = os.path.join(bios_dir, entry)
        
        # Check if it's a direct .md file
        if entry.endswith(('.md', '.MD')):
            bio_ids.add(os.path.splitext(entry)[0])
        
        # Check if it's a directory (chapter-based biography)
        elif os.path.isdir(entry_path) and not entry.startswith('.'):
            # Check if there's a main bio file (e.g., I10/I10.md)
            main_bio_file = os.path.join(entry_path, f"{entry}.md")
            if os.path.isfile(main_bio_file):
                bio_ids.add(entry)
    
    # Also include profiles with shared chapters
    shared_chapters_path = os.path.join(bios_dir, "shared_chapters.json")
    if os.path.exists(shared_chapters_path):
        try:
            with open(shared_chapters_path, 'r', encoding='utf-8') as f:
                shared_chapters_config = json.load(f)
            for profile_id in shared_chapters_config.keys():
                bio_ids.add(profile_id)
            logger.debug(f"Added {len(shared_chapters_config)} profiles with shared chapters")
        except Exception as e:
            logger.warning(f"Error loading shared_chapters.json: {e}")
    
    return bio_ids


def _extract_gedcom_id(profile_path: str) -> str:
    """
    Extract GEDCOM ID from profile frontmatter.
    
    Args:
        profile_path: Path to profile markdown file
    
    Returns:
        GEDCOM ID (without @ symbols) or None if not found
    """
    try:
        with open(profile_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract cleaned GEDCOM ID from frontmatter property `ID`
        parts = content.split('---', 2)
        if len(parts) > 2:
            fm = parts[1]
            for ln in fm.splitlines():
                if ln.strip().startswith('ID:'):
                    gedcom_id = ln.split(':', 1)[1].strip().strip("'\"")
                    return gedcom_id
    except Exception as e:
        logger.warning(f"Error reading {profile_path}: {e}")
    
    return None


def _create_empty_gallery_index(pages_dir: str):
    """Create empty gallery index when media-index.json doesn't exist."""
    lines = [
        "## Profiles with Gallery\n",
        "This page lists family members who have images in their gallery.\n",
        "*No gallery images available yet.*"
    ]
    
    os.makedirs(pages_dir, exist_ok=True)
    output_path = os.path.join(pages_dir, "profiles-with-gallery.md")
    
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
    except Exception as e:
        logger.error(f"Failed to write empty gallery index: {e}")

