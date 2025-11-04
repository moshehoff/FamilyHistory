import os
import argparse
import urllib.parse
import json



def debug(msg):
    print(f"[DEBUG] {msg}")

def verbose_debug(msg):
    print(f"[VERBOSE DEBUG] {msg}")


def safe_filename(name: str) -> str:
    """Return a filename-safe version of *name* (עברית, (), ', -, _)."""
    allowed = "-_ ()'"
    return "".join(c if c.isalnum() or c in allowed else "_" for c in name).strip()


##############################################################################
# 1) PARSE GEDCOM → (individuals, families)
##############################################################################

def parse_gedcom_file(path):
    """Parse a GEDCOM file into dictionaries of individuals and families."""
    debug(f"Loading GEDCOM file: {path}")
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    individuals, families = {}, {}
    current_id = current_type = None
    in_birt = in_deat = False

    for raw in lines:
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
            continue
        data = parts[2].strip() if len(parts) > 2 else ""

        # New record pointer
        if level == 0 and tag.startswith("@"):
            current_id = tag
            current_type = data.split(" ", 1)[0] if data else "UNKNOWN"
            if current_type == "INDI":
                individuals.setdefault(current_id, {})
            elif current_type == "FAM":
                families.setdefault(current_id, {})
            in_birt = in_deat = False
            continue

        # Individuals
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

        # Families
        elif current_type == "FAM":
            fam = families[current_id]
            if level == 1:
                if tag in ("HUSB", "WIFE"):
                    fam[tag] = data
                elif tag == "CHIL":
                    fam.setdefault("CHIL", []).append(data)
                else:
                    fam[tag] = data

    return individuals, families


##############################################################################
# 2) NORMALISE HELPERS
##############################################################################

def norm_individual(iid, d):
    birt, deat = d.get("BIRT", {}), d.get("DEAT", {})
    fams = d.get("FAMS", [])
    if isinstance(fams, str):
        fams = [fams]
    return {
        "id": iid,
        "name": d.get("NAME", "").replace("/", "").strip(),
        "birth_date": birt.get("DATE", ""),
        "birth_place": birt.get("PLAC", ""),
        "death_date": deat.get("DATE", ""),
        "death_place": deat.get("PLAC", ""),
        "occupation": d.get("OCCU", ""),
        "notes": d.get("NOTE", ""),
        "famc": d.get("FAMC", ""),
        "fams": fams,
    }


def norm_family(fid, d):
    kids = d.get("CHIL", [])
    if isinstance(kids, str):
        kids = [kids]
    return {"id": fid, "husband": d.get("HUSB", ""), "wife": d.get("WIFE", ""), "children": kids}


def build_mermaid_graph(pid, p, fams, name_of):
    """Build a Mermaid graph showing the person's immediate family relationships."""
    lines = ["```mermaid", "flowchart TD", 
            "classDef person fill:#e1f5fe,stroke:#0277bd,stroke-width:2px;",
            "classDef internal-link fill:#e1f5fe,stroke:#0277bd,stroke-width:2px;",
            "classDef current fill:#ffeb3b,stroke:#f57f17,stroke-width:4px;"]
    
    # Helper to create node IDs and labels
    def node_id(iid): return f'id{iid.replace("@", "")}'
    def node_label(iid): 
        name = name_of.get(iid, iid)
        # Remove problematic characters from display name
        name = name.replace('"', "'")
        return name
    def make_node(iid, is_current=False):
        node = node_id(iid)
        name = node_label(iid)
        lines.append(f'{node}["{name}"]')
        if is_current:
            lines.append(f'class {node} current')
        else:
            lines.append(f'class {node} internal-link')
        # Add click handler for navigation
        # URL-encode the name for the path
        encoded_name = urllib.parse.quote(name.replace(" ", "-"))
        lines.append(f'click {node} "/profiles/People/{encoded_name}" "{name}"')
        return node
    
    # Add the central person (highlighted)
    person_node = make_node(pid, is_current=True)
    
    # Add parents and their relationship
    if p["famc"] in fams:
        fam = fams[p["famc"]]
        if fam.get("husband") or fam.get("wife"):
            # Parents
            father_node = None
            mother_node = None
            if fam.get("husband"):
                father_node = make_node(fam["husband"])
            if fam.get("wife"):
                mother_node = make_node(fam["wife"])
            
            # Marriage connection
            if father_node and mother_node:
                marriage_node = f'marriage_{node_id(fam["id"])}'
                lines.append(f'{marriage_node}((" "))')
                lines.append(f'{father_node} --- {marriage_node}')
                lines.append(f'{mother_node} --- {marriage_node}')
                lines.append(f'{marriage_node} --> {person_node}')
            else:
                # Single parent
                parent_node = father_node or mother_node
                lines.append(f'{parent_node} --> {person_node}')
    
    # Add spouses and children
    for fid in p["fams"]:
        if fid not in fams:
            continue
        fam = fams[fid]
        
        # Add spouse
        spouse_id = None
        if fam.get("husband") == pid and fam.get("wife"):
            spouse_id = fam["wife"]
        elif fam.get("wife") == pid and fam.get("husband"):
            spouse_id = fam["husband"]
        
        if spouse_id:
            spouse_node = make_node(spouse_id)
            
            # Marriage connection
            marriage_node = f'marriage_{node_id(fid)}'
            lines.append(f'{marriage_node}((" "))')
            lines.append(f'{person_node} --- {marriage_node}')
            lines.append(f'{spouse_node} --- {marriage_node}')
            
            # Add children
            for child_id in fam.get("children", []):
                child_node = make_node(child_id)
                lines.append(f'{marriage_node} --> {child_node}')
        else:
            # Single parent with children
            for child_id in fam.get("children", []):
                child_node = make_node(child_id)
                lines.append(f'{person_node} --> {child_node}')
    
    lines.append("```")
    return "\n".join(lines)


def build_descendants_diagram(pid, p, individuals, fams, name_of):
    """Build a Mermaid graph showing 2 generations of descendants."""
    lines = ["```mermaid", "flowchart TD", 
            "classDef person fill:#e1f5fe,stroke:#0277bd,stroke-width:2px;",
            "classDef internal-link fill:#e1f5fe,stroke:#0277bd,stroke-width:2px;",
            "classDef current fill:#ffeb3b,stroke:#f57f17,stroke-width:4px;"]
    
    # Helper functions (same as above)
    def node_id(iid): return f'id{iid.replace("@", "")}'
    def node_label(iid): 
        name = name_of.get(iid, iid)
        name = name.replace('"', "'")
        return name
    def make_node(iid, is_current=False):
        node = node_id(iid)
        name = node_label(iid)
        lines.append(f'{node}["{name}"]')
        if is_current:
            lines.append(f'class {node} current')
        else:
            lines.append(f'class {node} internal-link')
        encoded_name = urllib.parse.quote(name.replace(" ", "-"))
        lines.append(f'click {node} "/profiles/People/{encoded_name}" "{name}"')
        return node
    
    # Add the central person (highlighted)
    person_node = make_node(pid, is_current=True)
    
    # Iterate through all families where this person is a parent
    for fid in p["fams"]:
        if fid not in fams:
            continue
        fam = fams[fid]
        
        # Add spouse if exists
        spouse_id = None
        if fam.get("husband") == pid and fam.get("wife"):
            spouse_id = fam["wife"]
        elif fam.get("wife") == pid and fam.get("husband"):
            spouse_id = fam["husband"]
        
        spouse_node = None
        if spouse_id:
            spouse_node = make_node(spouse_id)
            # Marriage connection
            marriage_node = f'marriage_{node_id(fid)}'
            lines.append(f'{marriage_node}((" "))')
            lines.append(f'{person_node} --- {marriage_node}')
            lines.append(f'{spouse_node} --- {marriage_node}')
        
        # Add children (1st generation)
        for child_id in fam.get("children", []):
            child_node = make_node(child_id)
            if spouse_node:
                lines.append(f'{marriage_node} --> {child_node}')
            else:
                lines.append(f'{person_node} --> {child_node}')
            
            # Now add this child's spouse and children (2nd generation - grandchildren)
            if child_id not in individuals:
                continue
            child_data = individuals[child_id]
            
            for child_fam_id in child_data.get("fams", []):
                if child_fam_id not in fams:
                    continue
                child_fam = fams[child_fam_id]
                
                # Add child's spouse
                child_spouse_id = None
                if child_fam.get("husband") == child_id and child_fam.get("wife"):
                    child_spouse_id = child_fam["wife"]
                elif child_fam.get("wife") == child_id and child_fam.get("husband"):
                    child_spouse_id = child_fam["husband"]
                
                child_spouse_node = None
                if child_spouse_id:
                    child_spouse_node = make_node(child_spouse_id)
                    # Marriage connection for child
                    child_marriage_node = f'marriage_{node_id(child_fam_id)}'
                    lines.append(f'{child_marriage_node}((" "))')
                    lines.append(f'{child_node} --- {child_marriage_node}')
                    lines.append(f'{child_spouse_node} --- {child_marriage_node}')
                
                # Add grandchildren
                for grandchild_id in child_fam.get("children", []):
                    grandchild_node = make_node(grandchild_id)
                    if child_spouse_node:
                        lines.append(f'{child_marriage_node} --> {grandchild_node}')
                    else:
                        lines.append(f'{child_node} --> {grandchild_node}')
    
    lines.append("```")
    return "\n".join(lines)


def build_ancestors_diagram(pid, p, individuals, fams, name_of):
    """Build a Mermaid graph showing 2 generations of ancestors (parents and grandparents)."""
    lines = ["```mermaid", "flowchart TD", 
            "classDef person fill:#e1f5fe,stroke:#0277bd,stroke-width:2px;",
            "classDef internal-link fill:#e1f5fe,stroke:#0277bd,stroke-width:2px;",
            "classDef current fill:#ffeb3b,stroke:#f57f17,stroke-width:4px;"]
    
    # Helper functions
    def node_id(iid): return f'id{iid.replace("@", "")}'
    def node_label(iid): 
        name = name_of.get(iid, iid)
        name = name.replace('"', "'")
        return name
    def make_node(iid, is_current=False):
        node = node_id(iid)
        name = node_label(iid)
        lines.append(f'{node}["{name}"]')
        if is_current:
            lines.append(f'class {node} current')
        else:
            lines.append(f'class {node} internal-link')
        encoded_name = urllib.parse.quote(name.replace(" ", "-"))
        lines.append(f'click {node} "/profiles/People/{encoded_name}" "{name}"')
        return node
    
    # Add the central person (current profile)
    person_node = make_node(pid, is_current=True)
    
    # Add parents (1st generation)
    if p["famc"] in fams:
        fam = fams[p["famc"]]
        parent_fam_id = p["famc"]
        
        father_node = None
        mother_node = None
        
        if fam.get("husband"):
            father_node = make_node(fam["husband"])
            father_id = fam["husband"]
        if fam.get("wife"):
            mother_node = make_node(fam["wife"])
            mother_id = fam["wife"]
        
        # Marriage connection for parents
        if father_node and mother_node:
            marriage_node = f'marriage_{node_id(parent_fam_id)}'
            lines.append(f'{marriage_node}((" "))')
            lines.append(f'{father_node} --- {marriage_node}')
            lines.append(f'{mother_node} --- {marriage_node}')
            lines.append(f'{marriage_node} --> {person_node}')
        elif father_node or mother_node:
            parent_node = father_node or mother_node
            lines.append(f'{parent_node} --> {person_node}')
        
        # Add grandparents (2nd generation) - father's parents
        if father_node and father_id in individuals:
            father_data = individuals[father_id]
            if father_data.get("famc") and father_data["famc"] in fams:
                gp_fam = fams[father_data["famc"]]
                gp_fam_id = father_data["famc"]
                
                grandfather_node = None
                grandmother_node = None
                
                if gp_fam.get("husband"):
                    grandfather_node = make_node(gp_fam["husband"])
                if gp_fam.get("wife"):
                    grandmother_node = make_node(gp_fam["wife"])
                
                if grandfather_node and grandmother_node:
                    gp_marriage_node = f'marriage_{node_id(gp_fam_id)}'
                    lines.append(f'{gp_marriage_node}((" "))')
                    lines.append(f'{grandfather_node} --- {gp_marriage_node}')
                    lines.append(f'{grandmother_node} --- {gp_marriage_node}')
                    lines.append(f'{gp_marriage_node} --> {father_node}')
                elif grandfather_node or grandmother_node:
                    gp_node = grandfather_node or grandmother_node
                    lines.append(f'{gp_node} --> {father_node}')
        
        # Add grandparents (2nd generation) - mother's parents
        if mother_node and mother_id in individuals:
            mother_data = individuals[mother_id]
            if mother_data.get("famc") and mother_data["famc"] in fams:
                gp_fam = fams[mother_data["famc"]]
                gp_fam_id = mother_data["famc"]
                
                grandfather_node = None
                grandmother_node = None
                
                if gp_fam.get("husband"):
                    grandfather_node = make_node(gp_fam["husband"])
                if gp_fam.get("wife"):
                    grandmother_node = make_node(gp_fam["wife"])
                
                if grandfather_node and grandmother_node:
                    gp_marriage_node = f'marriage_{node_id(gp_fam_id)}'
                    lines.append(f'{gp_marriage_node}((" "))')
                    lines.append(f'{grandfather_node} --- {gp_marriage_node}')
                    lines.append(f'{grandmother_node} --- {gp_marriage_node}')
                    lines.append(f'{gp_marriage_node} --> {mother_node}')
                elif grandfather_node or grandmother_node:
                    gp_node = grandfather_node or grandmother_node
                    lines.append(f'{gp_node} --> {mother_node}')
    
    lines.append("```")
    return "\n".join(lines)


##############################################################################
# 3) BUILD NOTES (wiki-links + bios)
##############################################################################

def build_obsidian_notes(individuals, families, out_dir, bios_dir):
    # Dictionary to map places to their Wikipedia article names
    place_to_wiki = {
        # Australia
        "Subiaco, Perth, Western Australia, Australia": "Subiaco,_Western_Australia",
        "Perth, Western Australia, Australia": "Perth,_Western_Australia",
        "Perth, WA, Australia": "Perth,_Western_Australia",
        "Perth, Australia": "Perth,_Western_Australia",
        "Perth": "Perth,_Western_Australia",
        "Sydney, NSW, Australia": "Sydney",
        "Sydney, New South Wales, Australia": "Sydney",
        "Brisbane, Queensland, Australia": "Brisbane",
        
        # Israel
        "Rehovot, Israel": "Rehovot",
        "Rehovot, Center District, Israel": "Rehovot",
        "Jerusalem": "Jerusalem",
        
        # Europe
        "Wien, Austria": "Vienna",
        "Vienna, Vienna, Austria": "Vienna",
        "Nikolsburg (Mikulov), Moravia, Czechoslovakia": "Mikulov",
        "Blackburn, Lancashire, England (United Kingdom)": "Blackburn,_Lancashire",
        "Pitten or Schwarzau am Steinfeld, near Neunkirchen, Lower Austria, Austria": "Neunkirchen,_Lower_Austria",
        
        # Eastern Europe/Asia
        "Savran, Podolia, Odessa oblast, Ukraine": "Savran,_Ukraine",
        "Bershad, Ukraine": "Bershad",
        "Hamedan, Iran, Islamic Republic of": "Hamadan",
        
        # Add more mappings as needed
    }

    inds = {i: norm_individual(i, d) for i, d in individuals.items()}
    fams = {f: norm_family(f, d) for f, d in families.items()}
    name_of = {i: info["name"] or i for i, info in inds.items()}

    wl = lambda lbl: f"[[{lbl or 'Unknown'}]]"  # For person links
    def wl_place(place):
        if not place:   
            return ""
        # Try to find a mapping, if not found use the place name directly
        wiki_name = place_to_wiki.get(place, place.replace(" ", "_"))
        return f"[{place}](https://en.wikipedia.org/wiki/{wiki_name})"
    ptr = lambda iid: wl(name_of.get(iid, iid)) if iid else ""

    people_dir = os.path.join(out_dir, "People")
    os.makedirs(people_dir, exist_ok=True)

    verbose_debug(f"Output directory for profiles: {people_dir}")
    verbose_debug(f"Bios directory: {bios_dir}")
    verbose_debug(f"Checking if bios directory exists: {os.path.exists(bios_dir)}")
    if os.path.exists(bios_dir):
        verbose_debug(f"Listing files in bios directory: {os.listdir(bios_dir)}")

    for pid, p in inds.items():
        parents, siblings = [], []
        if p["famc"] and p["famc"] in fams:
            fam = fams[p["famc"]]
            parents  = [ptr(x) for x in (fam.get("husband"), fam.get("wife")) if x]
            siblings = [ptr(c) for c in fam["children"] if c != pid]

        spouses, children = [], []
        for fid in p["fams"]:
            fam = fams.get(fid)
            if not fam:
                continue
            if fam.get("husband") == pid and fam.get("wife"):
                spouses.append(ptr(fam["wife"]))
            elif fam.get("wife") == pid and fam.get("husband"):
                spouses.append(ptr(fam["husband"]))
            children.extend(ptr(c) for c in fam["children"] if c != pid)

        clean_id = pid.strip("@")
        bio_text = ""
        verbose_debug(f"Looking for bio for ID: {clean_id}")
        for ext in ("md", "MD"):
            bio_path = os.path.join(bios_dir, f"{clean_id}.{ext}")
            verbose_debug(f"Checking bio path: {bio_path}")
            verbose_debug(f"Bio file exists: {os.path.isfile(bio_path)}")
            if os.path.isfile(bio_path):
                with open(bio_path, encoding="utf-8") as bf:
                    bio_text = bf.read().replace('\r', '').strip()
                verbose_debug(f"Found bio for {p['name']} at {bio_path}")
                break

        bp_link = wl_place(p["birth_place"]) if p["birth_place"] else ""
        dp_link = wl_place(p["death_place"]) if p["death_place"] else ""

        # Generate Mermaid diagrams
        mermaid_diagram = build_mermaid_graph(pid, p, fams, name_of)
        descendants_diagram = build_descendants_diagram(pid, p, inds, fams, name_of)
        ancestors_diagram = build_ancestors_diagram(pid, p, inds, fams, name_of)

        lines = [
            "---",
            "type: profile",
            f"title: {safe_filename(p['name'] or pid)}",
            f"ID: {safe_filename(clean_id)}",
            "---",
            f"**Birth**: {p['birth_date']}" + (f" at {bp_link}" if bp_link else ""),
            "",
            f"**Death**: {p['death_date']}" + (f" at {dp_link}" if dp_link else ""),
            "",
            f"**Occupation**: {p['occupation'] or '—'}",
            "",
            "**Parents**: "   + (", ".join(parents)  or "—"),
            "",
            "**Siblings**: " + (", ".join(siblings) or "—"),
            "",
            "**Spouse**: "   + (", ".join(spouses)  or "—"),
            "",
            "**Children**: " + (", ".join(children) or "—"),
            "",
            "**Notes**: "    + (p['notes'] or "—"),
            "",
            "---",
            "",
            "## Family Tree",
            mermaid_diagram,
            "",
            "## Ancestors (2 Generations)",
            ancestors_diagram,
            "",
            "## Descendants (2 Generations)",
            descendants_diagram,
        ]

        if bio_text:
            lines += ["", "---", "", "## Biography", bio_text]

        # no body-level GEDCOM ID; it now lives in frontmatter as `ID`

        out_path = os.path.join(people_dir, safe_filename(p["name"] or pid) + ".md")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")


##############################################################################
# 4) CREATE media-index.json for ProfileTabs
##############################################################################

def create_media_index(documents_dir, static_dir):
    """Create a JSON index of all images and documents for each profile."""
    import json
    
    print(f"[DEBUG] Starting media index creation from {documents_dir}")
    
    # documents/ is in project root, not in profiles/
    # Contains both images and documents for each profile
    
    index = {
        "images": {},
        "documents": {}
    }
    
    # Scan documents directory (contains both images and documents for each profile)
    if os.path.exists(documents_dir):
        print(f"[DEBUG] Scanning documents directory: {documents_dir}")
        profile_dirs = [d for d in os.listdir(documents_dir) if os.path.isdir(os.path.join(documents_dir, d))]
        print(f"[DEBUG] Found {len(profile_dirs)} profile directories: {profile_dirs}")
        
        for profile_id in profile_dirs:
            profile_dir = os.path.join(documents_dir, profile_id)
            print(f"[DEBUG] Processing profile {profile_id}")
            
            images = []
            documents = []
            
            files_in_dir = os.listdir(profile_dir)
            print(f"[DEBUG]   Files in {profile_id}: {files_in_dir}")
            
            for filename in files_in_dir:
                # Skip metadata files
                if filename.endswith(('.txt', '.md')):
                    print(f"[DEBUG]   Skipping metadata file: {filename}")
                    continue
                
                base_name = os.path.splitext(filename)[0]
                
                # Check if it's an image
                if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                    print(f"[DEBUG]   Found image: {filename}")
                    # Try to read caption from metadata file
                    caption = ""
                    for ext in ['.txt', '.md']:
                        caption_file = os.path.join(profile_dir, base_name + ext)
                        if os.path.exists(caption_file):
                            with open(caption_file, 'r', encoding='utf-8') as f:
                                caption = f.read().strip()
                            print(f"[DEBUG]     Caption from {base_name}{ext}: {caption[:50]}...")
                            break
                    
                    images.append({
                        "filename": filename,
                        "caption": caption
                    })
                
                # Otherwise, it's a document
                else:
                    print(f"[DEBUG]   Found document: {filename}")
                    # Try to read metadata from file with same name
                    title = filename
                    description = ""
                    for ext in ['.txt', '.md']:
                        meta_file = os.path.join(profile_dir, base_name + ext)
                        if os.path.exists(meta_file):
                            with open(meta_file, 'r', encoding='utf-8') as f:
                                lines = f.read().strip().split('\n')
                                if len(lines) > 0:
                                    title = lines[0]
                                if len(lines) > 1:
                                    description = lines[1]
                            print(f"[DEBUG]     Metadata from {base_name}{ext}: title='{title}', desc='{description[:30]}...'")
                            break
                    
                    documents.append({
                        "filename": filename,
                        "title": title,
                        "description": description
                    })
            
            if images:
                index["images"][profile_id] = images
                print(f"[DEBUG]   Added {len(images)} images for {profile_id}")
            if documents:
                index["documents"][profile_id] = documents
                print(f"[DEBUG]   Added {len(documents)} documents for {profile_id}")
    else:
        print(f"[DEBUG] Documents directory does not exist: {documents_dir}")
    
    # Write index to static directory
    os.makedirs(static_dir, exist_ok=True)
    index_path = os.path.join(static_dir, "media-index.json")
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    
    print(f"[DEBUG] Created media index with {len(index['images'])} profiles with images, "
          f"{len(index['documents'])} profiles with documents --> {index_path}")
    
    # Copy documents/ to site/quartz/static/documents/ so Quartz serves them from /static/documents/
    import shutil
    static_documents_dir = os.path.join("site", "quartz", "static", "documents")
    print(f"[DEBUG] Preparing to copy {documents_dir} to {static_documents_dir}")
    
    if os.path.exists(documents_dir):
        # Count files to copy
        total_files = 0
        for root, dirs, files in os.walk(documents_dir):
            total_files += len(files)
        print(f"[DEBUG] Found {total_files} files to copy")
        
        if os.path.exists(static_documents_dir):
            print(f"[DEBUG] Removing existing {static_documents_dir}")
            shutil.rmtree(static_documents_dir)
        
        print(f"[DEBUG] Copying files...")
        shutil.copytree(documents_dir, static_documents_dir)
        print(f"[DEBUG] OK Successfully copied {total_files} files to {static_documents_dir}")
    else:
        print(f"[DEBUG] ERROR Source directory does not exist: {documents_dir}")
    
    # Also copy image files from bios/ directory to site/content/ for use in biographies
    # Quartz will copy them to site/public/ during build
    bios_content_dir = os.path.join("site", "content")
    print(f"[DEBUG] Copying image files from bios to {bios_content_dir}")
    
    image_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    copied_images = 0
    
    os.makedirs(bios_content_dir, exist_ok=True)
    
    for filename in os.listdir("bios"):
        file_path = os.path.join("bios", filename)
        if os.path.isfile(file_path):
            ext = os.path.splitext(filename)[1].lower()
            if ext in image_extensions:
                # Copy with original name (with spaces)
                dest_path = os.path.join(bios_content_dir, filename)
                shutil.copy2(file_path, dest_path)
                copied_images += 1
                print(f"[DEBUG]   Copied {filename} --> {bios_content_dir}")
                
                # Also copy with dashes instead of spaces (for Quartz links)
                filename_with_dashes = filename.replace(' ', '-')
                if filename_with_dashes != filename:
                    dest_path_dashes = os.path.join(bios_content_dir, filename_with_dashes)
                    shutil.copy2(file_path, dest_path_dashes)
                    copied_images += 1
                    print(f"[DEBUG]   Copied {filename_with_dashes} --> {bios_content_dir}")
    
    print(f"[DEBUG] OK Copied {copied_images} image files from bios/ to {bios_content_dir}")


##############################################################################
# 5) CREATE People/index.md  ### NEW
##############################################################################

def write_people_index(people_dir):
    """Create/overwrite People/index.md with Markdown links."""
    files = sorted(
        f for f in os.listdir(people_dir)
        if f.lower().endswith(".md") and f != "index.md"
    )

    lines = ["# All People\n"]
    for fname in files:
        title = fname[:-3]                      # strip .md
        url   = urllib.parse.quote(fname)       # encode spaces/עברית
        lines.append(f"* [{title}]({url})")

    with open(os.path.join(people_dir, "index.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


##############################################################################
# 5) CLI
##############################################################################

def collect_unique_places(individuals):
    """Collect all unique birth and death places from individuals."""
    places = set()
    for person in individuals.values():
        birth_place = person.get("BIRT", {}).get("PLAC")
        death_place = person.get("DEAT", {}).get("PLAC")
        if birth_place:
            places.add(birth_place)
        if death_place:
            places.add(death_place)
    return sorted(places)

def analyze_places(individuals):
    """Analyze and collect all unique places from the GEDCOM file.
    
    This helps maintain the place_to_wiki mapping dictionary by showing:
    1. All unique places that need mapping
    2. Which places are variants of the same location
    3. Places that might be missing from the mapping
    """
    places = {}  # place -> count
    for person in individuals.values():
        birth = person.get("BIRT", {})
        death = person.get("DEAT", {})
        residence = person.get("RESI", {})
        
        if "PLAC" in birth:
            place = birth["PLAC"]
            places[place] = places.get(place, 0) + 1
        if "PLAC" in death:
            place = death["PLAC"]
            places[place] = places.get(place, 0) + 1
        if "PLAC" in residence:
            place = residence["PLAC"]
            places[place] = places.get(place, 0) + 1
    
    # Sort by count descending
    sorted_places = sorted(places.items(), key=lambda x: (-x[1], x[0]))
    
    print("\nPlace Analysis:")
    print("===============")
    for place, count in sorted_places:
        print(f"{count:2d}x {place}")
    print("\nTotal unique places:", len(places))
    return places

def write_bios_index(people_dir, bios_dir):
    """Create/overwrite People/bios.md with links to profiles that have biographies."""
    # Get all biography files
    bio_ids = {
        os.path.splitext(f)[0] 
        for f in os.listdir(bios_dir) 
        if f.endswith(('.md', '.MD'))
    }
    
    # Get all profile files that have matching bios
    profiles_with_bios = []
    for fname in sorted(os.listdir(people_dir)):
        if not fname.endswith('.md') or fname in ('index.md', 'bios.md'):
            continue
            
        profile_path = os.path.join(people_dir, fname)
        with open(profile_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract cleaned GEDCOM ID (I123) from frontmatter property `ID`
        gedcom_id = None
        parts = content.split('---', 2)
        if len(parts) > 2:
            fm = parts[1]
            for ln in fm.splitlines():
                if ln.strip().startswith('ID:'):
                    gedcom_id = ln.split(':', 1)[1].strip().strip("'\"")
                    break
        if gedcom_id and gedcom_id in bio_ids:
            profiles_with_bios.append((fname[:-3], fname))  # (title, filename)

    # Create the index page
    lines = [
        "# Profiles with Biographies\n",
        "This page lists all family members who have biographical information.\n"
    ]
    
    if profiles_with_bios:
        for title, fname in profiles_with_bios:
            url = urllib.parse.quote(fname)
            lines.append(f"* [{title}]({url})")
    else:
        lines.append("*No biographical information available yet.*")

    with open(os.path.join(people_dir, "bios.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

def write_family_data_json(individuals, families, out_dir):
    """Generate family-data.json for the large family tree visualization."""
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
    
    # Write to Quartz static folder so it can be served at /family-data.json
    # Assuming output is site/content/profiles, static is at site/quartz/static
    static_dir = os.path.join(out_dir, "..", "..", "quartz", "static")
    os.makedirs(static_dir, exist_ok=True)
    output_path = os.path.join(static_dir, "family-data.json")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    debug(f"Generated family-data.json with {len(people)} people and {len(families_list)} families --> {output_path}")

def copy_source_content(src_content_dir, dst_content_dir):
    """Copy source content (index.md, pages/) to site/content/"""
    import shutil
    
    debug(f"Copying source content from {src_content_dir} to {dst_content_dir}")
    
    os.makedirs(dst_content_dir, exist_ok=True)
    
    # Copy index.md
    src_index = os.path.join(src_content_dir, "index.md")
    if os.path.exists(src_index):
        dst_index = os.path.join(dst_content_dir, "index.md")
        shutil.copy2(src_index, dst_index)
        debug(f"Copied {src_index} -> {dst_index}")
    
    # Copy pages/ directory
    src_pages = os.path.join(src_content_dir, "pages")
    dst_pages = os.path.join(dst_content_dir, "pages")
    
    if os.path.exists(src_pages):
        if os.path.exists(dst_pages):
            shutil.rmtree(dst_pages)
        shutil.copytree(src_pages, dst_pages)
        debug(f"Copied {src_pages} -> {dst_pages}")

def clean_project():
    """Remove all generated files and build outputs."""
    import shutil
    import glob
    
    paths_to_remove = [
        "site/content",  # All content (profiles, index.md, pages/)
        "site/public",   # Quartz build output
        "site/.quartz-cache",  # Quartz cache
        "site/site",  # Accidentally created nested directory
        "site/quartz/static/family-data.json",  # Generated family data
        "site/quartz/static/media-index.json",  # Generated media index
        "site/quartz/static/documents",  # Copied documents directory
    ]
    
    print("Cleaning project...")
    for path in paths_to_remove:
        full_path = os.path.abspath(path)
        if os.path.exists(full_path):
            if os.path.isdir(full_path):
                shutil.rmtree(full_path)
                print(f"  Removed directory: {path}")
            else:
                os.remove(full_path)
                print(f"  Removed file: {path}")
        else:
            print(f"  (not found, skipping: {path})")
    
    # Also clean up image files that might have been copied to site/content/
    # (they get recreated from bios/ during build)
    print("Clean complete!")


def main():
    argp = argparse.ArgumentParser(description="GEDCOM ➜ Quartz profiles + bios merge")
    argp.add_argument("gedcom_file", nargs="?", help="Path to .ged file")
    argp.add_argument("--clean", action="store_true", help="Clean all generated files and build outputs")
    argp.add_argument("-o", "--output", default="site/content/profiles", help="Output directory for profiles (default: site/content/profiles)")
    argp.add_argument("--bios-dir", default="bios", help="Directory with bio *.md files (default: bios)")
    argp.add_argument("--src-content-dir", default="content", help="Directory with source content files (default: content)")
    argp.add_argument("--analyze-places", action="store_true", help="Analyze unique places in the GEDCOM file")
    args = argp.parse_args()

    if args.clean:
        clean_project()
        return
    
    if not args.gedcom_file:
        argp.error("gedcom_file is required (unless using --clean)")

    os.makedirs(args.output, exist_ok=True)
    if not os.path.exists(args.bios_dir):
        os.makedirs(args.bios_dir, exist_ok=True)

    individuals, families = parse_gedcom_file(args.gedcom_file)
    
    if args.analyze_places:
        analyze_places(individuals)
        return

    # Copy source content to site/content/
    copy_source_content(args.src_content_dir, os.path.dirname(args.output))

    build_obsidian_notes(individuals, families, args.output, args.bios_dir)

    people_dir = os.path.join(args.output, "People")
    write_people_index(people_dir)  # Write main index
    write_bios_index(people_dir, args.bios_dir)  # Write bios index

    # Generate family data JSON for large family tree
    write_family_data_json(individuals, families, args.output)
    
    # Create media index for ProfileTabs
    documents_dir = "documents"  # documents/ in project root
    static_dir = os.path.join("site", "quartz", "static")
    create_media_index(documents_dir, static_dir)

    debug(f"Done --> {args.output}")


if __name__ == "__main__":
    main()
