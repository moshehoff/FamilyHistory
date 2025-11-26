# רשימת משימות להגירה (Migration Checklist)

## סטטוס כללי

**מצב נוכחי:** בתהליך - בניית מודולים חדשים

**תאריך התחלה:** 2024-11-26

---

## ✅ שלב 1: הכנה והגדרה (COMPLETED)

- [x] יצירת מבנה תיקיות (gedcom/, generators/, utils/, tests/)
- [x] יצירת קבצי `__init__.py` עם ייצוא מודולים
- [x] גיבוי `doit.py` המקורי ל-`doit.py.backup`
- [x] יצירת תיעוד: `REFACTORING_PLAN.md`
- [x] יצירת תיעוד: `API_DOCUMENTATION.md`

---

## ✅ שלב 2: מודולי Utility (COMPLETED)

- [x] **config.py** - קבועים גלובליים
  - קבועי תמונה (IMAGE_EXTENSIONS)
  - סגנונות Mermaid (MERMAID_STYLES)
  - מיפוי מקומות (PLACE_TO_WIKI)
  - תיקיות ברירת מחדל
  - פורמט logging

- [x] **utils/logger.py** - מערכת logging מתקדמת
  - `setup_logger()` - הגדרת logger עם פורמט
  - `get_logger()` - קבלת logger instance
  - `set_global_log_level()` - שינוי רמת log גלובלית
  - `log_section()` - כותרות לוג מעוצבות
  - `log_progress()` - התקדמות במבנה אחיד
  - `log_dict()` - הצגת dictionary קריא

- [x] **utils/file_utils.py** - פונקציות קבצים
  - `safe_filename()` - המרת שם לשם קובץ בטוח
  - `ensure_dir()` - יצירת תיקייה עם בדיקה
  - `copy_directory_safe()` - העתקת תיקייה עם error handling
  - `copy_file_safe()` - העתקת קובץ בודד
  - `remove_directory_safe()` - מחיקת תיקייה
  - `count_files()` - ספירת קבצים
  - `list_subdirectories()` - רשימת תתי-תיקיות

- [x] **utils/place_mappings.py** - מיפוי מקומות
  - `get_wiki_name()` - קבלת שם ערך Wikipedia
  - `create_wiki_link()` - יצירת קישור (markdown/html)
  - `add_place_mapping()` - הוספת מיפוי חדש
  - `get_all_mapped_places()` - רשימת כל המקומות

---

## ✅ שלב 3: מודול GEDCOM (COMPLETED)

- [x] **gedcom/parser.py** - פרסור GEDCOM
  - `parse_gedcom_file()` - קריאה ופרסור קובץ .ged
  - שיפור: logging במקום print
  - טיפול משופר בשגיאות

- [x] **gedcom/normalizer.py** - נורמליזציה
  - `norm_individual()` - נורמליזציה של אדם
  - `norm_family()` - נורמליזציה של משפחה
  - `collect_unique_places()` - איסוף מקומות ייחודיים
  - `analyze_places()` - ניתוח ספירת מקומות
  - `print_place_analysis()` - הדפסה קריאה של ניתוח

---

## ✅ שלב 4: מודול קישורים (COMPLETED)

- [x] **utils/link_converter.py** - המרת קישורים
  - `LinkConverter` class עם:
    - `person_id_to_html()` - ID → קישור HTML
    - `extract_person_ids()` - חילוץ IDs מטקסט
    - `convert_ids_to_links()` - המרת כל ה-IDs בטקסט
    - `wikilink_place()` - קישור Wikipedia למקום
  - **איחוד 3 פונקציות דומות** מהקוד המקורי
  - **ולידציה** של name-ID pairs

---

## ✅ שלב 5: בונה Mermaid (COMPLETED)

- [x] **generators/mermaid_builder.py** - תרשימי Mermaid
  - `MermaidDiagramBuilder` class עם:
    - פונקציות עזר משותפות:
      - `_node_id()`, `_node_label()`, `_make_node()`
      - `_init_mermaid_lines()`, `_add_marriage_node()`
    - פונקציות ציבוריות:
      - `build_immediate_family()` - משפחה מיידית
      - `build_descendants()` - צאצאים (עם max_depth)
      - `build_ancestors()` - אבות קדמונים (עם max_depth)
  - **הסרת ~150 שורות שכפול קוד** (3 פונקציות → מחלקה אחת)

---

## ✅ שלב 6: מחולל פרופילים (COMPLETED)

- [x] **generators/profile_generator.py** - יצירת פרופילים
  - `ProfileGenerator` class עם:
    - `generate_all_profiles()` - נקודת כניסה ראשית
    - `_build_slug_mapping()` - בניית slugs ייחודיים
    - `_create_unique_slug()` - slug ייחודי לשם כפול
    - `_fix_slug_collisions()` - תיקון התנגשויות
    - `_generate_single_profile()` - יצירת פרופיל בודד
    - `_collect_family_relationships()` - איסוף קשרי משפחה
    - `_build_diagrams()` - כל התרשימים
    - `_check_bio_exists()` - בדיקת קיום ביוגרפיה
    - `_build_profile_content()` - בניית markdown מלא
    - `_build_info_box()` - תיבת מידע HTML
    - `_write_profile_file()` - כתיבה לקובץ
  - **החלפת פונקציה של 410 שורות** במחלקה מאורגנת

---

## ⏳ שלב 7: מטפלי מדיה וצ'פטרים (IN PROGRESS)

- [ ] **generators/media_handler.py** - ניהול תמונות ומסמכים
  - [ ] `MediaIndexHandler` class:
    - [ ] `create_media_index()` - נקודת כניסה
    - [ ] `_scan_documents_directory()` - סריקת documents/
    - [ ] `_process_image()` - עיבוד תמונה אחת
    - [ ] `_process_document()` - עיבוד מסמך אחד
    - [ ] `_distribute_to_tagged_people()` - הפצה לאנשים מתויגים
    - [ ] `_copy_static_files()` - העתקת קבצים סטטיים
    - [ ] `_copy_bios_images()` - העתקת תמונות מ-bios/

- [ ] **generators/chapters_handler.py** - ניהול פרקי ביוגרפיה
  - [ ] `ChaptersIndexHandler` class:
    - [ ] `create_chapters_index()` - נקודת כניסה
    - [ ] `_scan_chapter_directory()` - סריקת תיקייה
    - [ ] `_process_main_bio()` - עיבוד bio ראשי
    - [ ] `_process_chapter_file()` - עיבוד chapter בודד
    - [ ] `_process_shared_chapters()` - צ'פטרים משותפים
    - [ ] `_copy_chapter_files()` - העתקת קבצים

---

## ⏳ שלב 8: מחוללי אינדקסים (PENDING)

- [ ] **generators/index_generators.py** - דפי אינדקס
  - [ ] `write_people_index()` - all-profiles.md
  - [ ] `write_bios_index()` - profiles-of-interest.md
  - [ ] `write_gallery_index()` - profiles-with-gallery.md
  - [ ] `write_family_data_json()` - family-data.json
  - [ ] `copy_source_content()` - העתקת content/
  - [ ] `clean_project()` - ניקוי קבצים שנוצרו

---

## ⏳ שלב 9: עדכון doit.py הראשי (PENDING)

- [ ] עדכון doit.py לשימוש במודולים החדשים
  - [ ] Import מהמודולים החדשים
  - [ ] החלפת קריאות לפונקציות ישנות
  - [ ] עדכון טיפול ב-CLI arguments
  - [ ] הוספת דגלי --debug, --quiet, --log-file
  - [ ] בדיקה שהכל עובד

---

## ⏳ שלב 10: בדיקות ואימות (PENDING)

### בדיקות רגרסיה

- [ ] **הרצה משווה:**
  - [ ] הרצת doit.py הישן (backup) → שמירת פלט ל-output_old/
  - [ ] הרצת doit.py החדש → שמירת פלט ל-output_new/
  - [ ] השוואת תיקיות: `diff -r output_old/ output_new/`
  - [ ] תיעוד הבדלים (אם יש)

### בדיקות פונקציונליות

- [ ] **בדיקת פרופילים:**
  - [ ] פרופיל רגיל (ללא ביוגרפיה)
  - [ ] פרופיל עם ביוגרפיה מורחבת
  - [ ] פרופיל עם שם כפול
  - [ ] פרופיל עם תמונות בגלריה
  - [ ] פרופיל עם צ'פטרים משותפים

- [ ] **בדיקת תרשימים:**
  - [ ] תרשים משפחה מיידית
  - [ ] תרשים צאצאים (2-3 דורות)
  - [ ] תרשים אבות (2-3 דורות)

- [ ] **בדיקת אינדקסים:**
  - [ ] all-profiles.md - כל הפרופילים
  - [ ] profiles-of-interest.md - רק עם ביוגרפיה
  - [ ] profiles-with-gallery.md - רק עם תמונות
  - [ ] family-data.json - נתוני עץ משפחה

- [ ] **בניית האתר:**
  - [ ] `npx quartz build` עובד בלי שגיאות
  - [ ] פרופילים מוצגים נכון
  - [ ] קישורים עובדים
  - [ ] תרשימי Mermaid מוצגים
  - [ ] גלריה עובדת
  - [ ] צ'פטרים עובדים

### בדיקות יחידה (עתידי)

- [ ] tests/test_gedcom_parser.py
- [ ] tests/test_mermaid_builder.py
- [ ] tests/test_link_converter.py
- [ ] tests/test_profile_generator.py

---

## ⏳ שלב 11: ניקיון וסיום (PENDING)

- [ ] מחיקת doit.py.backup (רק אחרי אישור!)
- [ ] עדכון README.md עם הוראות שימוש חדשות
- [ ] יצירת CHANGELOG.md
- [ ] תיעוד הבדלים בין גרסה ישנה לחדשה
- [ ] Git commit של כל השינויים

---

## 📊 סטטיסטיקות

### קבצים שנוצרו עד כה

**תיעוד (2 קבצים):**
- ✅ scripts/REFACTORING_PLAN.md
- ✅ scripts/API_DOCUMENTATION.md
- 🔄 scripts/MIGRATION_CHECKLIST.md (קובץ זה)

**מודולים (11 קבצים):**
- ✅ scripts/config.py
- ✅ scripts/gedcom/__init__.py
- ✅ scripts/gedcom/parser.py
- ✅ scripts/gedcom/normalizer.py
- ✅ scripts/generators/__init__.py
- ✅ scripts/generators/mermaid_builder.py
- ✅ scripts/generators/profile_generator.py
- ✅ scripts/utils/__init__.py
- ✅ scripts/utils/logger.py
- ✅ scripts/utils/file_utils.py
- ✅ scripts/utils/place_mappings.py
- ✅ scripts/utils/link_converter.py
- ✅ scripts/tests/__init__.py

**נותר ליצור (3 מודולים + עדכון):**
- ⏳ scripts/generators/media_handler.py
- ⏳ scripts/generators/chapters_handler.py
- ⏳ scripts/generators/index_generators.py
- ⏳ scripts/doit.py (עדכון)

### שיפורים שהושגו

✅ **הפחתת שכפול קוד:**
- לפני: ~400 שורות של קוד כפול
- אחרי: 0 שורות כפולות

✅ **פיצול פונקציות:**
- לפני: פונקציה של 410 שורות (build_obsidian_notes)
- אחרי: מחלקה עם 15 פונקציות קטנות (<50 שורות כל אחת)

✅ **מערכת Logging:**
- לפני: print() ללא מבנה
- אחרי: logging מתקדם עם רמות ופורמט

✅ **ארגון קוד:**
- לפני: קובץ אחד של 1,886 שורות
- אחרי: 13+ קבצים מאורגנים במודולים

---

## 🐛 בעיות ידועות

אין בעיות ידועות כרגע.

---

## 📝 הערות

### שינויים מהתכנון המקורי

1. **logger.py:** הוספנו פונקציות נוספות:
   - `log_section()` - כותרות מעוצבות
   - `log_progress()` - עדכוני התקדמות
   - `log_dict()` - הצגת dictionaries

2. **file_utils.py:** הוספנו פונקציות נוספות:
   - `copy_file_safe()` - העתקת קובץ בודד
   - `remove_directory_safe()` - מחיקה בטוחה
   - `count_files()` - ספירת קבצים
   - `list_subdirectories()` - רשימת תתי-תיקיות

3. **MermaidDiagramBuilder:** הוספנו פרמטר `max_depth` לשליטה במספר דורות

### למה לשים לב

1. **imports:** כל המודולים משתמשים ב-relative imports (`from utils.logger import ...`)
2. **encoding:** כל פעולות קבצים עם `encoding='utf-8'`
3. **error handling:** כל פעולת I/O עטופה ב-try-except
4. **logging:** כל מודול משתמש ב-`get_logger(__name__)`

---

## 🚀 צעדים הבאים

1. **סיום מטפלי מדיה וצ'פטרים** - generators/media_handler.py, chapters_handler.py
2. **יצירת מחוללי אינדקסים** - generators/index_generators.py
3. **עדכון doit.py** - שימוש במודולים החדשים
4. **בדיקות רגרסיה** - השוואת פלטים
5. **תיעוד** - CHANGELOG.md ועדכון README

---

**עדכון אחרון:** 2024-11-26  
**מצב:** בתהליך (11/14 מודולים הושלמו)

