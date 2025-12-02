"""
GEDCOM to Quartz Family History Generator

This script converts GEDCOM files into a Quartz-compatible family history website.
"""

import os
import sys
import argparse
import logging

# Add current directory to path to import our modules
sys.path.insert(0, os.path.dirname(__file__))

# Import our modules
from config import DEFAULT_OUTPUT_DIR, DEFAULT_BIOS_DIR, DEFAULT_CONTENT_DIR, DEFAULT_DOCUMENTS_DIR, DEFAULT_STATIC_DIR
from utils.logger import setup_logger
from gedcom.parser import parse_gedcom_file
from gedcom.normalizer import analyze_places, print_place_analysis
from generators.profile_generator import ProfileGenerator
from generators.mermaid_builder import MermaidDiagramBuilder
from generators.media_handler import MediaIndexHandler
from generators.chapters_handler import ChaptersIndexHandler
from generators.index_generators import (
    write_people_index,
    write_bios_index,
    write_gallery_index,
    write_family_data_json,
    copy_source_content,
    clean_project
)


def main():
    """Main entry point for the GEDCOM to Quartz converter."""
    argp = argparse.ArgumentParser(
        description="GEDCOM to Quartz profiles + bios merge",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s data/tree.ged                    # Generate with defaults
  %(prog)s data/tree.ged --debug            # Generate with debug output
  %(prog)s data/tree.ged --analyze-places   # Analyze places in GEDCOM
  %(prog)s --clean                          # Clean generated files
        """
    )
    
    argp.add_argument(
        "gedcom_file",
        nargs="?",
        help="Path to .ged file"
    )
    
    argp.add_argument(
        "--clean",
        action="store_true",
        help="Clean all generated files and build outputs"
    )
    
    argp.add_argument(
        "-o", "--output",
        default=DEFAULT_OUTPUT_DIR,
        help=f"Output directory for profiles (default: {DEFAULT_OUTPUT_DIR})"
    )
    
    argp.add_argument(
        "--bios-dir",
        default=DEFAULT_BIOS_DIR,
        help=f"Directory with bio *.md files (default: {DEFAULT_BIOS_DIR})"
    )
    
    argp.add_argument(
        "--src-content-dir",
        default=DEFAULT_CONTENT_DIR,
        help=f"Directory with source content files (default: {DEFAULT_CONTENT_DIR})"
    )
    
    argp.add_argument(
        "--analyze-places",
        action="store_true",
        help="Analyze unique places in the GEDCOM file"
    )
    
    argp.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    
    argp.add_argument(
        "--quiet",
        action="store_true",
        help="Minimal output (warnings and errors only)"
    )
    
    argp.add_argument(
        "--log-file",
        help="Write log to file"
    )
    
    args = argp.parse_args()
    
    # Setup logging
    if args.quiet:
        log_level = logging.WARNING
    elif args.debug:
        log_level = logging.DEBUG
    else:
        log_level = logging.INFO
    
    logger = setup_logger(
        "doit",
        level=log_level,
        log_file=args.log_file,
        console=True
    )
    
    # Handle clean command
    if args.clean:
        clean_project()
        return
    
    # Require GEDCOM file for other operations
    if not args.gedcom_file:
        argp.error("gedcom_file is required (unless using --clean)")

    # Always clean before building
    logger.info("Cleaning previous build...")
    clean_project()
    
    # Ensure output directory exists
    os.makedirs(args.output, exist_ok=True)
    if not os.path.exists(args.bios_dir):
        os.makedirs(args.bios_dir, exist_ok=True)

    # Parse GEDCOM file
    logger.info(f"Processing GEDCOM file: {args.gedcom_file}")
    individuals, families = parse_gedcom_file(args.gedcom_file)
    
    # Handle analyze-places command
    if args.analyze_places:
        places = analyze_places(individuals)
        print_place_analysis(places)
        return

    # Generate profiles first (needed for link_converter)
    logger.info("Generating profiles...")
    generator = ProfileGenerator(individuals, families, args.bios_dir)
    id_to_slug = generator.generate_all_profiles(args.output)
    
    # Create link converter for processing [Name|ID] links
    from utils.link_converter import LinkConverter
    link_converter = LinkConverter(individuals, id_to_slug)
    
    # Copy source content to site/content/ (with link processing)
    logger.info("Copying source content...")
    copy_source_content(args.src_content_dir, os.path.dirname(args.output), link_converter=link_converter)
    
    # Create media index
    logger.info("Creating media index...")
    media_handler = MediaIndexHandler(
        DEFAULT_DOCUMENTS_DIR,
        DEFAULT_STATIC_DIR,
        bios_dir=args.bios_dir,
        content_dir=os.path.dirname(args.output),
        individuals=individuals,
        id_to_slug=id_to_slug
    )
    media_handler.create_media_index()
    
    # Create chapters index (with link processing)
    logger.info("Creating chapters index...")
    chapters_handler = ChaptersIndexHandler(
        args.bios_dir,
        DEFAULT_STATIC_DIR,
        individuals,
        link_converter=link_converter
    )
    chapters_handler.create_chapters_index()
    
    # Write index pages
    logger.info("Creating index pages...")
    people_dir = args.output
    pages_dir = os.path.join(os.path.dirname(args.output), "pages")
    
    write_people_index(people_dir, pages_dir)
    write_bios_index(people_dir, args.bios_dir, pages_dir)
    write_gallery_index(people_dir, DEFAULT_STATIC_DIR, pages_dir)
    write_family_data_json(individuals, families, args.output)
    
    logger.info("=" * 70)
    logger.info("✓ Done!")
    logger.info(f"Generated {len(individuals)} profiles in {args.output}")
    logger.info("=" * 70)


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
