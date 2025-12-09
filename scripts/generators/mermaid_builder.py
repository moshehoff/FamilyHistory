"""
Mermaid diagram builder for family relationships.

This module provides a class for building Mermaid flowchart diagrams
showing family relationships (immediate family, descendants, ancestors).

This replaces the original three similar functions with a single class
that shares helper methods, eliminating code duplication.
"""

import urllib.parse
from typing import Dict, List
from utils.logger import get_logger
from utils.file_utils import safe_filename
from config import MERMAID_STYLES

logger = get_logger(__name__)


class MermaidDiagramBuilder:
    """
    Builds Mermaid flowchart diagrams for family relationships.
    
    This class eliminates code duplication by sharing helper methods
    across all diagram types (immediate family, descendants, ancestors).
    """
    
    def __init__(
        self,
        individuals: Dict,
        families: Dict,
        name_of: Dict,
        id_to_slug: Dict
    ):
        """
        Initialize the Mermaid diagram builder.
        
        Args:
            individuals: Normalized individuals dictionary
            families: Normalized families dictionary
            name_of: Mapping from person ID to name
            id_to_slug: Mapping from person ID to unique slug
        
        Example:
            >>> builder = MermaidDiagramBuilder(inds, fams, name_of, id_to_slug)
        """
        self.individuals = individuals
        self.families = families
        self.name_of = name_of
        self.id_to_slug = id_to_slug
        logger.debug(f"MermaidDiagramBuilder initialized with {len(individuals)} people")
    
    # ========================================================================
    # Helper Methods (shared across all diagram types)
    # ========================================================================
    
    def _node_id(self, iid: str) -> str:
        """
        Convert person ID to Mermaid node ID.
        
        Args:
            iid: Person ID (e.g., "@I123@")
        
        Returns:
            Node ID (e.g., "idI123")
        """
        return f'id{iid.replace("@", "")}'
    
    def _node_label(self, iid: str) -> str:
        """
        Get display label for a person.
        
        Args:
            iid: Person ID
        
        Returns:
            Clean name for display (quotes removed)
        """
        name = self.name_of.get(iid, iid)
        # Remove problematic characters from display name
        return name.replace('"', "'")
    
    def _make_node(
        self,
        lines: List[str],
        iid: str,
        is_current: bool = False
    ) -> str:
        """
        Create a Mermaid node with styling and click handler.
        
        Args:
            lines: List to append Mermaid lines to
            iid: Person ID
            is_current: Whether this is the current profile person
        
        Returns:
            Node ID (for use in connections)
        
        Side effect:
            Appends node definition, class, and click handler to lines
        """
        node = self._node_id(iid)
        
        # Check if person is private
        person = self.individuals.get(iid, {})
        if person.get("is_private", False):
            # For private individuals, create a simple "private" node without link
            lines.append(f'{node}["private"]')
            lines.append(f'class {node} person')
            # Add dummy click handler to help Mermaid calculate viewbox correctly
            lines.append(f'click {node} "javascript:void(0)" "Private profile"')
            return node
        
        name = self._node_label(iid)
        
        # Node definition
        lines.append(f'{node}["{name}"]')
        
        # CSS class
        css_class = 'current' if is_current else 'internal-link'
        lines.append(f'class {node} {css_class}')
        
        # Click handler for navigation
        slug = self.id_to_slug.get(iid)
        if not slug:
            slug = safe_filename(name).replace(" ", "-")
            logger.debug(f"No slug for {iid}, using fallback: {slug}")
        
        encoded_name = urllib.parse.quote(slug)
        lines.append(f'click {node} "../profiles/{encoded_name}" "{name}"')
        
        return node
    
    def _init_mermaid_lines(self) -> List[str]:
        """
        Initialize Mermaid diagram with standard headers and styles.
        
        Returns:
            List of initial Mermaid lines
        """
        return [
            "```mermaid",
            "flowchart TD",
            f"classDef person {MERMAID_STYLES['person']};",
            f"classDef internal-link {MERMAID_STYLES['internal_link']};",
            f"classDef current {MERMAID_STYLES['current']};"
        ]
    
    def _add_marriage_node(
        self,
        lines: List[str],
        fam_id: str,
        spouse1_node: str,
        spouse2_node: str
    ) -> str:
        """
        Add a marriage connection between two spouses.
        
        Args:
            lines: List to append to
            fam_id: Family ID
            spouse1_node: First spouse node ID
            spouse2_node: Second spouse node ID
        
        Returns:
            Marriage node ID (for connecting children)
        """
        marriage_node = f'marriage_{self._node_id(fam_id)}'
        lines.append(f'{marriage_node}((" "))')  # Empty circle for marriage
        lines.append(f'{spouse1_node} --- {marriage_node}')
        lines.append(f'{spouse2_node} --- {marriage_node}')
        return marriage_node
    
    # ========================================================================
    # Public Methods (diagram generators)
    # ========================================================================
    
    def build_immediate_family(self, person_id: str, person: Dict) -> str:
        """
        Build diagram showing immediate family (parents, siblings).
        
        Args:
            person_id: Person's GEDCOM ID
            person: Normalized person dictionary
        
        Returns:
            Complete Mermaid diagram as string, or None if only the person would be shown
        
        Example:
            >>> diagram = builder.build_immediate_family("@I123@", person)
        """
        logger.debug(f"Building immediate family diagram for {person_id}")
        
        # Check if there's anything to show besides the person themselves
        has_parents_or_siblings = False
        if person["famc"] in self.families:
            fam = self.families[person["famc"]]
            # Check if there are parents or siblings
            if fam.get("husband") or fam.get("wife"):
                has_parents_or_siblings = True
            elif any(child_id != person_id for child_id in fam.get("children", [])):
                has_parents_or_siblings = True
        
        # If only the person would be shown, return None
        if not has_parents_or_siblings:
            logger.debug(f"No immediate family to show for {person_id}, skipping diagram")
            return None
        
        lines = self._init_mermaid_lines()
        
        # Add the central person (highlighted)
        person_node = self._make_node(lines, person_id, is_current=True)
        
        # Add parents and siblings
        if person["famc"] in self.families:
            fam = self.families[person["famc"]]
            self._add_parents_and_siblings(lines, fam, person_id, person_node)
        
        lines.append("```")
        return "\n".join(lines)
    
    def build_nuclear_family(self, person_id: str, person: Dict) -> str:
        """
        Build diagram showing nuclear family (spouse and children only).
        
        Args:
            person_id: Person's GEDCOM ID
            person: Normalized person dictionary
        
        Returns:
            Complete Mermaid diagram as string, or None if no spouse or children
        
        Example:
            >>> diagram = builder.build_nuclear_family("@I123@", person)
        """
        logger.debug(f"Building nuclear family diagram for {person_id}")
        
        # Check if there are any family members to show
        has_family = False
        for fid in person["fams"]:
            if fid in self.families:
                fam = self.families[fid]
                # Check if there's a spouse or children
                spouse_id = None
                if fam.get("husband") == person_id and fam.get("wife"):
                    spouse_id = fam["wife"]
                elif fam.get("wife") == person_id and fam.get("husband"):
                    spouse_id = fam["husband"]
                
                if spouse_id or fam.get("children"):
                    has_family = True
                    break
        
        # If only the person would be shown, return None
        if not has_family:
            logger.debug(f"No nuclear family to show for {person_id}, skipping diagram")
            return None
        
        lines = self._init_mermaid_lines()
        
        # Add the central person (highlighted)
        person_node = self._make_node(lines, person_id, is_current=True)
        
        # Iterate through all families where this person is a parent
        for fid in person["fams"]:
            if fid not in self.families:
                continue
            
            fam = self.families[fid]
            
            # Add spouse if exists
            spouse_id = None
            if fam.get("husband") == person_id and fam.get("wife"):
                spouse_id = fam["wife"]
            elif fam.get("wife") == person_id and fam.get("husband"):
                spouse_id = fam["husband"]
            
            spouse_node = None
            marriage_node = None
            
            if spouse_id:
                spouse_node = self._make_node(lines, spouse_id)
                marriage_node = self._add_marriage_node(
                    lines, fam["id"], person_node, spouse_node
                )
            
            # Add children (only direct children, no grandchildren)
            for child_id in fam.get("children", []):
                child_node = self._make_node(lines, child_id)
                
                # Connect child to marriage node or parent
                if marriage_node:
                    lines.append(f'{marriage_node} --> {child_node}')
                else:
                    lines.append(f'{person_node} --> {child_node}')
        
        lines.append("```")
        return "\n".join(lines)
    
    def build_descendants(
        self,
        person_id: str,
        person: Dict,
        max_depth: int = 2
    ) -> str:
        """
        Build diagram showing descendants (children, grandchildren).
        
        Args:
            person_id: Person's GEDCOM ID
            person: Normalized person dictionary
            max_depth: Maximum number of generations to show
        
        Returns:
            Complete Mermaid diagram as string, or None if no descendants to show
        
        Example:
            >>> diagram = builder.build_descendants("@I123@", person, max_depth=3)
        """
        logger.debug(f"Building descendants diagram for {person_id} (depth={max_depth})")
        
        # Check if there are any descendants to show
        has_descendants = False
        for fid in person["fams"]:
            if fid in self.families:
                fam = self.families[fid]
                # Check if there's a spouse or children
                spouse_id = None
                if fam.get("husband") == person_id and fam.get("wife"):
                    spouse_id = fam["wife"]
                elif fam.get("wife") == person_id and fam.get("husband"):
                    spouse_id = fam["husband"]
                
                if spouse_id or fam.get("children"):
                    has_descendants = True
                    break
        
        # If only the person would be shown, return None
        if not has_descendants:
            logger.debug(f"No descendants to show for {person_id}, skipping diagram")
            return None
        
        lines = self._init_mermaid_lines()
        
        # Add the central person (highlighted)
        person_node = self._make_node(lines, person_id, is_current=True)
        
        # Iterate through all families where this person is a parent
        for fid in person["fams"]:
            if fid not in self.families:
                continue
            
            fam = self.families[fid]
            self._add_descendants_recursive(
                lines,
                person_id,
                person_node,
                fam,
                depth=1,
                max_depth=max_depth
            )
        
        lines.append("```")
        return "\n".join(lines)
    
    def build_ancestors(
        self,
        person_id: str,
        person: Dict,
        max_depth: int = 2
    ) -> str:
        """
        Build diagram showing ancestors (parents, grandparents).
        
        Args:
            person_id: Person's GEDCOM ID
            person: Normalized person dictionary
            max_depth: Maximum number of generations to show
        
        Returns:
            Complete Mermaid diagram as string, or None if no ancestors to show
        
        Example:
            >>> diagram = builder.build_ancestors("@I123@", person, max_depth=3)
        """
        logger.debug(f"Building ancestors diagram for {person_id} (depth={max_depth})")
        
        # Check if there are any ancestors to show
        if person["famc"] not in self.families:
            logger.debug(f"No ancestors to show for {person_id}, skipping diagram")
            return None
        
        fam = self.families[person["famc"]]
        if not fam.get("husband") and not fam.get("wife"):
            logger.debug(f"No parents found for {person_id}, skipping diagram")
            return None
        
        lines = self._init_mermaid_lines()
        
        # Add the central person (highlighted)
        person_node = self._make_node(lines, person_id, is_current=True)
        
        # Add parents (and recursively grandparents)
        if person["famc"] in self.families:
            fam = self.families[person["famc"]]
            self._add_ancestors_recursive(
                lines,
                fam,
                person_node,
                depth=1,
                max_depth=max_depth
            )
        
        lines.append("```")
        return "\n".join(lines)
    
    # ========================================================================
    # Private Methods (recursive diagram building)
    # ========================================================================
    
    def _add_parents_and_siblings(
        self,
        lines: List[str],
        fam: Dict,
        person_id: str,
        person_node: str
    ):
        """
        Add parents and siblings to the diagram.
        
        Args:
            lines: List to append to
            fam: Family dictionary
            person_id: Current person's ID
            person_node: Current person's node ID
        """
        father_node = None
        mother_node = None
        
        # Add father
        if fam.get("husband"):
            father_node = self._make_node(lines, fam["husband"])
        
        # Add mother
        if fam.get("wife"):
            mother_node = self._make_node(lines, fam["wife"])
        
        # Marriage connection between parents
        if father_node and mother_node:
            marriage_node = self._add_marriage_node(
                lines, fam["id"], father_node, mother_node
            )
            # Connect to person
            lines.append(f'{marriage_node} --> {person_node}')
            
            # Add siblings
            for child_id in fam.get("children", []):
                if child_id != person_id:
                    sibling_node = self._make_node(lines, child_id)
                    lines.append(f'{marriage_node} --> {sibling_node}')
        
        elif father_node or mother_node:
            # Single parent
            parent_node = father_node or mother_node
            lines.append(f'{parent_node} --> {person_node}')
            
            # Add siblings with single parent
            for child_id in fam.get("children", []):
                if child_id != person_id:
                    sibling_node = self._make_node(lines, child_id)
                    lines.append(f'{parent_node} --> {sibling_node}')
    
    def _add_descendants_recursive(
        self,
        lines: List[str],
        person_id: str,
        person_node: str,
        fam: Dict,
        depth: int,
        max_depth: int
    ):
        """
        Recursively add descendants to the diagram.
        
        Args:
            lines: List to append to
            person_id: Current person's ID
            person_node: Current person's node ID
            fam: Family dictionary
            depth: Current depth level
            max_depth: Maximum depth to recurse
        """
        # Add spouse if exists
        spouse_id = None
        if fam.get("husband") == person_id and fam.get("wife"):
            spouse_id = fam["wife"]
        elif fam.get("wife") == person_id and fam.get("husband"):
            spouse_id = fam["husband"]
        
        spouse_node = None
        marriage_node = None
        
        if spouse_id:
            spouse_node = self._make_node(lines, spouse_id)
            marriage_node = self._add_marriage_node(
                lines, fam["id"], person_node, spouse_node
            )
        
        # Add children
        for child_id in fam.get("children", []):
            child_node = self._make_node(lines, child_id)
            
            # Connect child to marriage node or parent
            if marriage_node:
                lines.append(f'{marriage_node} --> {child_node}')
            else:
                lines.append(f'{person_node} --> {child_node}')
            
            # Recursively add grandchildren if not at max depth
            if depth < max_depth and child_id in self.individuals:
                child_data = self.individuals[child_id]
                
                for child_fam_id in child_data.get("fams", []):
                    if child_fam_id not in self.families:
                        continue
                    
                    child_fam = self.families[child_fam_id]
                    self._add_descendants_recursive(
                        lines,
                        child_id,
                        child_node,
                        child_fam,
                        depth + 1,
                        max_depth
                    )
    
    def _add_ancestors_recursive(
        self,
        lines: List[str],
        fam: Dict,
        child_node: str,
        depth: int,
        max_depth: int
    ):
        """
        Recursively add ancestors to the diagram.
        
        Args:
            lines: List to append to
            fam: Family dictionary (parents' family)
            child_node: Child's node ID
            depth: Current depth level
            max_depth: Maximum depth to recurse
        """
        father_id = fam.get("husband")
        mother_id = fam.get("wife")
        
        father_node = None
        mother_node = None
        
        if father_id:
            father_node = self._make_node(lines, father_id)
        if mother_id:
            mother_node = self._make_node(lines, mother_id)
        
        # Marriage connection for parents
        if father_node and mother_node:
            marriage_node = self._add_marriage_node(
                lines, fam["id"], father_node, mother_node
            )
            lines.append(f'{marriage_node} --> {child_node}')
        elif father_node or mother_node:
            parent_node = father_node or mother_node
            lines.append(f'{parent_node} --> {child_node}')
        
        # Recursively add grandparents if not at max depth
        if depth < max_depth:
            # Father's parents
            if father_id and father_id in self.individuals:
                father_data = self.individuals[father_id]
                if father_data.get("famc") and father_data["famc"] in self.families:
                    gp_fam = self.families[father_data["famc"]]
                    self._add_ancestors_recursive(
                        lines,
                        gp_fam,
                        father_node,
                        depth + 1,
                        max_depth
                    )
            
            # Mother's parents
            if mother_id and mother_id in self.individuals:
                mother_data = self.individuals[mother_id]
                if mother_data.get("famc") and mother_data["famc"] in self.families:
                    gp_fam = self.families[mother_data["famc"]]
                    self._add_ancestors_recursive(
                        lines,
                        gp_fam,
                        mother_node,
                        depth + 1,
                        max_depth
                    )

