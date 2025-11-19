import sys
sys.path.insert(0, 'scripts')
from doit import parse_gedcom_file

# Parse GEDCOM
individuals, families = parse_gedcom_file("data/tree.ged")

# Show relevant people
people_to_check = {
    "@I11032885@": "Wolf Hochman (father of Shimon Meir)",
    "@I38740219@": "Wolfe Hochman (son of Josef)",
    "@I40779121@": "Bella Hoffman (daughter of Hershl)",
    "@I38736293@": "Bella Hoffman (daughter of Aaron Harry)",
    "@I40775621@": "Rivka Hochman (wife of Berl, daughter of Yaakov Zvi Zisselman)",
    "@I41030641@": "Rivka Hochman (wife of Yaakov Harel)",
}

for pid, desc in people_to_check.items():
    if pid in individuals:
        name = individuals[pid].get("NAME", "?")
        print(f"{pid}: {name} - {desc}")
    else:
        print(f"{pid}: NOT FOUND - {desc}")

