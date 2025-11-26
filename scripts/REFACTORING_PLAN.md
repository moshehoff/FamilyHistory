# תוכנית הגירה - Refactoring doit.py

## מטרות הרפקטור

1. ✅ הפחתת שכפול קוד מ-~400 שורות של קוד כפול ל-0
2. ✅ פיצול פונקציות ענקיות (410 שורות) לפונקציות קטנות וברורות
3. ✅ הפרדת אחריות - כל מודול עם תפקיד אחד ברור
4. ✅ שיפור יכולת בדיקה - כל מחלקה ניתנת לבדיקה בנפרד
5. ✅ הוספת logging מתקדם עם רמות שונות
6. ✅ תיעוד API מלא

## מבנה קבצים חדש

```
scripts/
├── doit.py                           # נקודת כניסה ראשית (CLI בלבד) - ~150 שורות
├── config.py                         # קבועים וקונפיגורציה - ~50 שורות
├── gedcom/
│   ├── __init__.py                   # ייצוא פונקציות ציבוריות
│   ├── parser.py                     # parse_gedcom_file - ~100 שורות
│   └── normalizer.py                 # norm_individual, norm_family - ~50 שורות
├── generators/
│   ├── __init__.py                   # ייצוא פונקציות ציבוריות
│   ├── profile_generator.py          # ProfileGenerator class - ~250 שורות
│   ├── mermaid_builder.py            # MermaidDiagramBuilder class - ~200 שורות
│   ├── media_handler.py              # MediaIndexHandler class - ~300 שורות
│   ├── chapters_handler.py           # ChaptersIndexHandler class - ~250 שורות
│   └── index_generators.py           # פונקציות ליצירת אינדקסים - ~150 שורות
├── utils/
│   ├── __init__.py                   # ייצוא פונקציות ציבוריות
│   ├── link_converter.py             # LinkConverter class - ~150 שורות
│   ├── place_mappings.py             # PLACE_TO_WIKI dictionary - ~50 שורות
│   ├── file_utils.py                 # פונקציות עזר לקבצים - ~100 שורות
│   └── logger.py                     # מערכת logging מתקדמת - ~80 שורות
└── tests/                            # תיקיית בדיקות (עתידי)
    ├── __init__.py
    ├── test_gedcom_parser.py
    ├── test_mermaid_builder.py
    └── test_link_converter.py
```

**סה"כ משוער:** ~1,880 שורות (לעומת 1,886 בקובץ המקורי)
**אך:** קוד מאורגן, ללא שכפולים, עם הפרדת אחריות ברורה

## שלבי ההגירה

### שלב 0: הכנה (לא משנה קוד קיים)
- [x] יצירת מבנה תיקיות
- [x] יצירת קבצי `__init__.py` ריקים
- [x] העתקת `doit.py` ל-`doit.py.backup`

### שלב 1: מודולי Utility (ללא תלויות)
1. **config.py** - העברת קבועים
   - `PLACE_TO_WIKI`
   - `IMAGE_EXTENSIONS`
   - `MERMAID_STYLES`
   
2. **utils/logger.py** - מערכת logging חדשה
   - `setup_logger()` - הגדרת logger עם פורמט
   - `get_logger()` - קבלת logger instance
   - רמות: DEBUG, INFO, WARNING, ERROR
   
3. **utils/file_utils.py** - פונקציות קבצים
   - `safe_filename()` - העתקה מהקוד המקורי
   - `copy_directory_safe()` - wrapper ל-shutil עם error handling
   - `ensure_dir()` - יצירת תיקייה עם בדיקה

### שלב 2: מודול GEDCOM (תלוי רק ב-utils)
1. **gedcom/parser.py**
   - `parse_gedcom_file()` - העתקה מהקוד המקורי
   - שיפור: logging במקום print
   
2. **gedcom/normalizer.py**
   - `norm_individual()` - העתקה מהקוד המקורי
   - `norm_family()` - העתקה מהקוד המקורי
   - `collect_unique_places()` - העתקה מהקוד המקורי

### שלב 3: מודול קישורים (תלוי ב-utils + gedcom)
1. **utils/link_converter.py**
   - `LinkConverter` class:
     - `person_id_to_html()` - איחוד 3 פונקציות דומות
     - `extract_person_ids()` - מהקוד המקורי
     - `convert_ids_to_links()` - מהקוד המקורי
     - `wikilink_place()` - מהקוד המקורי

### שלב 4: בונה Mermaid (תלוי ב-utils)
1. **generators/mermaid_builder.py**
   - `MermaidDiagramBuilder` class:
     - פונקציות עזר משותפות (במקום שכפול):
       - `_node_id()`, `_node_label()`, `_make_node()`
       - `_init_mermaid_lines()`
     - פונקציות ציבוריות:
       - `build_immediate_family()` - במקום build_mermaid_graph
       - `build_descendants()` - במקום build_descendants_diagram
       - `build_ancestors()` - במקום build_ancestors_diagram

### שלב 5: מחולל פרופילים (תלוי בהכל)
1. **generators/profile_generator.py**
   - `ProfileGenerator` class:
     - `generate_all_profiles()` - נקודת כניסה ראשית
     - `_build_slug_mapping()` - לוגיקת slugs ייחודיים
     - `_detect_duplicate_names()` - זיהוי שמות כפולים
     - `_fix_slug_collisions()` - תיקון התנגשויות
     - `_generate_single_profile()` - פרופיל בודד
     - `_collect_family_relationships()` - קשרי משפחה
     - `_build_diagrams()` - כל התרשימים
     - `_build_profile_content()` - בניית markdown
     - `_write_profile_file()` - כתיבה לקובץ

### שלב 6: מטפלי מדיה וצ'פטרים
1. **generators/media_handler.py**
   - `MediaIndexHandler` class:
     - `create_media_index()` - נקודת כניסה
     - `_scan_documents_directory()` - סריקת documents/
     - `_process_image()` - עיבוד תמונה אחת
     - `_process_document()` - עיבוד מסמך אחד
     - `_distribute_to_tagged_people()` - הפצה לאנשים מתויגים
     - `_copy_static_files()` - העתקת קבצים

2. **generators/chapters_handler.py**
   - `ChaptersIndexHandler` class:
     - `create_chapters_index()` - נקודת כניסה
     - `_scan_chapter_directory()` - סריקת תיקייה
     - `_process_main_bio()` - עיבוד bio ראשי
     - `_process_chapter_file()` - עיבוד chapter בודד
     - `_process_shared_chapters()` - צ'פטרים משותפים

### שלב 7: מחוללי אינדקסים
1. **generators/index_generators.py**
   - פונקציות עצמאיות:
     - `write_people_index()` - all-profiles.md
     - `write_bios_index()` - profiles-of-interest.md
     - `write_gallery_index()` - profiles-with-gallery.md
     - `write_family_data_json()` - family-data.json

### שלב 8: עדכון doit.py הראשי
1. **doit.py החדש** - רק CLI וקריאות לפונקציות:
   ```python
   from gedcom.parser import parse_gedcom_file
   from generators.profile_generator import ProfileGenerator
   from generators.media_handler import MediaIndexHandler
   # ...
   
   def main():
       # CLI parsing
       # קריאות לפונקציות מהמודולים
   ```

### שלב 9: בדיקות ואימות
1. **בדיקות רגרסיה:**
   - הרצה של doit.py הישן → שמירת פלט
   - הרצה של doit.py החדש → שמירת פלט
   - השוואת קבצים עם diff
   
2. **בדיקות ידניות:**
   - בדיקה שהאתר נבנה בהצלחה
   - בדיקת פרופיל עם שם כפול
   - בדיקת פרופיל עם תמונות
   - בדיקת פרופיל עם צ'פטרים

### שלב 10: ניקיון
1. מחיקת `doit.py.backup` (רק אחרי אישור שהכל עובד)
2. עדכון README עם הוראות שימוש
3. יצירת CHANGELOG.md

## אסטרטגיית Testing

### בדיקות יחידה (Unit Tests)
```python
# tests/test_link_converter.py
def test_person_id_to_html():
    individuals = {...}
    id_to_slug = {...}
    converter = LinkConverter(individuals, id_to_slug)
    html = converter.person_id_to_html('@I123@')
    assert '<a href="/profiles/John-Doe">' in html
```

### בדיקות אינטגרציה
```bash
# הרצת הסקריפט המלא והשוואה
python scripts/doit.py data/tree.ged -o site/content/profiles
diff -r site/content/profiles/ site/content/profiles.backup/
```

## מערכת Logging החדשה

### רמות Logging
```python
# קריאות דוגמה
logger.debug("Loading GEDCOM file: %s", path)
logger.info("Generated %d profiles", len(individuals))
logger.warning("Duplicate name found: %s", name)
logger.error("Failed to read bio file: %s", bio_path)
```

### פורמט פלט
```
[2024-01-20 15:30:45] [INFO] gedcom.parser: Loading GEDCOM file: data/tree.ged
[2024-01-20 15:30:46] [DEBUG] gedcom.parser: Found 150 individuals, 80 families
[2024-01-20 15:30:47] [WARNING] generators.profile: Duplicate name: 'Leah Hoffman' (2 instances)
[2024-01-20 15:30:48] [INFO] generators.profile: Generated 150 profiles
```

### דגלי Debug ב-CLI
```bash
# רמת info (ברירת מחדל)
python scripts/doit.py data/tree.ged

# רמת debug (מפורט)
python scripts/doit.py data/tree.ged --debug

# רמת warning (שקט)
python scripts/doit.py data/tree.ged --quiet

# שמירת לוג לקובץ
python scripts/doit.py data/tree.ged --log-file=build.log
```

## זמן הערכה

- **שלבים 0-3:** ~2 שעות (מודולי בסיס)
- **שלבים 4-5:** ~3 שעות (Mermaid + Profiles)
- **שלבים 6-7:** ~3 שעות (Media + Chapters + Indexes)
- **שלב 8:** ~1 שעה (עדכון doit.py)
- **שלב 9:** ~2 שעות (בדיקות)

**סה"כ:** ~11 שעות עבודה

## יתרונות לאחר ההגירה

✅ **אפס שכפול קוד** - 400+ שורות מיותרות הוסרו  
✅ **קריאות** - פונקציות < 50 שורות, שמות ברורים  
✅ **תחזוקה** - באג ב-Mermaid? קובץ אחד לתקן  
✅ **הרחבה** - רוצה GraphViz? מחלקה נפרדת  
✅ **בדיקות** - כל מחלקה ניתנת לבדיקה  
✅ **Debug** - logging מתקדם ברמות שונות  
✅ **תיעוד** - API מלא לכל מחלקה  

## סיכונים וצמצומם

### סיכון: שבירת פונקציונליות קיימת
**צמצום:** 
- שמירת backup של הקוד המקורי
- בדיקות רגרסיה עם diff
- הגירה בשלבים עם בדיקה אחרי כל שלב

### סיכון: ביצועים איטיים יותר
**צמצום:**
- הקוד החדש לא יהיה איטי (אותה לוגיקה)
- אם יש בעיה, profiling יזהה אותה
- השיפור בתחזוקה שווה trade-off קטן

### סיכון: עקומת למידה למפתחים
**צמצום:**
- תיעוד API מפורט
- דוגמאות שימוש
- מבנה אינטואיטיבי (כל קובץ = תפקיד אחד)

## הערות חשובות

1. **Backward Compatibility:** הקוד החדש שומר על אותו ממשק CLI
   ```bash
   # עובד גם לפני וגם אחרי
   python scripts/doit.py data/tree.ged -o site/content/profiles
   ```

2. **Incremental Migration:** אפשר לעבור בשלבים, לא חייבים הכל בבת אחת

3. **Git Strategy:** כל שלב = commit נפרד, כך שאפשר לחזור אחורה

4. **Documentation:** תיעוד API מלא ב-docstrings (Google style)

## קבצים שנוצרים בשלב זה

1. ✅ `REFACTORING_PLAN.md` - תוכנית זו
2. ⏳ `API_DOCUMENTATION.md` - תיעוד API מלא
3. ⏳ `MIGRATION_CHECKLIST.md` - רשימת משימות לביצוע

---

**נוצר:** 2024-11-26  
**גרסה:** 1.0  
**מחבר:** AI Assistant + User Collaboration

