"""
GEDCOM data normalization.

This module provides functions for converting raw GEDCOM data into
a simpler, more consistent format.
"""

from typing import Dict, Set
from utils.logger import get_logger

logger = get_logger(__name__)


def norm_individual(iid: str, data: Dict) -> Dict:
    """
    Normalize an individual record from GEDCOM format.
    
    Args:
        iid: Individual ID (e.g., "@I123@")
        data: Raw GEDCOM data dictionary
    
    Returns:
        Normalized dictionary with consistent fields:
        {
            "id": "@I123@",
            "name": "John Doe",  # Without slashes
            "birth_date": "1900",
            "birth_place": "New York",
            "death_date": "1980",
            "death_place": "California",
            "occupation": "Carpenter",
            "notes": "",
            "famc": "@F10@",  # Family as child
            "fams": ["@F20@"]  # Families as spouse (always list)
        }
    
    Example:
        >>> raw = {"NAME": "John /Doe/", "BIRT": {"DATE": "1900"}}
        >>> person = norm_individual("@I123@", raw)
        >>> person["name"]
        'John Doe'
    """
    birt = data.get("BIRT", {})
    deat = data.get("DEAT", {})
    fams = data.get("FAMS", [])
    
    # Ensure fams is always a list
    if isinstance(fams, str):
        fams = [fams]
    
    # Remove slashes from name (GEDCOM surname markers)
    name = data.get("NAME", "").replace("/", "").strip()
    
    # Check for _PRIVATE tag (case-insensitive)
    is_private = False
    for key in data.keys():
        if key.upper() == "_PRIVATE":
            # Check if value is "Y" or "yes" (case-insensitive)
            value = str(data[key]).upper().strip()
            if value in ("Y", "YES", "1", "TRUE"):
                is_private = True
                break
    
    return {
        "id": iid,
        "name": name,
        "birth_date": birt.get("DATE", ""),
        "birth_place": birt.get("PLAC", ""),
        "death_date": deat.get("DATE", ""),
        "death_place": deat.get("PLAC", ""),
        "occupation": data.get("OCCU", ""),
        "notes": data.get("NOTE", ""),
        "famc": data.get("FAMC", ""),
        "fams": fams,
        "is_private": is_private,
    }


def norm_family(fid: str, data: Dict) -> Dict:
    """
    Normalize a family record from GEDCOM format.
    
    Args:
        fid: Family ID (e.g., "@F10@")
        data: Raw GEDCOM data dictionary
    
    Returns:
        Normalized dictionary:
        {
            "id": "@F10@",
            "husband": "@I100@",
            "wife": "@I101@",
            "children": ["@I123@", "@I124@"]  # Always list
        }
    
    Example:
        >>> raw = {"HUSB": "@I100@", "WIFE": "@I101@", "CHIL": "@I123@"}
        >>> family = norm_family("@F10@", raw)
        >>> len(family["children"])
        1
    """
    kids = data.get("CHIL", [])
    
    # Ensure children is always a list
    if isinstance(kids, str):
        kids = [kids]
    
    return {
        "id": fid,
        "husband": data.get("HUSB", ""),
        "wife": data.get("WIFE", ""),
        "children": kids
    }


def collect_unique_places(individuals: Dict) -> Set[str]:
    """
    Collect all unique birth and death places from individuals.
    
    Args:
        individuals: Raw individuals dictionary from GEDCOM parser
    
    Returns:
        Set of unique place names
    
    Example:
        >>> places = collect_unique_places(individuals)
        >>> "Perth, Australia" in places
        True
    """
    logger.info("Collecting unique places...")
    places = set()
    
    for person in individuals.values():
        birth_place = person.get("BIRT", {}).get("PLAC")
        death_place = person.get("DEAT", {}).get("PLAC")
        
        if birth_place:
            places.add(birth_place)
        if death_place:
            places.add(death_place)
    
    logger.info(f"Found {len(places)} unique places")
    return places


def analyze_places(individuals: Dict) -> Dict[str, int]:
    """
    Analyze and count all places in the GEDCOM file.
    
    This helps maintain the place_to_wiki mapping dictionary by showing:
    1. All unique places that need mapping
    2. Which places are variants of the same location
    3. Places that might be missing from the mapping
    
    Args:
        individuals: Raw individuals dictionary from GEDCOM parser
    
    Returns:
        Dictionary mapping place -> count
    
    Example:
        >>> places = analyze_places(individuals)
        >>> places["Perth, Australia"]
        25
    """
    logger.info("Analyzing places...")
    places = {}  # place -> count
    
    for person in individuals.values():
        birth = person.get("BIRT", {})
        death = person.get("DEAT", {})
        residence = person.get("RESI", {})
        
        for event in [birth, death, residence]:
            if "PLAC" in event:
                place = event["PLAC"]
                places[place] = places.get(place, 0) + 1
    
    logger.info(f"Found {len(places)} unique places with {sum(places.values())} total occurrences")
    return places


def print_place_analysis(places: Dict[str, int]):
    """
    Print place analysis in a readable format.
    
    Args:
        places: Dictionary from analyze_places()
    
    Example:
        >>> places = analyze_places(individuals)
        >>> print_place_analysis(places)
        Place Analysis:
        ===============
         25x Perth, Western Australia, Australia
         15x Rehovot, Israel
         ...
    """
    # Sort by count descending, then by name
    sorted_places = sorted(places.items(), key=lambda x: (-x[1], x[0]))
    
    print("\nPlace Analysis:")
    print("=" * 80)
    for place, count in sorted_places:
        print(f"{count:3d}x {place}")
    print(f"\nTotal unique places: {len(places)}")

