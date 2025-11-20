# התקנת Quartz - הגרסה החדשה

## מה השתנה?

עברנו מ-**template-quartz** (עם submodule) ל-**Quartz רשמי** (ללא submodule)

---

## ההבדל:

### לפני (Template):
```
site/
├── content/
├── quartz/              ← Git submodule (repository נפרד!)
│   └── quartz/          ← קוד Quartz
├── quartz.config.ts
└── quartz.layout.ts
```

**בעיה**: שינויים ב-`site/quartz/quartz/` לא נשמרים ב-Git שלנו!

### עכשיו (Quartz רשמי):
```
site/
├── content/
├── quartz/              ← חלק מהפרויקט שלנו!
│   ├── components/      ← עכשיו אפשר לשנות!
│   └── styles/          ← עכשיו אפשר לשנות!
├── quartz.config.ts
└── quartz.layout.ts
```

**יתרון**: כל השינויים נשמרים ב-Git שלנו! ✅

---

## איך להריץ עכשיו:

```powershell
# מתיקיית V4
cd site
npx quartz build --serve
```

**פשוט יותר!** אין צריך להעתיק config או לעבוד עם `--directory`

---

## מה עכשיו:

1. ✅ Quartz מותקן (ללא submodule)
2. ✅ 546 פרופילים נוצרו
3. ✅ התלויות מותקנות (mermaid, family-chart)
4. ✅ Config עודכן

**מוכן להמשיך לשבוע 2 (שוב)!** 🚀

---

## הפקודה הפשוטה החדשה:

```powershell
# יצירת פרופילים
python scripts/doit.py data/tree.ged -o site/content/profiles

# הרצת האתר
cd site
npx quartz build --serve
```

**זהו! אין צריך להעתיק קבצים או לעבוד עם submodules.**

---

## ⚡ אופטימיזציה - בנייה מהירה

### CustomOgImages מושבת

הפלאגין `CustomOgImages` **מושבת כרגע** ב-`quartz.config.ts` לשיפור מהירות הבנייה.

**למה?**
- יוצר תמונות תצוגה מקדימה לרשתות חברתיות (Facebook, Twitter, וכו')
- עם 546+ פרופילים - לוקח **זמן רב מאוד** (דקות!)
- משבית אותו = **90%+ מהיר יותר** ⚡

**אם צריך להפעיל בחזרה (לפרסום):**

ערוך את `site/quartz.config.ts` ובטל את ההערה:

```typescript
emitters: [
  // ...
  Plugin.NotFoundPage(),
  Plugin.CustomOgImages(),  // ← הסר את הערה // מכאן
],
```

**מתי כדאי להפעיל?**
- פרסום אתר פומבי
- שיתוף ברשתות חברתיות
- לא נדרש לפיתוח מקומי

