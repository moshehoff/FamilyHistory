# באגים שצריכים להיות מתוקנים לפתרון Pre-Built Deployment

## באג #1: baseUrl לא נכון ב-quartz.config.ts
**מה הבעיה:** ב-commit `ad6319d` ה-baseUrl מוגדר כ-`"localhost:8080"` שזה נכון רק ל-localhost, אבל לא יעבוד ב-GitHub Pages.

**למה זה חשוב:** Quartz משתמש ב-baseUrl ליצירת נתיבים מוחלטים (absolute paths) ל-RSS feeds, sitemap, ו-SPA routing. אם ה-baseUrl לא נכון, כל הנתיבים יהיו שבורים ב-GitHub Pages.

**התיקון:** לשנות את ה-baseUrl ל-`"moshehoff.github.io/FamilyHistory"` (ללא פרוטוקול https://, כפי שדורש Quartz).

---

## באג #2: אין GitHub Actions workflow ל-deployment
**מה הבעיה:** אין קובץ `.github/workflows/deploy.yml` שיעלה את האתר ל-GitHub Pages.

**למה זה חשוב:** בלי workflow, אין דרך אוטומטית להעלות את האתר ל-GitHub Pages. צריך ליצור workflow שיעלה את `site/public/` שכבר נבנה לוקלית.

**התיקון:** ליצור קובץ `.github/workflows/deploy.yml` עם workflow פשוט ש:
1. בודק ש-`site/public/` קיים
2. מעלה את `site/public/` כ-artifact
3. מפרסם ל-GitHub Pages

---

## באג #3: site/public/ ב-.gitignore
**מה הבעיה:** `site/public/` נמצא ב-.gitignore, אז הוא לא יועלה ל-git.

**למה זה חשוב:** אם `site/public/` לא ב-git, ה-workflow לא ימצא אותו ב-production branch.

**התיקון:** זה לא באג - זה נכון! צריך להשתמש ב-`git add -f site/public/` כדי להוסיף אותו ל-production branch למרות שהוא ב-.gitignore. זה מאפשר לנו לשמור את ה-build artifacts ב-production branch בלבד.

---

## סיכום: מה צריך לתקן

1. **baseUrl** - לשנות מ-`localhost:8080` ל-`moshehoff.github.io/FamilyHistory`
2. **GitHub Actions workflow** - ליצור `.github/workflows/deploy.yml` שיעלה pre-built site
3. **זה הכל!** - הפתרון החדש פשוט יותר כי הוא לא צריך:
   - Python setup
   - Node.js setup  
   - npm install
   - doit.py
   - quartz build
   
   הוא רק מעלה את מה שכבר נבנה לוקלית.

---

## למה הפתרון החדש יעבוד טוב יותר?

1. **פשוט יותר** - רק העתקה של תיקיה, לא build בשרת
2. **מהיר יותר** - 30 שניות במקום 2-3 דקות
3. **אמין יותר** - אתה בודק לוקלית לפני העלאה
4. **פותר את בעיית הפרקים** - הפרקים כבר נבנים ונבדקים לוקלית
5. **פחות תלויות** - לא צריך Python/Node בשרת

