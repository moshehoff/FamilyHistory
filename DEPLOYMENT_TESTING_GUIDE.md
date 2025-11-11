# מדריך בדיקה לפתרון Pre-Built Deployment

## סקירה כללית

הפתרון החדש עובד כך:
1. אתה בונה את האתר לוקלית
2. אתה בודק שהכל עובד לוקלית
3. אתה מעלה את `site/public/` ל-production branch
4. GitHub Actions מעלה את האתר אוטומטית ל-GitHub Pages

---

## שלב 1: בניית האתר לוקלית

### 1.1. הרצת doit.py
```powershell
cd scripts
python doit.py ../data/tree.ged -o ../site/content/profiles --src-content-dir ../content --bios-dir ../bios
cd ..
```

**מה זה עושה:**
- יוצר את קבצי הפרופילים ב-`site/content/profiles/`
- יוצר את `chapters-index.json` ב-`site/quartz/static/chapters-index.json`
- מעתיק את קבצי הפרקים ל-`site/quartz/static/chapters/`

**איך לבדוק שהצליח:**
```powershell
# בדוק ש-chapters-index.json נוצר
Test-Path site\quartz\static\chapters-index.json

# בדוק שיש פרקים
Get-ChildItem site\quartz\static\chapters -Recurse | Select-Object Name
```

### 1.2. בניית האתר עם Quartz
```powershell
cd site
npx quartz build
cd ..
```

**מה זה עושה:**
- בונה את האתר ל-`site/public/`
- מעתיק את כל הקבצים מ-`quartz/static/` ל-`public/static/` (כולל הפרקים!)

**איך לבדוק שהצליח:**
```powershell
# בדוק ש-public נוצר
Test-Path site\public

# בדוק שהפרקים הועתקו
Test-Path site\public\static\chapters-index.json
Get-ChildItem site\public\static\chapters -Recurse | Select-Object Name
```

---

## שלב 2: בדיקה לוקלית

### 2.1. הרצת שרת לוקלי
```powershell
cd site
npx quartz build --serve
```

**מה לבדוק:**
1. פתח `http://localhost:8080`
2. לך לפרופיל של Moshe Hoffman: `http://localhost:8080/profiles/Moshe משה Hoffman`
3. בדוק שהביוגרפיה מופיעה עם הפרקים:
   - צריך לראות טאבים של פרקים (Introduction, In Russia, וכו')
   - צריך להיות אפשר ללחוץ על כל פרק ולראות את התוכן
   - התמונות צריכות להיטען
4. בדוק שהניווט עובד (Home, All Profiles, וכו')

**אם הכל עובד:** לחץ `Ctrl+C` כדי לעצור את השרת

---

## שלב 3: העלאה ל-production

### 3.1. וידוא שאתה על production branch
```powershell
git branch --show-current
# צריך להציג: production
```

אם לא, עבור ל-production:
```powershell
git checkout production
```

### 3.2. הוספת site/public/ ל-git
```powershell
# הוסף את site/public/ למרות שהוא ב-.gitignore
git add -f site/public/

# בדוק מה נוסף
git status
```

**מה צריך לראות:**
- הרבה קבצים ב-`site/public/` נוספו
- כולל `site/public/static/chapters-index.json`
- כולל `site/public/static/chapters/`

### 3.3. Commit ו-Push
```powershell
git commit -m "build: Add pre-built site for deployment"
git push origin production
```

---

## שלב 4: בדיקת Deployment

### 4.1. בדיקת GitHub Actions
1. לך ל: https://github.com/moshehoff/FamilyHistory/actions
2. לחץ על ה-workflow האחרון "Deploy to GitHub Pages"
3. בדוק שהכל הצליח:
   - ✅ "Verify pre-built site exists" - צריך להציג שהפרקים נמצאים
   - ✅ "Upload artifact" - צריך להצליח
   - ✅ "Deploy to GitHub Pages" - צריך להצליח

### 4.2. בדיקת האתר ב-GitHub Pages
1. חכה 1-2 דקות (GitHub Pages צריך זמן לעדכן)
2. לך ל: https://moshehoff.github.io/FamilyHistory/
3. בדוק שהאתר עובד:
   - הניווט עובד
   - הפרופילים נטענים
   - **הפרקים של הביוגרפיות מופיעים!** (זה מה שתיקנו)

---

## פתרון בעיות

### בעיה: "site/public directory not found" ב-GitHub Actions
**פתרון:** שכחת להוסיף את `site/public/` ל-git. חזור לשלב 3.2.

### בעיה: הפרקים לא מופיעים ב-GitHub Pages
**פתרון:** 
1. בדוק שב-`site/public/static/chapters/` יש קבצים
2. בדוק שב-`site/public/static/chapters-index.json` קיים
3. אם לא - חזור לשלב 1.1 ו-1.2

### בעיה: הנתיבים לא עובדים ב-GitHub Pages
**פתרון:** זה לא אמור לקרות עם הפתרון החדש, אבל אם כן:
1. בדוק שה-`BASE_URL` מוגדר נכון ב-workflow
2. בדוק ש-`baseUrl` ב-`quartz.config.ts` משתמש ב-`process.env.BASE_URL`

---

## תהליך העבודה היומיומי

לאחר שהכל עובד, התהליך הוא:

```powershell
# 1. ערוך קבצים ב-main branch
git checkout main
# ... ערוך קבצים ...

# 2. בנה ובדוק לוקלית
cd scripts
python doit.py ../data/tree.ged -o ../site/content/profiles --src-content-dir ../content --bios-dir ../bios
cd ../site
npx quartz build
npx quartz build --serve
# בדוק שהכל עובד, לחץ Ctrl+C

# 3. העלה ל-production
cd ..
git checkout production
git merge main
git add -f site/public/
git commit -m "build: Update site"
git push origin production

# 4. חזור ל-main
git checkout main
```

---

## סיכום

הפתרון החדש:
- ✅ פשוט יותר - רק העתקה של תיקיה
- ✅ מהיר יותר - 30 שניות במקום 2-3 דקות
- ✅ אמין יותר - אתה בודק לוקלית לפני העלאה
- ✅ פותר את בעיית הפרקים - הפרקים נבנים ונבדקים לוקלית

