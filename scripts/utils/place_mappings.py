"""
Place to Wikipedia mapping utilities.

This module provides functions for mapping place names to Wikipedia article names.
"""

from typing import Optional
from config import PLACE_TO_WIKI


def get_wiki_name(place: str) -> str:
    """
    Get Wikipedia article name for a place.
    
    Args:
        place: Full place name (e.g., "Perth, Western Australia, Australia")
    
    Returns:
        Wikipedia article name with underscores (e.g., "Perth,_Western_Australia")
    
    Examples:
        >>> get_wiki_name("Perth, Western Australia, Australia")
        'Perth,_Western_Australia'
        >>> get_wiki_name("Unknown Place")
        'Unknown_Place'
    """
    if not place:
        return ""
    
    # Try to find in mapping
    if place in PLACE_TO_WIKI:
        return PLACE_TO_WIKI[place]
    
    # Fallback: replace spaces with underscores
    return place.replace(" ", "_")


def create_wiki_link(place: str, format: str = "markdown") -> str:
    """
    Create a Wikipedia link for a place.
    
    Args:
        place: Place name
        format: Output format - "markdown" or "html"
    
    Returns:
        Formatted link string
    
    Examples:
        >>> create_wiki_link("Perth, Australia")
        '[Perth, Australia](https://en.wikipedia.org/wiki/Perth,_Western_Australia)'
        
        >>> create_wiki_link("Perth, Australia", format="html")
        '<a href="https://en.wikipedia.org/wiki/Perth,_Western_Australia">Perth, Australia</a>'
    """
    if not place:
        return ""
    
    wiki_name = get_wiki_name(place)
    wiki_url = f"https://en.wikipedia.org/wiki/{wiki_name}"
    
    if format == "html":
        return f'<a href="{wiki_url}">{place}</a>'
    else:  # markdown
        return f"[{place}]({wiki_url})"


def add_place_mapping(place: str, wiki_article: str):
    """
    Add a new place mapping (runtime only, not persisted).
    
    Args:
        place: Full place name
        wiki_article: Wikipedia article name (without https://...)
    
    Example:
        >>> add_place_mapping("New Place, Country", "New_Place")
    """
    PLACE_TO_WIKI[place] = wiki_article


def get_all_mapped_places() -> list:
    """
    Get list of all places with explicit mappings.
    
    Returns:
        List of place names
    
    Example:
        >>> places = get_all_mapped_places()
        >>> len(places)
        20
    """
    return sorted(PLACE_TO_WIKI.keys())

