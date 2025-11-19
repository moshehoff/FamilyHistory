import sys
sys.path.insert(0, 'scripts')
from doit import parse_gedcom_file

# Parse GEDCOM
individuals, families = parse_gedcom_file("data/tree.ged")

# Normalize
def norm_individual(pid, data):
    return {
        "name": data.get("NAME", "").strip(),
        "fams": data.get("FAMS", []),
        "famc": data.get("FAMC"),
    }

def norm_family(fid, data):
    return {
        "husband": data.get("HUSB"),
        "wife": data.get("WIFE"),
        "children": data.get("CHIL", [])
    }

def safe_filename(s):
    s = s.replace("/", "")
    s = s.replace(" ", "-")
    return s

inds = {i: norm_individual(i, d) for i, d in individuals.items()}
fams = {f: norm_family(f, d) for f, d in families.items()}
name_of = {i: info["name"] or i for i, info in inds.items()}

# Build mapping of name -> list of IDs
name_to_ids = {}
for pid, p in inds.items():
    name = p["name"] or pid
    if name not in name_to_ids:
        name_to_ids[name] = []
    name_to_ids[name].append(pid)

# Identify duplicate names
duplicate_names = {name: ids for name, ids in name_to_ids.items() if len(ids) > 1}

print(f"Found {len(duplicate_names)} duplicate names\n")

# Build id_to_slug mapping
id_to_slug = {}
for pid, p in inds.items():
    name = p["name"] or pid
    clean_id = pid.strip("@")
    
    if name not in duplicate_names:
        slug = safe_filename(name)
    else:
        unique_suffix = None
        
        # Try to find spouse
        for fid in p["fams"]:
            fam = fams.get(fid)
            if not fam:
                continue
            if fam.get("husband") == pid and fam.get("wife"):
                spouse_id = fam["wife"]
                spouse_name = name_of.get(spouse_id, spouse_id)
                spouse_first_name = spouse_name.split()[0] if spouse_name and " " in spouse_name else spouse_name
                if spouse_first_name and spouse_first_name != name:
                    unique_suffix = spouse_first_name
                    break
            elif fam.get("wife") == pid and fam.get("husband"):
                spouse_id = fam["husband"]
                spouse_name = name_of.get(spouse_id, spouse_id)
                spouse_first_name = spouse_name.split()[0] if spouse_name and " " in spouse_name else spouse_name
                if spouse_first_name and spouse_first_name != name:
                    unique_suffix = spouse_first_name
                    break
        
        if not unique_suffix:
            unique_suffix = clean_id
        
        slug = f"{safe_filename(name)}-{safe_filename(unique_suffix)}"
    id_to_slug[pid] = slug

# Show duplicates and their slugs
print("All duplicate names:")
for dup_name in sorted(duplicate_names.keys()):
    if True:
        print(f"\n{dup_name}:")
        print("=" * 60)
        for pid in duplicate_names[dup_name]:
            slug = id_to_slug[pid]
            p = inds[pid]
            
            # Find spouse
            spouse_info = []
            for fid in p["fams"]:
                fam = fams.get(fid)
                if not fam:
                    continue
                if fam.get("husband") == pid and fam.get("wife"):
                    spouse_name = name_of.get(fam["wife"], "?")
                    spouse_info.append(f"m. {spouse_name}")
                elif fam.get("wife") == pid and fam.get("husband"):
                    spouse_name = name_of.get(fam["husband"], "?")
                    spouse_info.append(f"m. {spouse_name}")
            
            spouse_str = ", ".join(spouse_info) if spouse_info else "(no spouse)"
            print(f"  ID: {pid:20} => {slug:40} | {spouse_str}")

