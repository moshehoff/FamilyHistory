import sys
sys.path.insert(0, 'scripts')
from doit import parse_gedcom_file

# Parse GEDCOM
individuals, families = parse_gedcom_file("data/tree.ged")

# Check all Wolf/Wolfe
print("All Wolf/Wolfe people:")
print("=" * 80)
for pid, data in individuals.items():
    name = data.get("NAME", "")
    if "Wolf" in name or "Wolfe" in name:
        # Get family info
        famc = data.get("FAMC")
        fams = data.get("FAMS", [])
        
        father_name = "?"
        if famc and famc in families:
            fam = families[famc]
            father_id = fam.get("HUSB")
            if father_id and father_id in individuals:
                father_name = individuals[father_id].get("NAME", "?")
        
        spouse_names = []
        for fid in fams:
            if fid in families:
                fam = families[fid]
                if fam.get("HUSB") == pid and fam.get("WIFE"):
                    spouse_id = fam["WIFE"]
                    if spouse_id in individuals:
                        spouse_names.append(individuals[spouse_id].get("NAME", "?"))
                elif fam.get("WIFE") == pid and fam.get("HUSB"):
                    spouse_id = fam["HUSB"]
                    if spouse_id in individuals:
                        spouse_names.append(individuals[spouse_id].get("NAME", "?"))
        
        spouse_str = ", ".join(spouse_names) if spouse_names else "(no spouse)"
        
        print(f"{pid:20} {name:30} | Father: {father_name:25} | Spouse: {spouse_str}")

