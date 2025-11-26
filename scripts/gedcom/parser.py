"""
GEDCOM file parser.

This module provides functions for parsing GEDCOM (.ged) files into
Python dictionaries.
"""

from typing import Dict, Tuple
from utils.logger import get_logger

logger = get_logger(__name__)


def parse_gedcom_file(path: str) -> Tuple[Dict, Dict]:
    """
    Parse a GEDCOM file into dictionaries of individuals and families.
    
    Args:
        path: Path to .ged file
    
    Returns:
        Tuple of (individuals, families) where:
        - individuals: Dict[str, Dict] mapping "@I123@" -> person data
        - families: Dict[str, Dict] mapping "@F456@" -> family data
    
    Raises:
        FileNotFoundError: If the file doesn't exist
        UnicodeDecodeError: If the file encoding is invalid
    
    Example:
        >>> individuals, families = parse_gedcom_file("data/tree.ged")
        >>> len(individuals)
        150
    """
    logger.info(f"Parsing GEDCOM file: {path}")
    
    try:
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except FileNotFoundError:
        logger.error(f"GEDCOM file not found: {path}")
        raise
    except UnicodeDecodeError as e:
        logger.error(f"Encoding error in GEDCOM file: {e}")
        raise

    individuals, families = {}, {}
    current_id = current_type = None
    in_birt = in_deat = False
    
    line_count = 0
    for raw in lines:
        line_count += 1
        raw = raw.rstrip("\r\n")
        if not raw.strip():
            continue
        
        parts = raw.split(" ", 2)
        if len(parts) < 2:
            continue
        
        level, tag = parts[0], parts[1]
        try:
            level = int(level)
        except ValueError:
            logger.debug(f"Invalid level at line {line_count}: {raw}")
            continue
        
        data = parts[2].strip() if len(parts) > 2 else ""

        # New record pointer (level 0 with @ID@)
        if level == 0 and tag.startswith("@"):
            current_id = tag
            current_type = data.split(" ", 1)[0] if data else "UNKNOWN"
            
            if current_type == "INDI":
                individuals.setdefault(current_id, {})
                logger.debug(f"Found individual: {current_id}")
            elif current_type == "FAM":
                families.setdefault(current_id, {})
                logger.debug(f"Found family: {current_id}")
            
            in_birt = in_deat = False
            continue

        # Parse individual records
        if current_type == "INDI":
            indi = individuals[current_id]
            
            if level == 1:
                in_birt = in_deat = False
                
                if tag == "NAME":
                    indi["NAME"] = data
                elif tag == "FAMC":
                    indi["FAMC"] = data
                elif tag == "FAMS":
                    indi.setdefault("FAMS", []).append(data)
                elif tag == "BIRT":
                    indi["BIRT"] = {}
                    in_birt = True
                elif tag == "DEAT":
                    indi["DEAT"] = {}
                    in_deat = True
                elif tag in ("OCCU", "NOTE", "RESI"):
                    indi[tag] = data
                else:
                    indi[tag] = data
                    
            elif level == 2:
                if in_birt:
                    indi.setdefault("BIRT", {})[tag] = data
                elif in_deat:
                    indi.setdefault("DEAT", {})[tag] = data

        # Parse family records
        elif current_type == "FAM":
            fam = families[current_id]
            
            if level == 1:
                if tag in ("HUSB", "WIFE"):
                    fam[tag] = data
                elif tag == "CHIL":
                    fam.setdefault("CHIL", []).append(data)
                else:
                    fam[tag] = data

    logger.info(f"Parsed {len(individuals)} individuals and {len(families)} families")
    logger.debug(f"Processed {line_count} lines")
    
    return individuals, families

