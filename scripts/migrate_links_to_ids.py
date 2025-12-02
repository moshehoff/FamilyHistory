"""
Migration script to convert existing profile links from [Name](/profiles/Slug) 
to [Name|ID] format.

This script:
1. Scans bios/ directory for chapter files
2. Scans content/pages/ for static pages
3. Converts [Name](/profiles/Slug) to [Name|ID] format
4. Preserves original files as backup
"""

import os
import re
import sys
import urllib.parse
import argparse
from typing import Dict

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from config import DEFAULT_BIOS_DIR, DEFAULT_CONTENT_DIR
from utils.logger import setup_logger
from gedcom.parser import parse_gedcom_file
from generators.profile_generator import ProfileGenerator

logger = setup_logger("migrate_links", level="INFO", console=True)


def create_slug_to_id_mapping(id_to_slug: Dict) -> Dict[str, str]:
    """
    Create reverse mapping from slug to ID.
    
    Args:
        id_to_slug: Mapping from person ID to slug
    
    Returns:
        Dictionary mapping slug -> person ID
    """
    slug_to_id = {}
    for person_id, slug in id_to_slug.items():
        # Store both encoded and unencoded versions
        encoded_slug = urllib.parse.quote(slug)
        slug_to_id[slug] = person_id
        slug_to_id[encoded_slug] = person_id
        # Also store with different encodings
        slug_to_id[urllib.parse.quote(slug, safe='')] = person_id
    
    return slug_to_id


def migrate_file(filepath: str, slug_to_id: Dict, dry_run: bool = False) -> bool:
    """
    Migrate links in a single file.
    
    Args:
        filepath: Path to file to migrate
        slug_to_id: Mapping from slug to person ID
        dry_run: If True, don't write changes
    
    Returns:
        True if changes were made, False otherwise
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern: [Name](/profiles/Slug) or [Name](/profiles/Slug#anchor)
        # Need to handle parentheses in URLs correctly
        # Strategy: find [text]( and then find matching closing parenthesis
        new_content = ""
        i = 0
        while i < len(content):
            # Find start of markdown link: [text](
            bracket_start = content.find('[', i)
            if bracket_start == -1:
                new_content += content[i:]
                break
            
            bracket_end = content.find(']', bracket_start + 1)
            if bracket_end == -1:
                new_content += content[i:bracket_start + 1]
                i = bracket_start + 1
                continue
            
            # Check if next char is (
            if bracket_end + 1 >= len(content) or content[bracket_end + 1] != '(':
                new_content += content[i:bracket_end + 1]
                i = bracket_end + 1
                continue
            
            # Check if it's a profile link
            url_start = bracket_end + 2  # after ](
            if not content[url_start:url_start + 10] == '/profiles/':
                new_content += content[i:bracket_end + 1]
                i = bracket_end + 1
                continue
            
            # Found [text](/profiles/ - now find matching closing parenthesis
            name = content[bracket_start + 1:bracket_end]
            url_content_start = url_start + 10  # after /profiles/
            
            # Count parentheses to find matching closing one
            paren_count = 1
            url_end = url_content_start
            for j in range(url_content_start, len(content)):
                char = content[j]
                if char == '(':
                    paren_count += 1
                elif char == ')':
                    paren_count -= 1
                    if paren_count == 0:
                        url_end = j
                        break
                # Stop at newline if we haven't closed yet (malformed link)
                if char == '\n' and paren_count > 1:
                    new_content += content[i:bracket_end + 1]
                    i = bracket_end + 1
                    break
            else:
                # Didn't find closing paren, skip this
                new_content += content[i:bracket_end + 1]
                i = bracket_end + 1
                continue
            
            if paren_count == 0:
                # Found complete link
                # Add content before the link
                new_content += content[i:bracket_start]
                
                slug_raw = content[url_content_start:url_end]
                # Remove anchor if present
                if '#' in slug_raw:
                    slug_raw = slug_raw.split('#')[0]
                
                # Decode URL-encoded slug
                slug = urllib.parse.unquote(slug_raw)
                
                # Try to find ID by slug
                person_id = slug_to_id.get(slug) or slug_to_id.get(slug_raw)
                
                if person_id:
                    clean_id = person_id.strip('@')
                    replacement = f'[{name}|{clean_id}]'
                    logger.debug(f"  {filepath}: [{name}](/profiles/{slug_raw}) -> [{name}|{clean_id}]")
                    new_content += replacement
                    i = url_end + 1
                else:
                    logger.warning(f"  {filepath}: Could not find ID for slug: {slug} (keeping original)")
                    # Keep original link
                    new_content += content[bracket_start:url_end + 1]
                    i = url_end + 1
            else:
                new_content += content[i:bracket_end + 1]
                i = bracket_end + 1
        
        if new_content != original_content:
            if not dry_run:
                # Create backup
                backup_path = filepath + '.backup'
                with open(backup_path, 'w', encoding='utf-8') as f:
                    f.write(original_content)
                
                # Write new content
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                logger.info(f"✓ Migrated {filepath} (backup: {backup_path})")
            else:
                logger.info(f"✓ Would migrate {filepath} (dry run)")
            return True
        else:
            logger.debug(f"  No changes needed in {filepath}")
            return False
    
    except Exception as e:
        logger.error(f"Error processing {filepath}: {e}")
        return False


def migrate_directory(directory: str, slug_to_id: Dict, dry_run: bool = False) -> int:
    """
    Migrate all .md files in a directory recursively.
    
    Args:
        directory: Directory to scan
        slug_to_id: Mapping from slug to person ID
        dry_run: If True, don't write changes
    
    Returns:
        Number of files migrated
    """
    if not os.path.exists(directory):
        logger.warning(f"Directory not found: {directory}")
        return 0
    
    migrated_count = 0
    
    for root, dirs, files in os.walk(directory):
        # Skip hidden directories
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        
        for file in files:
            if not file.endswith('.md'):
                continue
            
            # Skip backup files
            if file.endswith('.backup'):
                continue
            
            filepath = os.path.join(root, file)
            if migrate_file(filepath, slug_to_id, dry_run):
                migrated_count += 1
    
    return migrated_count


def main():
    """Main entry point for migration script."""
    parser = argparse.ArgumentParser(
        description="Migrate profile links from [Name](/profiles/Slug) to [Name|ID] format",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s data/tree.ged                    # Migrate all files
  %(prog)s data/tree.ged --dry-run          # Preview changes without writing
  %(prog)s data/tree.ged --bios-dir bios/  # Custom bios directory
        """
    )
    
    parser.add_argument(
        "gedcom_file",
        help="Path to .ged file (needed to build slug mapping)"
    )
    
    parser.add_argument(
        "--bios-dir",
        default=DEFAULT_BIOS_DIR,
        help=f"Directory with bio files (default: {DEFAULT_BIOS_DIR})"
    )
    
    parser.add_argument(
        "--content-dir",
        default=DEFAULT_CONTENT_DIR,
        help=f"Directory with content files (default: {DEFAULT_CONTENT_DIR})"
    )
    
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without writing files"
    )
    
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    
    args = parser.parse_args()
    
    if args.debug:
        logger.setLevel("DEBUG")
    
    logger.info("=" * 70)
    logger.info("PROFILE LINKS MIGRATION")
    logger.info("=" * 70)
    
    if args.dry_run:
        logger.info("DRY RUN MODE - No files will be modified")
    
    # Parse GEDCOM file
    logger.info(f"Parsing GEDCOM file: {args.gedcom_file}")
    individuals, families = parse_gedcom_file(args.gedcom_file)
    
    # Generate slug mapping (same as doit.py)
    logger.info("Building slug mapping...")
    generator = ProfileGenerator(individuals, families, args.bios_dir)
    # Initialize generator to build slug mapping
    generator.id_to_slug = generator._build_slug_mapping()
    id_to_slug = generator.id_to_slug
    
    # Create reverse mapping
    logger.info("Creating slug-to-ID mapping...")
    slug_to_id = create_slug_to_id_mapping(id_to_slug)
    logger.info(f"Created mapping for {len(slug_to_id)} slugs")
    
    # Migrate bios directory
    logger.info(f"\nMigrating bios directory: {args.bios_dir}")
    bios_count = migrate_directory(args.bios_dir, slug_to_id, args.dry_run)
    
    # Migrate content/pages directory
    pages_dir = os.path.join(args.content_dir, "pages")
    logger.info(f"\nMigrating pages directory: {pages_dir}")
    pages_count = migrate_directory(pages_dir, slug_to_id, args.dry_run)
    
    # Summary
    logger.info("\n" + "=" * 70)
    logger.info("MIGRATION SUMMARY")
    logger.info("=" * 70)
    logger.info(f"Bios files migrated: {bios_count}")
    logger.info(f"Pages files migrated: {pages_count}")
    logger.info(f"Total files migrated: {bios_count + pages_count}")
    
    if args.dry_run:
        logger.info("\nThis was a dry run. Run without --dry-run to apply changes.")
    else:
        logger.info("\n✓ Migration complete!")
        logger.info("Backup files created with .backup extension")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

