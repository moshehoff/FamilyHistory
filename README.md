# Family History Website - V4

אתר היסטוריה משפחתית מבוסס Quartz 4 + GEDCOM

## Quick Start

### 0. התקנת Quartz (פעם אחת)

```powershell
# שבט את הטמפלייט
git clone https://github.com/sosiristseng/template-quartz.git site
cd site

# התקן את Quartz (submodule) והתלויות
git submodule update --init --recursive
cd quartz
npm install
npm install mermaid family-chart @types/node
```

### 1. יצירת פרופילים מ-GEDCOM
```powershell
# מתיקיית V4
python scripts/doit.py data/tree.ged
```

### 2. הרצת האתר

```powershell
# העתק קונפיגורציה
cd site
Copy-Item quartz.config.ts quartz/ -Force
Copy-Item quartz.layout.ts quartz/ -Force

# בנה והרץ
cd quartz
npx quartz build --directory ../content --serve
```

**האתר יהיה זמין ב: http://localhost:8080** 🎉

## מה יש כאן?

- **546 פרופילים משפחתיים** עם דיאגרמות Mermaid **אינטראקטיביות** 🎯
  - **לחיצה על קודקודים** מנווטת לפרופילים!
- **קישורי ויקיפדיה** למקומות
- **עץ משפחתי אינטראקטיבי** עם קישורים
- **תמיכה דו-לשונית** (עברית + אנגלית)

## תיעוד מלא

ראה: **`WEEK1_IMPLEMENTATION.md`** - הוראות מפורטות, בדיקות ופתרון בעיות

## מבנה פרויקט

```
V4/
├── data/tree.ged              # GEDCOM
├── bios/                      # ביוגרפיות מפורטות
├── site/                      # אתר Quartz
│   └── content/profiles/People/  # 546 פרופילים
├── scripts/doit.py            # המרת GEDCOM למרקדאון
└── documents/                 # תמונות ומסמכים (לעתיד)
```

## סטטוס

✅ **שבוע 1 הושלם** - תשתית בסיסית + 546 פרופילים  
⏳ שבוע 2 - רכיבי React מתקדמים

---
*פותח לפי מפרט FAMILY_HISTORY_SPECIFICATION_DETAILED.md*

