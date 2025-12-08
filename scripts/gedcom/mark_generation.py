"""
GEDCOM Generation Marking Tool

This tool marks specific generations of descendants in a GEDCOM file with custom tags.
For each person at the target generation, it also marks their spouses, all descendants,
and spouses of all descendants.

SYNOPSIS
--------
    python scripts/gedcom/mark_generation.py <gedcom_file> <person_id> <generation> <label> [--output <output_file>]

DESCRIPTION
-----------
The mark_generation tool allows you to mark individuals in a GEDCOM file with custom tags
based on their generation level relative to a starting person.

Generation Levels:
    - 1: The person themselves
    - 2: Their children
    - 3: Their grandchildren
    - 4: Their great-grandchildren
    - etc.

For each person at the target generation, the tool automatically also marks:
    - Their spouses (all marriages)
    - All their descendants (children, grandchildren, great-grandchildren, etc.)
    - Spouses of all descendants

This ensures that entire family branches are marked together, maintaining privacy
for extended family networks.

Custom Tags:
    The tool supports any custom tag that starts with an underscore (_), following
    GEDCOM 5.5.1 specification for user-defined tags. Examples:
    - private, _PRIVATE, _private (all become _PRIVATE)
    - hidden, _HIDDEN
    - restricted, _RESTRICTED
    - custom_tag, _CUSTOM_TAG

    Tags are automatically normalized to uppercase and prefixed with underscore
    if not already present.

Duplicate Prevention:
    The tool checks if a person already has the tag before adding it. If the tag
    exists (even with different case), it will be preserved but not duplicated.

Output:
    By default, the tool creates a new file with "_marked" suffix (e.g., 
    tree.ged -> tree_marked.ged). The original file is never modified.

ARGUMENTS
---------
    gedcom_file
        Path to the input GEDCOM file (required)
    
    person_id
        Person ID in GEDCOM format (e.g., @I1234@) (required)
    
    generation
        Generation level (1=person, 2=children, 3=grandchildren, etc.) (required)
        Must be >= 1
    
    label
        Custom tag name (e.g., 'private', 'hidden', 'restricted') (required)
        Will be normalized to _LABEL format
    
    --output, -o
        Output GEDCOM file path (optional)
        Default: <input_file>_marked.ged

EXAMPLES
--------
    # Mark person @I1234@ themselves (and spouse and all descendants) as private
    python scripts/gedcom/mark_generation.py data/tree.ged @I1234@ 1 private
    
    # Mark all children (and their spouses and all descendants) as hidden
    python scripts/gedcom/mark_generation.py data/tree.ged @I1234@ 2 hidden --output data/tree_hidden.ged
    
    # Mark all grandchildren (and their spouses and all descendants) with custom tag
    python scripts/gedcom/mark_generation.py data/tree.ged @I11032861@ 3 restricted
    
    # Mark with tag that already has underscore
    python scripts/gedcom/mark_generation.py data/tree.ged @I1234@ 1 _MY_CUSTOM_TAG

FUNCTIONS
---------
    find_spouses(person_id, individuals, families)
        Finds all spouses of a person across all their marriages.
    
    find_all_descendants(person_id, individuals, families)
        Finds all descendants of a person using BFS traversal.
    
    find_people_at_generation(person_id, generation, individuals, families)
        Finds all people at a specific generation level, including their spouses,
        all descendants, and spouses of descendants.
    
    add_custom_tag_to_gedcom(input_path, output_path, person_ids, tag_name)
        Adds custom tag to specified individuals in GEDCOM file, avoiding duplicates.

RETURN VALUES
------------
    Exit code 0: Success
    Exit code 1: Error (file not found, invalid person, etc.)

SEE ALSO
--------
    GEDCOM 5.5.1 Specification - User-defined tags
    scripts/gedcom/TEST_PLAN.md - Test plan and verification procedures

AUTHOR
------
    Family History Project

VERSION
-------
    2.0 - Added spouse and descendant marking, duplicate prevention
"""

import sys
import os
import argparse
from typing import Dict, List, Set
from pathlib import Path

# Add parent directory to path to import parser
sys.path.insert(0, str(Path(__file__).parent.parent))

from gedcom.parser import parse_gedcom_file
from utils.logger import get_logger

logger = get_logger(__name__)


def find_spouses(person_id: str, individuals: Dict, families: Dict) -> Set[str]:
    """
    Find all spouses of a person across all their marriages.
    
    This function searches through all families where the person is listed as
    either husband or wife, and returns the IDs of all their spouses.
    
    Args:
        person_id: Person ID in GEDCOM format (e.g., "@I1234@")
        individuals: Dictionary of all individuals from GEDCOM
        families: Dictionary of all families from GEDCOM
    
    Returns:
        Set of spouse IDs (empty set if person not found or has no spouses)
    
    Example:
        >>> individuals, families = parse_gedcom_file("data/tree.ged")
        >>> spouses = find_spouses("@I11032861@", individuals, families)
        >>> len(spouses)
        1
    """
    spouses = set()
    if person_id not in individuals:
        return spouses
    
    person = individuals[person_id]
    families_as_spouse = person.get("FAMS", [])
    if isinstance(families_as_spouse, str):
        families_as_spouse = [families_as_spouse]
    
    for fam_id in families_as_spouse:
        if fam_id in families:
            fam = families[fam_id]
            # Find the spouse (opposite of this person)
            if fam.get("HUSB") == person_id and fam.get("WIFE"):
                spouses.add(fam["WIFE"])
            elif fam.get("WIFE") == person_id and fam.get("HUSB"):
                spouses.add(fam["HUSB"])
    
    return spouses


def find_all_descendants(person_id: str, individuals: Dict, families: Dict) -> Set[str]:
    """
    Find all descendants of a person using breadth-first search (BFS).
    
    This function traverses the family tree downward from the given person,
    collecting all children, grandchildren, great-grandchildren, etc.
    
    Args:
        person_id: Person ID in GEDCOM format (e.g., "@I1234@")
        individuals: Dictionary of all individuals from GEDCOM
        families: Dictionary of all families from GEDCOM
    
    Returns:
        Set of all descendant IDs (empty set if person not found or has no descendants)
    
    Algorithm:
        Uses BFS to traverse the tree:
        1. Start with the person in the queue
        2. For each person, find all families where they are a parent
        3. Add all children to the descendants set and queue
        4. Continue until queue is empty
    
    Example:
        >>> individuals, families = parse_gedcom_file("data/tree.ged")
        >>> descendants = find_all_descendants("@I11032861@", individuals, families)
        >>> len(descendants) > 0
        True
    """
    descendants = set()
    if person_id not in individuals:
        return descendants
    
    # Use BFS to find all descendants
    queue = [person_id]
    visited = {person_id}
    
    while queue:
        current_id = queue.pop(0)
        if current_id not in individuals:
            continue
        
        person = individuals[current_id]
        families_as_parent = person.get("FAMS", [])
        if isinstance(families_as_parent, str):
            families_as_parent = [families_as_parent]
        
        # Get all children from all families
        for fam_id in families_as_parent:
            if fam_id in families:
                children = families[fam_id].get("CHIL", [])
                if isinstance(children, str):
                    children = [children]
                
                for child_id in children:
                    if child_id not in visited:
                        descendants.add(child_id)
                        visited.add(child_id)
                        queue.append(child_id)
    
    return descendants


def find_people_at_generation(
    person_id: str,
    generation: int,
    individuals: Dict,
    families: Dict
) -> Set[str]:
    """
    Find all people at a specific generation level, including their spouses,
    all descendants, and spouses of descendants.
    
    This is the main function that determines who should be marked. For each
    person at the target generation, it expands the set to include:
    1. The person themselves
    2. All their spouses
    3. All their descendants (recursively)
    4. Spouses of all descendants
    
    Generation levels:
        - 1: The person themselves
        - 2: Their children
        - 3: Their grandchildren
        - etc.
    
    Args:
        person_id: The ID of the starting person (e.g., "@I1234@")
        generation: The generation level (1 = person, 2 = children, 3 = grandchildren, etc.)
        individuals: Dictionary of all individuals from GEDCOM
        families: Dictionary of all families from GEDCOM
    
    Returns:
        Set of person IDs to mark (includes target generation + spouses + all descendants + their spouses)
        Empty set if person not found or generation < 1
    
    Example:
        >>> individuals, families = parse_gedcom_file("data/tree.ged")
        >>> people = find_people_at_generation("@I11032861@", 2, individuals, families)
        >>> len(people) > 0
        True
    """
    if person_id not in individuals:
        logger.error(f"Person {person_id} not found in GEDCOM file")
        return set()
    
    if generation < 1:
        logger.error("Generation must be >= 1")
        return set()
    
    # Generation 1 = the person themselves
    if generation == 1:
        target_people = {person_id}
    else:
        # For generation >= 2, we need to traverse down the tree
        # Start with the person's children (generation 2)
        current_generation = {person_id}
        
        for gen_level in range(2, generation + 1):
            next_generation = set()
            
            for pid in current_generation:
                if pid not in individuals:
                    continue
                
                person = individuals[pid]
                
                # Find all families where this person is a parent
                families_as_parent = person.get("FAMS", [])
                if isinstance(families_as_parent, str):
                    families_as_parent = [families_as_parent]
                
                # Get all children from these families
                for fam_id in families_as_parent:
                    if fam_id in families:
                        children = families[fam_id].get("CHIL", [])
                        if isinstance(children, str):
                            children = [children]
                        next_generation.update(children)
            
            if gen_level == generation:
                # This is the target generation
                target_people = next_generation
                break
            
            current_generation = next_generation
        else:
            # If we didn't break, no one found at this generation
            return set()
    
    # Now expand: for each person in target generation, add:
    # 1. Their spouses
    # 2. All their descendants
    # 3. Spouses of all descendants
    people_to_mark = set(target_people)
    
    for pid in target_people:
        # Add spouses
        spouses = find_spouses(pid, individuals, families)
        people_to_mark.update(spouses)
        
        # Add all descendants
        descendants = find_all_descendants(pid, individuals, families)
        people_to_mark.update(descendants)
        
        # Add spouses of all descendants
        for desc_id in descendants:
            desc_spouses = find_spouses(desc_id, individuals, families)
            people_to_mark.update(desc_spouses)
    
    return people_to_mark


def add_custom_tag_to_gedcom(
    input_gedcom_path: str,
    output_gedcom_path: str,
    person_ids: Set[str],
    tag_name: str
) -> None:
    """
    Add a custom tag to specified individuals in a GEDCOM file and write to output file.
    
    This function processes the GEDCOM file line by line, adding the custom tag
    to each specified person. It ensures:
    - Tags are not duplicated (checks for existing tags)
    - Tags are inserted in the correct location (after NAME or SEX)
    - The original file structure is preserved
    
    Args:
        input_gedcom_path: Path to the input GEDCOM file
        output_gedcom_path: Path to the output GEDCOM file
        person_ids: Set of person IDs to mark
        tag_name: Custom tag name (will be prefixed with _ if not already)
    
    Tag Format:
        The tag is added as: "1 _TAGNAME Y"
        Following GEDCOM 5.5.1 specification for custom tags.
    
    Duplicate Prevention:
        Before adding a tag, the function checks:
        1. If the exact tag already exists
        2. If a case-insensitive variant exists (e.g., _PRIVATE vs _private)
        If found, the existing tag is preserved and no duplicate is added.
    
    Example:
        >>> people_to_mark = {"@I1234@", "@I5678@"}
        >>> add_custom_tag_to_gedcom("input.ged", "output.ged", people_to_mark, "private")
        # Adds "1 _PRIVATE Y" to both people in output.ged
    """
    # Ensure tag starts with underscore and is uppercase
    if not tag_name.startswith("_"):
        tag_name = "_" + tag_name.upper()
    else:
        tag_name = tag_name.upper()
    
    logger.info(f"Reading GEDCOM file: {input_gedcom_path}")
    with open(input_gedcom_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    # Process the file
    output_lines = []
    current_person_id = None
    in_person_record = False
    tag_added = False
    marked_count = 0
    
    i = 0
    while i < len(lines):
        line = lines[i]
        raw_line = line.rstrip("\r\n")
        
        if not raw_line.strip():
            output_lines.append(line)
            i += 1
            continue
        
        parts = raw_line.split(" ", 2)
        if len(parts) < 2:
            output_lines.append(line)
            i += 1
            continue
        
        level = parts[0]
        tag = parts[1]
        
        # Check if this is a person record
        if level == "0" and tag.startswith("@"):
            # End of previous person record - add tag if needed
            if in_person_record and current_person_id in person_ids and not tag_added:
                # Add the custom tag before the next record
                output_lines.append(f"1 {tag_name} Y\n")
                marked_count += 1
                tag_added = False
            
            # Start of new record
            current_person_id = tag
            in_person_record = (len(parts) > 2 and parts[2].strip() == "INDI")
            tag_added = False
            
            # Check if this person already has the tag (look ahead)
            if current_person_id in person_ids:
                # Look ahead in the file to see if tag already exists
                for j in range(i + 1, min(i + 50, len(lines))):  # Check next 50 lines max
                    future_line = lines[j]
                    if future_line.startswith("0 "):
                        break
                    # Check for exact tag match
                    if f"1 {tag_name}" in future_line:
                        tag_added = True
                        break
                    # Also check for case-insensitive match (e.g., _PRIVATE vs _private)
                    if tag_name.startswith("_"):
                        future_parts = future_line.split(" ", 2)
                        if len(future_parts) >= 2:
                            future_tag = future_parts[1]
                            if future_tag.startswith("_") and future_tag.upper() == tag_name.upper():
                                tag_added = True
                                break
            
            output_lines.append(line)
            i += 1
            continue
        
        # Process lines within a person record
        if in_person_record and current_person_id in person_ids:
            # Check if this line is the tag we're adding
            if level == "1" and tag == tag_name:
                # Tag already exists, keep it (don't add again)
                tag_added = True
                output_lines.append(line)
                i += 1
                continue
            
            # If we haven't added the tag yet, look for a good place to insert it
            if level == "1" and not tag_added:
                # Check if this is a custom tag that might be a duplicate
                # (e.g., if tag_name is _PRIVATE, check for any _PRIVATE variant)
                if tag.startswith("_") and tag_name.startswith("_"):
                    # Normalize both tags for comparison (uppercase, remove variations)
                    tag_normalized = tag.upper()
                    tag_name_normalized = tag_name.upper()
                    # Check if they're the same tag (e.g., _PRIVATE vs _PRIVATE)
                    if tag_normalized == tag_name_normalized:
                        # Tag already exists (maybe with different case), keep it
                        tag_added = True
                        output_lines.append(line)
                        i += 1
                        continue
                
                # Insert after NAME or SEX (standard GEDCOM practice)
                if tag in ("NAME", "SEX"):
                    output_lines.append(line)
                    # Add tag after this line
                    output_lines.append(f"1 {tag_name} Y\n")
                    marked_count += 1
                    tag_added = True
                    i += 1
                    continue
        
        output_lines.append(line)
        i += 1
    
    # Handle last person if needed
    if in_person_record and current_person_id in person_ids and not tag_added:
        output_lines.append(f"1 {tag_name} Y\n")
        marked_count += 1
    
    # Write the output file
    logger.info(f"Writing output GEDCOM file: {output_gedcom_path}")
    with open(output_gedcom_path, "w", encoding="utf-8") as f:
        f.writelines(output_lines)
    
    logger.info(f"✓ Marked {marked_count} individuals with tag {tag_name}")


def main():
    """
    Main entry point for the GEDCOM generation marking tool.
    
    Parses command-line arguments, validates inputs, finds people to mark,
    and adds custom tags to the GEDCOM file.
    """
    parser = argparse.ArgumentParser(
        description="Mark specific generation of descendants in a GEDCOM file",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Generation levels:
  - 1: The person themselves
  - 2: Their children
  - 3: Their grandchildren
  - etc.

For each person at the target generation, the tool also marks:
  - Their spouses
  - All their descendants (children, grandchildren, etc.)
  - Spouses of all descendants

The tool will NOT add duplicate tags - if a person already has the tag,
it will be preserved but not duplicated.

Custom tags:
  Any tag starting with underscore (_) is valid. Examples:
  - private, _PRIVATE, _private (all become _PRIVATE)
  - hidden, _HIDDEN
  - restricted, _RESTRICTED
  - custom_tag, _CUSTOM_TAG

Examples:
  # Mark person @I1234@ themselves (and their spouse and all descendants) as private
  python scripts/gedcom/mark_generation.py data/tree.ged @I1234@ 1 private
  
  # Mark all children (and their spouses and all descendants) as hidden
  python scripts/gedcom/mark_generation.py data/tree.ged @I1234@ 2 hidden --output data/tree_marked.ged
  
  # Mark all grandchildren (and their spouses and all descendants) with custom tag
  python scripts/gedcom/mark_generation.py data/tree.ged @I11032861@ 3 restricted --output data/tree_restricted.ged
        """
    )
    
    parser.add_argument("gedcom_file", help="Path to input GEDCOM file")
    parser.add_argument("person_id", help="Person ID (e.g., @I1234@)")
    parser.add_argument("generation", type=int, help="Generation level (1=person, 2=children, 3=grandchildren, etc.)")
    parser.add_argument("label", help="Label/tag name (e.g., 'private', 'hidden', 'restricted' - will become '_PRIVATE', '_HIDDEN', etc.)")
    parser.add_argument("--output", "-o", help="Output GEDCOM file path (default: <input_file>_marked.ged)")
    
    args = parser.parse_args()
    
    # Validate inputs
    if not os.path.exists(args.gedcom_file):
        logger.error(f"GEDCOM file not found: {args.gedcom_file}")
        sys.exit(1)
    
    if not args.person_id.startswith("@") or not args.person_id.endswith("@"):
        logger.warning(f"Person ID should be in format @I1234@, got: {args.person_id}")
    
    if args.generation < 1:
        logger.error("Generation must be >= 1")
        sys.exit(1)
    
    # Determine output file path
    if args.output:
        output_path = args.output
    else:
        # Default: add _marked before .ged extension
        base_path = Path(args.gedcom_file)
        output_path = str(base_path.parent / f"{base_path.stem}_marked{base_path.suffix}")
    
    # Check if output file already exists
    if os.path.exists(output_path) and output_path != args.gedcom_file:
        logger.warning(f"Output file already exists: {output_path}")
        response = input("Overwrite? (y/N): ")
        if response.lower() != 'y':
            logger.info("Cancelled")
            sys.exit(0)
    
    # Parse GEDCOM
    logger.info("Parsing GEDCOM file...")
    individuals, families = parse_gedcom_file(args.gedcom_file)
    
    # Find people at specified generation
    logger.info(f"Finding generation {args.generation} for {args.person_id}...")
    people_to_mark = find_people_at_generation(
        args.person_id,
        args.generation,
        individuals,
        families
    )
    
    if not people_to_mark:
        logger.warning(f"No people found at generation {args.generation} for {args.person_id}")
        sys.exit(0)
    
    # Determine tag name
    tag_name = args.label
    if not tag_name.startswith("_"):
        tag_name = "_" + tag_name.upper()
    else:
        tag_name = tag_name.upper()
    
    # Count different categories
    target_count = len(people_to_mark)
    logger.info(f"Found {target_count} people to mark (including spouses and descendants)")
    logger.info(f"Will mark them with tag: {tag_name}")
    
    # Show summary (first 10, then count)
    logger.info("People to be marked (showing first 10):")
    sorted_people = sorted(people_to_mark)
    for person_id in sorted_people[:10]:
        person = individuals.get(person_id, {})
        name = person.get("NAME", "Unknown")
        logger.info(f"  {person_id}: {name}")
    if len(sorted_people) > 10:
        logger.info(f"  ... and {len(sorted_people) - 10} more")
    
    # Add tags to GEDCOM file
    add_custom_tag_to_gedcom(
        args.gedcom_file,
        output_path,
        people_to_mark,
        args.label
    )
    
    logger.info("=" * 70)
    logger.info("✓ Done!")
    logger.info(f"Output file: {output_path}")
    logger.info("=" * 70)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
