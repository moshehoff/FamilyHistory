# Family History Website - V4

אתר היסטוריה משפחתית מבוסס Quartz 4 + GEDCOM

## Quick Start

### 0. התקנת Quartz (פעם אחת)

```powershell
# שבט את Quartz הרשמי
git clone https://github.com/jackyzha0/quartz.git site

# הסר את ה-git כדי שיהיה חלק מהפרויקט שלנו
Remove-Item -Recurse -Force site/.git

# התקן תלויות
cd site
npm install
npm install mermaid family-chart @types/node
```

### 1. יצירת פרופילים מ-GEDCOM
```powershell
# מתיקיית V4
python scripts/doit.py data/tree.ged -o site/content/profiles
```

### 2. הרצת האתר

```powershell
cd site
npx quartz build --serve
```

**האתר יהיה זמין ב: http://localhost:8080** 🎉

## מה יש כאן?

- **546 פרופילים משפחתיים** עם דיאגרמות Mermaid **אינטראקטיביות** 🎯
  - **לחיצה על קודקודים** מנווטת לפרופילים!
- **קישורי ויקיפדיה** למקומות
- **עץ משפחתי אינטראקטיבי** עם קישורים
- **תמיכה דו-לשונית** (עברית + אנגלית)

## 🚀 Deployment

This project uses a two-branch deployment strategy:

- **`main`** - Development branch for all work-in-progress
- **`production`** - Deployment branch that triggers GitHub Pages

### Publishing Updates

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for full workflow and commands.

**Live Site:** https://moshehoff.github.io/FamilyHistory/

Quick reference:
1. Work on `main` branch as usual
2. When ready to publish:
   - Build: `cd scripts && python doit.py && cd ../site && npx quartz build`
   - Test locally: `npx quartz build --serve`
   - Merge to production and push
3. GitHub Actions automatically deploys in ~30-60 seconds

## תיעוד מלא

- **`DEPLOYMENT.md`** - 🚀 מדריך deployment ל-GitHub Pages
- **`FAMILY_HISTORY_SPECIFICATION_DETAILED.md`** - מפרט מלא של הפרויקט
- **`WEEK1_IMPLEMENTATION.md`** - הוראות מפורטות שבוע 1
- **`QUARTZ_SETUP.md`** - הסבר על ההתקנה החדשה (ללא submodule)

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

