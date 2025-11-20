# רשימת שינויים - Family History Website V4

## 2025-11-20 - גרסה 3.1

### ⚡ אופטימיזציה
- **CustomOgImages מושבת זמנית**: פלאגין יצירת תמונות לרשתות חברתיות מושבת
  - מהירות בנייה משתפרת ב-**90%+** (דקות → שניות)
  - עם 546+ פרופילים, הפלאגין לקח זמן רב מאוד
  - ניתן להפעיל מחדש לפרסום אם נדרש (`site/quartz.config.ts`)

### 📝 עדכוני תיעוד
- `QUARTZ_SETUP.md` - הוסף קטע אופטימיזציה
- `FAMILY_HISTORY_SPECIFICATION_DETAILED.md` - עדכון לגרסה 3.1
- `CHANGES.md` - קובץ זה!

---

## 2025-10-20 - גרסה 1.1

### ✨ תכונות חדשות
- **דיאגרמות Mermaid אינטראקטיביות**: כל קודקוד בדיאגרמה עכשיו לחיץ!
  - לחיצה על שם בדיאגרמה מנווטת ישירות לפרופיל
  - שיפור משמעותי בחוויית המשתמש

### 🔧 תיקונים
- תוקן `doit.py` להוסיף `click` handlers אוטומטיים לכל node בדיאגרמות
- התיעוד עודכן להסיר אפשרויות מיותרות (npx create-quartz)
- התיעוד ממוקד כעת רק בשיטת ה-template (git clone)

### 📝 עדכוני תיעוד
- `README.md` - הסרת אפשרויות מיותרות, הדגשת תכונות אינטראקטיביות
- `WEEK1_IMPLEMENTATION.md` - הוסף הסבר על click handlers
- `CHANGES.md` - קובץ זה!

---

## 2025-10-20 - גרסה 1.0

### 🎉 השקה ראשונית
- ✅ 546 פרופילים משפחתיים מ-GEDCOM
- ✅ דיאגרמות Mermaid למשפחה קרובה
- ✅ קישורי ויקיפדיה למקומות
- ✅ קישורי Obsidian [[]] בין פרופילים
- ✅ Frontmatter מובנה (type, title, ID)
- ✅ שילוב ביוגרפיות מתיקיית `bios/`
- ✅ Quartz 4 Template כ-git submodule
- ✅ תמיכה בעברית ואנגלית

### 🛠️ כלים
- `scripts/doit.py` - המרת GEDCOM למרקדאון
- תמיכה ב-`--analyze-places` לניתוח מקומות

### 📚 תיעוד
- `README.md` - Quick Start
- `WEEK1_IMPLEMENTATION.md` - הוראות מפורטות
- `FAMILY_HISTORY_SPECIFICATION_DETAILED.md` - מפרט מלא

