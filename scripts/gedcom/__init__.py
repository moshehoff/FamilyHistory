"""
GEDCOM parsing and normalization module.

This module provides tools for parsing GEDCOM files and normalizing
the data into a simpler, more consistent format.
"""

from .parser import parse_gedcom_file
from .normalizer import norm_individual, norm_family, collect_unique_places

__all__ = [
    'parse_gedcom_file',
    'norm_individual',
    'norm_family',
    'collect_unique_places'
]

