"""
Profile generator for creating individual profile pages.

This module generates Markdown profile pages from GEDCOM data,
including family relationships, diagrams, and biography integration.

This replaces the massive build_obsidian_notes() function (410 lines)
with a well-structured class (multiple small methods).
"""

import os
from typing import Dict, List, Tuple, Optional
from gedcom.normalizer import norm_individual, norm_family
from utils.logger import get_logger, log_section, log_progress
from utils.file_utils import safe_filename
from utils.link_converter import LinkConverter
from .mermaid_builder import MermaidDiagramBuilder

logger = get_logger(__name__)


class ProfileGenerator:
    """
    Generates individual profile pages from GEDCOM data.
    
    This class handles:
    - Building unique slugs for duplicate names
    - Collecting family relationships
    - Generating Mermaid diagrams
    - Creating profile markdown files
    """
    
    def __init__(self, individuals: Dict, families: Dict, bios_dir: str):
        """
        Initialize the profile generator.
        
        Args:
            individuals: Raw individuals dictionary from GEDCOM
            families: Raw families dictionary from GEDCOM
            bios_dir: Directory containing biography files
        
        Example:
            >>> generator = ProfileGenerator(individuals, families, "bios/")
        """
        self.raw_individuals = individuals
        self.raw_families = families
        self.bios_dir = bios_dir
        
        # Normalize data
        self.individuals = {i: norm_individual(i, d) for i, d in individuals.items()}
        self.families = {f: norm_family(f, d) for f, d in families.items()}
        self.name_of = {i: info["name"] or i for i, info in self.individuals.items()}
        
        # Will be set during generation
        self.id_to_slug = {}
        self.link_converter = None
        self.mermaid_builder = None
        
        logger.info(f"ProfileGenerator initialized with {len(self.individuals)} people")
    
    def generate_all_profiles(self, output_dir: str) -> Dict[str, str]:
        """
        Generate all profile pages.
        
        Args:
            output_dir: Directory to write profile markdown files
        
        Returns:
            Dictionary mapping person ID -> unique slug
        
        Example:
            >>> id_to_slug = generator.generate_all_profiles("site/content/profiles")
        """
        log_section(logger, "GENERATING PROFILES")
        
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        # Build slug mapping (handles duplicates)
        self.id_to_slug = self._build_slug_mapping()
        
        # Initialize helpers
        self.link_converter = LinkConverter(self.individuals, self.id_to_slug)
        self.mermaid_builder = MermaidDiagramBuilder(
            self.individuals,
            self.families,
            self.name_of,
            self.id_to_slug
        )
        
        # Generate each profile (skip private individuals)
        logger.info(f"Generating profiles (skipping private individuals)...")
        count = 0
        skipped_private = 0
        for pid, person in self.individuals.items():
            # Skip private individuals
            if person.get("is_private", False):
                skipped_private += 1
                continue
            
            count += 1
            if count % 50 == 0:
                log_progress(logger, count, len(self.individuals) - skipped_private, "profiles")
            
            self._generate_single_profile(pid, person, output_dir)
        
        if skipped_private > 0:
            logger.info(f"Skipped {skipped_private} private profile(s)")
        logger.info(f"✓ Generated {count} profiles successfully")
        return self.id_to_slug
    
    # ========================================================================
    # Slug Building (handles duplicate names)
    # ========================================================================
    
    def _build_slug_mapping(self) -> Dict[str, str]:
        """
        Build mapping from person ID to unique slug.
        
        Handles duplicate names by adding suffixes (spouse name, parent name,
        birth year, or ID).
        
        Returns:
            Dictionary mapping person ID -> unique slug
        """
        logger.info("Building slug mapping...")
        
        # Detect duplicate names
        name_to_ids = {}
        for pid, p in self.individuals.items():
            name = p["name"] or pid
            name_to_ids.setdefault(name, []).append(pid)
        
        duplicate_names = {name: ids for name, ids in name_to_ids.items() if len(ids) > 1}
        
        if duplicate_names:
            logger.warning(f"Found {len(duplicate_names)} names with duplicates")
            for dup_name, dup_ids in sorted(duplicate_names.items()):
                logger.debug(f"  '{dup_name}' appears {len(dup_ids)} times: {dup_ids}")
        
        # Build slugs
        id_to_slug = {}
        profiles_with_unique_slugs = []
        
        for pid, p in self.individuals.items():
            name = p["name"] or pid
            clean_id = pid.strip("@")
            
            # If name is not duplicate, use regular name
            if name not in duplicate_names:
                slug = safe_filename(name).replace(" ", "-")
            else:
                # Duplicate name - create unique slug
                slug, suffix, source = self._create_unique_slug(pid, p, name, clean_id)
                profiles_with_unique_slugs.append({
                    'id': pid,
                    'name': name,
                    'slug': slug,
                    'suffix': suffix,
                    'source': source
                })
            
            id_to_slug[pid] = slug
        
        # Log unique slugs
        if profiles_with_unique_slugs:
            logger.info(f"Created {len(profiles_with_unique_slugs)} unique slugs for duplicates")
            for item in profiles_with_unique_slugs:
                logger.debug(f"  {item['id']}: '{item['name']}' => '{item['slug']}'")
                logger.debug(f"      (suffix '{item['suffix']}' from {item['source']})")
        
        # Fix any slug collisions
        id_to_slug = self._fix_slug_collisions(id_to_slug)
        
        return id_to_slug
    
    def _create_unique_slug(
        self,
        pid: str,
        person: Dict,
        name: str,
        clean_id: str
    ) -> Tuple[str, str, str]:
        """
        Create unique slug for a person with duplicate name.
        
        Tries in order:
        1. Spouse first name
        2. Parent first name
        3. Birth year
        4. ID
        
        Returns:
            Tuple of (slug, suffix, source_description)
        """
        unique_suffix = None
        suffix_source = None
        
        # Try spouse name
        for fid in person["fams"]:
            fam = self.families.get(fid)
            if not fam:
                continue
            
            spouse_id = None
            if fam.get("husband") == pid and fam.get("wife"):
                spouse_id = fam["wife"]
            elif fam.get("wife") == pid and fam.get("husband"):
                spouse_id = fam["husband"]
            
            if spouse_id:
                spouse_name = self.name_of.get(spouse_id, "")
                spouse_first = spouse_name.split()[0] if spouse_name and " " in spouse_name else spouse_name
                if spouse_first and spouse_first != name:
                    unique_suffix = spouse_first
                    suffix_source = f"spouse: {spouse_name}"
                    break
        
        # Try parent name
        if not unique_suffix and person.get("famc"):
            parent_fam = self.families.get(person["famc"])
            if parent_fam:
                # Try father first
                if parent_fam.get("husband"):
                    father_id = parent_fam["husband"]
                    father_name = self.name_of.get(father_id, "")
                    father_first = father_name.split()[0] if father_name and " " in father_name else father_name
                    if father_first:
                        unique_suffix = father_first
                        suffix_source = f"parent: {father_name}"
                
                # If no father, try mother
                if not unique_suffix and parent_fam.get("wife"):
                    mother_id = parent_fam["wife"]
                    mother_name = self.name_of.get(mother_id, "")
                    mother_first = mother_name.split()[0] if mother_name and " " in mother_name else mother_name
                    if mother_first:
                        unique_suffix = mother_first
                        suffix_source = f"parent: {mother_name}"
        
        # Try birth year
        if not unique_suffix and person.get("birth_date"):
            birth_year = person["birth_date"].split()[-1] if person["birth_date"] else None
            if birth_year and birth_year.isdigit():
                unique_suffix = birth_year
                suffix_source = "birth year"
        
        # Last resort: use ID
        if not unique_suffix:
            unique_suffix = clean_id
            suffix_source = "ID"
        
        # Create slug: "Leah-Hoffman-Nate"
        slug = f"{safe_filename(name).replace(' ', '-')}-{safe_filename(unique_suffix).replace(' ', '-')}"
        
        return slug, unique_suffix, suffix_source
    
    def _fix_slug_collisions(self, id_to_slug: Dict[str, str]) -> Dict[str, str]:
        """
        Fix any remaining slug collisions by adding suffixes.
        
        Args:
            id_to_slug: Initial slug mapping
        
        Returns:
            Fixed slug mapping
        """
        # Find collisions
        slug_to_ids = {}
        for pid, slug in id_to_slug.items():
            slug_to_ids.setdefault(slug, []).append(pid)
        
        slug_collisions = {slug: ids for slug, ids in slug_to_ids.items() if len(ids) > 1}
        
        if not slug_collisions:
            return id_to_slug
        
        logger.warning(f"Found {len(slug_collisions)} slug collisions, fixing...")
        
        for slug, pids in slug_collisions.items():
            logger.debug(f"Collision on slug '{slug}':")
            for pid in pids:
                p = self.individuals[pid]
                clean_id = pid.strip("@")
                
                # Try adding birth year
                if p.get("birth_date"):
                    birth_year = p["birth_date"].split()[-1] if p["birth_date"] else None
                    if birth_year and birth_year.isdigit():
                        new_slug = f"{slug}-{birth_year}"
                        
                        # Check if this new slug is also taken
                        counter = 1
                        final_slug = new_slug
                        while final_slug in id_to_slug.values() and id_to_slug.get(pid) != final_slug:
                            final_slug = f"{new_slug}-{counter}"
                            counter += 1
                        
                        id_to_slug[pid] = final_slug
                        logger.debug(f"  {pid}: '{p['name']}' => '{final_slug}' (added birth year)")
                        continue
                
                # Otherwise append ID
                new_slug = f"{slug}-{clean_id}"
                id_to_slug[pid] = new_slug
                logger.debug(f"  {pid}: '{p['name']}' => '{new_slug}' (added ID)")
        
        return id_to_slug
    
    # ========================================================================
    # Single Profile Generation
    # ========================================================================
    
    def _generate_single_profile(self, pid: str, person: Dict, output_dir: str):
        """
        Generate a single profile markdown file.
        
        Args:
            pid: Person ID
            person: Normalized person dictionary
            output_dir: Output directory
        """
        # Collect family relationships
        family_data = self._collect_family_relationships(pid, person)
        
        # Build diagrams
        diagrams = self._build_diagrams(pid, person)
        
        # Check for biography
        bio_exists = self._check_bio_exists(pid)
        
        # Build profile content
        content = self._build_profile_content(
            pid,
            person,
            family_data,
            diagrams,
            bio_exists
        )
        
        # Write to file
        self._write_profile_file(pid, person, content, output_dir)
    
    def _collect_family_relationships(
        self,
        pid: str,
        person: Dict
    ) -> Dict[str, List[str]]:
        """
        Collect all family relationship IDs.
        
        Returns:
            Dictionary with keys: parents_ids, siblings_ids, half_siblings_ids,
            spouses_ids, children_ids
        """
        parents_ids = []
        siblings_ids = []
        half_siblings_ids = []
        
        # Parents and siblings
        if person["famc"] and person["famc"] in self.families:
            fam = self.families[person["famc"]]
            parents_ids = [x for x in (fam.get("husband"), fam.get("wife")) if x]
            siblings_ids = [c for c in fam["children"] if c != pid]
            
            # Half siblings from other marriages
            for parent_id in parents_ids:
                parent = self.individuals.get(parent_id)
                if parent:
                    for other_fam_id in parent.get("fams", []):
                        if other_fam_id != person["famc"] and other_fam_id in self.families:
                            other_fam = self.families[other_fam_id]
                            for child_id in other_fam.get("children", []):
                                if child_id != pid and child_id not in siblings_ids:
                                    if child_id not in half_siblings_ids:
                                        half_siblings_ids.append(child_id)
        
        # Spouses and children
        spouses_ids = []
        children_ids = []
        
        for fid in person["fams"]:
            fam = self.families.get(fid)
            if not fam:
                continue
            
            # Spouse
            if fam.get("husband") == pid and fam.get("wife"):
                spouses_ids.append(fam["wife"])
            elif fam.get("wife") == pid and fam.get("husband"):
                spouses_ids.append(fam["husband"])
            
            # Children
            children_ids.extend([c for c in fam["children"] if c != pid])
        
        return {
            "parents_ids": parents_ids,
            "siblings_ids": siblings_ids,
            "half_siblings_ids": half_siblings_ids,
            "spouses_ids": spouses_ids,
            "children_ids": children_ids
        }
    
    def _build_diagrams(self, pid: str, person: Dict) -> Dict[str, str]:
        """
        Build all Mermaid diagrams for a person.
        
        Returns:
            Dictionary with keys: immediate, nuclear, ancestors
            (any value can be None if diagram would show only the person)
        """
        return {
            "immediate": self.mermaid_builder.build_immediate_family(pid, person),
            "nuclear": self.mermaid_builder.build_nuclear_family(pid, person),
            "ancestors": self.mermaid_builder.build_ancestors(pid, person)
        }
    
    def _check_bio_exists(self, pid: str) -> bool:
        """
        Check if extended biography exists for a person.
        
        Args:
            pid: Person ID (with @ symbols)
        
        Returns:
            True if bio exists, False otherwise
        """
        clean_id = pid.strip("@")
        
        for ext in ("md", "MD"):
            bio_path = os.path.join(self.bios_dir, clean_id, f"{clean_id}.{ext}")
            if os.path.isfile(bio_path):
                logger.debug(f"Found biography for {clean_id}")
                return True
        
        return False
    
    def _build_profile_content(
        self,
        pid: str,
        person: Dict,
        family_data: Dict,
        diagrams: Dict,
        bio_exists: bool
    ) -> str:
        """
        Build the complete profile markdown content.
        
        Returns:
            Complete markdown content as string
        """
        clean_id = pid.strip("@")
        
        # Build frontmatter
        lines = [
            "---",
            "type: profile",
            f"title: {safe_filename(person['name'] or pid)}",
            f"ID: {safe_filename(clean_id)}",
            "---"
        ]
        
        # Build profile info box (HTML)
        lines.extend(self._build_info_box(person, family_data))
        
        # Add separator before diagrams
        lines.extend([
            "",
            "---",
            ""
        ])
        
        # Add immediate family diagram only if it has content
        if diagrams["immediate"]:
            lines.extend([
                "## Immediate Family",
                diagrams["immediate"],
                ""
            ])
        
        # Add ancestors diagram only if it has content
        if diagrams["ancestors"]:
            lines.extend([
                "## Ancestors (up to 2 Gen.)",
                diagrams["ancestors"],
                ""
            ])
        
        # Add nuclear family diagram only if it has content
        if diagrams.get("nuclear"):
            lines.extend([
                "## Nuclear Family",
                diagrams["nuclear"]
            ])
        
        return "\n".join(lines) + "\n"
    
    def _build_info_box(self, person: Dict, family_data: Dict) -> List[str]:
        """
        Build the profile information box (HTML).
        
        Returns:
            List of lines
        """
        lines = [
            '<div class="profile-info-box">',
            '<dl class="profile-info-list">'
        ]
        
        # Birth
        birth_place_html = self.link_converter.wikilink_place(
            person["birth_place"], format="html"
        )
        birth_value = person["birth_date"]
        if birth_place_html:
            birth_value += f" at {birth_place_html}"
        
        if birth_value:
            lines.append(f'<dt>Birth:</dt><dd>{birth_value}</dd>')
        
        # Death
        if person["death_date"]:
            death_place_html = self.link_converter.wikilink_place(
                person["death_place"], format="html"
            )
            death_value = person["death_date"]
            if death_place_html:
                death_value += f" at {death_place_html}"
            lines.append(f'<dt>Death:</dt><dd>{death_value}</dd>')
        
        # Occupation
        if person["occupation"]:
            lines.append(f'<dt>Occupation:</dt><dd>{person["occupation"]}</dd>')
        
        # Family relationships (show "private" for private individuals)
        parents_html = ", ".join([
            "private" if self.individuals.get(pid, {}).get("is_private", False)
            else self.link_converter.person_id_to_html(pid)
            for pid in family_data["parents_ids"]
        ]) or "—"
        
        siblings_html = ", ".join([
            "private" if self.individuals.get(sid, {}).get("is_private", False)
            else self.link_converter.person_id_to_html(sid)
            for sid in family_data["siblings_ids"]
        ]) or "—"
        
        spouses_html = ", ".join([
            "private" if self.individuals.get(spid, {}).get("is_private", False)
            else self.link_converter.person_id_to_html(spid)
            for spid in family_data["spouses_ids"]
        ]) or "—"
        
        children_html = ", ".join([
            "private" if self.individuals.get(cid, {}).get("is_private", False)
            else self.link_converter.person_id_to_html(cid)
            for cid in family_data["children_ids"]
        ]) or "—"
        
        lines.append(f'<dt>Parents:</dt><dd>{parents_html}</dd>')
        lines.append(f'<dt>Siblings:</dt><dd>{siblings_html}</dd>')
        
        # Only show half siblings if they exist
        if family_data["half_siblings_ids"]:
            half_siblings_html = ", ".join([
                "private" if self.individuals.get(sid, {}).get("is_private", False)
                else self.link_converter.person_id_to_html(sid)
                for sid in family_data["half_siblings_ids"]
            ])
            lines.append(f'<dt>Half Siblings:</dt><dd>{half_siblings_html}</dd>')
        
        lines.append(f'<dt>Spouse:</dt><dd>{spouses_html}</dd>')
        lines.append(f'<dt>Children:</dt><dd>{children_html}</dd>')
        
        lines.extend([
            '</dl>',
            '</div>'
        ])
        
        return lines
    
    def _write_profile_file(
        self,
        pid: str,
        person: Dict,
        content: str,
        output_dir: str
    ):
        """
        Write profile content to a markdown file.
        
        Args:
            pid: Person ID
            person: Person dictionary
            content: Markdown content
            output_dir: Output directory
        """
        slug = self.id_to_slug.get(pid) or safe_filename(person["name"] or pid).replace(" ", "-")
        out_path = os.path.join(output_dir, slug + ".md")
        
        try:
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(content)
            logger.debug(f"Wrote profile: {slug}.md")
        except Exception as e:
            logger.error(f"Failed to write profile {slug}.md: {e}")

